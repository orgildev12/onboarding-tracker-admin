import * as React from 'react';
import styles from './OnboardingTracker.module.scss';
import type { IOnboardingTrackerProps } from './IOnboardingTrackerProps';
import NavBar from './NavBar';
import type { INavItem } from './NavBar';
import HomePage from './pages/HomePage';
import NewEmployeeProcessPage from './pages/NewEmployeeProcessPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import TestPage from './pages/TestPage';
import JobSettingsPage from './pages/JobSettingsPage';
import JobTaskProcessPage from './pages/JobTaskProcessPage';
import NewEmployeesPage from './pages/NewEmployeesPage';
import FormsSetupPage from './pages/FormsSetupPage';
import LoginsPage from './pages/LoginsPage';
import { recordLogin } from '../services/recordLogin';
import { getUserRole } from '../services/userRole';
import type { UserRole } from '../services/userRole';
import type { IEmployee } from '../models/Employee';
import PageIcon from './pages/features/common/PageIcon';
import UserPersona from './pages/features/newEmployees/UserPersona';
import { PersonaSize } from '@fluentui/react/lib/Persona';

interface IState {
  page: string;
  selectedEmployee: IEmployee | undefined;
  // page to return to from the employee process page
  returnPage: 'home' | 'history';
  // the whole app covers the browser window
  fullscreen: boolean;
  // undefined until the UserRoles list has been read; the restricted menus stay hidden meanwhile
  role: UserRole | undefined;
  // always shown in the header so the role check is visible even when no pop-up appears
  roleLabel: string;
}

// Pages only role 1 may open.
const ROLE_1_PAGES: string[] = ['jobSettings', 'formsSetup', 'logins', 'test'];

// Pages without a nav item are still reachable by setting `page` (e.g. from a button on another page).
const NAV_ITEMS: INavItem[] = [
  { key: 'home', title: 'Home', iconName: 'Home' },
  { key: 'history', title: 'History', iconName: 'History' },
  { key: 'newEmployees', title: 'New employees', iconName: 'AddFriend' },
  { key: 'settings', title: 'Settings', iconName: 'Settings' },
  { key: 'jobSettings', title: 'Job settings', iconName: 'Work' },
  { key: 'jobTaskProcess', title: 'Job tasks', iconName: 'Flow' },
  { key: 'formsSetup', title: 'Forms questions', iconName: 'BulletedList' },
  { key: 'logins', title: 'Logins', iconName: 'Contact' },
  { key: 'test', title: 'Test', iconName: 'TestBeaker' }
];

export default class OnboardingTracker extends React.Component<IOnboardingTrackerProps, IState> {
  public state: IState = { page: 'home', selectedEmployee: undefined, returnPage: 'home', fullscreen: false, role: undefined, roleLabel: 'Эрх шалгаж байна...' };

  public componentDidMount(): void {
    console.log('[OnboardingTracker] started, checking role for', this.props.userLoginName);
    recordLogin(this.props.loginsService, this.props.userLoginName).catch(() => undefined);
    const timeout = new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('15 секундэд хариу ирсэнгүй')), 15000));
    Promise.race([getUserRole(this.props.userRolesService, this.props.userLoginName), timeout])
      .then(({ role, listed, error, detail }) => {
        this.setState({ role, roleLabel: error ? 'Эрх: алдаа' : !listed ? 'Эрх: бүртгэлгүй (Role 2)' : `Эрх: Role ${role}` });
        if (error) {
          console.error('[OnboardingTracker] role check failed:', error);
        } else {
          console.log(`[OnboardingTracker] role = ${role}, listed in UserRoles = ${listed}`);
          console.log(`[OnboardingTracker] ${detail}`);
        }
      })
      .catch((e: Error) => {
        this.setState({ role: 2, roleLabel: 'Эрх: алдаа' });
        console.error('[OnboardingTracker] role check failed:', e.message);
      });
  }

  private _navigate = (page: 'history' | 'settings'): void => {
    this.setState({ page, selectedEmployee: undefined });
  };

  private _showEmployee = (employee: IEmployee, returnPage: 'home' | 'history'): void => {
    this.setState({ page: 'newEmployeeProcess', selectedEmployee: employee, returnPage });
  };

  private _renderPage(): React.ReactElement {
    const page = ROLE_1_PAGES.indexOf(this.state.page) !== -1 && this.state.role !== 1 ? 'home' : this.state.page;
    switch (page) {
      case 'newEmployeeProcess':
        return this.state.selectedEmployee
          ? <NewEmployeeProcessPage {...this.props} employee={this.state.selectedEmployee} onBack={() => this.setState({ page: this.state.returnPage })} />
          : <HomePage {...this.props} onSelectEmployee={e => this._showEmployee(e, 'home')} onNavigate={this._navigate} />;
      case 'history':
        return <HistoryPage {...this.props} onSelectEmployee={e => this._showEmployee(e, 'history')} />;
      case 'newEmployees':
        return <NewEmployeesPage {...this.props} />;
      case 'settings':
        return <SettingsPage {...this.props} />;
      case 'jobSettings':
        return <JobSettingsPage {...this.props} />;
      case 'jobTaskProcess':
        return <JobTaskProcessPage {...this.props} />;
      case 'formsSetup':
        return <FormsSetupPage {...this.props} />;
      case 'logins':
        return <LoginsPage {...this.props} />;
      case 'test':
        return <TestPage {...this.props} />;
      default:
        return <HomePage {...this.props} onSelectEmployee={e => this._showEmployee(e, 'home')} onNavigate={this._navigate} />;
    }
  }

  public render(): React.ReactElement<IOnboardingTrackerProps> {
    const { fullscreen } = this.state;
    const { isTeamsHost } = this.props;
    return (
      <div
        className={
          `${styles.onboardingTracker}` +
          `${isTeamsHost ? ` ${styles.fillTeamsViewport}` : ''}` +
          `${fullscreen ? ' tw-fixed tw-inset-0 tw-z-[10000] tw-bg-white' : ''}`
        }
      >
        <header className={styles.appHeader}>
          <span className="tw-flex-1">Onboarding process tracker</span>
          <div className="tw-mr-3">
            <UserPersona
              graph={this.props.graphService}
              name={this.props.userDisplayName}
              email={this.props.userEmail}
              secondaryText={this.state.roleLabel}
              size={PersonaSize.size40}
            />
          </div>
          <button
            type="button"
            title={fullscreen ? 'Жижигрүүлэх' : 'Бүтэн дэлгэц'}
            aria-label={fullscreen ? 'Жижигрүүлэх' : 'Бүтэн дэлгэц'}
            aria-pressed={fullscreen}
            onClick={() => this.setState({ fullscreen: !fullscreen })}
            className="tw-flex tw-h-8 tw-items-center tw-gap-2 tw-rounded tw-border-0 tw-bg-transparent tw-px-3 tw-text-sm tw-font-normal tw-text-gray-800 tw-cursor-pointer hover:tw-bg-gray-100"
          >
            <PageIcon name={fullscreen ? 'FullScreenExit' : 'FullScreen'} className="tw-text-lg tw-text-brand" />
            <span>{fullscreen ? 'Жижигрүүлэх' : 'Бүтэн дэлгэцээр харах'}</span>
          </button>
        </header>
        <div className={`${styles.workspace}${fullscreen ? ' tw-min-h-0 tw-overflow-hidden' : ''}`}>
          <NavBar
            items={NAV_ITEMS.filter(item => this.state.role === 1 || ROLE_1_PAGES.indexOf(item.key) === -1)}
            selectedKey={this.state.page === 'newEmployeeProcess' ? this.state.returnPage : this.state.page}
            onSelect={page => this.setState({ page, selectedEmployee: undefined })}
          />
          <main className={`${styles.content}${fullscreen ? ' tw-overflow-auto' : ''}`}>{this._renderPage()}</main>
        </div>
      </div>
    );
  }
}
