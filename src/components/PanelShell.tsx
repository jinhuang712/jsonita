/**
 * M0-N3 浮窗外壳 placeholder。
 *
 * 视觉锚：spec/01_mockups.html § 1 主浮窗 6 态 + § 10.1 Empty States · 浮窗无内容。
 * 当前阶段仅占位文本；M1-N4 起被 SplitPane + TabBar + StatusBar 替换。
 */
export function PanelShell() {
  return (
    <div
      style={{
        height: '100%',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 10,
        boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        color: '#6B7280',
        gap: 6,
      }}
    >
      <div style={{ fontSize: 22, color: '#9CA3AF' }}>{'{ }'}</div>
      <div style={{ fontSize: 13 }}>Paste JSON to start</div>
      <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>M0-N3 NSPanel POC</div>
    </div>
  );
}
