import FormulaWorker from './formula-ocr.worker?worker';
import { getFormulaDeviceProfile } from './mobile-profile';
import type {
  ModelLoadPhase,
  ProgressCallback,
  WorkerInputMessage,
  WorkerOutputMessage,
} from './types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

class FormulaModelLoader {
  private worker: Worker | null = null;
  private phase: ModelLoadPhase = 'idle';
  private loadError: string | null = null;
  private device: 'webgpu' | 'wasm' | null = null;
  private initPromise: Promise<void> | null = null;
  private idleScheduled = false;
  private recognizeCount = 0;
  private recognizing = false;
  private listeners = new Set<(phase: ModelLoadPhase) => void>();

  get state(): ModelLoadPhase {
    return this.phase;
  }

  get error(): string | null {
    return this.loadError;
  }

  get accelerator(): 'webgpu' | 'wasm' | null {
    return this.device;
  }

  subscribe(listener: (phase: ModelLoadPhase) => void) {
    this.listeners.add(listener);
    listener(this.phase);
    return () => this.listeners.delete(listener);
  }

  private setPhase(phase: ModelLoadPhase) {
    this.phase = phase;
    for (const listener of this.listeners) listener(phase);
  }

  // 浏览器闲了预加载，不挡首屏；移动端跳过省内存
  scheduleIdlePreload() {
    if (!getFormulaDeviceProfile().preloadModel) return;
    if (this.idleScheduled || this.phase === 'ready' || this.phase === 'loading') return;
    this.idleScheduled = true;

    const run = () => {
      void this.ensureReady().catch(() => {
        /* 预加载失败静默，首次识别时会重试 */
      });
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(run, { timeout: 8000 });
    } else {
      setTimeout(run, 2000);
    }
  }

  // 第一次 recognize 才懒加载；idle 预加载也能触发
  async recognize(
    image: Blob,
    onProgress?: ProgressCallback,
    options?: { highAccuracy?: boolean }
  ): Promise<string> {
    if (this.recognizing) {
      throw new Error('上一次识别尚未完成，请稍候');
    }
    this.recognizing = true;
    try {
      await this.ensureReady(onProgress);
      const result = await this.runRecognize(image, onProgress, options?.highAccuracy ?? false);
      const recycleEvery = getFormulaDeviceProfile().recycleWorkerEvery;
      if (recycleEvery > 0) {
        this.recognizeCount += 1;
        if (this.recognizeCount >= recycleEvery) {
          this.recognizeCount = 0;
          this.dispose();
        }
      }
      return result;
    } finally {
      this.recognizing = false;
    }
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.initPromise = null;
    this.recognizing = false;
    this.recognizeCount = 0;
    this.setPhase('idle');
    this.device = null;
    this.loadError = null;
    this.idleScheduled = false;
  }

  private ensureWorker() {
    if (!this.worker) {
      this.worker = new FormulaWorker();
      this.worker.onerror = () => {
        this.setPhase('error');
        this.loadError = 'Worker 运行异常';
      };
    }
    return this.worker;
  }

  private async ensureReady(onProgress?: ProgressCallback): Promise<void> {
    if (this.phase === 'ready') return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadModelWithRetry(onProgress);
    try {
      await this.initPromise;
    } finally {
      if (this.phase !== 'ready') this.initPromise = null;
    }
  }

  private async loadModelWithRetry(onProgress?: ProgressCallback): Promise<void> {
    let lastError = '模型加载失败';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        this.worker?.terminate();
        this.worker = null;
        await delay(RETRY_DELAY_MS * attempt);
      }

      this.setPhase('loading');
      this.loadError = null;
      onProgress?.({
        phase: 'loading-model',
        message: attempt === 0 ? '正在加载 Texo 模型…' : `正在重试加载模型（${attempt}/${MAX_RETRIES}）…`,
      });

      try {
        await this.initWorker(onProgress);
        if (this.phase === 'ready') return;
      } catch (err) {
        lastError = err instanceof Error ? err.message : lastError;
      }
    }

    this.setPhase('error');
    this.loadError = lastError;
    throw new Error(lastError);
  }

  private initWorker(onProgress?: ProgressCallback): Promise<void> {
    const worker = this.ensureWorker();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('模型加载超时，请检查网络后重试'));
      }, 120_000);

      const onMessage = (event: MessageEvent<WorkerOutputMessage>) => {
        const data = event.data;

        if (data.type === 'progress' && data.phase === 'model') {
          const pct =
            data.progress != null
              ? Math.round(data.progress * 100)
              : data.loaded != null && data.total
                ? Math.round((data.loaded / data.total) * 100)
                : undefined;
          onProgress?.({
            phase: 'loading-model',
            message: pct != null ? `下载模型 ${pct}%` : '正在准备模型…',
            progress: {
              status: data.status ?? 'progress',
              file: data.file,
              name: data.name,
              progress: data.progress,
              loaded: data.loaded,
              total: data.total,
            },
          });
        }

        if (data.type === 'ready') {
          this.setPhase('ready');
          this.loadError = null;
          this.device = data.device ?? 'wasm';
          cleanup();
          resolve();
        }

        if (data.type === 'error' && !data.key) {
          cleanup();
          reject(new Error(data.message));
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        worker.removeEventListener('message', onMessage);
      };

      const profile = getFormulaDeviceProfile();
      worker.addEventListener('message', onMessage);
      worker.postMessage({
        type: 'init',
        preferWasm: profile.preferWasm,
        liteGeneration: profile.liteGeneration,
      } satisfies WorkerInputMessage);
    });
  }

  private runRecognize(
    image: Blob,
    onProgress?: ProgressCallback,
    highAccuracy = false
  ): Promise<string> {
    const worker = this.ensureWorker();
    const key = crypto.randomUUID();

    onProgress?.({ phase: 'recognizing', message: '正在识别公式…' });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('识别超时，请重试'));
      }, 60_000);

      const onMessage = (event: MessageEvent<WorkerOutputMessage>) => {
        const data = event.data;

        if (data.type === 'progress' && data.phase === 'recognize') {
          onProgress?.({
            phase: 'recognizing',
            message: data.message ?? '正在识别…',
          });
        }

        if (data.type === 'result' && data.key === key) {
          cleanup();
          resolve(data.latex);
        }

        if (data.type === 'error' && data.key === key) {
          cleanup();
          reject(new Error(data.message));
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        worker.removeEventListener('message', onMessage);
      };

      worker.addEventListener('message', onMessage);
      worker.postMessage({
        type: 'recognize',
        key,
        image,
        highAccuracy,
      } satisfies WorkerInputMessage);
    });
  }
}

// 单例，Texo (FormulaNet) 公式识别加载器
export const formulaModelLoader = new FormulaModelLoader();

export function scheduleFormulaModelPreload() {
  formulaModelLoader.scheduleIdlePreload();
}

export function disposeFormulaModel() {
  formulaModelLoader.dispose();
}
