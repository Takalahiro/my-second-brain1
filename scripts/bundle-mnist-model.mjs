/**
 * Bundle MNIST weights (from Python) into public/models/mnist/ for TF.js.
 * Run: python scripts/export-mnist-model.py && node scripts/bundle-mnist-model.mjs
 */
import * as tf from '@tensorflow/tfjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEIGHTS_PATH = join(__dirname, '.cache/mnist-weights.json');
const OUT_DIR = join(__dirname, '../public/models/mnist');

function buildModel() {
  const model = tf.sequential();
  model.add(
    tf.layers.conv2d({
      inputShape: [28, 28, 1],
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      name: 'conv2d_1',
    })
  );
  model.add(tf.layers.maxPooling2d({ poolSize: 2, name: 'max_pooling2d_1' }));
  model.add(
    tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      name: 'conv2d_2',
    })
  );
  model.add(tf.layers.maxPooling2d({ poolSize: 2, name: 'max_pooling2d_2' }));
  model.add(tf.layers.flatten({ name: 'flatten' }));
  model.add(tf.layers.dense({ units: 128, activation: 'relu', name: 'dense_1' }));
  model.add(tf.layers.dense({ units: 10, activation: 'softmax', name: 'dense_output' }));
  return model;
}

async function saveModelToDisk(model, dir) {
  await mkdir(dir, { recursive: true });
  await model.save(
    tf.io.withSaveHandler(async (artifacts) => {
      const weightsData = artifacts.weightData;
      if (weightsData instanceof Array) {
        for (let i = 0; i < weightsData.length; i++) {
          await writeFile(join(dir, `group1-shard${i + 1}.bin`), Buffer.from(weightsData[i]));
        }
      } else if (weightsData) {
        await writeFile(join(dir, 'group1-shard1.bin'), Buffer.from(weightsData));
      }

      const paths =
        weightsData instanceof Array
          ? weightsData.map((_, i) => `group1-shard${i + 1}.bin`)
          : ['group1-shard1.bin'];

      const modelJson = {
        modelTopology: artifacts.modelTopology,
        weightsManifest: [{ paths, weights: artifacts.weightSpecs }],
        format: artifacts.format,
        generatedBy: artifacts.generatedBy,
        convertedBy: artifacts.convertedBy,
      };

      await writeFile(join(dir, 'model.json'), JSON.stringify(modelJson));
      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
    })
  );
}

async function main() {
  const raw = await readFile(WEIGHTS_PATH, 'utf8');
  const { weights } = JSON.parse(raw);

  await tf.ready();
  const model = buildModel();
  // Build graph so weight variables exist
  model.predict(tf.zeros([1, 28, 28, 1]));

  const tensors = weights.map((w) => tf.tensor(w.values, w.shape));
  if (tensors.length !== model.weights.length) {
    throw new Error(`Weight count mismatch: keras ${tensors.length} vs tfjs ${model.weights.length}`);
  }
  model.setWeights(tensors);
  tensors.forEach((t) => t.dispose());

  await saveModelToDisk(model, OUT_DIR);
  console.log(`Model bundled to ${OUT_DIR}`);
  console.log('Use in app: /models/mnist/model.json');
  model.dispose();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
