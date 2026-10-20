import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';
import type { ICatalogTask, IJobTask, IJobTaskDraft } from './JobSettingsTypes';

export interface IJobTaskEditorProps {
  task: IJobTask | undefined;
  // tasks that can still be added to this job / job group
  availableTasks: ICatalogTask[];
  catalog: ICatalogTask[];
  onSave: (draft: IJobTaskDraft) => Promise<void>;
  onCancel: () => void;
}

export default function JobTaskEditor({ task, availableTasks, catalog, onSave, onCancel }: IJobTaskEditorProps): React.ReactElement {
  const [draft, setDraft] = React.useState<IJobTaskDraft>({
    taskId: task ? task.taskId : availableTasks.length > 0 ? availableTasks[0].id : 0,
    bodyText: task ? task.bodyText : '',
    hasNewEmployeeInfo: task ? task.hasNewEmployeeInfo : false,
    otherTaskId: task ? task.otherTaskId : undefined
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const defaultText = (catalog.filter(item => item.id === draft.taskId)[0] || { defaultBodyText: '' }).defaultBodyText;

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      // text identical to the task's default is stored blank, so it keeps following the default
      const text = draft.bodyText.trim();
      await onSave({ ...draft, bodyText: text === defaultText.trim() ? '' : draft.bodyText });
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const taskOptions = task ? catalog.filter(item => item.id === task.taskId) : availableTasks;

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form className={styles.dialog} onSubmit={event => { submit(event).catch(() => undefined); }}>
        <h3>{task ? 'Task засах' : 'Task нэмэх'}</h3>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <label className={styles.field}>
          <span>Task *</span>
          <select
            required
            disabled={!!task}
            value={draft.taskId}
            onChange={event => setDraft({ ...draft, taskId: Number(event.target.value) })}
          >
            {taskOptions.map(item => <option key={item.id} value={item.id}>({item.id}) {item.title}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>TaskBodyText (хоосон бол default текст ашиглана)</span>
          <textarea
            rows={3}
            value={draft.bodyText}
            placeholder={defaultText}
            onChange={event => setDraft({ ...draft, bodyText: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>OtherTask</span>
          <select
            value={draft.otherTaskId === undefined ? '' : draft.otherTaskId}
            onChange={event => setDraft({ ...draft, otherTaskId: event.target.value ? Number(event.target.value) : undefined })}
          >
            <option value="">-</option>
            {catalog.filter(item => item.id !== draft.taskId).map(item => (
              <option key={item.id} value={item.id}>({item.id}) {item.title}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>
            <input
              type="checkbox"
              checked={draft.hasNewEmployeeInfo}
              onChange={event => setDraft({ ...draft, hasNewEmployeeInfo: event.target.checked })}
            />
            {' '}HasNewEmployeeInfo
          </span>
        </label>
        <div className={styles.dialogActions}>
          <button type="submit" disabled={saving || !draft.taskId}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
          <button type="button" disabled={saving} onClick={onCancel}>Болих</button>
        </div>
      </form>
    </div>
  );
}
