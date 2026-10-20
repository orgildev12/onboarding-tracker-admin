import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';
import type { ListService } from '../../../../services/ListService';
import type { GraphService } from '../../../../services/GraphService';
import PersonPicker from './PersonPicker';
import type { IAnketPage, INewEmployeeDraft, INewEmployeeJob, IUserOption } from './NewEmployeeTypes';
import { clampPercent, EMPTY_DRAFT } from './NewEmployeeTypes';

export interface INewEmployeeFormProps {
  heading: string;
  initial: INewEmployeeDraft | undefined;
  jobs: INewEmployeeJob[];
  users: IUserOption[];
  personService: ListService;
  graph: GraphService;
  onSave: (draft: INewEmployeeDraft) => Promise<void>;
  onCancel: () => void;
}

type TraitKey = 'extraversion' | 'sensing' | 'thinking' | 'judging';

const TRAITS: Array<{ key: TraitKey; label: string }> = [
  { key: 'extraversion', label: 'Extraversion' },
  { key: 'sensing', label: 'Sensing' },
  { key: 'thinking', label: 'Thinking' },
  { key: 'judging', label: 'Judging' }
];

export default function NewEmployeeForm({ heading, initial, jobs, users, personService, graph, onSave, onCancel }: INewEmployeeFormProps): React.ReactElement {
  const [draft, setDraft] = React.useState<INewEmployeeDraft>(initial || EMPTY_DRAFT);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const set = <K extends keyof INewEmployeeDraft>(key: K, value: INewEmployeeDraft[K]): void =>
    setDraft(current => ({ ...current, [key]: value }));

  const addImages = (files: FileList | null): void => {
    if (!files) {
      return;
    }
    const pages: IAnketPage[] = Array.from(files).map(file => ({
      id: undefined,
      imageValue: undefined,
      previewUrl: URL.createObjectURL(file),
      file
    }));
    set('ankets', [...draft.ankets, ...pages]);
  };

  const movePage = (index: number, delta: number): void => {
    const target = index + delta;
    if (target < 0 || target >= draft.ankets.length) {
      return;
    }
    const next = draft.ankets.slice();
    [next[index], next[target]] = [next[target], next[index]];
    set('ankets', next);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    if (draft.probationStartDate && draft.probationEndDate && draft.probationEndDate < draft.probationStartDate) {
      setError('Туршилтын дуусах огноо эхлэх огнооноос өмнө байж болохгүй.');
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const text = (label: string, key: 'firstName' | 'lastName' | 'phone' | 'personalEmail' | 'workEmail' | 'mbti', required?: boolean, type?: string): React.ReactElement => (
    <label className={styles.field}>
      <span>{label}{required ? ' *' : ''}</span>
      <input type={type || 'text'} required={required} value={draft[key]} onChange={event => set(key, event.target.value)} />
    </label>
  );

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form className={styles.dialog} style={{ width: 'min(720px, 100%)' }} onSubmit={event => { submit(event).catch(() => undefined); }}>
        <h3>{heading}</h3>
        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-4">
          {text('Нэр', 'firstName', true)}
          {text('Овог', 'lastName', true)}
          {text('Утас', 'phone')}
          {text('Хувийн и-мэйл', 'personalEmail', false, 'email')}
          {text('Ажлын и-мэйл', 'workEmail', false, 'email')}
          {text('MBTI', 'mbti')}
          <label className={styles.field}>
            <span>Ажлын байр</span>
            <select value={draft.jobId ?? ''} onChange={event => set('jobId', event.target.value ? Number(event.target.value) : undefined)}>
              <option value="">-</option>
              {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </label>
          <div className={styles.field}>
            <span>Шууд удирдлага</span>
            <PersonPicker
              service={personService}
              graph={graph}
              users={users}
              selectedId={draft.firstLineManagerId}
              onChange={id => set('firstLineManagerId', id)}
              onError={setError}
            />
          </div>
          <label className={styles.field}>
            <span>Туршилтын эхлэх огноо</span>
            <input type="date" value={draft.probationStartDate} onChange={event => set('probationStartDate', event.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Туршилтын дуусах огноо</span>
            <input type="date" value={draft.probationEndDate} onChange={event => set('probationEndDate', event.target.value)} />
          </label>
          {TRAITS.map(trait => (
            <label key={trait.key} className={styles.field}>
              <span>{trait.label} (1-100)</span>
              <input
                type="number"
                min={1}
                max={100}
                value={draft[trait.key]}
                onChange={event => set(trait.key, event.target.value === '' ? 0 : Number(event.target.value))}
                onBlur={() => set(trait.key, clampPercent(draft[trait.key]))}
              />
            </label>
          ))}
        </div>

        <h4 className="tw-mb-2 tw-mt-4">Анкет хуудсууд</h4>
        <input type="file" accept="image/*" multiple onChange={event => { addImages(event.target.files); event.target.value = ''; }} />
        <ol className="tw-m-0 tw-mt-3 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
          {draft.ankets.map((page, index) => (
            <li key={page.id ?? page.previewUrl} className="tw-flex tw-items-center tw-gap-3 tw-rounded tw-border tw-border-gray-300 tw-p-2">
              <span className="tw-w-6 tw-text-center tw-text-sm">{index + 1}</span>
              <img src={page.previewUrl} alt={`Хуудас ${index + 1}`} className="tw-h-16 tw-w-12 tw-object-cover" />
              <span className="tw-flex-1" />
              <button type="button" disabled={index === 0} onClick={() => movePage(index, -1)} aria-label="Дээш">↑</button>
              <button type="button" disabled={index === draft.ankets.length - 1} onClick={() => movePage(index, 1)} aria-label="Доош">↓</button>
              <button type="button" onClick={() => set('ankets', draft.ankets.filter((_, i) => i !== index))}>Хасах</button>
            </li>
          ))}
        </ol>

        <div className={styles.dialogActions}>
          <button type="submit" disabled={saving || !draft.firstName.trim() || !draft.lastName.trim()}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
          <button type="button" disabled={saving} onClick={onCancel}>Болих</button>
        </div>
      </form>
    </div>
  );
}
