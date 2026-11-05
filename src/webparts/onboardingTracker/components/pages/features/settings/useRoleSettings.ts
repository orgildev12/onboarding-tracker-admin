import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import type { IPositionDuty, IPositionRole, IRoleOwner, ITaskOption } from '../../../../models/PositionRole';
import type { IListField, ListItem } from '../../../../services/ListService';
import {
  findFieldName,
  findLookupField,
  numberValue,
  readLookupId,
  readValue,
  textValue
} from '../../../../utils/listFields';

type RoleSettingsServices = Pick<
  IOnboardingTrackerProps,
  'taskOwnerRolesService' | 'roleOwnersService' | 'listService' | 'taskGroupsService' | 'newEmployeesService'
>;

export interface IRoleSettings {
  roles: IPositionRole[];
  // every Tasks row, for the "add duty" picker (a task can belong to only one role at a time)
  tasks: ITaskOption[];
  loading: boolean;
  error: string;
  addOwner: (roleId: number, userId: number) => Promise<void>;
  removeOwner: (roleId: number, owner: IRoleOwner) => Promise<void>;
  // resolves to the new role's id, so the caller can select it
  createRole: (title: string) => Promise<number>;
  renameRole: (roleId: number, title: string) => Promise<void>;
  // also unassigns its duties and removes its owners first, so nothing is left dangling
  deleteRole: (roleId: number) => Promise<void>;
  assignDuty: (taskId: number, roleId: number) => Promise<void>;
  unassignDuty: (taskId: number) => Promise<void>;
}

interface IOwnerFields {
  role: string;
  person: string;
  lastActionIndex: string;
  isPerson: boolean;
}

interface ISiteUser {
  Id: number;
  Title: string;
  Email: string;
  LoginName: string;
}

interface ITaskFields {
  ownerRole: string;
  group: string;
  order: string;
  groupOrder: string;
}

const isPersonField = (fields: IListField[], name: string): boolean =>
  fields.some(field => field.InternalName === name && field.TypeAsString.indexOf('User') === 0);

function readOwnerFields(fields: IListField[]): IOwnerFields {
  const person = findFieldName(fields, ['Employee', 'RoleOwner', 'Owner'], 'Employee');
  return {
    role: findLookupField(fields, ['TaskOwnerRoleID', 'TaskOwnerRole'], 'TaskOwnerRoleId'),
    person,
    lastActionIndex: findFieldName(fields, ['LastActionIndex'], ''),
    isPerson: isPersonField(fields, person)
  };
}

function readTaskFields(taskFields: IListField[], groupFields: IListField[]): ITaskFields {
  return {
    ownerRole: findLookupField(taskFields, ['TaskOwnerRoleID', 'TaskOwnerRole'], 'TaskOwnerRoleId'),
    group: findLookupField(taskFields, ['TaskGroupID', 'TaskGroup'], 'TaskGroupId'),
    order: findFieldName(taskFields, ['TaskOrderInTheGroup'], 'TaskOrderInTheGroup'),
    groupOrder: findFieldName(groupFields, ['Order'], 'Order')
  };
}

// Shared by the initial load and by the lightweight owners-only refresh after add/remove.
function buildOwnersByRole(ownerItems: ListItem[], fields: IOwnerFields, users: ISiteUser[]): Map<number, IRoleOwner[]> {
  const userById = new Map(users.map(user => [user.Id, user]));
  const ownersByRole = new Map<number, IRoleOwner[]>();
  ownerItems.forEach(item => {
    const roleId = readLookupId(item, fields.role, ['TaskOwnerRoleID', 'TaskOwnerRole']);
    if (!roleId) {
      return;
    }
    const expanded = readValue(item, [fields.person]);
    const userId = numberValue(readValue(item, [`${fields.person}Id`]), 0);
    const person = expanded && typeof expanded === 'object' ? expanded as { Title?: string; EMail?: string } : undefined;
    const siteUser = userById.get(userId);
    const owner: IRoleOwner = {
      id: numberValue(item.Id),
      userId,
      name: (person && person.Title) || (siteUser ? siteUser.Title : ''),
      email: (person && person.EMail) || (siteUser ? siteUser.Email : ''),
      lastActionIndex: fields.lastActionIndex ? numberValue(readValue(item, [fields.lastActionIndex]), 0) : 0
    };
    ownersByRole.set(roleId, [...(ownersByRole.get(roleId) || []), owner]);
  });
  return ownersByRole;
}

// Shared by the initial load and by the lightweight duties-only refresh after assign/unassign.
// Also returns every task flat (regardless of role), for the "add duty" picker.
// BySystem / ByOtherSystem tasks run automatically and are never assigned to a person, so they
// never show up here at all (not as an available task, nor as an existing duty).
function buildDuties(
  taskItems: ListItem[],
  groupItems: ListItem[],
  fields: ITaskFields
): { dutiesByRole: Map<number, IPositionDuty[]>; tasks: ITaskOption[] } {
  const groupOrder = new Map(groupItems.map(item => [numberValue(item.Id), numberValue(readValue(item, [fields.groupOrder, 'Order']))]));
  const rawDutiesByRole = new Map<number, Array<{ id: number; title: string; order: number }>>();
  const tasks: ITaskOption[] = [];
  taskItems.forEach(item => {
    const handlerType = textValue(item.HandlerType);
    if (handlerType === 'BySystem' || handlerType === 'ByOtherSystem') {
      return;
    }
    const id = numberValue(item.Id);
    const title = textValue(item.Title);
    const roleId = readLookupId(item, fields.ownerRole, ['TaskOwnerRoleID', 'TaskOwnerRole']);
    tasks.push({ id, title, roleId });
    if (!roleId) {
      return;
    }
    const groupId = readLookupId(item, fields.group, ['TaskGroupID', 'TaskGroup']);
    rawDutiesByRole.set(roleId, [
      ...(rawDutiesByRole.get(roleId) || []),
      { id, title, order: (groupId ? groupOrder.get(groupId) || 0 : 0) * 1000 + numberValue(readValue(item, [fields.order, 'TaskOrderInTheGroup'])) }
    ]);
  });
  const dutiesByRole = new Map<number, IPositionDuty[]>();
  rawDutiesByRole.forEach((list, roleId) => {
    dutiesByRole.set(roleId, list.slice().sort((a, b) => a.order - b.order || a.id - b.id).map(({ id, title }) => ({ id, title })));
  });
  return { dutiesByRole, tasks: tasks.sort((a, b) => a.title.localeCompare(b.title)) };
}

export function useRoleSettings(services: RoleSettingsServices): IRoleSettings {
  const { taskOwnerRolesService, roleOwnersService, listService, taskGroupsService, newEmployeesService } = services;
  const [roles, setRoles] = React.useState<IPositionRole[]>([]);
  const [tasks, setTasks] = React.useState<ITaskOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const fieldsRef = React.useRef<IOwnerFields | undefined>();
  const taskFieldsRef = React.useRef<ITaskFields | undefined>();

  const fetchRoles = React.useCallback(async (): Promise<{ roles: IPositionRole[]; tasks: ITaskOption[] }> => {
    const [roleItems, ownerFields, taskItems, rawTaskFields, groupItems, groupFields, users] = await Promise.all([
      taskOwnerRolesService.getItems(),
      roleOwnersService.getFields(),
      listService.getAllItems(),
      listService.getFields(),
      taskGroupsService.getItems(),
      taskGroupsService.getFields(),
      newEmployeesService.getSiteUsers()
    ]);
    const fields = readOwnerFields(ownerFields);
    fieldsRef.current = fields;
    const ownerItems = await roleOwnersService.getItems(5000, undefined, fields.isPerson ? [fields.person] : []);
    const ownersByRole = buildOwnersByRole(ownerItems, fields, users);

    const taskFields = readTaskFields(rawTaskFields, groupFields);
    taskFieldsRef.current = taskFields;
    // duties are listed in the order tasks run: task group order, then order inside the group
    const { dutiesByRole, tasks: taskOptions } = buildDuties(taskItems, groupItems, taskFields);

    const builtRoles = roleItems
      .map(item => {
        const id = numberValue(item.Id);
        return {
          id,
          title: textValue(item.Title),
          owners: (ownersByRole.get(id) || []).sort((a, b) => a.id - b.id),
          duties: dutiesByRole.get(id) || []
        };
      })
      .sort((a, b) => a.id - b.id);

    return { roles: builtRoles, tasks: taskOptions };
  }, [taskOwnerRolesService, roleOwnersService, listService, taskGroupsService, newEmployeesService]);

  const reload = React.useCallback(async (): Promise<void> => {
    setError('');
    try {
      const result = await fetchRoles();
      setRoles(result.roles);
      setTasks(result.tasks);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  React.useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  // Re-reads only RoleOwners + site users (not TaskOwnerRoles/Tasks/TaskGroups, which never
  // change from an add/remove) so add/remove stay fast instead of repeating the full page load.
  const refreshOwners = React.useCallback(async (): Promise<void> => {
    const fields = fieldsRef.current;
    if (!fields) {
      return;
    }
    const [ownerItems, users] = await Promise.all([
      roleOwnersService.getItems(5000, undefined, fields.isPerson ? [fields.person] : []),
      newEmployeesService.getSiteUsers()
    ]);
    const ownersByRole = buildOwnersByRole(ownerItems, fields, users);
    setRoles(current => current.map(role => ({ ...role, owners: (ownersByRole.get(role.id) || []).sort((a, b) => a.id - b.id) })));
  }, [roleOwnersService, newEmployeesService]);

  // Re-reads only Tasks + TaskGroups (not RoleOwners/site users/TaskOwnerRoles, which never
  // change from an assign/unassign) so duty changes stay fast too.
  const refreshDuties = React.useCallback(async (): Promise<void> => {
    const [taskItems, rawTaskFields, groupItems, groupFields] = await Promise.all([
      listService.getAllItems(),
      listService.getFields(),
      taskGroupsService.getItems(),
      taskGroupsService.getFields()
    ]);
    const taskFields = readTaskFields(rawTaskFields, groupFields);
    taskFieldsRef.current = taskFields;
    const { dutiesByRole, tasks: taskOptions } = buildDuties(taskItems, groupItems, taskFields);
    setTasks(taskOptions);
    setRoles(current => current.map(role => ({ ...role, duties: dutiesByRole.get(role.id) || [] })));
  }, [listService, taskGroupsService]);

  const addOwner: IRoleSettings['addOwner'] = async (roleId, userId) => {
    const fields = fieldsRef.current;
    if (!fields) {
      throw new Error('RoleOwners жагсаалтын багана уншигдаагүй байна.');
    }
    const role = roles.filter(r => r.id === roleId)[0];
    if (role && role.owners.length > 0) {
      throw new Error('Энэ албан тушаалд аль хэдийн хариуцагч байна. Нэг албан тушаалд зөвхөн нэг хариуцагч байж болно.');
    }
    const payload: ListItem = { [fields.role]: roleId, [`${fields.person}Id`]: userId };
    if (fields.lastActionIndex) {
      payload[fields.lastActionIndex] = 0;
    }
    await roleOwnersService.createItem(payload);
    await refreshOwners();
  };

  const removeOwner: IRoleSettings['removeOwner'] = async (roleId, owner) => {
    await roleOwnersService.deleteItem(owner.id);
    // the row is already gone server-side, so update locally instead of re-reading everything
    setRoles(current => current.map(role => (role.id === roleId ? { ...role, owners: role.owners.filter(o => o.id !== owner.id) } : role)));
  };

  const createRole: IRoleSettings['createRole'] = async title => {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('Албан тушаалын нэрийг оруулна уу.');
    }
    const id = await taskOwnerRolesService.createItemWithId({ Title: trimmed });
    setRoles(current => [...current, { id, title: trimmed, owners: [], duties: [] }].sort((a, b) => a.id - b.id));
    return id;
  };

  const renameRole: IRoleSettings['renameRole'] = async (roleId, title) => {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('Албан тушаалын нэрийг оруулна уу.');
    }
    await taskOwnerRolesService.updateItem(roleId, { Title: trimmed });
    setRoles(current => current.map(role => (role.id === roleId ? { ...role, title: trimmed } : role)));
  };

  const deleteRole: IRoleSettings['deleteRole'] = async roleId => {
    const fields = fieldsRef.current;
    const taskFields = taskFieldsRef.current;
    const role = roles.filter(r => r.id === roleId)[0];
    if (!fields || !taskFields || !role) {
      throw new Error('Өгөгдөл бүрэн ачаалагдаагүй байна.');
    }
    // leave nothing dangling: free the role's duties and remove its owner rows first
    await Promise.all(role.duties.map(duty => listService.updateItem(duty.id, { [taskFields.ownerRole]: null })));
    await Promise.all(role.owners.map(owner => roleOwnersService.deleteItem(owner.id)));
    await taskOwnerRolesService.deleteItem(roleId);
    setRoles(current => current.filter(r => r.id !== roleId));
    setTasks(current => current.map(t => (t.roleId === roleId ? { ...t, roleId: undefined } : t)));
  };

  const assignDuty: IRoleSettings['assignDuty'] = async (taskId, roleId) => {
    const taskFields = taskFieldsRef.current;
    if (!taskFields) {
      throw new Error('Tasks жагсаалтын багана уншигдаагүй байна.');
    }
    await listService.updateItem(taskId, { [taskFields.ownerRole]: roleId });
    await refreshDuties();
  };

  const unassignDuty: IRoleSettings['unassignDuty'] = async taskId => {
    const taskFields = taskFieldsRef.current;
    if (!taskFields) {
      throw new Error('Tasks жагсаалтын багана уншигдаагүй байна.');
    }
    await listService.updateItem(taskId, { [taskFields.ownerRole]: null });
    await refreshDuties();
  };

  return { roles, tasks, loading, error, addOwner, removeOwner, createRole, renameRole, deleteRole, assignDuty, unassignDuty };
}
