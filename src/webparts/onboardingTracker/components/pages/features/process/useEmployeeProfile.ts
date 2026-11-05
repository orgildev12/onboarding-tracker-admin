import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import { booleanValue, dateOnly, findFieldName, findLookupField, numberValue, readLookupId, readValue, textValue } from '../../../../utils/listFields';
import { DEFAULT_NEW_EMPLOYEE_FIELDS } from '../newEmployees/NewEmployeeTypes';

export type EmployeeProfileServices = Pick<IOnboardingTrackerProps, 'newEmployeesService' | 'anketsService' | 'jobsService'>;

// The fields shown in NewEmployeesPage's own employee dialogs (NewEmployeeForm / the table row),
// read here for a single employee so the process page's "view info" dialog shows the same data.
export interface IEmployeeProfile {
  phone: string;
  personalEmail: string;
  workEmail: string;
  mbti: string;
  managerName: string;
  managerEmail: string;
  jobTitle: string;
  probationStartDate: string;
  probationEndDate: string;
  workStartDate: string;
  tasksCreated: boolean;
  anketCount: number;
}

export interface IEmployeeProfileState {
  profile: IEmployeeProfile | undefined;
  loading: boolean;
  error: string;
}

// Loaded on demand (when the view-info dialog opens), not alongside the process page's own data.
export function useEmployeeProfile(services: EmployeeProfileServices, employeeId: number | undefined): IEmployeeProfileState {
  const { newEmployeesService, anketsService, jobsService } = services;
  const [state, setState] = React.useState<IEmployeeProfileState>({ profile: undefined, loading: false, error: '' });

  React.useEffect(() => {
    if (employeeId === undefined) {
      return undefined;
    }
    let cancelled = false;
    setState({ profile: undefined, loading: true, error: '' });

    (async (): Promise<void> => {
      try {
        const [employeeFields, employeeItems, jobItems, jobFields, anketFields, siteUsers] = await Promise.all([
          newEmployeesService.getFields(),
          newEmployeesService.getItems(1, `Id eq ${employeeId}`),
          jobsService.getItems(),
          jobsService.getFields(),
          anketsService.getFields(),
          newEmployeesService.getSiteUsers()
        ]);
        const item = employeeItems[0];
        if (!item) {
          throw new Error('Ажилтан олдсонгүй.');
        }

        const d = DEFAULT_NEW_EMPLOYEE_FIELDS;
        const phoneField = findFieldName(employeeFields, ['Phone'], d.phone);
        const personalEmailField = findFieldName(employeeFields, ['PersonalEmailAddress'], d.personalEmail);
        const workEmailField = findFieldName(employeeFields, ['WorkEmailAddress'], d.workEmail);
        const mbtiField = findFieldName(employeeFields, ['MBTI'], d.mbti);
        const managerField = `${findFieldName(employeeFields, ['FirstLineManager'], 'FirstLineManager')}Id`;
        const probationStartField = findFieldName(employeeFields, ['ProbationStartDate'], d.probationStartDate);
        const probationEndField = findFieldName(employeeFields, ['ProbationEndDate'], d.probationEndDate);
        const workStartField = findFieldName(employeeFields, ['WorkStartDate'], d.workStartDate);
        const tasksCreatedField = findFieldName(employeeFields, ['TasksCreated'], d.tasksCreated);
        const jobIdField = findLookupField(employeeFields, ['JobID', 'Job'], d.jobId);
        const whichRegionField = findFieldName(employeeFields, ['WhichRegion'], d.whichRegion);
        const anketEmployeeField = findLookupField(anketFields, ['NewEmployeeID', 'NewEmployee'], d.anketEmployeeId);
        const jobRegionalField = findFieldName(jobFields, ['IsRegional'], 'IsRegional');

        const jobId = readLookupId(item, jobIdField, ['JobID', 'Job']);
        const job = jobItems.filter(j => numberValue(j.Id) === jobId)[0];
        const whichRegion = textValue(readValue(item, [whichRegionField])).trim();
        const jobTitle = job
          ? (booleanValue(readValue(job, [jobRegionalField])) && whichRegion ? `${textValue(job.Title)} (${whichRegion})` : textValue(job.Title))
          : '';

        const anketItems = await anketsService.getAllItems(`${anketEmployeeField} eq ${employeeId}`);
        const managerId = numberValue(readValue(item, [managerField]), 0);
        const manager = managerId > 0 ? siteUsers.filter(u => u.Id === managerId)[0] : undefined;

        const profile: IEmployeeProfile = {
          phone: textValue(readValue(item, [phoneField])),
          personalEmail: textValue(readValue(item, [personalEmailField])),
          workEmail: textValue(readValue(item, [workEmailField])),
          mbti: textValue(readValue(item, [mbtiField])),
          managerName: manager ? manager.Title : '',
          managerEmail: manager ? manager.Email : '',
          jobTitle,
          probationStartDate: dateOnly(readValue(item, [probationStartField])),
          probationEndDate: dateOnly(readValue(item, [probationEndField])),
          workStartDate: dateOnly(readValue(item, [workStartField])),
          tasksCreated: booleanValue(readValue(item, [tasksCreatedField])),
          anketCount: anketItems.length
        };
        if (!cancelled) {
          setState({ profile, loading: false, error: '' });
        }
      } catch (e) {
        if (!cancelled) {
          setState({ profile: undefined, loading: false, error: (e as Error).message });
        }
      }
    })().catch(() => undefined);

    return () => { cancelled = true; };
  }, [newEmployeesService, anketsService, jobsService, employeeId]);

  return state;
}
