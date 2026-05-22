// 神经网络实验室页面命名（/digits 路由，里面好几个 demo）
export const NEURAL_LAB = {
  title: '神经网络实验室',
  description: '深度学习可视化、交互推理与模型实验',
  navLabel: '神经网络',
  navTitle: '神经网络实验室 · 可视化与交互',
  demos: {
    mnist: 'mnist',
    formula: 'formula',
  } as const,
  // 手写数字 CNN demo
  demoMnist: {
    id: 'mnist' as const,
    tabLabel: '手写数字',
    title: '手写数字 · CNN',
    subtitle: 'MNIST LeNet · 双路高精度推理 · 2D/3D 特征图与数据流',
    panelTitle: '卷积网络可视化',
  },
  // Texo 公式识别 demo
  demoFormula: {
    id: 'formula' as const,
    tabLabel: '数学公式',
    title: '数学公式 · Texo OCR + SymPy',
    subtitle: 'FormulaNet 识别 → SymPy 求导/积分/方程/正态分布 Φ(x) 与步骤',
    answerLabel: '识别结果',
    solverLabel: '运算求解',
  },
} as const;

export type NeuralLabDemoId =
  (typeof NEURAL_LAB.demos)[keyof typeof NEURAL_LAB.demos];
