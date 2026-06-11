export function resolveSettingsActiveGroup<Group extends string>(
  scrollSpyGroup: Group,
  programmaticTarget: Group | null,
): Group {
  return programmaticTarget ?? scrollSpyGroup;
}

export function shouldReleaseSettingsScrollLock(
  currentScrollTop: number,
  targetScrollTop: number,
): boolean {
  return Math.abs(currentScrollTop - targetScrollTop) <= 2;
}

export function clampSettingsScrollTarget(
  targetScrollTop: number,
  maxScrollTop: number,
): number {
  return Math.max(0, Math.min(targetScrollTop, Math.max(0, maxScrollTop)));
}
