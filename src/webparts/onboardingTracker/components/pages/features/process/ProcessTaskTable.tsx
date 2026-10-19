import * as React from 'react';
import type { IProcessTask, TaskStatus } from '../../../../models/OnboardingProcess';

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  completedLate: {
    label: 'Хоцорч дууссан',
    className: 'tw-bg-brand-light tw-border-brand'
  },
  delayed: {
    label: 'Хоцорч буй',
    className: 'tw-bg-danger-light tw-border-danger'
  },
  notStarted: {
    label: 'Эхлээгүй',
    className: 'tw-bg-gray-100 tw-border-gray-300'
  }
};

export interface IProcessTaskTableProps {
  tasks: IProcessTask[];
}

export default function ProcessTaskTable({ tasks }: IProcessTaskTableProps): React.ReactElement {
  return (
    <div className="tw-overflow-x-auto tw-p-2">
      <table className="tw-w-full tw-min-w-[700px] tw-border-collapse tw-text-sm">
        <thead>
          <tr className="tw-bg-orange-100">
            <th className="tw-p-3 tw-text-left tw-font-semibold">Ажлууд</th>
            <th className="tw-p-3 tw-text-left tw-font-semibold">Хариуцагч</th>
            <th className="tw-p-3 tw-text-left tw-font-semibold">Төлөв</th>
            <th className="tw-p-3 tw-text-left tw-font-semibold">Үр дүн</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => {
            const status = TASK_STATUS_CONFIG[task.status];
            return (
              <tr key={task.id} className="tw-border-b tw-border-gray-200">
                <td className="tw-p-3">
                  <label className="tw-flex tw-items-center tw-gap-2">
                    <input type="checkbox" checked={task.completed} readOnly className="tw-accent-brand" />
                    <span>{task.title}</span>
                  </label>
                </td>
                <td className="tw-p-3">
                  <div className="tw-font-medium">{task.assignee}</div>
                  <div className="tw-text-xs tw-text-gray-500">{task.role}</div>
                </td>
                <td className="tw-p-3">
                  <span className={`tw-inline-block tw-rounded-full tw-border tw-px-3 tw-py-1 tw-text-xs ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                <td className="tw-p-3">
                  {task.result && (
                    <button
                      type="button"
                      disabled={!task.completed}
                      className="tw-border tw-border-brand tw-rounded tw-px-3 tw-py-1 tw-text-brand disabled:tw-border-gray-300 disabled:tw-text-gray-400"
                    >
                      {task.result}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
