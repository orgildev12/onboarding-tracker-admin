import * as React from 'react';
import { PersonaSize } from '@fluentui/react/lib/Persona';
import type { IPositionRole, IRoleOwner } from '../../../../models/PositionRole';
import type { GraphService } from '../../../../services/GraphService';
import type { ListService } from '../../../../services/ListService';
import styles from '../../../OnboardingTracker.module.scss';
import PersonPicker from '../newEmployees/PersonPicker';
import UserPersona from '../newEmployees/UserPersona';

export interface IRoleDetailsProps {
  role: IPositionRole;
  graph: GraphService;
  // used to turn a picked tenant user into a SharePoint site user id
  personService: ListService;
  onAddOwner: (userId: number) => Promise<void>;
  onRemoveOwner: (owner: IRoleOwner) => Promise<void>;
}

const LINK_BUTTON = 'tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-underline tw-cursor-pointer';

export default function RoleDetails({ role, graph, personService, onAddOwner, onRemoveOwner }: IRoleDetailsProps): React.ReactElement {
  const [adding, setAdding] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  // The owner who got the most recent task; only shown when it is unambiguous.
  const highest = role.owners.reduce((max, owner) => Math.max(max, owner.lastActionIndex), 0);
  const lastAssigned = highest > 0 ? role.owners.filter(owner => owner.lastActionIndex === highest) : [];
  const lastAssignedId = lastAssigned.length === 1 ? lastAssigned[0].id : undefined;

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    setError('');
    try {
      await action();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = (userId: number | undefined): void => {
    if (userId === undefined) {
      return;
    }
    run(() => onAddOwner(userId)).then(ok => { if (ok) { setAdding(false); } }).catch(() => undefined);
  };

  const remove = (owner: IRoleOwner): void => {
    if (!window.confirm(`"${owner.name || 'Хариуцагч'}"-г "${role.title}" албан тушаалын хариуцагчаас хасах уу?`)) {
      return;
    }
    run(() => onRemoveOwner(owner)).catch(() => undefined);
  };

  return (
    <section className="tw-min-w-0 tw-flex-1 tw-bg-white tw-px-6 tw-py-6 md:tw-px-8">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-8 tw-gap-y-2">
        <h2 className="tw-m-0 tw-text-base tw-font-semibold">Хариуцагч</h2>
        {!adding && (
          <button type="button" disabled={busy} onClick={() => { setError(''); setAdding(true); }} className={`${LINK_BUTTON} tw-text-brand`}>
            + Хариуцагч нэмэх
          </button>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3">
        {role.owners.length === 0 && !adding && (
          <div className="tw-text-sm tw-text-gray-500">Хариуцагч тохируулаагүй байна.</div>
        )}
        {role.owners.map(owner => (
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
            <button type="button" disabled={busy} onClick={() => remove(owner)} className={`${LINK_BUTTON} tw-mt-3 tw-text-danger`}>
              Хасах
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="tw-mt-3 tw-flex tw-max-w-[420px] tw-flex-col tw-gap-2">
          <PersonPicker
            service={personService}
            graph={graph}
            users={[]}
            selectedId={undefined}
            onChange={add}
            onError={setError}
            ariaLabel="Хариуцагч нэмэх"
          />
          <div>
            <button type="button" disabled={busy} onClick={() => setAdding(false)} className={`${LINK_BUTTON} tw-text-gray-500`}>
              Болих
            </button>
          </div>
        </div>
      )}

      <section className="tw-mt-12">
        <h3 className="tw-m-0 tw-mb-3 tw-text-base tw-font-semibold">Хамаарах үүргүүд</h3>
        {role.duties.length > 0 ? (
          <div className="tw-flex tw-flex-col tw-gap-2">
            {role.duties.map(duty => (
              <label key={duty.id} className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  disabled
                  className="tw-m-0 tw-h-[18px] tw-w-[18px] tw-min-w-[18px] tw-shrink-0 tw-accent-gray-500"
                />
                <span>{duty.title}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="tw-m-0 tw-text-sm tw-text-gray-500">Энэ албан тушаалд үүрэг тохируулаагүй байна.</p>
        )}
      </section>
    </section>
  );
}
