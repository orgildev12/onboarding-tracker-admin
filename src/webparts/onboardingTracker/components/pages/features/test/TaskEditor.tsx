import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';
import type { ITask, ITaskDraft, ITaskGroup, ITaskOwnerRole } from './TaskAdminTypes';
import {
  EMPTY_TASK_DRAFT,
  HANDLER_TYPES,
  TASK_RESULT_TABLE_BY_TYPE,
  TASK_TYPES,
  TRIGGER_TYPES
} from './TaskAdminTypes';

export interface ITaskEditorProps {
  task?: ITask;
  initialGroupId: number;
  groups: ITaskGroup[];
  tasks: ITask[];
  ownerRoles: ITaskOwnerRole[];
  onSave: (draft: ITaskDraft) => Promise<void>;
  onCancel: () => void;
}

function toDraft(task: ITask | undefined, groupId: number): ITaskDraft {
  if (!task) {
    return { ...EMPTY_TASK_DRAFT, taskGroupId: groupId };
  }
  return {
    title: task.title,
    triggerType: task.triggerType,
    dayShouldBegin: task.dayShouldBegin,
    dayShouldEnd: task.dayShouldEnd,
    triggerTaskId: task.triggerTaskId === undefined ? '' : String(task.triggerTaskId),
    dayShouldTake: task.dayShouldTake,
    handlerType: task.handlerType,
    taskOwnerRoleId: task.taskOwnerRoleId === undefined ? '' : String(task.taskOwnerRoleId),
    taskType: task.taskType || EMPTY_TASK_DRAFT.taskType,
    taskFieldTableName: task.taskFieldTableName,
    taskDefaultBodyText: task.taskDefaultBodyText,
    taskGroupId: task.taskGroupId
  };
}

export default function TaskEditor(props: ITaskEditorProps): React.ReactElement {
  const [draft, setDraft] = React.useState<ITaskDraft>(() => toDraft(props.task, props.initialGroupId));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const set = (key: keyof ITaskDraft, value: string | number): void =>
    setDraft(current => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await props.onSave(draft);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const otherTasks = props.tasks.filter(task => task.id !== props.task?.id);
  const taskResultTable = TASK_RESULT_TABLE_BY_TYPE[draft.taskType];

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form className={styles.dialog} onSubmit={event => { void submit(event); }}>
        <h3>{props.task ? `Edit task ${props.task.id}` : 'New task'}</h3>
        {error && <p className={styles.error} role="alert">{error}</p>}

        <label className={styles.field}>
          <span>Title *</span>
          <input required value={draft.title} onChange={event => set('title', event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Task group *</span>
          <select required value={draft.taskGroupId} onChange={event => set('taskGroupId', Number(event.target.value))}>
            {props.groups.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Trigger type *</span>
          <select value={draft.triggerType} onChange={event => set('triggerType', event.target.value)}>
            {TRIGGER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>

        {draft.triggerType === 'ByDate' ? (
          <>
            <label className={styles.field}>
              <span>Day should begin *</span>
              <input required type="number" value={draft.dayShouldBegin} onChange={event => set('dayShouldBegin', event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Day should end *</span>
              <input required type="number" value={draft.dayShouldEnd} onChange={event => set('dayShouldEnd', event.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label className={styles.field}>
              <span>Trigger task *</span>
              <select
                required
                value={draft.triggerTaskId}
                onChange={event => set('triggerTaskId', event.target.value)}
              >
                <option value="">Select a task</option>
                {otherTasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Day should take *</span>
              <input required type="number" value={draft.dayShouldTake} onChange={event => set('dayShouldTake', event.target.value)} />
            </label>
          </>
        )}

        <label className={styles.field}>
          <span>Handler type *</span>
          <select value={draft.handlerType} onChange={event => set('handlerType', event.target.value)}>
            {HANDLER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        {draft.handlerType === 'ByTaskOwner' && (
          <>
            <label className={styles.field}>
              <span>Task type *</span>
              <select value={draft.taskType} onChange={event => set('taskType', event.target.value)}>
                {TASK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span>Task result table</span>
              <input readOnly value={taskResultTable || ''} />
            </label>
          </>
        )}
        {draft.handlerType === 'ByOtherSystem' && (
          <label className={styles.field}>
            <span>Task result table name</span>
            <input
              value={draft.taskFieldTableName}
              onChange={event => set('taskFieldTableName', event.target.value)}
            />
          </label>
        )}
        {draft.handlerType === 'ByTaskOwner' && (
          <label className={styles.field}>
            <span>Task owner role *</span>
            <select
              required
              value={draft.taskOwnerRoleId}
              onChange={event => set('taskOwnerRoleId', event.target.value)}
            >
              <option value="">Select a role</option>
              {props.ownerRoles.map(role => <option key={role.id} value={role.id}>{role.title}</option>)}
            </select>
          </label>
        )}
        <label className={styles.field}>
          <span>Default message text (TaskDefaultBodyText)</span>
          <textarea
            rows={3}
            value={draft.taskDefaultBodyText}
            onChange={event => set('taskDefaultBodyText', event.target.value)}
          />
        </label>

        <div className={styles.dialogActions}>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" disabled={saving} onClick={props.onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
