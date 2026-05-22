/**
 * i18n 初始化 — react-i18next + browser language detector。
 *
 * Spec ref: spec/14_i18n_a11y.html § 3 lib 选型 / § 5 namespace 拆分 / § 6 locale 检测 3 层 fallback。
 * M0 阶段仅 en-US；M3-N2 解锁 zh-CN 时只需补 `src/locales/zh-CN/*.json`
 * + 改 `supportedLngs` + `<Select>` 选项。
 */

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import about from '../locales/en-US/about.json';
import common from '../locales/en-US/common.json';
import errors from '../locales/en-US/errors.json';
import history from '../locales/en-US/history.json';
import panes from '../locales/en-US/panes.json';
import settings from '../locales/en-US/settings.json';
import shell from '../locales/en-US/shell.json';

export const NS = [
  'shell',
  'panes',
  'settings',
  'history',
  'errors',
  'about',
  'common',
] as const;

const resources = {
  'en-US': { shell, panes, settings, history, errors, about, common },
};

export async function initI18n() {
  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en-US',
      // v1 仅 en-US；M3-N2 加 'zh-CN'
      supportedLngs: ['en-US'],
      ns: NS as unknown as string[],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      detection: {
        // settings.locale → navigator → en-US fallback
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'jsonita.locale',
        caches: ['localStorage'],
      },
    });

  // <html lang="..."> 跟随 i18n.language（spec/14 § 9 a11y "语言声明"）
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
  document.documentElement.lang = i18n.language;

  return i18n;
}

export default i18n;
