import * as React from 'react';

export interface IHistoryPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const buttonClass = 'tw-px-3 tw-py-1.5 tw-text-sm tw-rounded-md tw-border tw-border-gray-300 tw-bg-white disabled:tw-opacity-40 disabled:tw-cursor-not-allowed';

export default function HistoryPagination({ page, pageCount, total, pageSize, onPageChange }: IHistoryPaginationProps): React.ReactElement {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className="tw-flex tw-items-center tw-justify-between tw-gap-4" aria-label="Хуудаслалт">
      <span className="tw-text-sm tw-text-gray-500">{from}–{to} / {total}</span>
      <div className="tw-flex tw-items-center tw-gap-3">
        <button type="button" className={buttonClass} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Өмнөх
        </button>
        <span className="tw-text-sm">{page} / {pageCount}</span>
        <button type="button" className={buttonClass} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Дараах
        </button>
      </div>
    </nav>
  );
}
