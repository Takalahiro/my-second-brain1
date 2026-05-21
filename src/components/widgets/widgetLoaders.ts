import type { Component } from 'svelte';

type Loader = () => Promise<{ default: Component }>;

export const widgetLoaders = {
  background: () => import('./BackgroundLayer.svelte'),
  atmosphere: () => import('./AtmosphereEffects.svelte'),
  clock: () => import('./PixelClock.svelte'),
  music: () => import('./MusicPlayer.svelte'),
  notes: () => import('./NotesWidget.svelte'),
  todo: () => import('./TodoWidget.svelte'),
  calendar: () => import('./CalendarWidget.svelte'),
  pomodoro: () => import('./PomodoroWidget.svelte'),
  weather: () => import('./WeatherWidget.svelte'),
  stats: () => import('./StatsWidget.svelte'),
  world: () => import('./WorldClockWidget.svelte'),
  graph: () => import('./GraphWidget.svelte'),
  territory: () => import('./TerritoryMapWidget.svelte'),
  calculator: () => import('./CalculatorWidget.svelte'),
  python: () => import('./PythonWidget.svelte'),
  whiteboard: () => import('./WhiteboardWidget.svelte'),
  whitenoise: () => import('./WhiteNoiseWidget.svelte'),
  network: () => import('./NetworkWidget.svelte'),
} satisfies Record<string, Loader>;
