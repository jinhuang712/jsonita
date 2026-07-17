import { shortcutTiles } from '../keyboard/accelerators';
import type { ShortcutTile } from '../keyboard/accelerators';

type Props = { accelerator?: string; decorative?: boolean; className?: string };

export function ShortcutGlyph({ accelerator, decorative = false, className }: Props) {
  if (!accelerator) return null;
  const tiles = shortcutTiles(accelerator);
  const label = tiles.map(accessibleLabel).join(' ');
  return (
    <span
      className={`jsonita-shortcut-glyph${className ? ` ${className}` : ''}`}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
    >
      {tiles.map((tile, i) => (
        <span key={i} className="jsonita-shortcut-tile">
          {tile.glyph ? (
            <svg className="jsonita-shortcut-glyph-icon" aria-hidden="true">
              <use href={`#${tile.glyph}`} />
            </svg>
          ) : (
            tile.text
          )}
        </span>
      ))}
    </span>
  );
}

function accessibleLabel(tile: ShortcutTile): string {
  if (tile.text) return tile.text;
  return (
    {
      'g-cmd': 'command',
      'g-shift': 'shift',
      'g-return': 'return',
    }[tile.glyph!] ?? ''
  );
}
