import { useId } from 'react';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { ShortcutGlyph } from './ShortcutGlyph';

type Props = PropsWithChildren<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type' | 'title'> & {
    tooltipLabel: string;
    tooltipShortcut?: string;
  }
>;

/**
 * 34px glass chrome icon button with an app-rendered tooltip.
 *
 * Visual source: design/prototype/controls.html — `.chrome` specimen.
 * The tooltip shortcut is rendered via ShortcutGlyph matte tiles.
 */
export function ChromeIconButton({
  children,
  tooltipLabel,
  tooltipShortcut,
  ...buttonProps
}: Props) {
  const tooltipId = useId();

  return (
    <button
      {...buttonProps}
      type="button"
      className={`jsonita-chrome-icon-button`}
      aria-describedby={tooltipId}
    >
      {children}
      <span id={tooltipId} role="tooltip" className="jsonita-chrome-tooltip">
        <span className="jsonita-chrome-tooltip-label">{tooltipLabel}</span>
        {tooltipShortcut && <ShortcutGlyph accelerator={tooltipShortcut} decorative />}
      </span>
    </button>
  );
}
