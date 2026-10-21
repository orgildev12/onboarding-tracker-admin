import * as React from 'react';
import * as ReactDom from 'react-dom';
import type { IProcessTaskTiming, TaskStatus } from '../../../../models/OnboardingProcess';
import PageIcon from '../common/PageIcon';

const POPOVER_MAX_WIDTH = 280;
const POPOVER_GAP = 12;
const VIEWPORT_MARGIN = 8;
// The card is rendered in document.body, outside the web part, so it needs its own font.
const CARD_FONT = '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif';

interface IPillPalette {
  label: string;
  border: string;
  // background when idle, hovered and pressed / selected
  fill: string;
  hoverFill: string;
  activeFill: string;
  // focus ring shown while the card is pinned
  ring: string;
  text: string;
}

const teal = (alpha: number): string => `rgba(41, 127, 135, ${alpha})`;

const PILL_PALETTE: Record<TaskStatus, IPillPalette> = {
  completed: { label: 'Дууссан', border: '#297F87', fill: teal(0.2), hoverFill: teal(0.3), activeFill: teal(0.4), ring: teal(0.3), text: '#292D32' },
  completedLate: { label: 'Хоцорч дууссан', border: '#297F87', fill: teal(0.2), hoverFill: teal(0.3), activeFill: teal(0.4), ring: teal(0.3), text: '#292D32' },
  started: {
    label: 'Эхлэсэн',
    border: '#DE8405',
    fill: 'rgba(222, 132, 5, 0.2)',
    hoverFill: 'rgba(222, 132, 5, 0.3)',
    activeFill: 'rgba(222, 132, 5, 0.4)',
    ring: 'rgba(222, 132, 5, 0.3)',
    text: '#292D32'
  },
  delayed: {
    label: 'Хоцорч буй',
    border: '#A10D00',
    fill: 'rgba(161, 13, 0, 0.2)',
    hoverFill: 'rgba(161, 13, 0, 0.3)',
    activeFill: 'rgba(161, 13, 0, 0.4)',
    ring: 'rgba(161, 13, 0, 0.3)',
    text: '#292D32'
  },
  notStarted: {
    label: 'Эхлээгүй',
    border: '#BFBFBF',
    fill: '#F3F3F3',
    hoverFill: '#E8E8E8',
    activeFill: '#DADADA',
    ring: 'rgba(110, 110, 110, 0.3)',
    text: '#000000'
  }
};

export interface ITaskStatusPillProps {
  status: TaskStatus;
  timing: IProcessTaskTiming;
}
interface IPosition {
  left: number;
  top: number;
}

// Status pill that shows the task's timing card on hover. A click pins the card
// until the pill is clicked again, the user clicks elsewhere or presses Escape.
export default function TaskStatusPill({ status, timing }: ITaskStatusPillProps): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [position, setPosition] = React.useState<IPosition>({ left: 0, top: 0 });
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const open = hovered || pinned;
  const isLate = timing.delayDays > 0;
  const isNotStarted = status === 'notStarted';
  const headerClass = isLate ? 'tw-text-danger' : isNotStarted ? 'tw-text-gray-500' : 'tw-text-brand';
  const palette = PILL_PALETTE[status];
  const style: React.CSSProperties = {
    backgroundColor: pinned || pressed ? palette.activeFill : hovered ? palette.hoverFill : palette.fill,
    borderColor: palette.border,
    color: palette.text,
    boxShadow: pinned ? `0 0 0 3px ${palette.ring}` : hovered ? '0 1px 4px rgba(0, 0, 0, 0.18)' : 'none',
    transition: 'background-color 120ms, box-shadow 120ms'
  };

  const place = React.useCallback((): void => {
    const button = buttonRef.current;
    if (!button) {
      return;
    }
    const rect = button.getBoundingClientRect();
    const cardHeight = cardRef.current ? cardRef.current.offsetHeight : 0;
    const cardWidth = cardRef.current ? cardRef.current.offsetWidth : POPOVER_MAX_WIDTH;
    const fitsRight = rect.right + POPOVER_GAP + cardWidth <= window.innerWidth - VIEWPORT_MARGIN;
    const left = fitsRight ? rect.right + POPOVER_GAP : Math.max(VIEWPORT_MARGIN, rect.left - POPOVER_GAP - cardWidth);
    const top = Math.max(VIEWPORT_MARGIN, Math.min(rect.top - 8, window.innerHeight - cardHeight - VIEWPORT_MARGIN));
    setPosition(previous => previous.left === left && previous.top === top ? previous : { left, top });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) {
      return undefined;
    }
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  React.useEffect(() => {
    if (!pinned) {
      return undefined;
    }
    const onPointerDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      const inside = (buttonRef.current && buttonRef.current.contains(target)) || (cardRef.current && cardRef.current.contains(target));
      if (!inside) {
        setPinned(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setPinned(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [pinned]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setPinned(value => !value)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setPressed(false); }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="tw-inline-block tw-min-w-[76px] tw-cursor-pointer tw-rounded-full tw-border-[1.5px] tw-border-solid tw-px-3 tw-py-1 tw-text-center tw-text-xs"
        style={style}
      >
        {palette.label}
      </button>
      {open && ReactDom.createPortal(
        <div
          ref={cardRef}
          role="tooltip"
          className={`tw-fixed tw-rounded-2xl tw-bg-[#F7F8FB] tw-p-5 tw-text-xs tw-text-[#292D32] tw-shadow-lg ${pinned ? '' : 'tw-pointer-events-none'}`}
          style={{ left: position.left, top: position.top, width: 'max-content', maxWidth: POPOVER_MAX_WIDTH, zIndex: 100001, fontFamily: CARD_FONT }}
        >
          <div className={`tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-sm tw-font-semibold ${headerClass}`}>
            <PageIcon name={isLate ? 'Clock' : isNotStarted ? 'MinusCircle' : 'Completed'} className="tw-text-lg" />
            <span>{isLate ? `${timing.delayDays} хоног хоцорсон` : isNotStarted ? 'Эхлээгүй' : 'Хэвийн'}</span>
          </div>
          <hr className="tw-my-3 tw-border-0 tw-border-t tw-border-solid tw-border-[#C8C9D0]" />
          <div className="tw-mb-3">
            <div className="tw-font-semibold">Зарцуулах хугацаа</div>
            <div className="tw-text-gray-500">{timing.planned}</div>
          </div>
          <div>
            <div className="tw-font-semibold">Зарцуулсан хугацаа</div>
            <div className="tw-text-gray-500">{timing.actual}</div>
          </div>
          {isLate && timing.delayReason && (
            <>
              <hr className="tw-my-3 tw-border-0 tw-border-t tw-border-solid tw-border-[#C8C9D0]" />
              <div className="tw-font-semibold">Шалтгаан</div>
              <div className="tw-text-gray-500">{timing.delayReason}</div>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
