import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';
import type { GraphService } from '../../../../services/GraphService';
import { formatDay, formatMonthDay } from '../../../../utils/workingDays';
import { useRowReorder } from '../../../../utils/useRowReorder';
import PersonPicker from './PersonPicker';
import type { INewEmployeeRecord, IUserOption } from './NewEmployeeTypes';
import { useInternshipPlan } from './useInternshipPlan';
import type { InternshipPlanServices } from './useInternshipPlan';

export interface IInternshipPlanDialogProps {
  services: InternshipPlanServices;
  employee: INewEmployeeRecord;
  users: IUserOption[];
  graph: GraphService;
  // called after the plan and dates were saved, so the list can refresh
  onSaved: () => void;
  onClose: () => void;
}

const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

export default function InternshipPlanDialog({ services, employee, users, graph, onSaved, onClose }: IInternshipPlanDialogProps): React.ReactElement {
  const plan = useInternshipPlan(services, employee, onSaved);
  const [pickerError, setPickerError] = React.useState('');
  const [addId, setAddId] = React.useState('');
  const busy = plan.loading || plan.saving;
  const error = plan.error || pickerError;
  const hasStart = plan.probationEnd !== undefined;

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPickerError('');
    plan.save().catch(() => undefined);
  };

  const trainerName = (id: number | undefined): string => {
    const user = users.filter(item => item.id === id)[0];
    return user ? user.title : '';
  };

  // drop targets in visual order
  const orderedIds = plan.tasks.map(task => task.taskId);
  const { getRowProps, getRowState } = useRowReorder(orderedIds, plan.dropTask);
  const rowClass: Record<string, string> = {
    dragging: 'tw-opacity-40',
    dropAbove: 'tw-shadow-[inset_0_3px_0_#ea580c]',
    dropBelow: 'tw-shadow-[inset_0_-3px_0_#ea580c]'
  };
  const locked = plan.readOnly || busy;

  // Two independent columns laid out as a grid so that row N of both has the same height: the left column is the
  // fixed list of days, the right column the tasks. Dragging only reorders the right column.
  const rows: React.ReactElement[] = [];
  plan.tasks.forEach((task, index) => {
    const { day, date } = plan.days[index];
    rows.push(
      <div key={`day-${index}`} className="tw-flex tw-items-start tw-gap-2 tw-border-r tw-border-t tw-px-3 tw-py-2">
        <span className="tw-inline-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded tw-border tw-text-sm tw-font-semibold">{day}</span>
        {date && <span className="tw-pt-1 tw-text-sm">{formatMonthDay(date)} ({WEEKDAYS[date.getDay()]})</span>}
      </div>,
      <div
        key={`task-${task.taskId}`}
        {...getRowProps(task.taskId, locked)}
        className={`tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-border-t tw-px-3 tw-py-1.5 ${rowClass[getRowState(task.taskId) || ''] || ''}`}
      >
        <span className={`${styles.dragHandle} tw-shrink-0`} aria-label="Чирж зөөх" title="Чирж зөөх">☰</span>
        <span className="tw-min-w-0 tw-flex-1 tw-text-sm">{task.title}</span>
        <div className="tw-w-[240px] tw-shrink-0">
          {plan.readOnly ? (
            <span className="tw-text-sm">{trainerName(task.trainerId) || '-'}</span>
          ) : (
            <PersonPicker
              service={services.newEmployeesService}
              graph={graph}
              users={users}
              selectedId={task.trainerId}
              onChange={id => plan.setTrainer(task.taskId, id)}
              onError={setPickerError}
              ariaLabel="Сургагч"
            />
          )}
        </div>
        <button type="button" className="tw-shrink-0" disabled={locked} onClick={() => plan.removeTask(task.taskId)}>Хасах</button>
      </div>
    );
  });

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form className={styles.dialog} style={{ width: 'min(820px, 100%)' }} onSubmit={submit}>
        <h3>Талбарын төлөвлөгөө – {employee.lastName} {employee.firstName}</h3>
        {plan.readOnly && <p className="tw-text-sm tw-text-gray-500">Task-ууд үүссэн тул төлөвлөгөөг өөрчлөх боломжгүй.</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {plan.notice && <p className="tw-text-sm tw-text-green-700" role="status">{plan.notice}</p>}

        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-4">
          <label className={styles.field}>
            <span>Талбараар ажиллаж эхлэх өдөр *</span>
            <input type="date" required disabled={plan.readOnly} value={plan.probationStart} onChange={event => plan.setProbationStart(event.target.value)} />
          </label>
          {hasStart && (
            <label className={styles.field}>
              <span>Үндсэн ажил эхлэх өдөр *</span>
              <input type="date" required disabled={plan.readOnly} value={plan.workStart} onChange={event => plan.setWorkStart(event.target.value)} />
            </label>
          )}
        </div>

        {/* the plan and the main work start date only appear once the internship start is known */}
        {hasStart && (
          <>
            <p className="tw-mt-0 tw-text-sm tw-text-gray-500">
              Туршилт дуусах: {plan.probationEnd ? formatDay(plan.probationEnd) : '-'}
            </p>
            {plan.warning && <p className="tw-text-sm tw-text-amber-600" role="status">{plan.warning}</p>}

            {plan.loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
            {!plan.loading && plan.loaded && !plan.hasJobTasks && (
              <p className="tw-text-sm tw-text-gray-500">Дадлагын task олдсонгүй. Task засварлагчаас «Дадлагын task»-ыг тэмдэглэнэ үү.</p>
            )}
            {!plan.loading && plan.hasJobTasks && (
              <>
                <div className="tw-mt-2 tw-grid tw-grid-cols-[11rem_1fr] tw-border-b">{rows}</div>
                {!plan.readOnly && (
                  <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                    <button type="button" disabled={busy || !plan.canAddDay} onClick={plan.addDay}>+ Өдөр нэмэх</button>
                    <button type="button" disabled={busy} onClick={plan.resetPlan}>Анхны байдалд оруулах</button>
                    {plan.removed.length > 0 && (
                      <>
                        <select aria-label="Хасагдсан task" value={addId} onChange={event => setAddId(event.target.value)}>
                          <option value="">Хасагдсан task буцааж нэмэх...</option>
                          {plan.removed.map(task => <option key={task.taskId} value={task.taskId}>{task.title}</option>)}
                        </select>
                        <button
                          type="button"
                          disabled={busy || !addId}
                          onClick={() => { plan.addTask(Number(addId)); setAddId(''); }}
                        >
                          Нэмэх
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className={styles.dialogActions}>
          {!plan.readOnly && <button type="submit" disabled={busy || !plan.loaded || !hasStart}>{plan.saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>}
          <button type="button" disabled={plan.saving} onClick={onClose}>Хаах</button>
        </div>
      </form>
    </div>
  );
}
