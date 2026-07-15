type ModifierEvent = Pick<KeyboardEvent, 'ctrlKey' | 'metaKey'>;
type AcceleratorEvent = Pick<
  KeyboardEvent,
  'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'
>;

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return true;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform);
}

export function primaryHotkeyPrefix(): 'meta' | 'ctrl' {
  return isMacPlatform() ? 'meta' : 'ctrl';
}

export function hasPrimaryModifier(event: ModifierEvent): boolean {
  if (isMacPlatform()) return event.metaKey && !event.ctrlKey;
  return event.ctrlKey && !event.metaKey;
}

export function eventMatchesAccelerator(
  event: AcceleratorEvent,
  accelerator: string,
): boolean {
  const parts = accelerator
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;

  let wantsMeta = false;
  let wantsCtrl = false;
  let wantsAlt = false;
  let wantsShift = false;
  let wantsPrimary = false;
  let keyPart = '';

  for (const part of parts) {
    switch (part.toLowerCase()) {
      case 'cmdorctrl':
        wantsPrimary = true;
        break;
      case 'cmd':
      case 'command':
      case 'meta':
        wantsMeta = true;
        break;
      case 'ctrl':
      case 'control':
        wantsCtrl = true;
        break;
      case 'alt':
      case 'option':
        wantsAlt = true;
        break;
      case 'shift':
        wantsShift = true;
        break;
      default:
        keyPart = part;
    }
  }

  const primaryOk = wantsPrimary ? hasPrimaryModifier(event) : true;
  const metaOk = wantsPrimary ? true : event.metaKey === wantsMeta;
  const ctrlOk = wantsPrimary ? true : event.ctrlKey === wantsCtrl;
  return (
    primaryOk &&
    metaOk &&
    ctrlOk &&
    event.altKey === wantsAlt &&
    event.shiftKey === wantsShift &&
    normalizeKey(event.key) === normalizeKey(keyPart)
  );
}

export function formatAccelerator(accelerator: string): string {
  const mac = isMacPlatform();
  const parts = accelerator
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => formatAcceleratorPart(part, mac));

  // 显示统一用 " + " 分隔（⌘ + ⇧ + J）；mac 不再紧贴成 ⌘⇧J，Windows 也带空格
  return parts.join(' + ');
}

function formatAcceleratorPart(part: string, mac: boolean): string {
  const lower = part.toLowerCase();
  if (mac) {
    switch (lower) {
      case 'cmdorctrl':
      case 'cmd':
      case 'command':
      case 'meta':
        return '⌘';
      case 'ctrl':
      case 'control':
        return '⌃';
      case 'shift':
        return '⇧';
      case 'alt':
      case 'option':
        return '⌥';
      case 'enter':
      case 'return':
        return '↵';
      case 'plus':
        return '+';
      case 'minus':
        return '-';
      case 'escape':
        return 'Esc';
      case 'space':
        return 'Space';
      default:
        return part.length === 1 ? part.toUpperCase() : part;
    }
  }

  switch (lower) {
    case 'cmdorctrl':
    case 'cmd':
    case 'command':
    case 'meta':
      return 'Ctrl';
    case 'ctrl':
    case 'control':
      return 'Ctrl';
    case 'alt':
    case 'option':
      return 'Alt';
    case 'shift':
      return 'Shift';
    case 'enter':
    case 'return':
      return 'Enter';
    case 'plus':
      return '+';
    case 'minus':
      return '-';
    case 'escape':
      return 'Esc';
    default:
      return part.length === 1 ? part.toUpperCase() : part;
  }
}

export type ShortcutTile = { glyph?: string; text?: string };

const TILE_MAP: Record<string, ShortcutTile> = {
  'cmdorctrl': { glyph: 'g-cmd' },
  'cmd': { glyph: 'g-cmd' },
  'command': { glyph: 'g-cmd' },
  'meta': { glyph: 'g-cmd' },
  'shift': { glyph: 'g-shift' },
  'enter': { glyph: 'g-return' },
  'return': { glyph: 'g-return' },
  'escape': { text: 'esc' },
  'esc': { text: 'esc' },
  'space': { text: 'space' },
  'tab': { text: 'tab' },
  'plus': { text: '+' },
  'minus': { text: '-' },
};

export function shortcutTiles(accelerator: string): ShortcutTile[] {
  return accelerator
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((part) => {
      const mapped = TILE_MAP[part.toLowerCase()];
      if (mapped) return mapped;
      return { text: part.length === 1 ? part.toUpperCase() : part };
    });
}

function normalizeKey(key: string): string {
  const lower = key.toLowerCase();
  switch (lower) {
    case 'escape':
    case 'esc':
      return 'escape';
    case 'return':
    case 'enter':
      return 'enter';
    case ' ':
    case 'space':
      return 'space';
    case 'plus':
      return '+';
    case 'minus':
      return '-';
    case 'comma':
      return ',';
    case 'period':
      return '.';
    case 'slash':
      return '/';
    case 'backslash':
      return '\\';
    default:
      return lower.length === 1 ? lower : lower;
  }
}
