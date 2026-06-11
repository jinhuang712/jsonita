/**
 * TypeScript 类型增强 ── 让 `t('key.subkey')` 有 IDE 自动补全 + 编译期 key 校验。
 *
 * Spec ref: design/14_i18n_a11y.md § 5 namespace 拆分。
 * 基于 en-US 资源推 key 类型；zh-CN 文件结构必须严格对齐。
 */

import 'react-i18next';

import type about from '../locales/en-US/about.json';
import type common from '../locales/en-US/common.json';
import type errors from '../locales/en-US/errors.json';
import type history from '../locales/en-US/history.json';
import type panes from '../locales/en-US/panes.json';
import type settings from '../locales/en-US/settings.json';
import type shell from '../locales/en-US/shell.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      about: typeof about;
      common: typeof common;
      errors: typeof errors;
      history: typeof history;
      panes: typeof panes;
      settings: typeof settings;
      shell: typeof shell;
    };
  }
}
