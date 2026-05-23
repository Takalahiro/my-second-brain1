import { CURRICULUM_PARTS } from './parts-1-5';
import { CURRICULUM_PARTS_6_10 } from './parts-6-10';
import { buildFromLesson, type LessonDef, type PartDef } from './helpers';
import type { CalcStepSequence } from '../types';

export const ALL_PARTS: PartDef[] = [...CURRICULUM_PARTS, ...CURRICULUM_PARTS_6_10];

const topicMap = new Map<string, LessonDef & { partTitle: string }>();

for (const part of ALL_PARTS) {
  for (const topic of part.topics) {
    topicMap.set(topic.id, { ...topic, partTitle: part.title });
  }
}

export function getTopic(id: string) {
  return topicMap.get(id) ?? null;
}

export function buildCurriculumSteps(topicId: string): CalcStepSequence | null {
  const topic = topicMap.get(topicId);
  if (!topic) return null;
  const seq = buildFromLesson(topic);
  return { ...seq, resultText: topic.resultText ?? seq.resultText };
}

export function listAllTopics(): Array<{ id: string; title: string; partId: string; partTitle: string; interactive?: string }> {
  const out: Array<{ id: string; title: string; partId: string; partTitle: string; interactive?: string }> = [];
  for (const part of ALL_PARTS) {
    for (const t of part.topics) {
      out.push({
        id: t.id,
        title: t.title,
        partId: part.id,
        partTitle: part.title,
        interactive: t.interactive,
      });
    }
  }
  return out;
}

export { type PartDef, type LessonDef } from './helpers';
