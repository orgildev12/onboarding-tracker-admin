import type { IHistoryEmployee } from '../models/HistoryEmployee';
import type { StepStatus } from '../models/Employee';

const ALL_DONE: StepStatus[] = Array(11).fill('completedOnTime');
const FAILED_STEPS: StepStatus[] = [
  'completedOnTime', 'completedLate', 'noProcess', 'completedOnTime', 'completedOnTime', 'completedOnTime',
  'delayed', 'notStarted', 'notStarted', 'notStarted', 'notStarted'
];

function passed(id: number, lastName: string, firstName: string, position: string): IHistoryEmployee {
  return {
    id, lastName, firstName, position,
    status: 'normal',
    progress: 100,
    hireDate: '2026.08.10',
    probationEndDate: '2026.11.10',
    steps: ALL_DONE,
    result: 'passed',
    confirmedDate: '2026.11.10'
  };
}

function failed(id: number, lastName: string, firstName: string, position: string): IHistoryEmployee {
  return {
    id, lastName, firstName, position,
    status: 'delayed',
    progress: 55,
    hireDate: '2026.08.10',
    probationEndDate: '2026.11.10',
    steps: FAILED_STEPS,
    result: 'failed'
  };
}

// Dummy data for now; replace with data from a service later.
export const DUMMY_HISTORY: IHistoryEmployee[] = [
  passed(101, 'Батсүх', 'Оргил', 'Программ хөгжүүлэгч'),
  failed(102, 'Батсүх', 'Оргил', 'Программ хөгжүүлэгч'),
  passed(103, 'Батсүх', 'Оргил', 'Программ хөгжүүлэгч'),
  passed(104, 'Батсүх', 'Оргил', 'Программ хөгжүүлэгч'),
  passed(105, 'Батсүх', 'Оргил', 'Программ хөгжүүлэгч'),
  passed(106, 'Батсүх', 'Оргил', 'Программ хөгжүүлэгч'),
  failed(107, 'Батсүх', 'Оргил', 'Программ хөгжүүлэгч'),
  passed(108, 'Батсүх', 'Оргил', 'Программ хөгжүүлэгч'),
  passed(109, 'Батсүх', 'Оргил', 'Программ хөгжүүлэгч')
];
