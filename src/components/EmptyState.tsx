/**
 * Empty State 组件 — spec/01_mockups.html § 10 6 处 placeholder。
 *
 * 用法：`<EmptyState icon="{ }" title="..." hint="⌘V" />`
 */

interface Props {
  icon?: React.ReactNode;
  title: string;
  hint?: React.ReactNode;
}

export function EmptyState({ icon = '{ }', title, hint }: Props) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        color: 'var(--text-faint)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-sm)',
      }}
    >
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div>{title}</div>
      {hint && <div style={{ fontSize: 'var(--fs-xs)' }}>{hint}</div>}
    </div>
  );
}
