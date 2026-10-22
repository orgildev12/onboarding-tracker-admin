import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import type { HistoryFilter, IHistoryEmployee } from '../../../../models/HistoryEmployee';
import type { ListItem } from '../../../../services/ListService';
import { dateOnly, numberValue, textValue } from '../../../../utils/listFields';

export type HistoryServices = Pick<IOnboardingTrackerProps, 'newEmployeesService' | 'jobsService'>;

export interface IHistoryEmployeesState {
  employees: IHistoryEmployee[];
  // 1-based number of the page on screen
  page: number;
  hasPrevious: boolean;
  hasNext: boolean;
  loading: boolean;
  error: string;
  goNext: () => void;
  goPrevious: () => void;
}

// NewEmployee.HasPassed choices
const PASSED = 'Процесс амжилттай дууссан';
const NOT_PASSED = ['Ажилд ороогүй', 'Шийдэгдэх болоогүй'];

// Only the columns the history cards show. Tasks are not needed here:
// the employee page loads one employee's tasks when a card is opened.
const SELECT = ['Id', 'FirstName', 'LastName', 'JobID', 'ProbationStartDate', 'ProbationEndDate', 'HasPassed'];

const quote = (text: string): string => `'${text.replace(/'/g, "''")}'`;
const displayDate = (value: unknown): string => dateOnly(value).replace(/-/g, '.');

// Builds the server-side $filter. Every column used is indexed (IsHistory, HasPassed, FirstName, LastName, JobID),
// so the query keeps working after NewEmployee grows past the 5,000-row list view threshold.
// Names are matched by their beginning (startswith, case-insensitive): "Ор" finds "Оргил", "ргил" does not.
// substringof ("contains") is avoided on purpose because it cannot use an index.
// The search clause goes first: it is the most selective condition for SharePoint to start from.
function buildFilter(filter: HistoryFilter, query: string, jobs: Map<number, string>): string {
  const parts: string[] = [];
  query.trim().split(/\s+/).filter(word => !!word).slice(0, 3).forEach(word => {
    const lower = word.toLowerCase();
    const jobIds: number[] = [];
    jobs.forEach((title, id) => { if (title.toLowerCase().indexOf(lower) !== -1) { jobIds.push(id); } });
    const terms = [`startswith(FirstName,${quote(word)})`, `startswith(LastName,${quote(word)})`]
      .concat(jobIds.map(id => `JobID eq ${id}`));
    parts.push(`(${terms.join(' or ')})`);
  });
  parts.push('IsHistory eq 1');
  if (filter === 'passed') {
    parts.push(`HasPassed eq ${quote(PASSED)}`);
  } else if (filter === 'failed') {
    parts.push(`(${NOT_PASSED.map(choice => `HasPassed eq ${quote(choice)}`).join(' or ')})`);
  }
  return parts.join(' and ');
}

function toHistoryEmployee(item: ListItem, jobs: Map<number, string>): IHistoryEmployee {
  const passed = textValue(item.HasPassed).toLowerCase().indexOf('амжилттай') !== -1;
  const probationEndDate = displayDate(item.ProbationEndDate);
  return {
    id: numberValue(item.Id),
    lastName: textValue(item.LastName),
    firstName: textValue(item.FirstName),
    position: jobs.get(numberValue(item.JobID)) || '',
    status: 'normal',
    progress: 0,
    hireDate: displayDate(item.ProbationStartDate),
    probationEndDate,
    steps: [],
    hasPassed: textValue(item.HasPassed),
    result: passed ? 'passed' : 'failed',
    confirmedDate: passed ? probationEndDate : undefined
  };
}

// Reads finished employees from SharePoint one page at a time (newest first).
// The search text is applied 300 ms after the user stops typing.
export function useHistoryEmployees(services: HistoryServices, query: string, filter: HistoryFilter, pageSize: number): IHistoryEmployeesState {
  const { newEmployeesService, jobsService } = services;
  const [jobs, setJobs] = React.useState<Map<number, string> | undefined>(undefined);
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  // urls of the pages visited so far; undefined = first page
  const [pageUrls, setPageUrls] = React.useState<Array<string | undefined>>([undefined]);
  const [nextUrl, setNextUrl] = React.useState<string | undefined>(undefined);
  const [employees, setEmployees] = React.useState<IHistoryEmployee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    jobsService.getItems()
      .then(items => setJobs(new Map(items.map(item => [numberValue(item.Id), textValue(item.Title)]))))
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [jobsService]);

  // A new search or result filter starts again from the first page.
  React.useEffect(() => { setPageUrls([undefined]); }, [debouncedQuery, filter]);

  const currentUrl = pageUrls[pageUrls.length - 1];

  React.useEffect(() => {
    if (!jobs) {
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    newEmployeesService.getPage(pageSize, buildFilter(filter, debouncedQuery, jobs), SELECT, 'Id desc', currentUrl)
      .then(result => {
        if (!cancelled) {
          setEmployees(result.items.map(item => toHistoryEmployee(item, jobs)));
          setNextUrl(result.nextUrl);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setEmployees([]);
          setNextUrl(undefined);
          setError(e.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [newEmployeesService, jobs, filter, debouncedQuery, currentUrl, pageSize]);

  const goNext = React.useCallback((): void => {
    if (nextUrl) {
      setPageUrls(urls => urls.concat([nextUrl]));
    }
  }, [nextUrl]);
  const goPrevious = React.useCallback((): void => {
    setPageUrls(urls => (urls.length > 1 ? urls.slice(0, -1) : urls));
  }, []);

  return {
    employees,
    page: pageUrls.length,
    hasPrevious: pageUrls.length > 1,
    hasNext: !!nextUrl,
    loading,
    error,
    goNext,
    goPrevious
  };
}
