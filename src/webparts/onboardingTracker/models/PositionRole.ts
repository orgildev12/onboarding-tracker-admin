export interface IPositionDuty {
  id: number;
  title: string;
}

export interface IRoleOwner {
  // RoleOwners list item id
  id: number;
  // SharePoint site user id of the person
  userId: number;
  name: string;
  email: string;
  // 0 when the owner has not been assigned a task yet
  lastActionIndex: number;
}

export interface IPositionRole {
  id: number;
  title: string;
  owners: IRoleOwner[];
  // tasks that belong to this role (Tasks.TaskOwnerRoleID)
  duties: IPositionDuty[];
}

// Every Tasks row, used to offer tasks that can be assigned to a role as a duty.
// A task's TaskOwnerRoleID is a single lookup, so assigning it to a role always
// un-assigns it from whatever role (if any) it belonged to before.
export interface ITaskOption {
  id: number;
  title: string;
  roleId: number | undefined;
}

