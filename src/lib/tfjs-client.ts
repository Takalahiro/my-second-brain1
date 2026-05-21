/**
 * 浏览器端 TF.js 单例入口 — 使用静态 import，避免 Vite dev 下
 * dynamic import('@tensorflow/tfjs') 请求 node_modules/.vite/deps 404。
 */
import * as tf from '@tensorflow/tfjs';

export { tf };
export default tf;
