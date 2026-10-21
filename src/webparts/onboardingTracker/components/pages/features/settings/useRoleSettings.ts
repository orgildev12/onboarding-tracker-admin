import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import type { IPositionRole, IRoleOwner } from '../../../../models/PositionRole';
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
  loading: boolean;
  error: string;
  addOwner: (roleId: number, userId: number) => Promise<void>;
  removeOwner: (owner: IRoleOwner) => Promise<void>;
}

interface IOwnerFields {
  role: string;
  person: string;
  lastActionIndex: string;
  isPerson: boolean;
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

export function useRoleSettings(services: RoleSettingsServices): IRoleSettings {
  const { taskOwnerRolesService, roleOwnersService, listService, taskGroupsService, newEmployeesService } = services;
  const [roles, setRoles] = React.useState<IPositionRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const fieldsRef = React.useRef<IOwnerFields | undefined>();

  const fetchRoles = React.useCallback(async (): Promise<IPositionRole[]> => {
    const [roleItems, ownerFields, taskItems, taskFields, groupItems, groupFields, users] = await Promise.all([
      taskOwnerRolesService.getItems(),
      roleOwnersService.getFields(),
      listService.getItems(5000),
      listService.getFields(),
      taskGroupsService.getItems(),
      taskGroupsService.getFields(),
      newEmployeesService.getSiteUsers()
    ]);
    const fields = readOwnerFields(ownerFields);
    fieldsRef.current = fields;
    const ownerItems = await roleOwnersService.getItems(5000, undefined, fields.isPerson ? [fields.person] : []);

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

    // duties are listed in the order tasks run: task group order, then order inside the group
    const groupOrderField = findFieldName(groupFields, ['Order'], 'Order');
    const groupOrder = new Map(groupItems.map(item => [numberValue(item.Id), numberValue(readValue(item, [groupOrderField, 'Order']))]));
    const roleField = findLookupField(taskFields, ['TaskOwnerRoleID', 'TaskOwnerRole'], 'TaskOwnerRoleId');
    const groupField = findLookupField(taskFields, ['TaskGroupID', 'TaskGroup'], 'TaskGroupId');
    const taskOrderField = findFieldName(taskFields, ['TaskOrderInTheGroup'], 'TaskOrderInTheGroup');
    const dutiesByRole = new Map<number, Array<{ id: number; title: string; order: number }>>();
    taskItems.forEach(item => {
      const roleId = readLookupId(item, roleField, ['TaskOwnerRoleID', 'TaskOwnerRole']);
      if (!roleId) {
        return;
      }
      const groupId = readLookupId(item, groupField, ['TaskGroupID', 'TaskGroup']);
      dutiesByRole.set(roleId, [
        ...(dutiesByRole.get(roleId) || []),
        {
          id: numberValue(item.Id),
          title: textValue(item.Title),
          order: (groupId ? groupOrder.get(groupId) || 0 : 0) * 1000 + numberValue(readValue(item, [taskOrderField, 'TaskOrderInTheGroup']))
        }
      ]);
    });

    return roleItems
      .map(item => {
        const id = numberValue(item.Id);
        return {
          id,
          title: textValue(item.Title),
          owners: (ownersByRole.get(id) || []).sort((a, b) => a.id - b.id),
          duties: (dutiesByRole.get(id) || [])
            .sort((a, b) => a.order - b.order || a.id - b.id)
            .map(({ id: dutyId, title }) => ({ id: dutyId, title }))
        };
      })
      .sort((a, b) => a.id - b.id);
  }, [taskOwnerRolesService, roleOwnersService, listService, taskGroupsService, newEmployeesService]);

  const reload = React.useCallback(async (): Promise<void> => {
    setError('');
    try {
      setRoles(await fetchRoles());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  React.useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  // Runs a change, then always reloads so the page shows what is really stored.
  const mutate = async (action: () => Promise<void>): Promise<void> => {
    let failure: Error | undefined;
    try {
      await action();
    } catch (e) {
      failure = e as Error;
    }
    try {
      setRoles(await fetchRoles());
    } catch (e) {
      failure = failure || (e as Error);
    }
    if (failure) {
      throw failure;
    }
  };

  const addOwner: IRoleSettings['addOwner'] = (roleId, userId) => mutate(async () => {
    const fields = fieldsRef.current;
    if (!fields) {
      throw new Error('RoleOwners жагсаалтын багана уншигдаагүй байна.');
    }
    const role = roles.filter(r => r.id === roleId)[0];
    if (role && role.owners.some(owner => owner.userId === userId)) {
      throw new Error('Энэ хүн аль хэдийн хариуцагчаар нэмэгдсэн байна.');
    }
    const payload: ListItem = { [fields.role]: roleId, [`${fields.person}Id`]: userId };
    if (fields.lastActionIndex) {
      payload[fields.lastActionIndex] = 0;
    }
    await roleOwnersService.createItem(payload);
  });

  const removeOwner: IRoleSettings['removeOwner'] = owner => mutate(async () => {
    await roleOwnersService.deleteItem(owner.id);
  });

  return { roles, loading, error, addOwner, removeOwner };
}
