import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import { getCurrentWindow } from '@tauri-apps/api/window';

type ResizeDirection =
  | 'East'
  | 'North'
  | 'NorthEast'
  | 'NorthWest'
  | 'South'
  | 'SouthEast'
  | 'SouthWest'
  | 'West';

const HANDLES: Array<{
  direction: ResizeDirection;
  style: React.CSSProperties;
}> = [
  {
    direction: 'North',
    style: { top: 0, left: 12, right: 12, height: 6, cursor: 'ns-resize' },
  },
  {
    direction: 'South',
    style: { bottom: 0, left: 12, right: 12, height: 6, cursor: 'ns-resize' },
  },
  {
    direction: 'West',
    style: { left: 0, top: 12, bottom: 12, width: 6, cursor: 'ew-resize' },
  },
  {
    direction: 'East',
    style: { right: 0, top: 12, bottom: 12, width: 6, cursor: 'ew-resize' },
  },
  {
    direction: 'NorthWest',
    style: { top: 0, left: 0, width: 14, height: 14, cursor: 'nwse-resize' },
  },
  {
    direction: 'NorthEast',
    style: { top: 0, right: 0, width: 14, height: 14, cursor: 'nesw-resize' },
  },
  {
    direction: 'SouthWest',
    style: { bottom: 0, left: 0, width: 14, height: 14, cursor: 'nesw-resize' },
  },
  {
    direction: 'SouthEast',
    style: { bottom: 0, right: 0, width: 14, height: 14, cursor: 'nwse-resize' },
  },
];

export function WindowResizeHandles() {
  const startResize = (direction: ResizeDirection) => async (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const el = event.currentTarget;
    el.setPointerCapture(event.pointerId);

    const win = getCurrentWindow();
    const startX = event.screenX;
    const startY = event.screenY;
    const [startSize, startPosition, scaleFactor] = await Promise.all([
      win.outerSize(),
      win.outerPosition(),
      win.scaleFactor(),
    ]);
    const startWidth = startSize.width / scaleFactor;
    const startHeight = startSize.height / scaleFactor;
    const startLeft = startPosition.x / scaleFactor;
    const startTop = startPosition.y / scaleFactor;

    const minWidth = 680;
    const minHeight = 380;
    let frame = 0;

    const needsMove = direction.includes('West') || direction.includes('North');

    const onMove = (moveEvent: PointerEvent) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const dx = (moveEvent.screenX - startX) / scaleFactor;
        const dy = (moveEvent.screenY - startY) / scaleFactor;
        const east = direction.includes('East');
        const south = direction.includes('South');
        const west = direction.includes('West');
        const north = direction.includes('North');
        const w = Math.max(minWidth, startWidth + (east ? dx : 0) - (west ? dx : 0));
        const h = Math.max(minHeight, startHeight + (south ? dy : 0) - (north ? dy : 0));

        if (needsMove) {
          const l = west ? startLeft + startWidth - w : startLeft;
          const t = north ? startTop + startHeight - h : startTop;
          Promise.all([
            win.setSize(new LogicalSize(w, h)),
            win.setPosition(new LogicalPosition(l, t)),
          ]).catch(() => {});
        } else {
          win.setSize(new LogicalSize(w, h)).catch(() => {});
        }
      });
    };

    const onUp = () => {
      el.releasePointerCapture(event.pointerId);
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    window.addEventListener('pointercancel', onUp, { once: true });
  };

  return (
    <>
      {HANDLES.map((handle) => (
        <div
          key={handle.direction}
          aria-hidden="true"
          onPointerDown={startResize(handle.direction)}
          style={{
            position: 'absolute',
            zIndex: 'var(--z-tooltip)',
            ...handle.style,
          }}
        />
      ))}
    </>
  );
}
