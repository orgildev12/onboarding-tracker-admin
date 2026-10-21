import * as React from 'react';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import PositionSidebar from './features/settings/PositionSidebar';
import RoleDetails from './features/settings/RoleDetails';
import { useRoleSettings } from './features/settings/useRoleSettings';

export default function SettingsPage(props: IOnboardingTrackerProps): React.ReactElement {
  const { roles, loading, error, addOwner, removeOwner } = useRoleSettings(props);
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | undefined>();
  const selectedRole = roles.filter(role => role.id === selectedRoleId)[0] || roles[0];

  return (
    <div className="tw-flex tw-min-h-full tw-flex-col md:tw-flex-row tw-bg-white">
      <PositionSidebar
        roles={roles}
        selectedRoleId={selectedRole ? selectedRole.id : undefined}
        onSelectRole={role => setSelectedRoleId(role.id)}
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
            graph={props.graphService}
            personService={props.newEmployeesService}
            onAddOwner={userId => addOwner(selectedRole.id, userId)}
            onRemoveOwner={removeOwner}
          />
        )}
      </div>
    </div>
  );
}
