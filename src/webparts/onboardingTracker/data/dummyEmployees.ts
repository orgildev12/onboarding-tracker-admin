import type { IEmployee, IProcessStep } from '../models/Employee';

export const DUMMY_STEPS: IProcessStep[] = [
  { key: 'info', title: 'Onboarding мэдээлэл үүсгэх' },
  { key: 'notify', title: 'Талбараар дадлагажуулах' },
  { key: 'page', title: 'Дүгнэлт хуудас гаргах' },
  { key: 'prepare', title: 'Ажилтан хүлээн авах бэлтгэл хийх' },
  { key: 'material', title: 'Материал бүрдүүлэлт' },
  { key: 'accept', title: 'Ажилтан хүлээн авах' },
  { key: 'relations', title: 'Хөдөлмөрийн харилцааны процесс' },
  { key: 'register', title: 'Бүртгэл' },
  { key: 'training', title: 'Шинэ ажилтны сургалт' },
  { key: 'review', title: '1.5 уулзалт' },
  { key: 'confirm', title: 'Жинхлэх' }
];

export const DUMMY_EMPLOYEES: IEmployee[] = [
  {
    id: 1,
    lastName: 'Даваа',
    firstName: 'Мягмаржав',
    position: 'Түгээгч',
    status: 'normal',
    progress: 12,
    hireDate: '2026.08.10',
    probationEndDate: '2026.11.10',
    steps: [
      'completedOnTime', 'completedLate', 'noProcess', 'completedOnTime', 'completedOnTime', 'completedOnTime',
      'completedOnTime', 'completedOnTime', 'completedOnTime', 'notStarted', 'notStarted'
    ]
  },
  {
    id: 2,
    lastName: 'Батсүх',
    firstName: 'Оргил',
    position: 'Программ хөгжүүлэгч',
    status: 'delayed',
    progress: 75,
    hireDate: '2026.08.10',
    probationEndDate: '2026.11.10',
    steps: [
      'completedOnTime', 'completedLate', 'noProcess', 'completedOnTime', 'delayed', 'inProgress',
      'delayed', 'notStarted', 'notStarted', 'notStarted', 'notStarted'
    ]
  },
  {
    id: 3,
    lastName: 'Чимэд',
    firstName: 'Хоролмаа',
    position: 'Худалдааны төлөөлөгч',
    status: 'normal',
    progress: 12,
    hireDate: '2026.08.10',
    probationEndDate: '2026.11.10',
    steps: [
      'completedOnTime', 'completedLate', 'noProcess', 'completedOnTime', 'completedOnTime', 'completedOnTime',
      'completedOnTime', 'completedOnTime', 'completedOnTime', 'notStarted', 'notStarted'
    ]
  },
  {
    id: 4,
    lastName: 'Гомбо',
    firstName: 'Мягмаржав',
    position: 'Түгээгч',
    status: 'delayed',
    progress: 40,
    hireDate: '2026.08.10',
    probationEndDate: '2026.11.10',
    steps: [
      'completedOnTime', 'completedLate', 'inProgress', 'delayed', 'inProgress', 'notStarted',
      'notStarted', 'notStarted', 'notStarted', 'notStarted', 'notStarted'
    ]
  }
];
