// 浏览器端 TF.js 单例
// 用静态 import，Vite dev 下 dynamic import('@tensorflow/tfjs') 会 404 node_modules/.vite/deps
import * as tf from '@tensorflow/tfjs';

export { tf };
export default tf;
