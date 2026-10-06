import { LearningPageId, LEARNING_PAGES } from "../data/learningPages";
export interface PageProgress {
  index: number;
  playing: boolean;
  speed: number;
  example: string;
  selectedLine: number | null;
}
export interface LearningState {
  page: LearningPageId;
  progress: Record<LearningPageId, PageProgress>;
}
export type LearningAction =
  | { type: "navigate"; page: LearningPageId }
  | { type: "update"; patch: Partial<PageProgress> }
  | { type: "advance"; page: LearningPageId; total: number }
  | { type: "reset" };
export const defaultProgress = (): PageProgress => ({
  index: 0,
  playing: false,
  speed: 1,
  example: "normal",
  selectedLine: 6,
});
export function initialLearningState(page: LearningPageId): LearningState {
  const progress = Object.fromEntries(
    LEARNING_PAGES.map((p) => [p.id, defaultProgress()]),
  ) as LearningState["progress"];
  return { page, progress };
}
export function learningReducer(
  state: LearningState,
  action: LearningAction,
): LearningState {
  if (action.type === "navigate") {
    const progress = Object.fromEntries(
      Object.entries(state.progress).map(([id, p]) => [
        id,
        { ...p, playing: false },
      ]),
    ) as LearningState["progress"];
    return { page: action.page, progress };
  }
  const current = state.progress[state.page];
  let next: PageProgress;
  if (action.type === "advance") {
    if (action.page !== state.page || !current.playing) return state;
    const index = Math.min(current.index + 1, action.total - 1);
    next = { ...current, index, playing: index < action.total - 1 };
  } else if (action.type === "reset") {
    next = { ...current, index: 0, playing: false, selectedLine: 6 };
  } else next = { ...current, ...action.patch };
  return { ...state, progress: { ...state.progress, [state.page]: next } };
}
