import * as React from 'react';
import type { IPositionRole } from '../../../../models/PositionRole';
import Avatar from '../common/Avatar';

export interface IRoleDetailsProps {
  role: IPositionRole;
  onResponsibleChange: (name: string) => void;
}

export default function RoleDetails({ role, onResponsibleChange }: IRoleDetailsProps): React.ReactElement {
  const [editingResponsible, setEditingResponsible] = React.useState(false);
  const [draftResponsible, setDraftResponsible] = React.useState(role.responsible || '');

  const saveResponsible = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onResponsibleChange(draftResponsible.trim());
    setEditingResponsible(false);
  };

  const cancelResponsibleEdit = (): void => {
    setDraftResponsible(role.responsible || '');
    setEditingResponsible(false);
  };

  return (
    <section className="tw-min-w-0 tw-flex-1 tw-bg-white tw-px-6 tw-py-6 md:tw-px-8">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-8 tw-gap-y-2">
        <h2 className="tw-m-0 tw-text-base tw-font-semibold">Хариуцагч</h2>
        {!editingResponsible && (
          <button
            type="button"
            onClick={() => setEditingResponsible(true)}
            className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-text-brand tw-underline tw-cursor-pointer"
          >
            Өөрчлөх
          </button>
        )}
      </div>

      <div className="tw-mt-3 tw-flex tw-items-center tw-gap-3">
        <Avatar sizeClass="tw-h-10 tw-w-10" />
        {!editingResponsible ? (
          <div>
            <div className="tw-text-sm tw-font-semibold">{role.responsible || 'Хариуцагч тохируулаагүй'}</div>
            {role.responsible && <div className="tw-text-xs tw-text-gray-500">{role.title}</div>}
          </div>
        ) : (
          <form onSubmit={saveResponsible} className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <input
              autoFocus
              type="text"
              value={draftResponsible}
              onChange={event => setDraftResponsible(event.target.value)}
              aria-label="Хариуцагчийн нэр"
              placeholder="Хариуцагчийн нэр"
              className="tw-rounded tw-border tw-border-solid tw-border-gray-300 tw-px-2 tw-py-1 tw-text-sm"
            />
            <button type="submit" className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-text-brand tw-underline tw-cursor-pointer">
              Хадгалах
            </button>
            <button type="button" onClick={cancelResponsibleEdit} className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-text-gray-500 tw-underline tw-cursor-pointer">
              Болих
            </button>
          </form>
        )}
      </div>

      <section className="tw-mt-12">
        <h3 className="tw-m-0 tw-mb-3 tw-text-base tw-font-semibold">Хамаарах үүргүүд</h3>
        {role.duties.length > 0 ? (
          <div className="tw-flex tw-flex-col tw-gap-2">
            {role.duties.map(duty => (
              <label key={duty.id} className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                <input
                  type="checkbox"
                  checked={duty.assigned}
                  disabled
                  className="tw-m-0 tw-h-[18px] tw-w-[18px] tw-min-w-[18px] tw-shrink-0 tw-accent-[#777777]"
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
