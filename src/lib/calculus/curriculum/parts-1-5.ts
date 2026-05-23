import type { PartDef } from './helpers';
import { L, lesson } from './helpers';

export const CURRICULUM_PARTS: PartDef[] = [
  {
    id: 'functions',
    title: '第一部分：Functions 函数基础',
    topics: [
      {
        id: 'domain',
        title: 'Domain 定义域判断',
        steps: [
          L('分母 ≠ 0', '有理函数：令分母 = 0 的点排除。例 f(x)=1/(x-2) → x≠2。', 'x-2\\neq0\\Rightarrow x\\neq2'),
          L('根号 ≥ 0', '偶次根号内非负。例 √(x-1) → x≥1。', '\\sqrt{x-1}\\Rightarrow x\\geq1'),
          L('ln > 0', '对数真数大于 0。例 ln(3-x) → x<3。', '\\ln(3-x)\\Rightarrow 3-x>0'),
          L('反三角范围', 'arcsin/arccos 定义域 [-1,1]；arctan 为全体实数。', '\\arcsin x\\Rightarrow -1\\leq x\\leq1'),
        ],
        resultText: '定义域 = 各限制条件的交集',
        resultLatex: 'D(f)=\\{x\\mid\\text{同时满足所有约束}\\}',
      },
      {
        id: 'range',
        title: 'Range 值域',
        steps: [
          L('观察图像', '画出 y=f(x)，看纵轴覆盖范围。'),
          L('反解 x', '令 y=f(x)，解出 x=g(y)，y 的允许范围即值域。', 'y=f(x)\\Rightarrow x=g(y)'),
          L('单调性', '在单调区间上，比较端点与极值。'),
        ],
        resultText: '值域是函数输出的所有可能 y 值',
      },
      {
        id: 'inverse',
        title: 'Inverse Function 反函数',
        steps: [
          L('一一对应', '先判断水平线测试：每个 y 至多一个 x。'),
          L('换元解出', '令 y=f(x)，解 x=f^{-1}(y)。', 'y=2x+1\\Rightarrow x=\\frac{y-1}{2}'),
          L('验证', '检查 f(f^{-1}(y))=y 且 f^{-1}(f(x))=x。'),
        ],
      },
      {
        id: 'composite',
        title: '函数复合 f(g(x))',
        steps: [
          L('由内到外', '先算 g(x)，再代入 f。', '(f\\circ g)(x)=f(g(x))'),
          L('定义域', 'x 需使 g(x) 在 f 的定义域内。'),
          L('示例', 'f(x)=x², g(x)=x+1 → f(g(x))=(x+1)²。', 'f(g(x))=(x+1)^2'),
        ],
      },
      {
        id: 'parity',
        title: '奇偶性判断',
        steps: [
          L('偶函数', 'f(-x)=f(x)，关于 y 轴对称。', 'f(-x)=f(x)'),
          L('奇函数', 'f(-x)=-f(x)，关于原点对称。', 'f(-x)=-f(x)'),
          L('代入验证', '用 -x 替换 x，化简后与 f(x) 比较。'),
        ],
      },
    ],
  },
  {
    id: 'limits',
    title: '第二部分：Limits and Continuity 极限与连续',
    topics: [
      {
        id: 'limit-methods',
        title: '极限：代入、因式分解、有理化',
        steps: [
          L('直接代入', '若 f(a) 有定义且有限，则 lim_{x→a} f(x)=f(a)。'),
          L('0/0 型', '因式分解约去公因子后再代入。', '\\lim_{x\\to1}\\frac{x^2-1}{x-1}=\\lim_{x\\to1}(x+1)=2'),
          L('有理化', '分子或分母含根号时，乘共轭有理化。', '\\frac{\\sqrt{x+1}-1}{x}\\cdot\\frac{\\sqrt{x+1}+1}{\\sqrt{x+1}+1}'),
        ],
      },
      {
        id: 'one-sided',
        title: '左右极限',
        steps: [
          L('左极限', 'x 从左侧趋近 a：x→a⁻。', '\\lim_{x\\to a^-}f(x)'),
          L('右极限', 'x 从右侧趋近 a：x→a⁺。', '\\lim_{x\\to a^+}f(x)'),
          L('存在条件', '双侧极限存在且相等，极限才存在。'),
        ],
      },
      {
        id: 'continuity',
        title: '连续性三步检查',
        steps: [
          L('① f(a) 存在', '函数在 a 处有定义。'),
          L('② 极限存在', 'lim_{x→a} f(x) 有限。'),
          L('③ 两者相等', 'lim_{x→a} f(x)=f(a)。', '\\lim_{x\\to a}f(x)=f(a)'),
        ],
      },
      {
        id: 'piecewise-continuity',
        title: '分段函数连续性',
        steps: [
          L('找分段点', '在 x=a 处分别算左、右极限。'),
          L('比较函数值', '左极限=右极限=f(a) 则连续。'),
          L('示例', 'f(x)={x², x≤1; 2x, x>1} 在 x=1：左=1，右=2，不连续。'),
        ],
      },
      {
        id: 'squeeze',
        title: 'Squeeze Theorem 夹逼定理',
        steps: [
          L('夹逼条件', 'g(x)≤f(x)≤h(x) 在 a 附近成立。'),
          L('同极限', 'lim g(x)=lim h(x)=L。'),
          L('结论', '则 lim f(x)=L。', 'g(x)\\leq f(x)\\leq h(x),\\ \\lim g=\\lim h=L\\Rightarrow\\lim f=L'),
        ],
      },
      {
        id: 'sinx-over-x',
        title: '重要极限 sin x / x',
        interactive: 'derivative',
        steps: [
          L('标准形式', 'x→0 时 sin x 与 x 等价。', '\\lim_{x\\to0}\\frac{\\sin x}{x}=1'),
          L('几何直觉', '单位圆上弧长与弦长之比趋近 1。'),
          L('应用', '换元：lim sin(3x)/(2x) = (3/2)·1 = 3/2。', '\\lim_{x\\to0}\\frac{\\sin3x}{2x}=\\frac{3}{2}'),
        ],
      },
      {
        id: 'asymptotes',
        title: '无穷极限与渐近线',
        steps: [
          L('水平渐近线', 'x→±∞ 时 y→L，则 y=L 为水平渐近线。', 'y=L'),
          L('垂直渐近线', 'x→a 时 |f(x)|→∞，则 x=a 为垂直渐近线。', 'x=a'),
          L('斜渐近线', '若 lim [f(x)-(kx+b)]=0，则 y=kx+b。', 'y=kx+b'),
        ],
      },
    ],
  },
  {
    id: 'derivatives',
    title: '第三部分：Derivatives 求导',
    topics: [
      {
        id: 'deriv-def',
        title: '导数定义',
        interactive: 'derivative',
        steps: lesson('导数定义', [
          ['极限形式', '导数是平均变化率在 h→0 时的极限。', "f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}"],
          ['几何意义', '切线斜率。'],
          ['数值验证', '取小 h 逐步逼近（见交互演示）。'],
        ]),
      },
      {
        id: 'power-rule',
        title: '幂函数求导',
        steps: [
          L('公式', '(x^n)\'=nx^{n-1}，n 为常数。', '(x^n)\'=nx^{n-1}'),
          L('示例', '(x⁵)\'=5x⁴；(√x)\'=(x^{1/2})\'=\\frac{1}{2}x^{-1/2}。'),
        ],
      },
      {
        id: 'trig-deriv',
        title: '三角函数 6 个导数',
        steps: [
          L('基本', '(sin x)\'=cos x；(cos x)\'=-sin x；(tan x)\'=sec²x。'),
          L('其余', '(cot x)\'=-csc²x；(sec x)\'=sec x tan x；(csc x)\'=-csc x cot x。'),
        ],
        resultLatex: "(\\sin x)'=\\cos x,\\ (\\cos x)'=-\\sin x,\\ (\\tan x)'=\\sec^2 x",
      },
      {
        id: 'exp-log-deriv',
        title: '指数与对数求导',
        steps: [
          L('自然指数', '(e^x)\'=e^x。'),
          L('一般指数', '(a^x)\'=a^x\\ln a。'),
          L('对数', '(\\ln x)\'=1/x；(\\log_a x)\'=\\frac{1}{x\\ln a}。'),
        ],
      },
      {
        id: 'inverse-trig-deriv',
        title: '反三角函数导数',
        steps: [
          L('公式', "(arcsin x)'=\\frac{1}{\\sqrt{1-x^2}}；(arctan x)'=\\frac{1}{1+x^2}。"),
          L('链式', '复合时别忘乘内层导数。'),
        ],
      },
      {
        id: 'chain-rule',
        title: 'Chain Rule 链式法则',
        steps: [
          L('结构', 'y=f(u), u=g(x) → dy/dx = f\'(u)·g\'(x)。', '\\frac{dy}{dx}=\\frac{dy}{du}\\cdot\\frac{du}{dx}'),
          L('示例', '(sin(x²))\'=cos(x²)·2x。', '2x\\cos(x^2)'),
          L('易错', '少乘内层导数是最高频错误之一。'),
        ],
      },
      {
        id: 'product-rule',
        title: 'Product Rule 乘法法则',
        steps: [
          L('公式', '(uv)\'=u\'v+uv\'。', "(uv)'=u'v+uv'"),
          L('示例', '(x² sin x)\'=2x sin x + x² cos x。'),
        ],
      },
      {
        id: 'quotient-rule',
        title: 'Quotient Rule 除法法则',
        steps: [
          L('公式', '(u/v)\'=(u\'v-uv\')/v²。', "(\\frac{u}{v})' = \\frac{u'v-uv'}{v^2}"),
          L('易错', '分子是 u\'v − uv\'，顺序别反。'),
        ],
      },
      {
        id: 'implicit',
        title: 'Implicit Differentiation 隐函数求导',
        steps: [
          L('两边对 x 求导', 'y 视为 x 的函数。'),
          L('含 y 项', '对 y 求导后要乘 dy/dx。', '\\frac{d}{dx}[y^2]=2y\\frac{dy}{dx}'),
          L('解出 dy/dx', '把含 dy/dx 的项移到一边。'),
        ],
      },
      {
        id: 'log-diff',
        title: 'Logarithmic Differentiation 对数求导法',
        steps: [
          L('取 ln', '两边取自然对数化乘除为加减。', '\\ln y=\\ln(\\cdots)'),
          L('隐函数求导', '对 x 求导。'),
          L('回代', '用 y 的表达式代回。'),
        ],
      },
      {
        id: 'higher-order',
        title: '高阶导数',
        steps: [
          L('定义', 'f\'\'(x) 是 f\'(x) 的导数，依此类推。'),
          L('示例', 'f(x)=x⁴ → f\'=4x³, f\'\'=12x², f^{(3)}=24x, f^{(4)}=24。'),
        ],
      },
    ],
  },
  {
    id: 'lhopital',
    title: '第四部分：L\'Hôpital\'s Rule 洛必达法则',
    topics: [
      {
        id: 'lhop-check',
        title: '验证 0/0 或 ∞/∞',
        steps: [
          L('不定式', '直接代入得 0/0 或 ±∞/±∞ 才能用。'),
          L('反例', '1/0、∞−∞ 需先变形，不能直接用。'),
        ],
      },
      {
        id: 'lhop-apply',
        title: '分子分母分别求导',
        steps: [
          L('法则', 'lim f/g = lim f\'/g\'（满足条件时）。', '\\lim\\frac{f}{g}=\\lim\\frac{f\'}{g\'}'),
          L('可重复', '若仍为不定式，继续求导。'),
        ],
      },
      {
        id: 'lhop-0-inf',
        title: '0·∞ 转化为分式',
        steps: [
          L('改写', '0·∞ → 0/(1/∞) 或 ∞/(1/0)。', 'x\\ln x=\\frac{\\ln x}{1/x}'),
          L('再洛必达', '化为 0/0 或 ∞/∞。'),
        ],
      },
      {
        id: 'lhop-inf-minus',
        title: '∞−∞ 通分',
        steps: [
          L('通分或有理化', '化为分式后再判断不定式类型。'),
          L('示例', '1/x − 1/(x-1) 通分后处理。'),
        ],
      },
      {
        id: 'lhop-power',
        title: '1^∞, 0^0, ∞^0 取对数',
        steps: [
          L('设 y=f(x)', '对 y 取 ln：ln y = …'),
          L('求极限', '先求 lim ln y，再 y=e^{lim ln y}。', 'y=e^{\\lim\\ln y}'),
        ],
      },
    ],
  },
  {
    id: 'optimization',
    title: '第五部分：Optimization 优化问题',
    topics: [
      {
        id: 'opt-setup',
        title: '画图标变量',
        steps: lesson('优化建模', [
          ['读题', '找出要最大/最小的量（目标）。'],
          ['设变量', '用 x 表示关键几何量，画示意图。'],
          ['标注', '把其他量用 x 表示。'],
        ]),
      },
      {
        id: 'opt-objective',
        title: '写目标函数',
        steps: [L('目标函数', '把要优化的量写成 f(x)。')],
      },
      {
        id: 'opt-constraint',
        title: '写约束条件',
        steps: [L('约束', '周长固定、体积关系等 → 方程 g(x,y)=0 或消元关系。')],
      },
      {
        id: 'opt-substitute',
        title: '用约束消元',
        steps: [L('消元', '用约束把目标函数化为单变量 f(x)。')],
      },
      {
        id: 'opt-domain',
        title: '确定定义域',
        steps: [L('实际意义', '边长>0、角度范围等，缩小 x 的允许区间。')],
      },
      {
        id: 'opt-critical',
        title: '求一阶导找临界点',
        steps: [
          L('求导', "f'(x)=0 或 f' 不存在的点。"),
          L('临界点', '这些 x 是候选极值点。'),
        ],
      },
      {
        id: 'opt-second',
        title: '二阶导 / 一阶导符号判别',
        steps: [
          L('二阶导', "f''(x)>0 极小，f''(x)<0 极大。"),
          L('一阶导符号', "f' 由正变负 → 极大；由负变正 → 极小。"),
        ],
      },
      {
        id: 'opt-verify',
        title: '验证最值并回答',
        steps: [
          L('比较端点', '闭区间上比较临界点和端点。'),
          L('写答案', '带单位，回应题目问法。'),
        ],
      },
      {
        id: 'opt-geometry',
        title: '几何题（面积、体积、距离）',
        steps: [
          L('面积', '矩形/圆/多边形面积公式 → 目标函数。'),
          L('体积', '圆柱、盒子、旋转体等。'),
          L('距离', '点到曲线距离常平方后求导。'),
        ],
      },
      {
        id: 'opt-applied',
        title: '实际应用（成本、时间）',
        steps: [
          L('成本', 'C(x) 最小化。'),
          L('时间', 'T(x) 在约束下最小化。'),
        ],
      },
    ],
  },
];
