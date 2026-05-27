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
  const startResize = (direction: ResizeDirection) => (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    getCurrentWindow().startResizeDragging(direction).catch(() => {});
  };

  return (
    <>
      {HANDLES.map((handle) => (
        <div
          key={handle.direction}
          aria-hidden="true"
          onMouseDown={startResize(handle.direction)}
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
