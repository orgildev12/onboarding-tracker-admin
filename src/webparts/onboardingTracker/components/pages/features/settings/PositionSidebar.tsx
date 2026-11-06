import * as React from 'react';
import type { IPositionRole } from '../../../../models/PositionRole';
import PageIcon from '../common/PageIcon';
import { confirmDialog } from '../common/ConfirmDialog';

export interface IPositionSidebarProps {
  roles: IPositionRole[];
  selectedRoleId: number | undefined;
  // only Role 1 may delete a position
  canDelete: boolean;
  onSelectRole: (role: IPositionRole) => void;
  onCreateRole: (title: string) => Promise<void>;
  onRenameRole: (roleId: number, title: string) => Promise<void>;
  onDeleteRole: (roleId: number) => Promise<void>;
}

const LINK_BUTTON = 'tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-underline tw-cursor-pointer';

export default function PositionSidebar({ roles, selectedRoleId, canDelete, onSelectRole, onCreateRole, onRenameRole, onDeleteRole }: IPositionSidebarProps): React.ReactElement {
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [editText, setEditText] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [createText, setCreateText] = React.useState('');
  const [busyId, setBusyId] = React.useState<number | undefined>();
  const [creatingBusy, setCreatingBusy] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | undefined>();
  const [error, setError] = React.useState('');

  const startEdit = (role: IPositionRole): void => {
    setError('');
    setEditingId(role.id);
    setEditText(role.title);
  };

  const cancelEdit = (): void => {
    setEditingId(undefined);
    setEditText('');
  };

  const saveEdit = (roleId: number): void => {
    const title = editText.trim();
    if (!title) {
      return;
    }
    setBusyId(roleId);
    setError('');
    (async (): Promise<void> => {
      try {
        await onRenameRole(roleId, title);
        setEditingId(undefined);
        setEditText('');
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusyId(undefined);
      }
    })().catch(() => undefined);
  };

  const remove = async (role: IPositionRole): Promise<void> => {
    if (!(await confirmDialog(`"${role.title}" албан тушаалыг устгах уу? Үүнтэй холбоотой хариуцагч болон хамаарах үүргүүд цэвэрлэгдэнэ.`))) {
      return;
    }
    setError('');
    setDeletingId(role.id);
    try {
      await onDeleteRole(role.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(undefined);
    }
  };

  const create = (): void => {
    const title = createText.trim();
    if (!title) {
      return;
    }
    setCreatingBusy(true);
    setError('');
    (async (): Promise<void> => {
      try {
        await onCreateRole(title);
        setCreating(false);
        setCreateText('');
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setCreatingBusy(false);
      }
    })().catch(() => undefined);
  };

  return (
    <aside className="tw-w-full md:tw-w-[240px] tw-shrink-0 tw-border-0 tw-border-r tw-border-solid tw-border-gray-300 tw-bg-gray-100">
      <div className="tw-flex tw-h-9 tw-items-center tw-gap-2 tw-px-3 tw-text-xs tw-font-medium">
        <PageIcon name="PositionGroup" className="tw-text-base" />
        <span>Албан тушаалууд</span>
      </div>

      {error && <p className="tw-m-0 tw-px-3 tw-pb-1 tw-text-xs tw-text-danger" role="alert">{error}</p>}

      <div className="tw-flex tw-flex-col tw-gap-1 tw-px-3 tw-pb-3">
        {creating && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-gray-300 tw-bg-white tw-px-2 tw-py-1">
            <input
              type="text"
              autoFocus
              disabled={creatingBusy}
              value={createText}
              onChange={event => setCreateText(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') { create(); } }}
              placeholder="Албан тушаалын нэр"
              className="tw-min-w-0 tw-flex-1 tw-border-0 tw-p-0 tw-text-xs focus:tw-outline-none"
            />
            <button type="button" disabled={creatingBusy || !createText.trim()} onClick={create} className={`${LINK_BUTTON} tw-text-brand`}>
              {creatingBusy ? '...' : 'Нэмэх'}
            </button>
            <button type="button" disabled={creatingBusy} onClick={() => { setCreating(false); setCreateText(''); }} className={`${LINK_BUTTON} tw-text-gray-500`}>
              Болих
            </button>
          </div>
        )}

        {roles.map(role => {
          const selected = role.id === selectedRoleId;
          const editing = editingId === role.id;
          const saving = busyId === role.id;
          const deleting = deletingId === role.id;

          if (editing) {
            return (
              <div key={role.id} className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-gray-300 tw-bg-white tw-px-2 tw-py-1">
                <input
                  type="text"
                  autoFocus
                  disabled={saving}
                  value={editText}
                  onChange={event => setEditText(event.target.value)}
                  onKeyDown={event => { if (event.key === 'Enter') { saveEdit(role.id); } }}
                  className="tw-min-w-0 tw-flex-1 tw-border-0 tw-p-0 tw-text-xs focus:tw-outline-none"
                />
                <button type="button" disabled={saving || !editText.trim()} onClick={() => saveEdit(role.id)} className={`${LINK_BUTTON} tw-text-brand`}>
                  {saving ? '...' : 'Хадгалах'}
                </button>
                <button type="button" disabled={saving} onClick={cancelEdit} className={`${LINK_BUTTON} tw-text-gray-500`}>
                  Болих
                </button>
              </div>
            );
          }

          return (
            <div
              key={role.id}
              className={`tw-flex tw-items-center tw-rounded-lg tw-border tw-border-solid ${
                selected ? 'tw-border-brand tw-bg-brand-light' : 'tw-border-gray-300 tw-bg-white'
              }`}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectRole(role)}
                className="tw-min-h-7 tw-flex-1 tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-xs tw-cursor-pointer"
              >
                {deleting ? 'Устгаж байна...' : role.title}
              </button>
              <button
                type="button"
                disabled={deleting}
                aria-label={`${role.title} засах`}
                onClick={() => startEdit(role)}
                className="tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-cursor-pointer"
              >
                <PageIcon name="Edit" className="tw-text-xs tw-text-gray-600" />
              </button>
              {canDelete && (
                <button
                  type="button"
                  disabled={deleting}
                  aria-label={`${role.title} устгах`}
                  onClick={() => remove(role)}
                  className="tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-cursor-pointer"
                >
                  <PageIcon name="Delete" className="tw-text-xs tw-text-danger" />
                </button>
              )}
            </div>
          );
        })}

        {!creating && (
          <button
            type="button"
            onClick={() => { setError(''); setCreating(true); }}
            className="tw-min-h-7 tw-rounded-lg tw-border tw-border-solid tw-border-gray-400 tw-bg-white tw-text-xs tw-cursor-pointer"
          >
            + Нэмэх
          </button>
        )}
      </div>
    </aside>
  );
}
