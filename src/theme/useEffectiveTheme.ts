/**
 * Effective theme 计算 + DOM data-theme 同步 + system 主题变更订阅。
 *
 * Spec ref: design/03_design_tokens.md § 11 主题切换流程。
 * 权威数据源：**原生** `window_set_theme(mode)` → 读 `NSApp.effectiveAppearance` 解析 light|dark 回传。
 *   ── 不再用 webview 的 `matchMedia` 取值：NSWindow.appearance 被 pin 后会污染 webview 的
 *      prefers-color-scheme（旧 bug：light→system 不变 dark）。matchMedia 仅在 system 模式下
 *      作为「OS 主题切换」的 re-trigger（此时原生 appearance=nil 跟随 OS，事件可正常推送）。
 * 非 Tauri（浏览器 dev）环境无原生 → 退回 matchMedia 取值（此时无 pin，可靠）。
 * 应用到 `document.documentElement.dataset.theme` → CSS [data-theme="dark"] 覆盖触发整套 token 切换。
 */

import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../store/settings';
import { win } from '../ipc/commands';

export function useEffectiveTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((s) => s.settings.theme);
  const prevThemeRef = useRef(theme);
  const themeMotionTimerRef = useRef<number | null>(null);
  const [effective, setEffective] = useState<'light' | 'dark'>(() => {
    // 初始化从 DOM 读（FOUC inline script 已设）
    const cur = document.documentElement.dataset.theme;
    return cur === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    let cancelled = false;

    // 解析 effective：优先原生（权威），失败（非 Tauri）退回 matchMedia。
    const resolve = async (): Promise<'light' | 'dark'> => {
      try {
        return await win.setTheme(theme);
      } catch {
        if (theme === 'light') return 'light';
        if (theme === 'dark') return 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
    };

    const apply = async (animate: boolean) => {
      const eff = await resolve();
      if (cancelled) return;
      const root = document.documentElement;
      if (animate && root.dataset.theme !== eff) {
        root.classList.add('jsonita-theme-transition');
        if (themeMotionTimerRef.current !== null) {
          window.clearTimeout(themeMotionTimerRef.current);
        }
        themeMotionTimerRef.current = window.setTimeout(() => {
          root.classList.remove('jsonita-theme-transition');
          themeMotionTimerRef.current = null;
        }, 220);
      }
      setEffective(eff);
      root.dataset.theme = eff;
      try {
        localStorage.setItem('jsonita.theme.effective', eff);
      } catch (_) {
        /* ignore */
      }
    };

    const previousTheme = prevThemeRef.current;
    const manualThemeChange = previousTheme !== theme && theme !== 'system';
    prevThemeRef.current = theme;

    void apply(manualThemeChange);

    if (theme === 'system') {
      // system 模式下原生 appearance=nil 跟随 OS → 运行时系统主题切换会推送此事件 → 重解析。
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const applySystem = () => void apply(false);
      mql.addEventListener('change', applySystem);
      return () => {
        cancelled = true;
        mql.removeEventListener('change', applySystem);
        if (themeMotionTimerRef.current !== null) {
          window.clearTimeout(themeMotionTimerRef.current);
          themeMotionTimerRef.current = null;
        }
        document.documentElement.classList.remove('jsonita-theme-transition');
      };
    }

    return () => {
      cancelled = true;
      if (themeMotionTimerRef.current !== null) {
        window.clearTimeout(themeMotionTimerRef.current);
        themeMotionTimerRef.current = null;
      }
      document.documentElement.classList.remove('jsonita-theme-transition');
    };
  }, [theme]);

  return effective;
}
