export type SkinSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onchange: (value: boolean) => void;
};

export type SkinSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
  ariaLabel: string;
  oninput: (value: number) => void;
};

export type SkinSegmentOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type SkinSegmentProps = {
  options: SkinSegmentOption[];
  value: string;
  ariaLabel: string;
  onchange: (id: string) => void;
};

export type DrawerPaneId = 'home' | 'widgets' | 'wallpaper' | 'desktop' | 'ui';

export type SkinDrawerTabsProps = {
  pane: DrawerPaneId;
  tabs: Array<{ id: DrawerPaneId; label: string }>;
  onchange: (id: DrawerPaneId) => void;
};
