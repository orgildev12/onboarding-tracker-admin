import * as React from 'react';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import type { UserRole } from '../../services/userRole';
import PositionSidebar from './features/settings/PositionSidebar';
import RoleDetails from './features/settings/RoleDetails';
import { useRoleSettings } from './features/settings/useRoleSettings';

type SettingsPageProps = IOnboardingTrackerProps & {
  // undefined while the role check hasn't resolved yet; deleting a position stays hidden meanwhile
  role: UserRole | undefined;
};

export default function SettingsPage(props: SettingsPageProps): React.ReactElement {
  const { roles, tasks, loading, error, addOwner, removeOwner, createRole, renameRole, deleteRole, assignDuty, unassignDuty } = useRoleSettings(props);
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | undefined>();
  const selectedRole = roles.filter(role => role.id === selectedRoleId)[0] || roles[0];

  const addRole = (title: string): Promise<void> => createRole(title).then(id => setSelectedRoleId(id));

  const removeRole = (roleId: number): Promise<void> => deleteRole(roleId).then(() => {
    if (selectedRoleId === roleId) {
      setSelectedRoleId(undefined);
    }
  });

  return (
    <div className="tw-flex tw-min-h-full tw-flex-col md:tw-flex-row tw-bg-white">
      <PositionSidebar
        roles={roles}
        selectedRoleId={selectedRole ? selectedRole.id : undefined}
        canDelete={props.role === 1}
        onSelectRole={role => setSelectedRoleId(role.id)}
        onCreateRole={addRole}
        onRenameRole={renameRole}
        onDeleteRole={removeRole}
      />
      <div className="tw-min-w-0 tw-flex-1">
        {error && <p className={`${styles.error} tw-px-8`} role="alert">{error}</p>}
        {loading && <p className="tw-px-8 tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
        {!loading && !error && !selectedRole && (
          <p className="tw-px-8 tw-text-sm tw-text-gray-500">Албан тушаал (TaskOwnerRoles) олдсонгүй.</p>
        )}
        {selectedRole && (
          <RoleDetails
            key={selectedRole.id}
            role={selectedRole}
            tasks={tasks}
            graph={props.graphService}
            personService={props.newEmployeesService}
            onAddOwner={userId => addOwner(selectedRole.id, userId)}
            onRemoveOwner={owner => removeOwner(selectedRole.id, owner)}
            onAssignDuty={taskId => assignDuty(taskId, selectedRole.id)}
            onUnassignDuty={unassignDuty}
          />
        )}
      </div>
    </div>
  );
}
