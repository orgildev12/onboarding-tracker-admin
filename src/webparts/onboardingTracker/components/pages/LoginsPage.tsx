import * as React from 'react';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import SearchBox from './features/common/SearchBox';
import LoginRow from './features/logins/LoginRow';
import { useLogins } from './features/logins/useLogins';

// Who opened the app and when, most recent first.
export default function LoginsPage({ loginsService, graphService }: IOnboardingTrackerProps): React.ReactElement {
  const { logins, loading, error } = useLogins(loginsService);
  const [query, setQuery] = React.useState('');
  const term = query.trim().toLowerCase();
  const visible = term ? logins.filter(login => login.name.toLowerCase().indexOf(term) !== -1) : logins;

  return (
    <div className="tw-p-5 md:tw-p-8 tw-min-h-full tw-bg-surface">
    <div className="tw-flex tw-flex-col tw-gap-8 tw-w-full tw-max-w-3xl tw-mx-auto">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h2 className="tw-m-0 tw-text-lg tw-font-semibold">
          Нэвтэрсэн хэрэглэгчид{!loading && !error && <span className="tw-font-normal tw-text-gray-500"> ({logins.length})</span>}
        </h2>
        <SearchBox value={query} placeholder="Хэрэглэгч хайх" onChange={setQuery} />
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
      {!loading && !error && visible.length === 0 && <p className="tw-text-sm tw-text-gray-500">Хэрэглэгч олдсонгүй.</p>}
      {!loading && !error && visible.length > 0 && (
        <ul className="tw-m-0 tw-p-0 tw-list-none tw-divide-y tw-divide-solid tw-divide-gray-200">
          {visible.map(login => <LoginRow key={login.userId} login={login} graph={graphService} />)}
        </ul>
      )}
    </div>
    </div>
  );
}
