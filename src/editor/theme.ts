/**
 * CodeMirror theme extension — 全走 CSS variables（spec/08 § 1.5）。
 *
 * data-theme attr 切换时所有变量随之换；CM6 instance 不需销毁重建
 * （M3-N1 polish 时引入 Compartment 即可热切）。但仍维持 light/dark
 * 两 instance 以让 CM 内置 highlightStyle 选对版本（CM 内部 dark flag）。
 */

import { EditorView } from '@codemirror/view';

const sharedSpec: Parameters<typeof EditorView.theme>[0] = {
  '&': {
    color: 'var(--text)',
    backgroundColor: 'var(--editor-bg)',
    fontSize: 'var(--fs-editor)',
    fontFamily: 'var(--font-mono)',
    height: '100%',
    userSelect: 'text',
  },
  '.cm-content': {
    caretColor: 'var(--editor-cursor)',
    padding: 'var(--sp-3) 0',
    fontFamily: 'var(--font-mono)',
    lineHeight: 'var(--lh-code)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--editor-cursor)',
  },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--editor-selection)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--editor-gutter)',
    color: 'var(--text-faint)',
    border: 'none',
  },
  '.cm-activeLineGutter, .cm-activeLine': {
    backgroundColor: 'var(--editor-line-active)',
  },
  '.cm-foldPlaceholder': {
    color: 'var(--text-faint)',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: 'var(--fs-xs)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--editor-bracket-match)',
    outline: '1px solid var(--primary-edge)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'rgba(250, 155, 16, 0.18)',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'rgba(250, 155, 16, 0.36)',
  },
  '.cm-lintRange-error': {
    backgroundImage:
      'linear-gradient(to top right, transparent calc(50% - 1px), color-mix(in srgb, var(--editor-error-underline) 70%, transparent) calc(50% - 1px), color-mix(in srgb, var(--editor-error-underline) 70%, transparent) calc(50% + 1px), transparent calc(50% + 1px))',
    backgroundRepeat: 'repeat-x',
    backgroundPosition: 'bottom',
    backgroundSize: '6px 2px',
  },
  '.cm-gutter-lint': {
    width: '0.78em',
  },
  '.cm-gutter-lint .cm-gutterElement': {
    padding: '0 2px',
  },
  '.cm-lint-marker': {
    content: '""',
    display: 'block',
    width: '3px',
    height: 'calc(var(--fs-editor) * 1.12)',
    margin: '0.2em auto 0',
    borderRadius: '999px',
    background: 'transparent',
  },
  '.cm-lint-marker-error': {
    content: '""',
    backgroundColor: 'color-mix(in srgb, var(--editor-error-underline) 44%, transparent)',
    boxShadow: 'none',
  },
  '.cm-tooltip-lint': {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--fs-sm)',
  },
};

export const jsonitaLightTheme = EditorView.theme(sharedSpec, { dark: false });
export const jsonitaDarkTheme = EditorView.theme(sharedSpec, { dark: true });
