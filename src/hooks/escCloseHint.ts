export const DOUBLE_ESC_HIDE_MS = 700;
export const ESC_CLOSE_HINT_MS = 1700;

export type EscCloseAction = 'ignore' | 'exit-editing' | 'show-hint' | 'hide-window';

export type EscCloseDecision = {
  action: EscCloseAction;
  nextLastEscAt: number;
};

export type EscCloseInput = {
  isPlainEscape: boolean;
  isBlocked: boolean;
  isEditing: boolean;
  lastNonEditingEscAt: number;
  now: number;
};

export function decideEscClose(input: EscCloseInput): EscCloseDecision {
  if (!input.isPlainEscape || input.isBlocked) {
    return { action: 'ignore', nextLastEscAt: input.lastNonEditingEscAt };
  }

  if (input.isEditing) {
    return { action: 'exit-editing', nextLastEscAt: 0 };
  }

  if (input.now - input.lastNonEditingEscAt <= DOUBLE_ESC_HIDE_MS) {
    return { action: 'hide-window', nextLastEscAt: 0 };
  }

  return { action: 'show-hint', nextLastEscAt: input.now };
}
