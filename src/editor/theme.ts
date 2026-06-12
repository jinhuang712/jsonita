/**
 * CodeMirror theme extension — 全走 CSS variables（design/08 § 1.5）。
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
  '.cm-scroller, .cm-content, .cm-line, .cm-layer': {
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    caretColor: 'var(--editor-cursor)',
    padding: 'var(--sp-3) 0',
    fontFamily: 'var(--font-mono)',
    lineHeight: 'var(--lh-code)',
  },
  '.cm-line': {
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
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--fs-editor)',
    lineHeight: 'var(--lh-code)',
  },
  '.cm-gutterElement': {
    lineHeight: 'var(--lh-code)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    minWidth: '2.4ch',
    padding: '0 var(--sp-2)',
    textAlign: 'right',
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
    backgroundColor: 'color-mix(in srgb, var(--primary) 11%, transparent)',
    outline: '1px solid color-mix(in srgb, var(--primary) 13%, transparent)',
    borderRadius: '2px',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 18%, transparent)',
    outlineColor: 'color-mix(in srgb, var(--primary) 23%, transparent)',
  },
  '.jsonita-search-panel': {
    display: 'grid',
    gap: '4px',
    padding: '6px 10px',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'color-mix(in srgb, var(--bg-code) 82%, var(--surface-raised))',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--fs-sm)',
    color: 'var(--text-muted)',
  },
  '.jsonita-search-row': {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    minWidth: 0,
  },
  '.jsonita-search-replace-row': {
    paddingLeft: 0,
  },
  '.jsonita-search-label': {
    flex: '0 0 54px',
    color: 'var(--text-faint)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--fs-xs)',
    lineHeight: 'var(--lh-tight)',
  },
  '.jsonita-search-input': {
    minWidth: '96px',
    flex: '1 1 180px',
    height: '26px',
    padding: '0 8px',
    border: '1px solid var(--control-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--control-bg)',
    color: 'var(--text)',
    font: 'inherit',
    outline: 'none',
  },
  '.jsonita-search-input:focus': {
    borderColor: 'var(--primary-edge)',
    boxShadow: 'var(--shadow-focus)',
  },
  '.jsonita-search-replace-input': {
    flex: '1 1 180px',
  },
  '.jsonita-search-count': {
    minWidth: '54px',
    color: 'var(--text-faint)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--fs-xs)',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  '.jsonita-search-button': {
    height: '26px',
    minWidth: '26px',
    padding: '0 8px',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    font: 'inherit',
    lineHeight: 1,
    cursor: 'pointer',
  },
  '.jsonita-search-button:hover': {
    backgroundColor: 'var(--control-bg-hover)',
    color: 'color-mix(in srgb, var(--text) 84%, var(--primary))',
  },
  '.jsonita-search-button:focus-visible': {
    boxShadow: 'var(--shadow-focus)',
    outline: 'none',
  },
  '.jsonita-search-toggle': {
    minWidth: '34px',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--fs-xs)',
  },
  '.jsonita-search-toggle-active': {
    borderColor: 'var(--primary-edge)',
    backgroundColor: 'var(--control-bg-active)',
    color: 'color-mix(in srgb, var(--primary) 72%, var(--text))',
  },
  '.jsonita-search-replace-button': {
    minWidth: '64px',
    color: 'var(--text-muted)',
  },
  '.jsonita-search-close': {
    minWidth: '27px',
    padding: 0,
    fontSize: 'var(--fs-md)',
    color: 'var(--text-faint)',
  },
  '.cm-lineNumbers .cm-gutterElement.jsonita-search-line-number': {
    position: 'relative',
  },
  '.cm-lineNumbers .cm-gutterElement.jsonita-search-line-number::before': {
    content: '""',
    position: 'absolute',
    left: '2px',
    top: '50%',
    width: '2px',
    height: 'calc(var(--fs-editor) * 0.88)',
    borderRadius: '999px',
    backgroundColor: 'color-mix(in srgb, var(--primary) 22%, transparent)',
    transform: 'translateY(-50%)',
  },
  '.cm-lineNumbers .cm-gutterElement.jsonita-search-line-number-active::before': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 38%, transparent)',
    boxShadow: 'none',
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
    backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 92%, transparent)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    fontSize: 'var(--fs-sm)',
  },
};

export const jsonitaLightTheme = EditorView.theme(sharedSpec, { dark: false });
export const jsonitaDarkTheme = EditorView.theme(sharedSpec, { dark: true });
