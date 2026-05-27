/**
 * Effective theme 计算 + DOM data-theme 同步 + matchMedia 订阅。
 *
 * Spec ref: spec/03_design_tokens.html § 11 主题切换流程（3 数据源 + 双重订阅）。
 * 数据源：(1) settings.theme (2) prefers-color-scheme (system 时) (3) localStorage cache。
 * 应用到 `document.documentElement.dataset.theme` → CSS [data-theme="dark"] 覆盖触发整套 token 切换。
 */

import { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settings';

export function useEffectiveTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.settings.theme);
  const [effective, setEffective] = useState<'light' | 'dark'>(() => {
    // 初始化从 DOM 读（FOUC inline script 已设）
    const cur = document.documentElement.dataset.theme;
    return cur === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    function compute(): 'light' | 'dark' {
      if (theme === 'light') return 'light';
      if (theme === 'dark') return 'dark';
      // system
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    const apply = () => {
      const eff = compute();
      setEffective(eff);
      document.documentElement.dataset.theme = eff;
      try {
        localStorage.setItem('jsonita.theme.effective', eff);
      } catch (_) {
        /* ignore */
      }
    };

    apply();

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    }
  }, [theme]);

  return effective;
}
