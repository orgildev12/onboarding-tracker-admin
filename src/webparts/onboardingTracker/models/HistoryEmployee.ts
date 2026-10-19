import type { IEmployee } from './Employee';

export type HistoryResult = 'passed' | 'failed';

export type HistoryFilter = 'all' | HistoryResult;

// An employee whose onboarding process is finished.
export interface IHistoryEmployee extends IEmployee {
  result: HistoryResult;
  // undefined when the employee did not pass probation
  confirmedDate?: string;
}
