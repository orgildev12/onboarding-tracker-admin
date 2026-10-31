import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';
import type { ITask, ITaskGroup } from './TaskAdminTypes';
import { MAX_TASKS_PER_GROUP } from './TaskAdminTypes';
import { useRowReorder } from '../../../../utils/useRowReorder';

export interface ITaskGroupSectionProps {
  group: ITaskGroup;
  tasks: ITask[];
  taskTitlesById: Record<number, string>;
  ownerRoleTitlesById: Record<number, string>;
  disabled: boolean;
  onCreateTask: (group: ITaskGroup) => void;
  onEditTask: (task: ITask) => void;
  onDeleteTask: (task: ITask) => void;
  onEditGroup: (group: ITaskGroup) => void;
  onDeleteGroup: (group: ITaskGroup) => void;
  onReorder: (group: ITaskGroup, sourceId: number, targetId: number) => void;
  isFirst: boolean;
  isLast: boolean;
  onMoveGroup: (group: ITaskGroup, direction: -1 | 1) => void;
}

export default function TaskGroupSection(props: ITaskGroupSectionProps): React.ReactElement {
  const [expanded, setExpanded] = React.useState(true);
  const { getRowProps, getRowState } = useRowReorder(
    props.tasks.map(task => task.id),
    (sourceId, targetId) => props.onReorder(props.group, sourceId, targetId)
  );
  const rowClass: Record<string, string> = {
    dragging: styles.draggingRow,
    dropAbove: styles.dropAbove,
    dropBelow: styles.dropBelow
  };

  return (
    <section className={styles.taskGroup}>
      <div className={styles.taskGroupHeader}>
        <button type="button" className={styles.groupTitle} onClick={() => setExpanded(value => !value)}>
          <span>{props.group.title}</span>
          <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
        </button>
        <div>
          <button type="button" disabled={props.disabled || props.isFirst} onClick={() => props.onMoveGroup(props.group, -1)} aria-label="Move group up">↑</button>
          <button type="button" disabled={props.disabled || props.isLast} onClick={() => props.onMoveGroup(props.group, 1)} aria-label="Move group down">↓</button>
          <button type="button" disabled={props.disabled} onClick={() => props.onEditGroup(props.group)}>Edit group</button>
          <button type="button" disabled={props.disabled} onClick={() => props.onDeleteGroup(props.group)}>Delete group</button>
        </div>
      </div>
      {expanded && (
        <>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.taskTable}`}>
              <colgroup>
                <col style={{ width: 32 }} />
                <col style={{ width: 50 }} />
                <col style={{ width: 280 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 210 }} />
                <col style={{ width: 170 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 170 }} />
                <col style={{ width: 200 }} />
                <col style={{ width: 138 }} />
              </colgroup>
              <thead>
                <tr>
                  <th aria-label="Reorder" />
                  <th>ID</th>
                  <th>Title</th>
                  <th>Trigger type</th>
                  <th>Day should begin / trigger task</th>
                  <th>Day should end / day should take</th>
                  <th>Handler type</th>
                  <th>Task type</th>
                  <th>Task owner role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {props.tasks.map(task => (
                  <tr
                    key={task.id}
                    {...getRowProps(task.id, props.disabled)}
                    className={`${styles.dragRow} ${rowClass[getRowState(task.id) || ''] || ''}`}
                    onDoubleClick={() => props.onEditTask(task)}
                    title="Double-click to edit; drag to reorder"
                  >
                    <td className={styles.dragHandle} aria-label="Drag to reorder">☰</td>
                    <td>{task.id}</td>
                    <td>{task.title}</td>
                    <td>{task.triggerType}</td>
                    <td>{task.triggerType === 'ByOtherTask'
                      ? props.taskTitlesById[task.triggerTaskId || 0] || ''
                      : task.dayShouldBegin}</td>
                    <td>{task.triggerType === 'ByOtherTask' ? task.dayShouldTake : task.dayShouldEnd}</td>
                    <td>{task.handlerType}</td>
                    <td>{task.handlerType === 'ByOtherSystem' ? task.taskFieldTableName : task.taskType}</td>
                    <td>{task.taskOwnerRoleId ? props.ownerRoleTitlesById[task.taskOwnerRoleId] || '' : ''}</td>
                    <td className={styles.actions}>
                      <button type="button" disabled={props.disabled} onClick={() => props.onEditTask(task)}>Edit</button>
                      <button type="button" disabled={props.disabled} onClick={() => props.onDeleteTask(task)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {props.tasks.length === 0 && (
                  <tr><td colSpan={10}>No tasks in this group yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className={styles.groupFooter}>
            <button
              type="button"
              disabled={props.disabled || props.tasks.length >= MAX_TASKS_PER_GROUP}
              onClick={() => props.onCreateTask(props.group)}
            >
              + Add task to group
            </button>
            {props.tasks.length >= MAX_TASKS_PER_GROUP && <span>A group can contain up to {MAX_TASKS_PER_GROUP} tasks.</span>}
          </div>
        </>
      )}
    </section>
  );
}
