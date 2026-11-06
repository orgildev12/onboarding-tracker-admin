import * as React from 'react';
import { PersonaSize } from '@fluentui/react/lib/Persona';
import type { IPositionRole, IRoleOwner, ITaskOption } from '../../../../models/PositionRole';
import type { GraphService } from '../../../../services/GraphService';
import type { ListService } from '../../../../services/ListService';
import styles from '../../../OnboardingTracker.module.scss';
import PersonPicker from '../newEmployees/PersonPicker';
import UserPersona from '../newEmployees/UserPersona';
import SearchableSelect from '../common/SearchableSelect';
import { confirmDialog } from '../common/ConfirmDialog';

export interface IRoleDetailsProps {
  role: IPositionRole;
  // every Tasks row, so a duty can be picked from those not already in this role
  tasks: ITaskOption[];
  graph: GraphService;
  // used to turn a picked tenant user into a SharePoint site user id
  personService: ListService;
  onAddOwner: (userId: number) => Promise<void>;
  onRemoveOwner: (owner: IRoleOwner) => Promise<void>;
  // moves a task to this role (a task can only belong to one role at a time)
  onAssignDuty: (taskId: number) => Promise<void>;
  onUnassignDuty: (taskId: number) => Promise<void>;
}

const LINK_BUTTON = 'tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-underline tw-cursor-pointer';
// 0 is never a real Tasks list item id, so it stands for "nothing picked yet"
const NO_TASK = 0;

export default function RoleDetails({ role, tasks, graph, personService, onAddOwner, onRemoveOwner, onAssignDuty, onUnassignDuty }: IRoleDetailsProps): React.ReactElement {
  const [adding, setAdding] = React.useState(false);
  // user picked in the PersonPicker, waiting for the "Нэмэх" button to confirm it
  const [pendingUserId, setPendingUserId] = React.useState<number | undefined>();
  const [addBusy, setAddBusy] = React.useState(false);
  // id of the owner row currently being removed, so only that row shows feedback
  const [removingId, setRemovingId] = React.useState<number | undefined>();
  const [error, setError] = React.useState('');

  const [addingDuty, setAddingDuty] = React.useState(false);
  const [pendingTaskId, setPendingTaskId] = React.useState(NO_TASK);
  const [dutyBusy, setDutyBusy] = React.useState(false);
  // id of the duty row currently being removed, so only that row shows feedback
  const [removingDutyId, setRemovingDutyId] = React.useState<number | undefined>();

  const canAddOwner = role.owners.length === 0;
  // only tasks with no role yet; a task already owned by another role must be removed there first
  const availableTasks = tasks.filter(t => t.roleId === undefined);

  // The owner who got the most recent task; only shown when it is unambiguous.
  const highest = role.owners.reduce((max, owner) => Math.max(max, owner.lastActionIndex), 0);
  const lastAssigned = highest > 0 ? role.owners.filter(owner => owner.lastActionIndex === highest) : [];
  const lastAssignedId = lastAssigned.length === 1 ? lastAssigned[0].id : undefined;

  const cancelAdd = (): void => {
    setAdding(false);
    setPendingUserId(undefined);
  };

  const confirmAdd = (): void => {
    if (pendingUserId === undefined) {
      return;
    }
    setAddBusy(true);
    setError('');
    (async (): Promise<void> => {
      try {
        await onAddOwner(pendingUserId);
        setAdding(false);
        setPendingUserId(undefined);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setAddBusy(false);
      }
    })().catch(() => undefined);
  };

  const remove = async (owner: IRoleOwner): Promise<void> => {
    if (!(await confirmDialog(`"${owner.name || 'Хариуцагч'}"-г "${role.title}" албан тушаалын хариуцагчаас хасах уу?`))) {
      return;
    }
    setError('');
    setRemovingId(owner.id);
    try {
      await onRemoveOwner(owner);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemovingId(undefined);
    }
  };

  const cancelAddDuty = (): void => {
    setAddingDuty(false);
    setPendingTaskId(NO_TASK);
  };

  const confirmAddDuty = (): void => {
    if (pendingTaskId === NO_TASK) {
      return;
    }
    setDutyBusy(true);
    setError('');
    (async (): Promise<void> => {
      try {
        await onAssignDuty(pendingTaskId);
        setAddingDuty(false);
        setPendingTaskId(NO_TASK);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setDutyBusy(false);
      }
    })().catch(() => undefined);
  };

  const removeDuty = async (taskId: number, title: string): Promise<void> => {
    if (!(await confirmDialog(`"${title}" үүргийг "${role.title}" албан тушаалаас хасах уу?`))) {
      return;
    }
    setError('');
    setRemovingDutyId(taskId);
    try {
      await onUnassignDuty(taskId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemovingDutyId(undefined);
    }
  };

  return (
    <section className="tw-min-w-0 tw-flex-1 tw-bg-white tw-px-6 tw-py-6 md:tw-px-8">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-8 tw-gap-y-2">
        <h2 className="tw-m-0 tw-text-base tw-font-semibold">Хариуцагч</h2>
        {!adding && canAddOwner && (
          <button type="button" onClick={() => { setError(''); setAdding(true); }} className={`${LINK_BUTTON} tw-text-brand`}>
            + Хариуцагч нэмэх
          </button>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3">
        {role.owners.length === 0 && !adding && (
          <div className="tw-text-sm tw-text-gray-500">Хариуцагч тохируулаагүй байна.</div>
        )}
        {role.owners.map(owner => {
          const removing = removingId === owner.id;
          return (
            <div key={owner.id} className="tw-flex tw-items-start tw-gap-4">
              <div>
                <UserPersona graph={graph} name={owner.name || 'Нэргүй хэрэглэгч'} email={owner.email} secondaryText={role.title} size={PersonaSize.size40} />
                {owner.id === lastAssignedId && (
                  <div
                    className="tw-ml-[56px] tw-mt-1 tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-brand-light tw-px-2 tw-py-0.5 tw-text-[11px] tw-text-brand"
                    title="Хамгийн сүүлд task хуваарилагдсан хариуцагч"
                  >
                    <span aria-hidden="true" className="tw-inline-block tw-h-1.5 tw-w-1.5 tw-rounded-full tw-bg-brand" />
                    Сүүлд task хуваарилагдсан
                  </div>
                )}
              </div>
              <button type="button" disabled={removing} onClick={() => remove(owner)} className={`${LINK_BUTTON} tw-mt-3 ${removing ? 'tw-text-gray-400' : 'tw-text-danger'}`}>
                {removing ? 'Устгаж байна...' : 'Хасах'}
              </button>
            </div>
          );
        })}
      </div>

      {adding && (
        <div className="tw-mt-3 tw-flex tw-max-w-[420px] tw-flex-col tw-gap-2">
          <PersonPicker
            service={personService}
            graph={graph}
            users={[]}
            selectedId={undefined}
            onChange={setPendingUserId}
            onError={setError}
            ariaLabel="Хариуцагч нэмэх"
          />
          <div className="tw-flex tw-gap-3">
            <button type="button" disabled={pendingUserId === undefined || addBusy} onClick={confirmAdd} className={`${LINK_BUTTON} ${pendingUserId === undefined || addBusy ? 'tw-text-gray-400' : 'tw-text-brand'}`}>
              {addBusy ? 'Нэмж байна...' : 'Нэмэх'}
            </button>
            <button type="button" disabled={addBusy} onClick={cancelAdd} className={`${LINK_BUTTON} tw-text-gray-500`}>
              Болих
            </button>
          </div>
        </div>
      )}

      <section className="tw-mt-12">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-8 tw-gap-y-2">
          <h3 className="tw-m-0 tw-text-base tw-font-semibold">Хамаарах үүргүүд</h3>
          {!addingDuty && (
            <button type="button" onClick={() => { setError(''); setAddingDuty(true); }} className={`${LINK_BUTTON} tw-text-brand`}>
              + Үүрэг нэмэх
            </button>
          )}
        </div>

        {addingDuty && (
          <div className="tw-mt-3 tw-flex tw-max-w-[520px] tw-flex-col tw-gap-2">
            <SearchableSelect
              value={pendingTaskId}
              onChange={setPendingTaskId}
              placeholder="Task хайх..."
              disabled={dutyBusy}
              inputClassName="tw-h-11 tw-w-full tw-rounded tw-border tw-border-solid tw-border-gray-300 tw-px-3 tw-text-base"
              options={[
                { value: NO_TASK, label: '-' },
                ...availableTasks.map(t => ({ value: t.id, label: t.title }))
              ]}
            />
            <div className="tw-flex tw-gap-3">
              <button type="button" disabled={pendingTaskId === NO_TASK || dutyBusy} onClick={confirmAddDuty} className={`${LINK_BUTTON} ${pendingTaskId === NO_TASK || dutyBusy ? 'tw-text-gray-400' : 'tw-text-brand'}`}>
                {dutyBusy ? 'Нэмж байна...' : 'Нэмэх'}
              </button>
              <button type="button" disabled={dutyBusy} onClick={cancelAddDuty} className={`${LINK_BUTTON} tw-text-gray-500`}>
                Болих
              </button>
            </div>
          </div>
        )}

        {role.duties.length > 0 ? (
          <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2">
            {role.duties.map(duty => {
              const removing = removingDutyId === duty.id;
              return (
                <div key={duty.id} className="tw-flex tw-items-center tw-gap-3 tw-rounded tw-px-2 tw-py-1 tw-text-sm hover:tw-bg-gray-50">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    disabled
                    className="tw-m-0 tw-h-[18px] tw-w-[18px] tw-min-w-[18px] tw-shrink-0 tw-accent-gray-500"
                  />
                  <span className="tw-flex-1">{duty.title}</span>
                  <button type="button" disabled={removing} onClick={() => removeDuty(duty.id, duty.title)} className={`${LINK_BUTTON} ${removing ? 'tw-text-gray-400' : 'tw-text-danger'}`}>
                    {removing ? 'Устгаж байна...' : 'Хасах'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          !addingDuty && <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-gray-500">Энэ албан тушаалд үүрэг тохируулаагүй байна.</p>
        )}
      </section>
    </section>
  );
}
