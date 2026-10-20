import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';
import type { ITaskGroup, ITaskGroupDraft } from './TaskAdminTypes';

export interface ITaskGroupEditorProps {
  group?: ITaskGroup;
  onSave: (draft: ITaskGroupDraft) => Promise<void>;
  onCancel: () => void;
}

export default function TaskGroupEditor(props: ITaskGroupEditorProps): React.ReactElement {
  const [title, setTitle] = React.useState(props.group?.title || '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await props.onSave({ title: title.trim() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form className={styles.dialog} onSubmit={event => { void submit(event); }}>
        <h3>{props.group ? 'Edit task group' : 'New task group'}</h3>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <label className={styles.field}>
          <span>Title *</span>
          <input required value={title} onChange={event => setTitle(event.target.value)} />
        </label>
        <div className={styles.dialogActions}>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" disabled={saving} onClick={props.onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
