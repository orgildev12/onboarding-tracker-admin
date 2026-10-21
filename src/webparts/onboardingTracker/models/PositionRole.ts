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
