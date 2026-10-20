import * as React from 'react';
import type { ICatalogTask, IJobTask } from './JobSettingsTypes';

export interface IJobTaskTableProps {
  tasks: IJobTask[];
  catalog: ICatalogTask[];
  disabled: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onEdit: (task: IJobTask) => void;
  onRemove: (task: IJobTask) => void;
  onReorder: (sourceId: number, targetId: number) => void;
}

const LINK_BUTTON = 'tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-text-orange-600 tw-underline tw-cursor-pointer';

export default function JobTaskTable(props: IJobTaskTableProps): React.ReactElement {
  const [draggedId, setDraggedId] = React.useState<number | undefined>();
  const catalogById = (id: number | undefined): ICatalogTask | undefined =>
    props.catalog.filter(task => task.id === id)[0];

  return (
    <div className="tw-mt-6">
      <div className="tw-overflow-x-auto">
        <table className="tw-w-full tw-border-collapse tw-text-sm">
          <thead>
            <tr className="tw-text-left tw-text-xs tw-text-gray-600">
              <th className="tw-w-8" aria-label="Reorder" />
              <th className="tw-px-2 tw-py-2">ID</th>
              <th className="tw-px-2 tw-py-2">Task name</th>
              <th className="tw-px-2 tw-py-2">TaskGroup name</th>
              <th className="tw-px-2 tw-py-2">TaskBodyText</th>
              <th className="tw-px-2 tw-py-2">OtherTaskName</th>
              <th className="tw-px-2 tw-py-2">HasNewEmployeeInfo</th>
              <th className="tw-px-2 tw-py-2" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {props.tasks.map(link => {
              const task = catalogById(link.taskId);
              const other = catalogById(link.otherTaskId);
              return (
                <tr
                  key={link.id}
                  draggable={!props.disabled}
                  title="Давхар товшиж засах; чирж дараалал өөрчлөх"
                  className={`tw-border-0 tw-border-t tw-border-solid tw-border-gray-200 ${draggedId === link.id ? 'tw-opacity-40' : ''}`}
                  onDragStart={event => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(link.id));
                    setDraggedId(link.id);
                  }}
                  onDragEnd={() => setDraggedId(undefined)}
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    event.preventDefault();
                    const sourceId = Number(event.dataTransfer.getData('text/plain'));
                    setDraggedId(undefined);
                    if (sourceId && sourceId !== link.id) {
                      props.onReorder(sourceId, link.id);
                    }
                  }}
                  onDoubleClick={() => props.onEdit(link)}
                >
                  <td className="tw-cursor-grab tw-text-center tw-text-gray-500">☰</td>
                  <td className="tw-px-2 tw-py-3">{link.taskId}</td>
                  <td className="tw-px-2 tw-py-3">{task ? task.title : ''}</td>
                  <td className="tw-px-2 tw-py-3">{task ? task.taskGroupTitle : ''}</td>
                  <td className="tw-px-2 tw-py-3">
                    {link.bodyText || (
                      <span className="tw-text-gray-500" title="Default текст">{task ? task.defaultBodyText : ''}</span>
                    )}
                  </td>
                  <td className="tw-px-2 tw-py-3">{other ? `(${other.id}) ${other.title}` : ''}</td>
                  <td className="tw-px-2 tw-py-3">{link.hasNewEmployeeInfo ? 'Yes' : 'No'}</td>
                  <td className="tw-px-2 tw-py-3 tw-whitespace-nowrap">
                    <button type="button" disabled={props.disabled} className={LINK_BUTTON} onClick={() => props.onEdit(link)}>Засах</button>
                    {' '}
                    <button type="button" disabled={props.disabled} className={LINK_BUTTON} onClick={() => props.onRemove(link)}>Хасах</button>
                  </td>
                </tr>
              );
            })}
            {props.tasks.length === 0 && (
              <tr><td colSpan={8} className="tw-px-2 tw-py-3 tw-text-gray-500">Task байхгүй байна.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        disabled={props.disabled || !props.canAdd}
        onClick={props.onAdd}
        className="tw-mt-3 tw-rounded-lg tw-border tw-border-solid tw-border-gray-400 tw-bg-white tw-px-6 tw-py-1 tw-text-sm tw-cursor-pointer"
      >
        + Нэмэх
      </button>
    </div>
  );
}
