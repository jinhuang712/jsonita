/**
 * 浮窗内 hotkeys ── Tab 切功能 / 双击 Esc 隐藏 / ⌘K 清空 / ⌘⇧L 恢复上次会话 / ⌘W 关。
 *
 * Spec ref: design/07 § 4 In-app 快捷键。
 */

import { useEffect, useRef } from 'react';
import { paneToOpType, runPaneApply } from '../editor/transforms';
import { history as historyApi, settings as settingsApi, win } from '../ipc/commands';
import { isJsonitaError } from '../ipc/error';
import { eventMatchesAccelerator, hasPrimaryModifier } from '../keyboard/accelerators';
import { acceptAiFix } from '../panes/aiFixActions';
import { shouldCloseSettingsOnKeyDown } from '../settings/settingsKeymap';
import { useAiStore } from '../store/ai';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { EDITOR_FONT_ZOOM_STEP, useUiStore, type Pane } from '../store/ui';
import { decideEscClose, ESC_CLOSE_HINT_MS } from './escCloseHint';

const PANE_ORDER: Pane[] = ['format', 'minify', 'tree', 'json-to-str'];

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
  const escCloseHintTimerRef = useRef<number | null>(null);
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
  const settingsViewOpen = useUiStore((s) => s.settingsViewOpen);
  const singlePaneApplyState = useUiStore((s) => s.singlePaneApplyState);
  const setActivePane = useUiStore((s) => s.setActivePane);
  const setShowAiFix = useUiStore((s) => s.setShowAiFix);
  const setHistoryModalOpen = useUiStore((s) => s.setHistoryModalOpen);
  const setSettingsViewOpen = useUiStore((s) => s.setSettingsViewOpen);
  const setEscCloseHintVisible = useUiStore((s) => s.setEscCloseHintVisible);
  const showEscCloseHint = useUiStore((s) => s.showEscCloseHint);
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

  useEffect(() => {
    if (historyModalOpen || settingsViewOpen || activePane === 'ai-fix') {
      setEscCloseHintVisible(false);
      lastExitEscAtRef.current = 0;
    }
  }, [activePane, historyModalOpen, setEscCloseHintVisible, settingsViewOpen]);

  // 不在编辑器 / 表单里时，Tab / Shift+Tab 在功能 tab 间循环。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      if (historyModalOpen || settingsViewOpen || isTypingTarget(event.target)) return;

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
  }, [activePane, aiEnabled, historyModalOpen, settingsViewOpen, setActivePane, showAiFix]);

  // ⌘Y 打开 / 关闭 History。即使编辑器聚焦也响应，方便随手找回历史。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'y' ||
        !hasPrimaryModifier(event) ||
        event.altKey ||
        event.shiftKey ||
        settingsViewOpen
      ) {
        return;
      }

      consume(event);
      setHistoryModalOpen(!historyModalOpen);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [historyModalOpen, setHistoryModalOpen, settingsViewOpen]);

  // 可自定义窗口内快捷键：切换单窗 / 双栏。默认 CmdOrCtrl+\。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (historyModalOpen || settingsViewOpen) return;
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
    settingsViewOpen,
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
      setHistoryModalOpen(false);
      setSettingsViewOpen(true);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [historyModalOpen, setHistoryModalOpen, setSettingsViewOpen]);

  // Settings 是主壳内页面状态；Esc 返回编辑工作区，不触发双击 Esc 隐藏。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!shouldCloseSettingsOnKeyDown(settingsViewOpen, event)) {
        return;
      }

      consume(event);
      setSettingsViewOpen(false);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [setSettingsViewOpen, settingsViewOpen]);

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

  // Cmd+Enter 单一分发器：按优先级择一动作，避免多个 capture 监听器因各自 effect
  // 依赖不同、重订阅时序漂移，导致同一次按键同时触发 apply 和 AI retry 两个动作。
  // Esc 在 ai-fix 态退回编辑区。
  useEffect(() => {
    const applySinglePane = () => {
      if (content.trim() === '') {
        setStatus('empty');
        setOutput('');
        setError(null);
        setSinglePaneApplyState('idle');
        return;
      }
      setSinglePaneApplyState('running');
      runPaneApply(content, activePane)
        .then((result) => {
          setContent(result);
          setOutput(result);
          setStatus('valid');
          setError(null);
          setShowAiFix(false);
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

    const onKeyDown = (event: KeyboardEvent) => {
      if (historyModalOpen || settingsViewOpen) return;

      const isCmdEnter =
        event.key === 'Enter' && hasPrimaryModifier(event) && !event.altKey && !event.shiftKey;
      const isPlainEsc =
        event.key === 'Escape' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey;

      if (isCmdEnter) {
        // 优先级：接受 AI 修复 → 触发 AI 修复（存在 parse error）→ 单窗 apply
        if (activePane === 'ai-fix' && aiStatus === 'awaiting-decision') {
          consume(event);
          acceptAiFix(aiAfter, setContent, resetAi, setActivePane).catch(() => {});
          return;
        }
        if (
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
        if (singlePaneMode && activePane !== 'tree' && activePane !== 'ai-fix') {
          consume(event);
          applySinglePane();
        }
        return;
      }

      if (
        isPlainEsc &&
        activePane === 'ai-fix' &&
        (aiStatus === 'awaiting-decision' || aiStatus === 'error')
      ) {
        consume(event);
        lastExitEscAtRef.current = 0;
        setEscCloseHintVisible(false);
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
    editorError,
    editorStatus,
    historyModalOpen,
    resetAi,
    retryAi,
    setActivePane,
    setContent,
    setError,
    setEscCloseHintVisible,
    setOutput,
    setShowAiFix,
    setSinglePaneApplyState,
    setStatus,
    settingsViewOpen,
    showAiFix,
    singlePaneMode,
  ]);

  // 单击 Esc 只退出编辑态 / 预备关闭；连续双击 Esc 才隐藏浮窗。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isPlainEscape =
        event.key === 'Escape' &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey;
      const decision = decideEscClose({
        isPlainEscape,
        isBlocked:
          historyModalOpen ||
          settingsViewOpen ||
          activePane === 'ai-fix',
        isEditing: isTypingTarget(event.target),
        lastNonEditingEscAt: lastExitEscAtRef.current,
        now: Date.now(),
      });
      if (decision.action === 'ignore') return;

      event.preventDefault();
      event.stopPropagation();
      lastExitEscAtRef.current = decision.nextLastEscAt;

      if (decision.action === 'exit-editing') {
        exitEditing(event.target);
        setEscCloseHintVisible(false);
        return;
      }

      if (decision.action === 'hide-window') {
        setEscCloseHintVisible(false);
        win.hide().catch(() => {});
        return;
      }

      showEscCloseHint();
      if (escCloseHintTimerRef.current !== null) {
        window.clearTimeout(escCloseHintTimerRef.current);
      }
      escCloseHintTimerRef.current = window.setTimeout(() => {
        setEscCloseHintVisible(false);
        escCloseHintTimerRef.current = null;
      }, ESC_CLOSE_HINT_MS);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (escCloseHintTimerRef.current !== null) {
        window.clearTimeout(escCloseHintTimerRef.current);
        escCloseHintTimerRef.current = null;
      }
    };
  }, [activePane, aiStatus, historyModalOpen, setEscCloseHintVisible, settingsViewOpen, showEscCloseHint]);

  useEffect(() => {
    if (singlePaneApplyState !== 'success' && singlePaneApplyState !== 'error') return;
    const timer = window.setTimeout(() => {
      setSinglePaneApplyState('idle');
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [setSinglePaneApplyState, singlePaneApplyState]);

  // ⌘K 清空 + 不污染 last_session。用 window capture 手工监听，编辑器聚焦（contentEditable）时也生效。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'k' ||
        !hasPrimaryModifier(event) ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }
      if (historyModalOpen || settingsViewOpen) return;
      consume(event);
      clearEditor();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [clearEditor, historyModalOpen, settingsViewOpen]);

  // ⌘W 关闭浮窗；Settings 页内先返回编辑工作区。window capture，编辑器聚焦时也生效。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'w' ||
        !hasPrimaryModifier(event) ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }
      consume(event);
      if (settingsViewOpen) {
        setSettingsViewOpen(false);
        return;
      }
      win.hide().catch(() => {});
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [setSettingsViewOpen, settingsViewOpen]);

  // ⌘+ / ⌘- / ⌘0 调整编辑器与树视图字体大小。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!hasPrimaryModifier(event) || event.altKey) return;
      if (historyModalOpen || settingsViewOpen) return;

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
  }, [historyModalOpen, resetEditorFontSize, settingsViewOpen, zoomEditorFont]);
}
