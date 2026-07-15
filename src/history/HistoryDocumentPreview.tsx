import { ActionButton } from '../components/ActionButton';
import { PinIcon, StarIcon } from '../components/icons';
import { ShortcutGlyph } from '../components/ShortcutGlyph';
import type { HistoryRow } from '../types/commands';
import { formatHistoryBytes, formatHistoryDate } from './historyPresentation';

type HistoryPreviewLabels = {
  emptyPreview: string;
  openInEditor: string;
  pin: string;
  unpin: string;
  star: string;
  unstar: string;
};

type HistoryDocumentPreviewProps = {
  row: HistoryRow | null;
  locale: string;
  labels: HistoryPreviewLabels;
  onOpen: () => void;
  onPin: () => void;
  onStar: () => void;
};

export function HistoryDocumentPreview({ row, locale, labels, onOpen, onPin, onStar }: HistoryDocumentPreviewProps) {
  if (!row) {
    return <section className="jsonita-history-preview jsonita-history-preview-empty">{labels.emptyPreview}</section>;
  }

  return (
    <section className="jsonita-history-preview" aria-label={labels.openInEditor}>
      <header className="jsonita-history-preview-header">
        <span className="jsonita-history-preview-meta">{`${formatHistoryDate(row.createdAt, locale)} · ${formatHistoryBytes(row.content)}`}</span>
        <div className="jsonita-history-preview-actions">
          <ActionButton
            variant="secondary"
            aria-label={row.pinned ? labels.unpin : labels.pin}
            aria-pressed={row.pinned}
            title={row.pinned ? labels.unpin : labels.pin}
            onClick={onPin}
          >
            <PinIcon width={14} height={14} strokeWidth={1.75} aria-hidden="true" />
            <span>{row.pinned ? labels.unpin : labels.pin}</span>
          </ActionButton>
          <ActionButton
            variant="secondary"
            aria-label={row.starred ? labels.unstar : labels.star}
            aria-pressed={row.starred}
            title={row.starred ? labels.unstar : labels.star}
            onClick={onStar}
          >
            <StarIcon width={14} height={14} strokeWidth={1.75} aria-hidden="true" />
            <span>{row.starred ? labels.unstar : labels.star}</span>
          </ActionButton>
        </div>
      </header>
      <pre className="jsonita-history-preview-code">{row.content}</pre>
      <ActionButton variant="secondary" onClick={onOpen}>
        <ShortcutGlyph accelerator="CmdOrCtrl+Enter" decorative />
        <span>{labels.openInEditor}</span>
      </ActionButton>
    </section>
  );
}
