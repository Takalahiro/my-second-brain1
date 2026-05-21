/** 浏览器内会话级网络流量估算（Performance API + Network Information） */

export type NetworkConnectionInfo = {
  effectiveType?: string;
  downlinkMbps?: number;
  rttMs?: number;
  saveData?: boolean;
};

export type NetworkTrafficSnapshot = {
  sessionStarted: number;
  bytesDown: number;
  bytesUp: number;
  requestCount: number;
  bytesPerSecond: number;
  peakBytesPerSecond: number;
  sparkline: number[];
  connection: NetworkConnectionInfo;
  lastUpdated: number;
};

export type NetworkTrafficMonitor = {
  getSnapshot: () => NetworkTrafficSnapshot;
  reset: () => void;
  destroy: () => void;
};

const SPARK_LEN = 36;

function readConnection(): NetworkConnectionInfo {
  if (typeof navigator === 'undefined') return {};
  const conn = (navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
  }).connection;
  if (!conn) return {};
  return {
    effectiveType: conn.effectiveType,
    downlinkMbps: typeof conn.downlink === 'number' ? conn.downlink : undefined,
    rttMs: typeof conn.rtt === 'number' ? conn.rtt : undefined,
    saveData: !!conn.saveData,
  };
}

function entryBytes(entry: PerformanceEntry): number {
  const rt = entry as PerformanceResourceTiming;
  if (typeof rt.transferSize === 'number' && rt.transferSize > 0) return rt.transferSize;
  if (typeof rt.encodedBodySize === 'number' && rt.encodedBodySize > 0) return rt.encodedBodySize;
  if (typeof rt.decodedBodySize === 'number' && rt.decodedBodySize > 0) return rt.decodedBodySize;
  return 0;
}

export function formatBytes(n: number, digits = 1): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : digits)} ${units[i]}`;
}

export function formatBitrate(bps: number): string {
  if (!Number.isFinite(bps) || bps <= 0) return '0 B/s';
  return `${formatBytes(bps)}/s`;
}

export function effectiveTypeLabel(type?: string): string {
  switch (type) {
    case 'slow-2g': return '2G 慢';
    case '2g': return '2G';
    case '3g': return '3G';
    case '4g': return '4G';
    default: return type ?? '未知';
  }
}

export function createNetworkTrafficMonitor(): NetworkTrafficMonitor {
  const sessionStarted = Date.now();
  let bytesDown = 0;
  let bytesUp = 0;
  let requestCount = 0;
  let bytesThisSecond = 0;
  let bytesPerSecond = 0;
  let peakBytesPerSecond = 0;
  const sparkline: number[] = Array(SPARK_LEN).fill(0);
  const seen = new Set<string>();

  const bump = (size: number) => {
    if (size <= 0) return;
    bytesDown += size;
    bytesThisSecond += size;
  };

  if (typeof performance !== 'undefined') {
    for (const entry of [...performance.getEntriesByType('resource'), ...performance.getEntriesByType('navigation')]) {
      if (seen.has(entry.name + entry.startTime)) continue;
      seen.add(entry.name + entry.startTime);
      bump(entryBytes(entry));
      requestCount += 1;
    }
  }

  let observer: PerformanceObserver | null = null;
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (seen.has(entry.name + entry.startTime)) continue;
          seen.add(entry.name + entry.startTime);
          bump(entryBytes(entry));
          requestCount += 1;
        }
      });
      observer.observe({ type: 'resource', buffered: true });
      observer.observe({ type: 'navigation', buffered: true });
    } catch {
      observer = null;
    }
  }

  const tick = window.setInterval(() => {
    bytesPerSecond = bytesThisSecond;
    peakBytesPerSecond = Math.max(peakBytesPerSecond, bytesPerSecond);
    sparkline.push(bytesThisSecond);
    if (sparkline.length > SPARK_LEN) sparkline.shift();
    bytesThisSecond = 0;
  }, 1000);

  const onConnectionChange = () => {
    /* snapshot reads live connection each tick */
  };
  const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
  conn?.addEventListener?.('change', onConnectionChange);

  return {
    getSnapshot(): NetworkTrafficSnapshot {
      return {
        sessionStarted,
        bytesDown,
        bytesUp,
        requestCount,
        bytesPerSecond,
        peakBytesPerSecond,
        sparkline: [...sparkline],
        connection: readConnection(),
        lastUpdated: Date.now(),
      };
    },
    reset() {
      bytesDown = 0;
      bytesUp = 0;
      requestCount = 0;
      bytesThisSecond = 0;
      bytesPerSecond = 0;
      peakBytesPerSecond = 0;
      sparkline.fill(0);
      seen.clear();
    },
    destroy() {
      window.clearInterval(tick);
      conn?.removeEventListener?.('change', onConnectionChange);
      observer?.disconnect();
      observer = null;
    },
  };
}
