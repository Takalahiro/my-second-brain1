import type { NetworkTrafficSnapshot } from '../../../lib/network-traffic';

export type NetworkBodyProps = {
  ui: Record<string, string>;
  snap: NetworkTrafficSnapshot | null;
  loadPct: number;
  formatBytes: (n: number) => string;
  formatBitrate: (n: number) => string;
};
