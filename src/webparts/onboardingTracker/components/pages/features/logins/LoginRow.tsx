import * as React from 'react';
import { PersonaSize } from '@fluentui/react/lib/Persona';
import type { GraphService } from '../../../../services/GraphService';
import { formatRelativeTime } from '../../../../utils/relativeTime';
import UserPersona from '../newEmployees/UserPersona';
import type { ILoginRecord } from './useLogins';

export default function LoginRow({ login, graph }: { login: ILoginRecord; graph: GraphService }): React.ReactElement {
  const [jobTitle, setJobTitle] = React.useState('');

  React.useEffect(() => {
    let active = true;
    graph.getJobTitle(login.email).then(title => { if (active) { setJobTitle(title); } }).catch(() => undefined);
    return () => { active = false; };
  }, [graph, login.email]);

  return (
    <li className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-py-3">
      <UserPersona graph={graph} name={login.name} email={login.email} secondaryText={jobTitle} size={PersonaSize.size48} />
      <time
        dateTime={login.lastLogin.toISOString()}
        title={login.lastLogin.toLocaleString()}
        className="tw-shrink-0 tw-text-sm"
      >
        {formatRelativeTime(login.lastLogin)}
      </time>
    </li>
  );
}
