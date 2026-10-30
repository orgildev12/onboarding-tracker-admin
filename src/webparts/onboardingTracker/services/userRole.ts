import type { ListService } from './ListService';
import { findFieldName, numberValue, readValue, textValue } from '../utils/listFields';

export type UserRole = 1 | 2;

export interface IUserRoleResult {
  role: UserRole;
  // false when the user has no row with Role 1 or 2 in the UserRoles list (still treated as role 2)
  listed: boolean;
  // set when the UserRoles list could not be read; the role is then 2
  error?: string;
  // what was compared, shown in the dialog when the user is not listed
  detail: string;
}

interface IPerson {
  Id?: number;
  Title?: string;
  EMail?: string;
}

// Role 1 = full access, role 2 = limited. A user missing from the UserRoles list counts as role 2.
// The list is small, so it is read whole and matched by site user id or e-mail instead of filtering on the Person column.
export async function getUserRole(userRolesService: ListService, fallbackLoginName: string): Promise<IUserRoleResult> {
  try {
    const [items, fields, me] = await Promise.all([
      userRolesService.getAllItems(undefined, ['Employee']),
      userRolesService.getFields(),
      userRolesService.getCurrentUser().catch(() => undefined)
    ]);
    const roleField = findFieldName(fields, ['Role'], 'Role');
    const myId = me ? me.Id : undefined;
    const myEmail = ((me && me.Email) || fallbackLoginName.split('|').pop() || '').toLowerCase();
    const isMe = (person: IPerson | null | undefined): boolean =>
      !!person && ((myId !== undefined && person.Id === myId) || (!!myEmail && (person.EMail || '').toLowerCase() === myEmail));

    const rows = items.map(item => {
      const person = item.Employee as IPerson | null | undefined;
      return { person, role: numberValue(readValue(item, [roleField, 'Role'])), raw: textValue(readValue(item, [roleField, 'Role'])) };
    });
    const mine = rows.filter(row => isMe(row.person) && (row.role === 1 || row.role === 2));
    const role: UserRole = mine.some(row => row.role === 1) ? 1 : 2;
    const detail =
      `Таны хэрэглэгч: id=${myId ?? '?'}, email=${myEmail || '?'}. ` +
      `UserRoles мөр: ${rows.length}, Role багана: ${roleField}. ` +
      `Мөрүүд: ${rows.map(row => `${row.person ? `${row.person.Title}(id=${row.person.Id}, ${row.person.EMail || 'email-гүй'})` : 'хоосон'}=${row.raw}`).join('; ') || 'алга'}`;
    return { role, listed: mine.length > 0, detail };
  } catch (e) {
    console.error('Could not read the UserRoles list', e);
    return { role: 2, listed: false, error: (e as Error).message, detail: '' };
  }
}
