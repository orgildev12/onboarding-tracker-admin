import type { IEmployee } from '../models/Employee';

// "Даваа Мягмаржав" -> "Д.Мягмаржав"
export function getShortName(employee: IEmployee): string {
  return `${employee.lastName.charAt(0)}.${employee.firstName}`;
}
