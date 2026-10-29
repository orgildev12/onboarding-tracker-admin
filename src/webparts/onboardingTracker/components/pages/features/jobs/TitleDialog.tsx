import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';
import type { IDepartment, IJobGroup } from './JobSettingsTypes';

export interface IDepartmentOptions {
  departments: IDepartment[];
  // the job's current department (a Gazar, or a Heltes under a Gazar)
  initialDepartmentId: number | undefined;
}

export interface ITitleDialogProps {
  heading: string;
  initialTitle: string;
  // when provided, a job group can be picked (used when creating a job)
  groups?: IJobGroup[];
  // when provided, a Gazar (and its Heltes, if it has any) must be chosen (used for jobs)
  department?: IDepartmentOptions;
  onSave: (title: string, groupId: number | undefined, departmentId: number | undefined) => Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
}

function initialSelection(options: IDepartmentOptions | undefined): { gazar: string; heltes: string } {
  const current = options ? options.departments.filter(item => item.id === options.initialDepartmentId)[0] : undefined;
  if (!current) {
    return { gazar: '', heltes: '' };
  }
  if (current.isGazar) {
    return { gazar: String(current.id), heltes: '' };
  }
  return current.gazarId ? { gazar: String(current.gazarId), heltes: String(current.id) } : { gazar: '', heltes: '' };
}

export default function TitleDialog({ heading, initialTitle, groups, department, onSave, onDelete, onCancel }: ITitleDialogProps): React.ReactElement {
  const initial = initialSelection(department);
  const [title, setTitle] = React.useState(initialTitle);
  const [groupId, setGroupId] = React.useState('');
  const [gazar, setGazar] = React.useState(initial.gazar);
  const [heltes, setHeltes] = React.useState(initial.heltes);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const gazarOptions = department ? department.departments.filter(item => item.isGazar) : [];
  const heltesOptions = department && gazar
    ? department.departments.filter(item => !item.isGazar && item.gazarId === Number(gazar))
    : [];
  // a Gazar without any Heltes is saved on its own
  const departmentId = heltes ? Number(heltes) : gazar && heltesOptions.length === 0 ? Number(gazar) : undefined;

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(title.trim(), groupId ? Number(groupId) : undefined, departmentId);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const departmentMissing = !!department && departmentId === undefined;

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form className={styles.dialog} onSubmit={event => { submit(event).catch(() => undefined); }}>
        <h3>{heading}</h3>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <label className={styles.field}>
          <span>Нэр *</span>
          <input autoFocus required value={title} onChange={event => setTitle(event.target.value)} />
        </label>
        {department && (
          <>
            <label className={styles.field}>
              <span>Газар *</span>
              <select
                required
                value={gazar}
                onChange={event => { setGazar(event.target.value); setHeltes(''); }}
              >
                <option value="">-</option>
                {gazarOptions.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
            {heltesOptions.length > 0 && (
              <label className={styles.field}>
                <span>Хэлтэс *</span>
                <select required value={heltes} onChange={event => setHeltes(event.target.value)}>
                  <option value="">-</option>
                  {heltesOptions.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
            )}
          </>
        )}
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
          <button type="submit" disabled={saving || !title.trim() || departmentMissing}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
          <button type="button" disabled={saving} onClick={onCancel}>Болих</button>
        </div>
      </form>
    </div>
  );
}
