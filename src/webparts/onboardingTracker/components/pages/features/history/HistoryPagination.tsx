import * as React from 'react';

export interface IHistoryPaginationProps {
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const buttonClass = 'tw-px-3 tw-py-1.5 tw-text-sm tw-rounded-md tw-border tw-border-gray-300 tw-bg-white disabled:tw-opacity-40 disabled:tw-cursor-not-allowed';

export default function HistoryPagination({ page, hasPrevious, hasNext, onPrevious, onNext }: IHistoryPaginationProps): React.ReactElement {
  return (
    <nav className="tw-flex tw-items-center tw-justify-end tw-gap-3" aria-label="Хуудаслалт">
      <button type="button" className={buttonClass} disabled={!hasPrevious} onClick={onPrevious}>
        Өмнөх
      </button>
      <span className="tw-text-sm">{page}-р хуудас</span>
      <button type="button" className={buttonClass} disabled={!hasNext} onClick={onNext}>
        Дараах
      </button>
    </nav>
  );
}
