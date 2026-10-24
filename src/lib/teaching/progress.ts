import type { TeachingIslandId } from './registry';
import { idbGet, idbSet } from '../storage/idb';
import { lsGet, lsRemove, lsSetJson, lsGetJson } from '../storage/safe-storage';

const IDB_KEY = 'teaching-progress-v2';
const LEGACY_LS_KEY = 'teaching-learning-progress-v1';
const SETTINGS_KEY = 'second-brain:learning-settings';

export type IslandProgress = {
  percent: number;
  lastVisitedAt: string;
  title: string;
  /** 已完成章节 id */
  completedChapters?: string[];
};

export type TeachingProgressState = {
  version: 2;
  byIsland: Partial<Record<TeachingIslandId, IslandProgress>>;
  streakDays: number;
};

/** 用户开关：高级内容（研究生/博士）是否强制显示 */
export type LearningSettings = {
  version: 1;
  /** 显示研究生拓展 */
  showGraduate: boolean;
  /** 显示博士/研究专题 */
  showResearch: boolean;
  /** 显示数学证明块 */
  showProofs: boolean;
};

const DEFAULT_STATE: TeachingProgressState = {
  version: 2,
  byIsland: {},
  streakDays: 0,
};

const DEFAULT_SETTINGS: LearningSettings = {
  version: 1,
  showGraduate: false,
  showResearch: false,
  showProofs: false,
};

let memory: TeachingProgressState = { ...DEFAULT_STATE, byIsland: {} };
let hydratePromise: Promise<void> | null = null;

function normalize(raw: unknown): TeachingProgressState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE, byIsland: {} };
  const o = raw as Partial<TeachingProgressState> & { version?: number };
  if (o.version !== 1 && o.version !== 2) return { ...DEFAULT_STATE, byIsland: {} };
  return {
    version: 2,
    streakDays: typeof o.streakDays === 'number' ? o.streakDays : 0,
    byIsland: o.byIsland && typeof o.byIsland === 'object' ? { ...o.byIsland } : {},
  };
}

function readLegacyLs(): TeachingProgressState | null {
  const raw = lsGet(LEGACY_LS_KEY);
  if (!raw) return null;
  try {
    return normalize(JSON.parse(raw));
  } catch {
    lsRemove(LEGACY_LS_KEY);
    return null;
  }
}

async function persist(state: TeachingProgressState) {
  memory = state;
  const ok = await idbSet(IDB_KEY, state);
  if (!ok) {
    // IDB 不可用时降级：仅作临时备份，正式路径仍以 IDB 为准
    lsSetJson(LEGACY_LS_KEY, state);
  } else {
    lsRemove(LEGACY_LS_KEY);
  }
}

/** 应用启动时调用一次；未 await 也可，读写走内存缓存 */
export function hydrateTeachingProgress(): Promise<void> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    const fromIdb = await idbGet<TeachingProgressState>(IDB_KEY);
    if (fromIdb) {
      memory = normalize(fromIdb);
      return;
    }
    const legacy = readLegacyLs();
    if (legacy) {
      memory = legacy;
      await idbSet(IDB_KEY, memory);
      lsRemove(LEGACY_LS_KEY);
    }
  })();
  return hydratePromise;
}

export function loadTeachingProgress(): TeachingProgressState {
  void hydrateTeachingProgress();
  return memory;
}

export function getIslandProgress(id: TeachingIslandId): IslandProgress | null {
  return loadTeachingProgress().byIsland[id] ?? null;
}

export function saveIslandProgress(
  id: TeachingIslandId,
  patch: Partial<IslandProgress> & { title: string },
) {
  const state = { ...loadTeachingProgress(), byIsland: { ...loadTeachingProgress().byIsland } };
  const prev = state.byIsland[id];
  state.byIsland[id] = {
    percent: patch.percent ?? prev?.percent ?? 0,
    lastVisitedAt: patch.lastVisitedAt ?? new Date().toISOString(),
    title: patch.title,
    completedChapters: patch.completedChapters ?? prev?.completedChapters ?? [],
  };
  void persist(state);
}

export function markIslandVisited(id: TeachingIslandId, title: string, percent?: number) {
  const prev = getIslandProgress(id);
  saveIslandProgress(id, {
    title,
    percent: percent ?? prev?.percent ?? 0,
    lastVisitedAt: new Date().toISOString(),
  });
}

export function getAggregateProgressPercent(): number {
  const entries = Object.values(loadTeachingProgress().byIsland);
  if (entries.length === 0) return 0;
  const sum = entries.reduce((n, e) => n + (e?.percent ?? 0), 0);
  return Math.round(sum / entries.length);
}

export function getLastVisitedIsland(): (IslandProgress & { id: TeachingIslandId }) | null {
  const state = loadTeachingProgress();
  let best: (IslandProgress & { id: TeachingIslandId }) | null = null;
  for (const [id, prog] of Object.entries(state.byIsland) as [TeachingIslandId, IslandProgress][]) {
    if (!prog) continue;
    if (!best || prog.lastVisitedAt > best.lastVisitedAt) {
      best = { id, ...prog };
    }
  }
  return best;
}

export function getStreakDays(): number {
  return loadTeachingProgress().streakDays;
}

export function loadLearningSettings(): LearningSettings {
  return lsGetJson(SETTINGS_KEY, DEFAULT_SETTINGS, {
    validate: (v): v is LearningSettings =>
      !!v && typeof v === 'object' && (v as LearningSettings).version === 1,
  });
}

export function saveLearningSettings(patch: Partial<LearningSettings>) {
  const next = { ...loadLearningSettings(), ...patch, version: 1 as const };
  lsSetJson(SETTINGS_KEY, next);
  return next;
}

/**
 * 高级内容是否可见：
 * - 用户开关开启 → 显示
 * - 否则需前置章节完成比例 ≥ threshold
 */
export function isAdvancedVisible(opts: {
  tier: 'graduate' | 'research' | 'proof';
  prerequisiteCompleteRatio?: number;
  threshold?: number;
}): boolean {
  const settings = loadLearningSettings();
  if (opts.tier === 'graduate' && settings.showGraduate) return true;
  if (opts.tier === 'research' && settings.showResearch) return true;
  if (opts.tier === 'proof' && settings.showProofs) return true;
  const ratio = opts.prerequisiteCompleteRatio ?? 0;
  const threshold = opts.threshold ?? 0.8;
  return ratio >= threshold;
}
