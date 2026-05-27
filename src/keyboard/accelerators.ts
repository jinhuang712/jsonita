type ModifierEvent = Pick<KeyboardEvent, 'ctrlKey' | 'metaKey'>;

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

export function formatAccelerator(accelerator: string): string {
  const mac = isMacPlatform();
  const parts = accelerator
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => formatAcceleratorPart(part, mac));

  return mac ? parts.join('') : parts.join('+');
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
