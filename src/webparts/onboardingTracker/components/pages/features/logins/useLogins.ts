import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import type { ListItem } from '../../../../services/ListService';
import { numberValue, textValue } from '../../../../utils/listFields';

export interface ILoginRecord {
  userId: number;
  name: string;
  email: string;
  lastLogin: Date;
}

export interface ILoginsState {
  logins: ILoginRecord[];
  loading: boolean;
  error: string;
}

function toLoginRecord(item: ListItem): ILoginRecord | undefined {
  const person = item.Employee as { Id?: number; Title?: string; EMail?: string } | null | undefined;
  const lastLogin = new Date(textValue(item.LastLoginDate));
  if (!person || !person.Title || isNaN(lastLogin.getTime())) {
    return undefined;
  }
  return { userId: numberValue(person.Id), name: person.Title, email: person.EMail || '', lastLogin };
}

// Every user who opened the app, most recent first. One row per user is expected;
// if a duplicate ever exists, only the newest date of that user is shown.
export function useLogins(loginsService: IOnboardingTrackerProps['loginsService']): ILoginsState {
  const [logins, setLogins] = React.useState<ILoginRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    loginsService.getAllItems(undefined, ['Employee'])
      .then(items => {
        if (cancelled) {
          return;
        }
        const latest = new Map<number, ILoginRecord>();
        items.forEach(item => {
          const record = toLoginRecord(item);
          const known = record && latest.get(record.userId);
          if (record && (!known || record.lastLogin > known.lastLogin)) {
            latest.set(record.userId, record);
          }
        });
        const sorted: ILoginRecord[] = [];
        latest.forEach(record => sorted.push(record));
        sorted.sort((a, b) => b.lastLogin.getTime() - a.lastLogin.getTime());
        setLogins(sorted);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [loginsService]);

  return { logins, loading, error };
}
