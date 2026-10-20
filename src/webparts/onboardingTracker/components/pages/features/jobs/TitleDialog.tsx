import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';
import type { IJobGroup } from './JobSettingsTypes';

export interface ITitleDialogProps {
  heading: string;
  initialTitle: string;
  // when provided, a job group can be picked (used when creating a job)
  groups?: IJobGroup[];
  onSave: (title: string, groupId: number | undefined) => Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
}

export default function TitleDialog({ heading, initialTitle, groups, onSave, onDelete, onCancel }: ITitleDialogProps): React.ReactElement {
  const [title, setTitle] = React.useState(initialTitle);
  const [groupId, setGroupId] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(title.trim(), groupId ? Number(groupId) : undefined);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form className={styles.dialog} onSubmit={event => { submit(event).catch(() => undefined); }}>
        <h3>{heading}</h3>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <label className={styles.field}>
          <span>Нэр *</span>
          <input autoFocus required value={title} onChange={event => setTitle(event.target.value)} />
        </label>
        {groups && (
          <label className={styles.field}>
            <span>Job group</span>
            <select value={groupId} onChange={event => setGroupId(event.target.value)}>
              <option value="">Job group-гүй (өөрийн task order-той)</option>
              {groups.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}
            </select>
          </label>
        )}
        <div className={styles.dialogActions}>
          {onDelete && <button type="button" disabled={saving} onClick={onDelete}>Устгах</button>}
          <button type="submit" disabled={saving || !title.trim()}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
          <button type="button" disabled={saving} onClick={onCancel}>Болих</button>
        </div>
      </form>
    </div>
  );
}
