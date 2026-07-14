import { PinIcon, StarIcon } from '../components/icons';
import { formatAccelerator } from '../keyboard/accelerators';
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
          <button
            type="button"
            className="jsonita-history-preview-meta-action"
            aria-label={row.pinned ? labels.unpin : labels.pin}
            aria-pressed={row.pinned}
            title={row.pinned ? labels.unpin : labels.pin}
            onClick={onPin}
          >
            <PinIcon width={14} height={14} strokeWidth={1.75} aria-hidden="true" />
            <span>{row.pinned ? labels.unpin : labels.pin}</span>
          </button>
          <button
            type="button"
            className="jsonita-history-preview-meta-action"
            aria-label={row.starred ? labels.unstar : labels.star}
            aria-pressed={row.starred}
            title={row.starred ? labels.unstar : labels.star}
            onClick={onStar}
          >
            <StarIcon width={14} height={14} strokeWidth={1.75} aria-hidden="true" />
            <span>{row.starred ? labels.unstar : labels.star}</span>
          </button>
        </div>
      </header>
      <pre className="jsonita-history-preview-code">{row.content}</pre>
      <button type="button" className="jsonita-history-preview-action" onClick={onOpen}>
        <kbd>{formatAccelerator('CmdOrCtrl+Enter')}</kbd>
        <span>{labels.openInEditor}</span>
      </button>
    </section>
  );
}
