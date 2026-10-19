import * as React from 'react';
import { DUMMY_POSITION_ROLES } from '../../data/dummyPositionRoles';
import type { IPositionRole } from '../../models/PositionRole';
import PositionSidebar from './features/settings/PositionSidebar';
import RoleDetails from './features/settings/RoleDetails';

export default function SettingsPage(): React.ReactElement {
  const [roles, setRoles] = React.useState<IPositionRole[]>(DUMMY_POSITION_ROLES);
  const [selectedRoleId, setSelectedRoleId] = React.useState(DUMMY_POSITION_ROLES[0].id);
  const selectedRole = roles.find(role => role.id === selectedRoleId);

  if (!selectedRole) {
    throw new Error(`Settings role "${selectedRoleId}" was not found.`);
  }

  const updateResponsible = (name: string): void => {
    setRoles(currentRoles => currentRoles.map(role => (
      role.id === selectedRoleId ? { ...role, responsible: name || undefined } : role
    )));
  };

  return (
    <div className="tw-flex tw-min-h-full tw-flex-col md:tw-flex-row tw-bg-white">
      <PositionSidebar
        roles={roles}
        selectedRoleId={selectedRoleId}
        onSelectRole={role => setSelectedRoleId(role.id)}
      />
      <RoleDetails
        key={selectedRole.id}
        role={selectedRole}
        onResponsibleChange={updateResponsible}
      />
    </div>
  );
}
