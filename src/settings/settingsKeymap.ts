export interface SettingsKeyEvent {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export function shouldCloseSettingsOnKeyDown(
  settingsViewOpen: boolean,
  event: SettingsKeyEvent,
): boolean {
  return (
    settingsViewOpen &&
    event.key === 'Escape' &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}
