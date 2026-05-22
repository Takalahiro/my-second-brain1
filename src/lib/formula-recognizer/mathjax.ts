declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: Element[]) => Promise<void>;
      tex2chtml?: (tex: string, options?: { display?: boolean }) => HTMLElement;
      startup?: { promise?: Promise<void> };
    };
  }
}

let mathJaxPromise: Promise<void> | null = null;

function waitForMathJax(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.MathJax?.typesetPromise) return Promise.resolve();
  if (mathJaxPromise) return mathJaxPromise;

  mathJaxPromise = new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.MathJax?.typesetPromise) {
        resolve();
        return;
      }
      if (Date.now() - started > 15000) {
        reject(new Error('MathJax 加载超时'));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

  return mathJaxPromise;
}

// LaTeX → 指定容器（MathJax 3）
export async function renderLatexPreview(
  container: HTMLElement,
  latex: string,
  options?: { emptyText?: string }
): Promise<void> {
  const emptyText = options?.emptyText ?? '识别结果将显示在这里';
  if (!latex.trim()) {
    container.innerHTML = `<span class="fr-preview-empty">${emptyText}</span>`;
    return;
  }

  try {
    await waitForMathJax();
    const mj = window.MathJax;
    if (!mj?.tex2chtml) {
      container.textContent = latex;
      return;
    }

    container.innerHTML = '';
    const display = mj.tex2chtml(latex, { display: true });
    display.classList.add('fr-mathjax-output');
    container.append(display);
    await mj.typesetPromise?.([container]);
  } catch {
    container.textContent = latex;
  }
}

export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
