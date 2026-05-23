/**
 * CodeMirror 6 扩展组装 — spec/08 § 1.2 (12 项标配) + § 1.3。
 */

import { closeBrackets } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import {
  bracketMatching,
  codeFolding,
  defaultHighlightStyle,
  foldGutter,
  syntaxHighlighting,
} from '@codemirror/language';
import { lintGutter, linter } from '@codemirror/lint';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';

import { jsonitaJsonHighlight } from './highlight';
import { jsonitaDarkTheme, jsonitaLightTheme } from './theme';

export interface EditorConfig {
  theme: 'light' | 'dark';
  readOnly?: boolean;
  softWrap?: boolean;
  placeholderText?: string;
}

export function makeExtensions(cfg: EditorConfig): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    foldGutter(),
    codeFolding(),
    bracketMatching(),
    closeBrackets(),
    history(),
    drawSelection(),
    highlightSelectionMatches(),
    indentationMarkers({ thickness: 1, hideFirstIndent: true, colors: { light: 'var(--editor-indent-guide)' } }),
    EditorState.allowMultipleSelections.of(true),
    cfg.softWrap !== false ? EditorView.lineWrapping : [],
    json(),
    linter(jsonParseLinter(), { delay: 300 }),
    lintGutter(),
    syntaxHighlighting(defaultHighlightStyle),
    jsonitaJsonHighlight,
    cfg.theme === 'dark' ? jsonitaDarkTheme : jsonitaLightTheme,
    cfg.readOnly ? EditorState.readOnly.of(true) : [],
    cfg.placeholderText ? placeholder(cfg.placeholderText) : [],
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, indentWithTab]),
  ];
}
