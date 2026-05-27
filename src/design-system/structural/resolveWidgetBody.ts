import type { Component } from 'svelte';

import type { StructuralSkinId } from './registry';

import type { TodoBodyProps } from './widgets/todo/todo-types';
import type { StatsBodyProps } from './widgets/stats/stats-types';
import type { WeatherBodyProps } from './widgets/weather/weather-types';
import type { MusicBodyProps } from './widgets/music/music-types';
import type { CalendarBodyProps } from './widgets/calendar/calendar-types';
import type { PomodoroBodyProps } from './widgets/pomodoro/pomodoro-types';
import type { NotesBodyProps } from './widgets/notes/notes-types';
import type { NetworkBodyProps } from './widgets/network/network-types';
import type { WorldClockBodyProps } from './widgets/world/world-types';
import type { WhiteNoiseBodyProps } from './widgets/whitenoise/whitenoise-types';
import type { ClockBodyProps } from './widgets/clock/clock-types';
import type { GraphBodyProps } from './widgets/graph/graph-types';
import type { CalculatorBodyProps } from './widgets/calculator/calculator-types';
import type { PythonBodyProps } from './widgets/python/python-types';
import type { WhiteboardBodyProps } from './widgets/whiteboard/whiteboard-types';
import type { TerritoryBodyProps } from './widgets/territory/territory-types';

import BlueprintTodoBody from './widgets/todo/BlueprintTodoBody.svelte';
import ScholarTodoBody from './widgets/todo/ScholarTodoBody.svelte';
import TerminalTodoBody from './widgets/todo/TerminalTodoBody.svelte';
import CrtTodoBody from './widgets/todo/CrtTodoBody.svelte';
import ObservatoryTodoBody from './widgets/todo/ObservatoryTodoBody.svelte';
import HerbariumTodoBody from './widgets/todo/HerbariumTodoBody.svelte';
import InkTodoBody from './widgets/todo/InkTodoBody.svelte';
import RpgTodoBody from './widgets/todo/RpgTodoBody.svelte';
import SpacecraftTodoBody from './widgets/todo/SpacecraftTodoBody.svelte';

import StatsWidgetBody from './widgets/stats/StatsWidgetBody.svelte';
import WeatherWidgetBody from './widgets/weather/WeatherWidgetBody.svelte';
import MusicWidgetBody from './widgets/music/MusicWidgetBody.svelte';
import CalendarWidgetBody from './widgets/calendar/CalendarWidgetBody.svelte';
import PomodoroWidgetBody from './widgets/pomodoro/PomodoroWidgetBody.svelte';
import NotesWidgetBody from './widgets/notes/NotesWidgetBody.svelte';
import NetworkWidgetBody from './widgets/network/NetworkWidgetBody.svelte';
import WorldClockWidgetBody from './widgets/world/WorldClockWidgetBody.svelte';
import WhiteNoiseWidgetBody from './widgets/whitenoise/WhiteNoiseWidgetBody.svelte';
import ClockWidgetBody from './widgets/clock/ClockWidgetBody.svelte';
import GraphWidgetBody from './widgets/graph/GraphWidgetBody.svelte';
import CalculatorWidgetBody from './widgets/calculator/CalculatorWidgetBody.svelte';
import PythonWidgetBody from './widgets/python/PythonWidgetBody.svelte';
import WhiteboardWidgetBody from './widgets/whiteboard/WhiteboardWidgetBody.svelte';
import TerritoryWidgetBody from './widgets/territory/TerritoryWidgetBody.svelte';

const TODO_BODIES: Record<StructuralSkinId, Component<TodoBodyProps>> = {
  blueprint: BlueprintTodoBody,
  scholar: ScholarTodoBody,
  terminal: TerminalTodoBody,
  crt: CrtTodoBody,
  observatory: ObservatoryTodoBody,
  herbarium: HerbariumTodoBody,
  ink: InkTodoBody,
  rpg: RpgTodoBody,
  spacecraft: SpacecraftTodoBody,
};

export function getTodoBodyComponent(skin: StructuralSkinId): Component<TodoBodyProps> {
  return TODO_BODIES[skin];
}

export function getStatsBodyComponent(_skin: StructuralSkinId): Component<StatsBodyProps> {
  return StatsWidgetBody;
}

export function getWeatherBodyComponent(_skin: StructuralSkinId): Component<WeatherBodyProps> {
  return WeatherWidgetBody;
}

export function getMusicBodyComponent(_skin: StructuralSkinId): Component<MusicBodyProps> {
  return MusicWidgetBody;
}

export function getCalendarBodyComponent(_skin: StructuralSkinId): Component<CalendarBodyProps> {
  return CalendarWidgetBody;
}

export function getPomodoroBodyComponent(_skin: StructuralSkinId): Component<PomodoroBodyProps> {
  return PomodoroWidgetBody;
}

export function getNotesBodyComponent(_skin: StructuralSkinId): Component<NotesBodyProps> {
  return NotesWidgetBody;
}

export function getNetworkBodyComponent(_skin: StructuralSkinId): Component<NetworkBodyProps> {
  return NetworkWidgetBody;
}

export function getWorldClockBodyComponent(_skin: StructuralSkinId): Component<WorldClockBodyProps> {
  return WorldClockWidgetBody;
}

export function getWhiteNoiseBodyComponent(_skin: StructuralSkinId): Component<WhiteNoiseBodyProps> {
  return WhiteNoiseWidgetBody;
}

export function getClockBodyComponent(_skin: StructuralSkinId): Component<ClockBodyProps> {
  return ClockWidgetBody;
}

export function getGraphBodyComponent(_skin: StructuralSkinId): Component<GraphBodyProps> {
  return GraphWidgetBody;
}

export function getCalculatorBodyComponent(_skin: StructuralSkinId): Component<CalculatorBodyProps> {
  return CalculatorWidgetBody;
}

export function getPythonBodyComponent(_skin: StructuralSkinId): Component<PythonBodyProps> {
  return PythonWidgetBody;
}

export function getWhiteboardBodyComponent(_skin: StructuralSkinId): Component<WhiteboardBodyProps> {
  return WhiteboardWidgetBody;
}

export function getTerritoryBodyComponent(_skin: StructuralSkinId): Component<TerritoryBodyProps> {
  return TerritoryWidgetBody;
}

export type { TodoBodyProps, TodoItemView } from './widgets/todo/todo-types';
export type { StatsBodyProps, StatsData, StatTab, StatsDay } from './widgets/stats/stats-types';
export type { WeatherBodyProps, WeatherForecast } from './widgets/weather/weather-types';
export type { MusicBodyProps } from './widgets/music/music-types';
export type { CalendarBodyProps, CalEvent, CalCell } from './widgets/calendar/calendar-types';
export type { PomodoroBodyProps, PomodoroPhase } from './widgets/pomodoro/pomodoro-types';
export type { NotesBodyProps, NoteItem } from './widgets/notes/notes-types';
export type { NetworkBodyProps } from './widgets/network/network-types';
export type { WorldClockBodyProps, WorldCity, WorldSlot } from './widgets/world/world-types';
export type { WhiteNoiseBodyProps, WhiteNoiseTrack } from './widgets/whitenoise/whitenoise-types';
export type { ClockBodyProps } from './widgets/clock/clock-types';
export type { GraphBodyProps, GraphNode, GraphLink } from './widgets/graph/graph-types';
export type { CalculatorBodyProps } from './widgets/calculator/calculator-types';
export type { PythonBodyProps } from './widgets/python/python-types';
export type { WhiteboardBodyProps } from './widgets/whiteboard/whiteboard-types';
export type { TerritoryBodyProps, TerritoryStarHud } from './widgets/territory/territory-types';
