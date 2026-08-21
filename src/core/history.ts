import { applyAlignmentCommand, AlignmentCommand } from "./commands";
import { AlignmentDocument } from "./model";

export type DocumentHistory = {
  past: AlignmentDocument[];
  present: AlignmentDocument;
  future: AlignmentDocument[];
  saved: AlignmentDocument;
  dirty: boolean;
};

export type HistoryAction =
  | { type: "execute"; command: AlignmentCommand }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "open"; document: AlignmentDocument }
  | { type: "mark-saved" };

export function createDocumentHistory(document: AlignmentDocument): DocumentHistory {
  return { past: [], present: document, future: [], saved: document, dirty: false };
}

export function documentHistoryReducer(
  state: DocumentHistory,
  action: HistoryAction,
): DocumentHistory {
  switch (action.type) {
    case "execute": {
      const next = applyAlignmentCommand(state.present, action.command);
      if (next === state.present) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: [],
        saved: state.saved,
        dirty: true,
      };
    }

    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        saved: state.saved,
        dirty: previous !== state.saved,
      };
    }

    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        saved: state.saved,
        dirty: next !== state.saved,
      };
    }

    case "open":
      return createDocumentHistory(action.document);

    case "mark-saved":
      return { ...state, saved: state.present, dirty: false };
  }
}
