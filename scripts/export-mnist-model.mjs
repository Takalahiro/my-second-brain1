/**
 * 训一个 LeNet-style MNIST CNN，export 到 public/models/mnist/ 给 digits demo 用。
 * node scripts/export-mnist-model.mjs
 */
import * as tf from '@tensorflow/tfjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/models/mnist');

const IMAGE_URL =
  'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png';
const LABEL_URL =
  'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8';

const IMAGE_H = 28;
const IMAGE_W = 28;
const IMAGE_SIZE = IMAGE_H * IMAGE_W;
const NUM_CLASSES = 10;
const NUM_DATASET_ELEMENTS = 65000;
const NUM_TRAIN = 55000;

async function loadMnist() {
  const [imgResponse, labelResponse] = await Promise.all([fetch(IMAGE_URL), fetch(LABEL_URL)]);
  if (!imgResponse.ok) throw new Error(`Failed to fetch images: ${imgResponse.status}`);
  if (!labelResponse.ok) throw new Error(`Failed to fetch labels: ${labelResponse.status}`);

  const png = PNG.sync.read(Buffer.from(await imgResponse.arrayBuffer()));
  // sprite sheet 布局：每行一个 28×28 digit，宽 784 × 高 65000
  if (png.width !== IMAGE_SIZE) {
    throw new Error(`Unexpected sprite width ${png.width}, expected ${IMAGE_SIZE}`);
  }
  if (png.height < NUM_DATASET_ELEMENTS) {
    throw new Error(`Unexpected sprite height ${png.height}, expected >= ${NUM_DATASET_ELEMENTS}`);
  }

  const pixels = new Float32Array(NUM_DATASET_ELEMENTS * IMAGE_SIZE);
  for (let i = 0; i < NUM_DATASET_ELEMENTS; i++) {
    for (let p = 0; p < IMAGE_SIZE; p++) {
      const idx = (i * png.width + p) << 2;
      pixels[i * IMAGE_SIZE + p] = png.data[idx] / 255;
    }
  }

  const labelBytes = new Uint8Array(await labelResponse.arrayBuffer());
  const labels = tf.tensor2d(labelBytes, [NUM_DATASET_ELEMENTS, NUM_CLASSES]);
  const images = tf.tensor4d(pixels, [NUM_DATASET_ELEMENTS, IMAGE_H, IMAGE_W, 1]);

  const TRAIN_COUNT = 5000;
  const TEST_COUNT = 1000;

  return {
    trainImages: images.slice([0, 0, 0, 0], [TRAIN_COUNT, IMAGE_H, IMAGE_W, 1]),
    trainLabels: labels.slice([0, 0], [TRAIN_COUNT, NUM_CLASSES]),
    testImages: images.slice([NUM_TRAIN, 0, 0, 0], [TEST_COUNT, IMAGE_H, IMAGE_W, 1]),
    testLabels: labels.slice([NUM_TRAIN, 0], [TEST_COUNT, NUM_CLASSES]),
  };
}

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
      const weightsManifest = artifacts.weightSpecs.map((spec, i) => ({
        ...spec,
        paths: [`group1-shard${i + 1}.bin`],
      }));

      if (weightsData instanceof Array) {
        for (let i = 0; i < weightsData.length; i++) {
          await writeFile(join(dir, `group1-shard${i + 1}.bin`), Buffer.from(weightsData[i]));
        }
      } else if (weightsData) {
        await writeFile(join(dir, 'group1-shard1.bin'), Buffer.from(weightsData));
      }

      const modelJson = {
        modelTopology: artifacts.modelTopology,
        weightsManifest: [{ paths: weightsManifest.map((s) => s.paths[0]), weights: artifacts.weightSpecs }],
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
  console.log('Loading MNIST…');
  await tf.ready();
  console.log('Backend:', tf.getBackend());

  const { trainImages, trainLabels, testImages, testLabels } = await loadMnist();
  console.log('Train:', trainImages.shape, 'Test:', testImages.shape);

  const model = buildModel();
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
  model.summary();

  const epochs = 1;
  console.log(`Training ${epochs} epochs…`);
  await model.fit(trainImages, trainLabels, {
    batchSize: 128,
    epochs,
    validationData: [testImages, testLabels],
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(
          `Epoch ${epoch + 1}/${epochs} — loss ${logs.loss.toFixed(4)} acc ${logs.acc.toFixed(4)} val_acc ${logs.val_acc.toFixed(4)}`
        );
      },
    },
  });

  await saveModelToDisk(model, OUT_DIR);
  console.log(`\nModel exported to ${OUT_DIR}`);

  const sample = testImages.slice([0, 0, 0, 0], [1, 28, 28, 1]);
  const pred = model.predict(sample);
  const idx = (await pred.argMax(-1).data())[0];
  const label = (await testLabels.slice([0, 0], [1, NUM_CLASSES]).argMax(-1).data())[0];
  console.log(`Sample pred=${idx} label=${label}`);

  sample.dispose();
  pred.dispose();
  trainImages.dispose();
  trainLabels.dispose();
  testImages.dispose();
  testLabels.dispose();
  model.dispose();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
