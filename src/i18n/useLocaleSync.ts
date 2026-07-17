/**
 * settings.locale 变化 → i18n.changeLanguage 自动同步（M3-N2）。
 *
 * Spec ref: design/14_i18n_a11y.md § 2.3 locale 检测与切换
 */

import { useEffect } from 'react';
import i18n from './index';
import { useSettingsStore } from '../store/settings';

export function useLocaleSync() {
  const locale = useSettingsStore((s) => s.settings.locale);
  const loaded = useSettingsStore((s) => s.loaded);

  useEffect(() => {
    // settings 未加载前 locale 只是 DEFAULT_SETTINGS 占位（en-US）；此时切语言会把
    // initI18n 检测到的语言（如 zh-CN）强切成 en-US，settings 到达后再切回 → 启动闪一次英文。
    if (!loaded) return;
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [loaded, locale]);
}
