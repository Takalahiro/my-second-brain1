/**
 * 白噪音音轨清单 —— 文件名关键词作为 key，文件在 public/voice/
 */
export type VoiceTrack = {
  /** 关键词 key（来自文件名） */
  key: string;
  /** 显示名 */
  label: string;
  /** 相对 public 的路径 */
  src: string;
  /** 分类标签 */
  tag: string;
};

/** 从文件名解析出的 12 条音轨 */
export const VOICE_TRACKS: VoiceTrack[] = [
  { key: '水下水语', src: '/voice/4.【大自然白噪音】水下水语.ogg', label: '水下水语', tag: '自然' },
  { key: '溪边长笛', src: '/voice/7.溪边长笛.ogg', label: '溪边长笛', tag: '自然' },
  { key: '日本街头雨天', src: '/voice/11.日本街头雨天漫步~白噪音_减压_专注_冥想（1小时）.ogg', label: '日本街头雨天', tag: '城市' },
  { key: '暮色森林', src: '/voice/19.【大自然白噪音】暮色森林.ogg', label: '暮色森林', tag: '自然' },
  { key: '夜晚篝火', src: '/voice/2.夜晚篝火8D高清白噪音.ogg', label: '夜晚篝火', tag: '自然' },
  { key: '图书馆', src: '/voice/5.图书馆~白噪音_减压_专注_冥想（1小时）.ogg', label: '图书馆', tag: '室内' },
  { key: '落日潮汐', src: '/voice/17.【大自然白噪音】落日潮汐.ogg', label: '落日潮汐', tag: '自然' },
  { key: '午后的马厩', src: '/voice/6.午后的马厩.ogg', label: '午后的马厩', tag: '自然' },
  { key: '宁静雨夜', src: '/voice/11.宁静雨夜！雷声和阵阵大雨 安静舒适.ogg', label: '宁静雨夜', tag: '雨声' },
  { key: '海边火语', src: '/voice/11.【大自然白噪音】海边火语.ogg', label: '海边火语', tag: '自然' },
  { key: '森林鸟唱', src: '/voice/6.【大自然白噪音】森林鸟唱.ogg', label: '森林鸟唱', tag: '自然' },
  { key: '晨湖静语', src: '/voice/9.【大自然白噪音】晨湖静语.ogg', label: '晨湖静语', tag: '自然' },
];

export const VOICE_TRACK_MAP = new Map(VOICE_TRACKS.map((t) => [t.key, t]));
