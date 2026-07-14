export function compactJson(content: string, limit = 96): string {
  const compact = content.trim().replace(/\s+/g, ' ');
  return compact.length > limit ? `${compact.slice(0, limit - 1)}…` : compact;
}

export function formatHistoryBytes(content: string): string {
  const bytes = new TextEncoder().encode(content).byteLength;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
}

export function formatHistoryDate(createdAt: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(createdAt));
}
