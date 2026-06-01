import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { on } from '../ipc/events';
import { formatAccelerator } from '../keyboard/accelerators';
import { useAiStore } from '../store/ai';
import { useUiStore } from '../store/ui';
import { HINT_FADE_MS, HINT_HOLD_MS } from './hintTiming';

export function ShortcutHint() {
  const activePane = useUiStore((s) => s.activePane);
  const settingsModalOpen = useUiStore((s) => s.settingsModalOpen);
  const historyModalOpen = useUiStore((s) => s.historyModalOpen);
  const aiStatus = useAiStore((s) => s.status);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  const removeTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (removeTimerRef.current !== null) {
      window.clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }
  }, []);

  const showHint = useCallback(() => {
    clearTimers();
    setMounted(true);
    window.requestAnimationFrame(() => setVisible(true));
    fadeTimerRef.current = window.setTimeout(() => setVisible(false), HINT_HOLD_MS);
    removeTimerRef.current = window.setTimeout(
      () => setMounted(false),
      HINT_HOLD_MS + HINT_FADE_MS,
    );
  }, [clearTimers]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    showHint();
    on('window:shown', showHint).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
      clearTimers();
    };
  }, [clearTimers, showHint]);

  useEffect(() => {
    if (activePane === 'ai-fix' && aiStatus === 'awaiting-decision') {
      showHint();
    }
  }, [activePane, aiStatus, showHint]);

  const items = useMemo(() => {
    if (activePane === 'ai-fix' && aiStatus === 'awaiting-decision') {
      return [
        { keys: [formatAccelerator('CmdOrCtrl+Enter')], label: 'Accept' },
        { keys: ['Esc'], label: 'Cancel' },
        { keys: ['Tab', formatAccelerator('Shift+Tab')], label: 'Switch' },
      ];
    }

    return [
      { keys: ['Esc'], label: 'Exit edit' },
      { keys: ['Esc', 'Esc'], label: 'Hide' },
      { keys: ['Tab', formatAccelerator('Shift+Tab')], label: 'Switch' },
    ];
  }, [activePane, aiStatus]);

  if (!mounted || settingsModalOpen || historyModalOpen) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: 'absolute',
        right: 12,
        bottom: 76,
        zIndex: 'var(--z-sticky)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
        maxWidth: 'min(520px, calc(100% - 24px))',
        padding: '7px 10px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'color-mix(in srgb, var(--glass-bg) 84%, transparent)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-xs)',
        lineHeight: 1.25,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(4px)',
        transition: `opacity ${HINT_FADE_MS}ms var(--ease-native), transform ${HINT_FADE_MS}ms var(--ease-native)`,
        pointerEvents: 'none',
      }}
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} style={itemStyle}>
          <span style={keyGroupStyle}>
            {item.keys.map((key, keyIndex) => (
              <KeyCap key={`${key}-${keyIndex}`}>{key}</KeyCap>
            ))}
          </span>
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

function KeyCap({ children }: { children: ReactNode }) {
  return <kbd style={keyStyle}>{children}</kbd>;
}

const itemStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  whiteSpace: 'nowrap',
};

const keyGroupStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
};

const keyStyle: React.CSSProperties = {
  padding: '1px 5px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-strong)',
  background: 'var(--chrome-bg-strong)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 1.2,
};
