import type { PixelIconName } from '../pixel-icons';

export type TeachingModule = {
  id: string;
  title: string;
  description: string;
  embed: 'calculus-course';
};

export type TeachingSubject = {
  id: string;
  title: string;
  icon: PixelIconName;
  description: string;
  modules: TeachingModule[];
};

/** 教学模块独立运行，与 MATLAB 计算器无关联 */
export const TEACHING_SUBJECTS: TeachingSubject[] = [
  {
    id: 'math',
    title: '数学',
    icon: 'matlab',
    description: '微积分分步复习',
    modules: [
      {
        id: 'calculus-course',
        title: '微积分复习',
        description: '按复习清单逐条讲解公式与思路',
        embed: 'calculus-course',
      },
    ],
  },
];

export function findModule(subjectId: string, moduleId: string) {
  const subject = TEACHING_SUBJECTS.find((s) => s.id === subjectId);
  if (!subject) return null;
  const mod = subject.modules.find((m) => m.id === moduleId);
  if (!mod) return null;
  return { subject, module: mod };
}
