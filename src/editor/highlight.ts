/**
 * 自定义 JSON 语法高亮风格 — 走 design tokens（spec/03 § 4.4 + spec/08 § 1.7）。
 *
 * 6 类 tag → CSS variables，data-theme 切换自动应用 light/dark。
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const style = HighlightStyle.define([
  { tag: t.propertyName, color: 'var(--json-key)' },
  { tag: t.string, color: 'var(--json-string)' },
  { tag: t.number, color: 'var(--json-number)' },
  { tag: [t.bool, t.atom], color: 'var(--json-bool)' },
  { tag: t.null, color: 'var(--json-null)' },
  { tag: [t.punctuation, t.separator, t.bracket], color: 'var(--json-punc)' },
]);

export const jsonitaJsonHighlight = syntaxHighlighting(style);
