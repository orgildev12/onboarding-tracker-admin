import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import type { ListItem } from '../../../../services/ListService';
import { findFieldName, findLookupField, numberValue, readLookupId, readValue, textValue } from '../../../../utils/listFields';
import type { IAnketPage, INewEmployeeData, INewEmployeeDraft, INewEmployeeFields, INewEmployeeRecord } from './NewEmployeeTypes';
import { clampPercent, DEFAULT_NEW_EMPLOYEE_FIELDS, EMPTY_NEW_EMPLOYEE_DATA } from './NewEmployeeTypes';

type NewEmployeeServices = Pick<
  IOnboardingTrackerProps,
  'newEmployeesService' | 'anketsService' | 'jobsService'
>;

// Library that receives uploaded anket images
const IMAGE_LIBRARY = 'SiteAssets';

export interface INewEmployees {
  data: INewEmployeeData;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  save: (id: number | undefined, draft: INewEmployeeDraft, original: INewEmployeeRecord | undefined) => Promise<void>;
  remove: (employee: INewEmployeeRecord) => Promise<void>;
}

// The Image column holds a JSON string like {"serverRelativeUrl":"/sites/x/SiteAssets/a.png",...}
function imageUrl(value: unknown): string {
  const text = textValue(value);
  if (!text) {
    return '';
  }
  try {
    const parsed = JSON.parse(text) as { serverRelativeUrl?: string; serverUrl?: string };
    if (parsed.serverRelativeUrl) {
      return `${parsed.serverUrl || ''}${parsed.serverRelativeUrl}`;
    }
  } catch {
    // plain URL
  }
  return text;
}

const dateOnly = (value: unknown): string => textValue(value).substring(0, 10);

export function useNewEmployees(services: NewEmployeeServices): INewEmployees {
  const { newEmployeesService, anketsService, jobsService } = services;
  const [data, setData] = React.useState<INewEmployeeData>(EMPTY_NEW_EMPLOYEE_DATA);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const fieldsRef = React.useRef<INewEmployeeFields>(DEFAULT_NEW_EMPLOYEE_FIELDS);

  const fetchData = React.useCallback(async (): Promise<INewEmployeeData> => {
    const [employeeItems, employeeFields, anketItems, anketFields, jobItems, users] = await Promise.all([
      newEmployeesService.getItems(),
      newEmployeesService.getFields(),
      anketsService.getItems(),
      anketsService.getFields(),
      jobsService.getItems(),
      newEmployeesService.getSiteUsers()
    ]);

    const d = DEFAULT_NEW_EMPLOYEE_FIELDS;
    const fields: INewEmployeeFields = {
      firstName: findFieldName(employeeFields, ['FirstName'], d.firstName),
      lastName: findFieldName(employeeFields, ['LastName'], d.lastName),
      phone: findFieldName(employeeFields, ['Phone'], d.phone),
      personalEmail: findFieldName(employeeFields, ['PersonalEmailAddress'], d.personalEmail),
      mbti: findFieldName(employeeFields, ['MBTI'], d.mbti),
      extraversion: findFieldName(employeeFields, ['Extraversion'], d.extraversion),
      sensing: findFieldName(employeeFields, ['Sensing'], d.sensing),
      thinking: findFieldName(employeeFields, ['Thinking'], d.thinking),
      judging: findFieldName(employeeFields, ['Judging'], d.judging),
      workEmail: findFieldName(employeeFields, ['WorkEmailAddress'], d.workEmail),
      // Person columns are written through "<InternalName>Id"
      firstLineManager: `${findFieldName(employeeFields, ['FirstLineManager'], 'FirstLineManager')}Id`,
      probationStartDate: findFieldName(employeeFields, ['ProbationStartDate'], d.probationStartDate),
      probationEndDate: findFieldName(employeeFields, ['ProbationEndDate'], d.probationEndDate),
      jobId: findLookupField(employeeFields, ['JobID', 'Job'], d.jobId),
      anketEmployeeId: findLookupField(anketFields, ['NewEmployeeID', 'NewEmployee'], d.anketEmployeeId),
      anketImage: findFieldName(anketFields, ['Image'], d.anketImage),
      anketIndex: findFieldName(anketFields, ['Index'], d.anketIndex)
    };
    fieldsRef.current = fields;

    const anketsByEmployee = new Map<number, Array<IAnketPage & { index: number }>>();
    anketItems.forEach(item => {
      const employeeId = readLookupId(item, fields.anketEmployeeId, ['NewEmployeeID', 'NewEmployee']);
      if (!employeeId) {
        return;
      }
      const value = readValue(item, [fields.anketImage, 'Image']);
      const page = {
        id: numberValue(item.Id),
        imageValue: textValue(value),
        previewUrl: imageUrl(value),
        file: undefined,
        index: numberValue(readValue(item, [fields.anketIndex, 'Index']))
      };
      anketsByEmployee.set(employeeId, [...(anketsByEmployee.get(employeeId) || []), page]);
    });

    const employees: INewEmployeeRecord[] = employeeItems.map(item => {
      const id = numberValue(item.Id);
      const ankets = (anketsByEmployee.get(id) || [])
        .sort((a, b) => a.index - b.index || (a.id || 0) - (b.id || 0))
        .map(({ index, ...page }) => page);
      const manager = numberValue(readValue(item, [fields.firstLineManager]), 0);
      return {
        id,
        firstName: textValue(readValue(item, [fields.firstName])),
        lastName: textValue(readValue(item, [fields.lastName])),
        phone: textValue(readValue(item, [fields.phone])),
        personalEmail: textValue(readValue(item, [fields.personalEmail])),
        mbti: textValue(readValue(item, [fields.mbti])),
        extraversion: numberValue(readValue(item, [fields.extraversion]), 50),
        sensing: numberValue(readValue(item, [fields.sensing]), 50),
        thinking: numberValue(readValue(item, [fields.thinking]), 50),
        judging: numberValue(readValue(item, [fields.judging]), 50),
        workEmail: textValue(readValue(item, [fields.workEmail])),
        firstLineManagerId: manager > 0 ? manager : undefined,
        probationStartDate: dateOnly(readValue(item, [fields.probationStartDate])),
        probationEndDate: dateOnly(readValue(item, [fields.probationEndDate])),
        jobId: readLookupId(item, fields.jobId, ['JobID', 'Job']),
        ankets
      };
    });

    return {
      employees,
      jobs: jobItems.map(item => ({ id: numberValue(item.Id), title: textValue(item.Title) })),
      users: users
        .filter(u => !/^(SHAREPOINT\\|NT SERVICE\\|NT AUTHORITY\\)/i.test(u.LoginName) && u.Title !== 'System Account')
        .map(u => ({ id: u.Id, title: u.Title, email: u.Email || '', loginName: u.LoginName }))
        .sort((a, b) => a.title.localeCompare(b.title))
    };
  }, [newEmployeesService, anketsService, jobsService]);

  const reload = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchData());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  React.useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  // Runs a change, then always reloads. Errors are re-thrown so dialogs can show them.
  const mutate = async (action: () => Promise<void>): Promise<void> => {
    setError('');
    try {
      await action();
    } finally {
      await reload();
    }
  };

  const save = (id: number | undefined, draft: INewEmployeeDraft, original: INewEmployeeRecord | undefined): Promise<void> =>
    mutate(async () => {
      const f = fieldsRef.current;
      const fields: ListItem = {
        Title: `${draft.lastName} ${draft.firstName}`.trim(),
        [f.firstName]: draft.firstName,
        [f.lastName]: draft.lastName,
        [f.phone]: draft.phone,
        [f.personalEmail]: draft.personalEmail,
        [f.mbti]: draft.mbti,
        [f.extraversion]: clampPercent(draft.extraversion),
        [f.sensing]: clampPercent(draft.sensing),
        [f.thinking]: clampPercent(draft.thinking),
        [f.judging]: clampPercent(draft.judging),
        [f.workEmail]: draft.workEmail,
        [f.firstLineManager]: draft.firstLineManagerId ?? null,
        [f.probationStartDate]: draft.probationStartDate ? new Date(draft.probationStartDate).toISOString() : null,
        [f.probationEndDate]: draft.probationEndDate ? new Date(draft.probationEndDate).toISOString() : null,
        [f.jobId]: draft.jobId ?? null
      };

      let employeeId = id;
      if (employeeId === undefined) {
        employeeId = await newEmployeesService.createItemWithId(fields);
      } else {
        await newEmployeesService.updateItem(employeeId, fields);
      }

      const keptIds = draft.ankets.map(page => page.id).filter((v): v is number => v !== undefined);
      const removed = (original ? original.ankets : []).filter(page => page.id !== undefined && keptIds.indexOf(page.id) === -1);
      for (const page of removed) {
        await anketsService.deleteItem(page.id as number);
      }

      for (let index = 0; index < draft.ankets.length; index++) {
        const page = draft.ankets[index];
        const orderField = { [f.anketIndex]: index + 1 };
        if (page.id !== undefined) {
          await anketsService.updateItem(page.id, orderField);
          continue;
        }
        const image = page.file ? await anketsService.uploadImage(IMAGE_LIBRARY, page.file) : page.imageValue;
        await anketsService.createItem({
          Title: `${draft.lastName} ${draft.firstName} - ${index + 1}`.trim(),
          [f.anketEmployeeId]: employeeId,
          [f.anketImage]: image,
          ...orderField
        });
      }
    });

  const remove = (employee: INewEmployeeRecord): Promise<void> =>
    mutate(async () => {
      for (const page of employee.ankets) {
        if (page.id !== undefined) {
          await anketsService.deleteItem(page.id);
        }
      }
      await newEmployeesService.deleteItem(employee.id);
    });

  return { data, loading, error, reload, save, remove };
}
