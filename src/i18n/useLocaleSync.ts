/**
 * settings.locale 变化 → i18n.changeLanguage 自动同步（M3-N2）。
 *
 * Spec ref: spec/14_i18n_a11y.html § 2.3 locale 检测与切换
 */

import { useEffect } from 'react';
import i18n from './index';
import { useSettingsStore } from '../store/settings';

export function useLocaleSync() {
  const locale = useSettingsStore((s) => s.settings.locale);

  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);
}
