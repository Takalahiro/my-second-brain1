#!/usr/bin/env python3
"""Fast MNIST training; exports weights JSON for scripts/bundle-mnist-model.mjs."""
from __future__ import annotations

import json
import os
import urllib.request

import numpy as np
import tensorflow as tf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scripts", ".cache")
WEIGHTS_PATH = os.path.join(CACHE, "mnist-weights.json")

IMAGE_URL = "https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png"
LABEL_URL = "https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8"

NUM_DATASET = 65000
IMAGE_SIZE = 784
NUM_TRAIN = 12000
NUM_TEST = 2000


def load_png_rows(url: str) -> np.ndarray:
    import io

    from PIL import Image

    with urllib.request.urlopen(url) as resp:
        img = Image.open(io.BytesIO(resp.read())).convert("L")
    arr = np.asarray(img, dtype=np.float32) / 255.0
    return arr[:NUM_DATASET]


def load_labels(url: str) -> np.ndarray:
    with urllib.request.urlopen(url) as resp:
        raw = resp.read()
    return np.frombuffer(raw, dtype=np.uint8).reshape(NUM_DATASET, 10)


def build_model() -> tf.keras.Model:
    return tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(28, 28, 1)),
            tf.keras.layers.Conv2D(32, 3, activation="relu", name="conv2d_1"),
            tf.keras.layers.MaxPooling2D(2, name="max_pooling2d_1"),
            tf.keras.layers.Conv2D(64, 3, activation="relu", name="conv2d_2"),
            tf.keras.layers.MaxPooling2D(2, name="max_pooling2d_2"),
            tf.keras.layers.Flatten(name="flatten"),
            tf.keras.layers.Dense(128, activation="relu", name="dense_1"),
            tf.keras.layers.Dense(10, activation="softmax", name="dense_output"),
        ],
        name="mnist_lenet",
    )


def main() -> None:
    print("Loading MNIST…")
    rows = load_png_rows(IMAGE_URL)
    labels = load_labels(LABEL_URL)
    x = rows.reshape(NUM_DATASET, 28, 28, 1)
    y = labels

    x_train, y_train = x[:NUM_TRAIN], y[:NUM_TRAIN]
    x_test = x[NUM_DATASET - NUM_TEST : NUM_DATASET]
    y_test = y[NUM_DATASET - NUM_TEST : NUM_DATASET]
    print("Train:", x_train.shape, "Test:", x_test.shape)

    model = build_model()
    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    model.summary()

    print("Training…")
    model.fit(x_train, y_train, batch_size=128, epochs=3, validation_data=(x_test, y_test), verbose=1)

    os.makedirs(CACHE, exist_ok=True)
    payload = {
        "weights": [
            {"shape": list(w.shape), "values": w.reshape(-1).tolist()}
            for w in model.get_weights()
        ],
    }
    with open(WEIGHTS_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f)
    print(f"Weights saved to {WEIGHTS_PATH}")
    print("Run: node scripts/bundle-mnist-model.mjs")


if __name__ == "__main__":
    main()
