import * as React from 'react';

export interface ITriggerRelation {
  // the task that triggers `targetId`
  sourceId: number;
  targetId: number;
}

export interface ITriggerLine {
  key: string;
  path: string;
  active: boolean;
}

// Room to leave on the right of the content for the curves.
export const TRIGGER_LINES_GUTTER = 64;
export const TRIGGER_SELECTED_BG = 'rgba(241, 89, 0, 0.25)';
export const TRIGGER_RELATED_BG = 'rgba(241, 89, 0, 0.1)';

const LINE_COLOR_ACTIVE = '#F15900';
const LINE_COLOR = '#BDBDBD';

export interface IUseTriggerLines {
  // pass to <TriggerLines lines=... />
  lines: ITriggerLine[];
  selectedId: number | undefined;
  toggleTask: (taskId: number) => void;
  // the selected task, the task that triggers it and the tasks it triggers
  related: Set<number>;
}

// Measures the rows (or a collapsed section's header) of the related tasks inside `containerRef` and
// builds the curves that join each trigger task to the task it starts.
// `findAnchor` returns the element a task's line attaches to, e.g. its row, or the header when its section is collapsed.
export function useTriggerLines(
  containerRef: React.RefObject<HTMLElement>,
  relations: ITriggerRelation[],
  findAnchor: (container: HTMLElement, taskId: number) => Element | undefined
): IUseTriggerLines {
  const [selectedId, setSelectedId] = React.useState<number | undefined>();
  const [lines, setLines] = React.useState<ITriggerLine[]>([]);

  const related = React.useMemo(() => {
    const ids = new Set<number>();
    if (selectedId !== undefined) {
      ids.add(selectedId);
      relations.forEach(relation => {
        if (relation.targetId === selectedId) {
          ids.add(relation.sourceId);
        }
        if (relation.sourceId === selectedId) {
          ids.add(relation.targetId);
        }
      });
    }
    return ids;
  }, [relations, selectedId]);

  const measure = React.useCallback((): void => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const origin = container.getBoundingClientRect();
    const next: ITriggerLine[] = [];
    relations.forEach((relation, index) => {
      const from = findAnchor(container, relation.sourceId);
      const to = findAnchor(container, relation.targetId);
      if (!from || !to || from === to) {
        return;
      }
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      const x1 = fromRect.right - origin.left;
      const x2 = toRect.right - origin.left;
      const y1 = fromRect.top + fromRect.height / 2 - origin.top;
      const y2 = toRect.top + toRect.height / 2 - origin.top;
      // spread the curves so lines between neighbouring rows do not overlap
      const reach = Math.max(x1, x2) + 14 + (index % 5) * 8 + Math.min(Math.abs(y2 - y1) / 12, 24);
      next.push({
        key: `${relation.sourceId}-${relation.targetId}`,
        path: `M ${x1} ${y1} C ${reach} ${y1}, ${reach} ${y2}, ${x2} ${y2}`,
        active: related.has(relation.sourceId) && related.has(relation.targetId)
      });
    });
    setLines(next);
  }, [containerRef, relations, findAnchor, related]);

  React.useLayoutEffect(() => {
    measure();
  }, [measure]);

  React.useEffect(() => {
    const container = containerRef.current;
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' || !container ? undefined : new ResizeObserver(() => measure());
    if (observer && container) {
      observer.observe(container);
    }
    return () => {
      window.removeEventListener('resize', measure);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [containerRef, measure]);

  const toggleTask = React.useCallback(
    (taskId: number): void => setSelectedId(current => current === taskId ? undefined : taskId),
    []
  );

  return { lines, selectedId, toggleTask, related };
}

// Background of a task row: selected, related to the selection, or none.
export function triggerRowBackground(taskId: number, selectedId: number | undefined, related: Set<number>): string | undefined {
  if (taskId === selectedId) {
    return TRIGGER_SELECTED_BG;
  }
  return related.has(taskId) ? TRIGGER_RELATED_BG : undefined;
}

export function TriggerLines({ lines }: { lines: IUseTriggerLines['lines'] }): React.ReactElement {
  return (
    <svg aria-hidden="true" className="tw-pointer-events-none tw-absolute tw-left-0 tw-top-0 tw-h-full tw-w-full tw-overflow-visible">
      {lines.filter(line => !line.active).concat(lines.filter(line => line.active)).map(line => (
        <path
          key={line.key}
          d={line.path}
          fill="none"
          stroke={line.active ? LINE_COLOR_ACTIVE : LINE_COLOR}
          strokeWidth={line.active ? 2 : 1.5}
        />
      ))}
    </svg>
  );
}
