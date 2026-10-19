import type { IPositionRole } from '../models/PositionRole';

const RECRUITMENT_DUTIES = [
  'Шинэ ажилтны мэдээлэл оруулах',
  'Бүрдүүлэх материалын жагсаалт илгээх',
  'Талбарын дадлага төлөвлөгөө гаргах',
  'Ажилтанд төлөвлөгөөг танилцуулах, чиглүүлэх өгөх',
  'Green ERP дээр ажилтныг бүртгэх, эрхийн тохиргоо хийх, бүрдүүлсэн материалыг оруулах',
  '1.5 Уулзалт хийх'
];

export const DUMMY_POSITION_ROLES: IPositionRole[] = [
  {
    id: 'recruitment-manager',
    title: 'Сонгон шалгаруулалтын менежер',
    responsible: 'Х. Баттуяа',
    duties: RECRUITMENT_DUTIES.map((title, index) => ({
      id: `recruitment-duty-${index + 1}`,
      title,
      assigned: true
    }))
  },
  { id: 'hiring-manager', title: 'Hiring manager', duties: [] },
  { id: 'safety-officer', title: 'ХАБ ажилтан', duties: [] },
  { id: 'accountant', title: 'Нягтлан бодогч', duties: [] },
  { id: 'lr', title: 'LR', duties: [] },
  { id: 'tr', title: 'TR', duties: [] },
  { id: 'hrm', title: 'HRM', duties: [] },
  { id: 'hrs', title: 'HRS', duties: [] }
];
