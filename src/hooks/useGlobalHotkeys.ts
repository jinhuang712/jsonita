/**
 * 浮窗内 hotkeys ── Tab 切功能 / 双击 Esc 隐藏 / ⌘K 清空 / ⌘⇧L 恢复上次会话 / ⌘W 关。
 *
 * Spec ref: design/07 § 4 In-app 快捷键。
 */

import { useEffect, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { paneToOpType, runPaneApply } from '../editor/transforms';
import { history as historyApi, session, settings as settingsApi, win } from '../ipc/commands';
import { isJsonitaError } from '../ipc/error';
import { on } from '../ipc/events';
import { eventMatchesAccelerator, hasPrimaryModifier, primaryHotkeyPrefix } from '../keyboard/accelerators';
import { acceptAiFix } from '../panes/aiFixActions';
import { useAiStore } from '../store/ai';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { EDITOR_FONT_ZOOM_STEP, useUiStore, type Pane } from '../store/ui';

const PANE_ORDER: Pane[] = ['format', 'minify', 'tree', 'json-to-str', 'str-to-json'];
const DOUBLE_ESC_HIDE_MS = 700;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable ||
    target.closest('.cm-editor') !== null
  );
}

function isTreeTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('.jsonita-tree-container') !== null;
}

function exitEditing(target: EventTarget | null): boolean {
  if (!isTypingTarget(target)) return false;
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
  return true;
}

function consume(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

export function useGlobalHotkeys() {
  const lastExitEscAtRef = useRef(0);
  const content = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);
  const setOutput = useEditorStore((s) => s.setOutput);
  const setStatus = useEditorStore((s) => s.setStatus);
  const setError = useEditorStore((s) => s.setError);
  const editorStatus = useEditorStore((s) => s.status);
  const editorError = useEditorStore((s) => s.error);
  const clearEditor = useEditorStore((s) => s.clear);
  const activePane = useUiStore((s) => s.activePane);
  const showAiFix = useUiStore((s) => s.showAiFix);
  const historyModalOpen = useUiStore((s) => s.historyModalOpen);
  const settingsModalOpen = useUiStore((s) => s.settingsModalOpen);
  const singlePaneApplyState = useUiStore((s) => s.singlePaneApplyState);
  const setActivePane = useUiStore((s) => s.setActivePane);
  const setShowAiFix = useUiStore((s) => s.setShowAiFix);
  const setHistoryModalOpen = useUiStore((s) => s.setHistoryModalOpen);
  const setSettingsModalOpen = useUiStore((s) => s.setSettingsModalOpen);
  const setSinglePaneApplyState = useUiStore((s) => s.setSinglePaneApplyState);
  const zoomEditorFont = useUiStore((s) => s.zoomEditorFont);
  const resetEditorFontSize = useUiStore((s) => s.resetEditorFontSize);
  const aiStatus = useAiStore((s) => s.status);
  const aiAfter = useAiStore((s) => s.after);
  const resetAi = useAiStore((s) => s.reset);
  const retryAi = useAiStore((s) => s.retry);
  const aiEnabled = useSettingsStore((s) => s.settings.aiEnabled);
  const singlePaneMode = useSettingsStore((s) => s.settings.singlePaneMode);
  const shortcutSplitToggle = useSettingsStore((s) => s.settings.shortcutSplitToggle);
  const setSettings = useSettingsStore((s) => s.setSettings);

  const restoreLast = async () => {
    try {
      const last = await session.loadLast();
      if (last && last.content) {
        setContent(last.content);
      }
    } catch (_) {
      /* ignore */
    }
  };

  // 不在编辑器 / 表单里时，Tab / Shift+Tab 在功能 tab 间循环。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      if (historyModalOpen || settingsModalOpen || isTypingTarget(event.target)) return;

      const panes = showAiFix && aiEnabled ? [...PANE_ORDER, 'ai-fix' as Pane] : PANE_ORDER;
      const currentIndex = panes.indexOf(activePane);
      const nextIndex =
        event.shiftKey
          ? (currentIndex <= 0 ? panes.length : currentIndex) - 1
          : (currentIndex + 1) % panes.length;

      event.preventDefault();
      setActivePane(panes[nextIndex]);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [activePane, aiEnabled, historyModalOpen, settingsModalOpen, setActivePane, showAiFix]);

  // ⌘Y 打开 / 关闭 History。即使编辑器聚焦也响应，方便随手找回历史。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'y' ||
        !hasPrimaryModifier(event) ||
        event.altKey ||
        event.shiftKey ||
        settingsModalOpen
      ) {
        return;
      }

      consume(event);
      setHistoryModalOpen(!historyModalOpen);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [historyModalOpen, setHistoryModalOpen, settingsModalOpen]);

  // 可自定义窗口内快捷键：切换单窗 / 双栏。默认 CmdOrCtrl+\。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (historyModalOpen || settingsModalOpen) return;
      if (!eventMatchesAccelerator(event, shortcutSplitToggle)) return;

      consume(event);
      settingsApi
        .set({ singlePaneMode: !singlePaneMode })
        .then(setSettings)
        .catch(() => {});
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [
    historyModalOpen,
    setSettings,
    settingsModalOpen,
    shortcutSplitToggle,
    singlePaneMode,
  ]);

  // ⌘, 打开 Settings。跟 macOS app menu 保持一致，编辑器聚焦时也可用。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== ',' ||
        !hasPrimaryModifier(event) ||
        event.altKey ||
        event.shiftKey ||
        historyModalOpen
      ) {
        return;
      }

      consume(event);
      setSettingsModalOpen(true);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [historyModalOpen, setSettingsModalOpen]);

  // Cmd+A 只允许编辑器 / 表单走原生全选，其他 UI chrome 绝不触发 DOM 全页选择。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'a' ||
        !hasPrimaryModifier(event) ||
        event.altKey ||
        event.shiftKey ||
        isTypingTarget(event.target) ||
        isTreeTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      window.getSelection()?.removeAllRanges();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  // AI Fix 快捷键优先于普通 single-pane apply / Esc hide，单双栏一致。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (historyModalOpen || settingsModalOpen) return;

      const isCmdEnter =
        event.key === 'Enter' &&
        hasPrimaryModifier(event) &&
        !event.altKey &&
        !event.shiftKey;
      const isPlainEsc =
        event.key === 'Escape' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey;

      if (isCmdEnter && activePane === 'ai-fix' && aiStatus === 'awaiting-decision') {
        consume(event);
        acceptAiFix(aiAfter, setContent, resetAi, setActivePane).catch(() => {});
        return;
      }

      if (
        isCmdEnter &&
        editorStatus === 'error' &&
        showAiFix &&
        aiEnabled &&
        content.trim() !== '' &&
        aiStatus !== 'requesting' &&
        aiStatus !== 'awaiting-decision'
      ) {
        consume(event);
        retryAi();
        setActivePane('ai-fix');
        return;
      }

      if (isPlainEsc && activePane === 'ai-fix' && (aiStatus === 'awaiting-decision' || aiStatus === 'error')) {
        consume(event);
        resetAi();
        setActivePane('format');
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [
    activePane,
    aiAfter,
    aiEnabled,
    aiStatus,
    content,
    editorStatus,
    historyModalOpen,
    resetAi,
    retryAi,
    setActivePane,
    setContent,
    settingsModalOpen,
    showAiFix,
  ]);

  // 单击 Esc 只退出编辑态 / 预备关闭；连续双击 Esc 才隐藏浮窗。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (historyModalOpen || settingsModalOpen) return;

      event.preventDefault();
      event.stopPropagation();

      const now = Date.now();
      if (exitEditing(event.target)) {
        lastExitEscAtRef.current = now;
        return;
      }

      if (now - lastExitEscAtRef.current <= DOUBLE_ESC_HIDE_MS) {
        lastExitEscAtRef.current = 0;
        win.hide().catch(() => {});
        return;
      }

      lastExitEscAtRef.current = now;
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [historyModalOpen, settingsModalOpen]);

  useEffect(() => {
    if (singlePaneApplyState !== 'success' && singlePaneApplyState !== 'error') return;
    const timer = window.setTimeout(() => {
      setSinglePaneApplyState('idle');
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [setSinglePaneApplyState, singlePaneApplyState]);

  // 单窗模式：⌘Enter 才把当前功能的结果应用回输入编辑器。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Enter' ||
        !hasPrimaryModifier(event) ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }
      if (!singlePaneMode || historyModalOpen || settingsModalOpen) return;
      if (activePane === 'tree' || activePane === 'ai-fix') return;

      event.preventDefault();
      event.stopPropagation();

      if (content.trim() === '') {
        setStatus('empty');
        setOutput('');
        setError(null);
        setSinglePaneApplyState('idle');
        return;
      }

      setSinglePaneApplyState('running');
      runPaneApply(content, activePane, editorError)
        .then((result) => {
          setContent(result);
          setOutput(result);
          setStatus('valid');
          setError(null);
          setShowAiFix(false);
          session
            .saveLast({
              content: result,
              opType: paneToOpType(activePane),
              savedAt: Date.now(),
            })
            .catch(() => {});
          historyApi.add(result, paneToOpType(activePane)).catch(() => {});
          setSinglePaneApplyState('success');
        })
        .catch((e: unknown) => {
          if (isJsonitaError(e) && e.kind === 'Parse') {
            setStatus('error');
            setError({ line: e.data.line, col: e.data.col, msg: e.data.msg });
            setShowAiFix(true);
          }
          setSinglePaneApplyState('error');
        });
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [
    activePane,
    content,
    editorError,
    historyModalOpen,
    setContent,
    setError,
    setOutput,
    setShowAiFix,
    setActivePane,
    setSinglePaneApplyState,
    setStatus,
    settingsModalOpen,
    singlePaneMode,
  ]);

  // ⌘K 清空 + 不污染 last_session（M1-N7：调 session_clear_last 显式清）
  useHotkeys(
    `${primaryHotkeyPrefix()}+k`,
    () => {
      clearEditor();
      session.clearLast().catch(() => {});
    },
    { preventDefault: true },
  );

  // ⌘⇧L 找回上次会话
  useHotkeys(
    `${primaryHotkeyPrefix()}+shift+l`,
    restoreLast,
    { preventDefault: true },
  );

  // 全局快捷键 Cmd+Shift+L 由 Rust 发事件；窗口 focus 内的 meta+shift+l 走上面的 useHotkeys。
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    on('shortcut:restore_last', () => {
      restoreLast();
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
    // restoreLast 只闭包当前 setContent；setContent 在 zustand 中稳定。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setContent]);

  // ⌘W 关闭浮窗（design/06 § 5.1 路由）
  useHotkeys(`${primaryHotkeyPrefix()}+w`, () => {
    win.hide().catch(() => {});
  });

  // ⌘+ / ⌘- / ⌘0 调整编辑器与树视图字体大小。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!hasPrimaryModifier(event) || event.altKey) return;

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomEditorFont(EDITOR_FONT_ZOOM_STEP);
        return;
      }
      if (event.key === '-') {
        event.preventDefault();
        zoomEditorFont(-EDITOR_FONT_ZOOM_STEP);
        return;
      }
      if (event.key === '0') {
        event.preventDefault();
        resetEditorFontSize();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [resetEditorFontSize, zoomEditorFont]);
}
