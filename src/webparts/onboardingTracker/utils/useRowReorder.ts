import * as React from 'react';

const EDGE_SIZE = 90;
const MAX_SCROLL_STEP = 26;

export type RowDragState = 'dragging' | 'dropAbove' | 'dropBelow' | undefined;

export interface IRowDragProps {
  draggable: boolean;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
}

export interface IRowReorder {
  getRowProps: (id: number, disabled: boolean) => IRowDragProps;
  getRowState: (id: number) => RowDragState;
}

function isScrollable(element: HTMLElement): boolean {
  const overflowY = window.getComputedStyle(element).overflowY;
  return /(auto|scroll|overlay)/.test(overflowY) && element.scrollHeight > element.clientHeight;
}

// Innermost-first list of vertically scrollable ancestors; undefined stands for the window.
function getScrollParents(start: HTMLElement): Array<HTMLElement | undefined> {
  const parents: Array<HTMLElement | undefined> = [];
  let node: HTMLElement | null = start.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    if (isScrollable(node)) {
      parents.push(node);
    }
    node = node.parentElement;
  }
  parents.push(undefined);
  return parents;
}

function scrollStep(pointerY: number, top: number, bottom: number): number {
  if (pointerY < top + EDGE_SIZE) {
    const ratio = Math.min(1, (top + EDGE_SIZE - pointerY) / EDGE_SIZE);
    return -Math.max(2, Math.round(ratio * ratio * MAX_SCROLL_STEP));
  }
  if (pointerY > bottom - EDGE_SIZE) {
    const ratio = Math.min(1, (pointerY - (bottom - EDGE_SIZE)) / EDGE_SIZE);
    return Math.max(2, Math.round(ratio * ratio * MAX_SCROLL_STEP));
  }
  return 0;
}

function autoScroll(parents: Array<HTMLElement | undefined>, pointerY: number): void {
  for (const parent of parents) {
    const rect = parent ? parent.getBoundingClientRect() : undefined;
    const top = Math.max(0, rect ? rect.top : 0);
    const bottom = Math.min(window.innerHeight, rect ? rect.bottom : window.innerHeight);
    const step = scrollStep(pointerY, top, bottom);
    if (step === 0) {
      continue;
    }
    if (parent) {
      const before = parent.scrollTop;
      parent.scrollTop = before + step;
      if (parent.scrollTop !== before) {
        return;
      }
    } else {
      const before = window.pageYOffset;
      window.scrollBy(0, step);
      if (window.pageYOffset !== before) {
        return;
      }
    }
  }
}

/**
 * Drag-to-reorder for table rows: tracks the dragged/hovered row for visual feedback
 * and scrolls the nearest scrollable ancestor while the pointer is near its top/bottom edge.
 * `orderedIds` must be the current visual order so the drop position can be indicated.
 */
export function useRowReorder(
  orderedIds: number[],
  onReorder: (sourceId: number, targetId: number) => void
): IRowReorder {
  const [draggedId, setDraggedId] = React.useState<number | undefined>();
  const [overId, setOverId] = React.useState<number | undefined>();
  const cleanupRef = React.useRef<(() => void) | undefined>();

  const stopDrag = React.useCallback((): void => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = undefined;
    }
    setDraggedId(undefined);
    setOverId(undefined);
  }, []);

  React.useEffect(() => () => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }
  }, []);

  const startAutoScroll = (row: HTMLElement): void => {
    const parents = getScrollParents(row);
    let pointerY: number | undefined;
    let frame = 0;
    const onDocumentDragOver = (event: DragEvent): void => {
      pointerY = event.clientY;
    };
    const tick = (): void => {
      if (pointerY !== undefined) {
        autoScroll(parents, pointerY);
      }
      frame = window.requestAnimationFrame(tick);
    };
    document.addEventListener('dragover', onDocumentDragOver);
    frame = window.requestAnimationFrame(tick);
    cleanupRef.current = () => {
      document.removeEventListener('dragover', onDocumentDragOver);
      window.cancelAnimationFrame(frame);
    };
  };

  const getRowProps = (id: number, disabled: boolean): IRowDragProps => ({
    draggable: !disabled,
    onDragStart: event => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(id));
      const row = event.currentTarget;
      startAutoScroll(row);
      // Defer so the browser snapshots the row before it is dimmed.
      window.setTimeout(() => setDraggedId(id), 0);
    },
    onDragEnd: stopDrag,
    onDragOver: event => {
      if (draggedId === undefined) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (overId !== id) {
        setOverId(id);
      }
    },
    onDrop: event => {
      event.preventDefault();
      const sourceId = Number(event.dataTransfer.getData('text/plain'));
      stopDrag();
      if (sourceId && sourceId !== id) {
        onReorder(sourceId, id);
      }
    }
  });

  const getRowState = (id: number): RowDragState => {
    if (draggedId === undefined) {
      return undefined;
    }
    if (id === draggedId) {
      return 'dragging';
    }
    if (id !== overId) {
      return undefined;
    }
    return orderedIds.indexOf(id) > orderedIds.indexOf(draggedId) ? 'dropBelow' : 'dropAbove';
  };

  return { getRowProps, getRowState };
}
