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
import type { IEmployee } from '../models/Employee';

interface IState {
  page: string;
  selectedEmployee: IEmployee | undefined;
  // page to return to from the employee process page
  returnPage: 'home' | 'history';
}

// Pages without a nav item are still reachable by setting `page` (e.g. from a button on another page).
const NAV_ITEMS: INavItem[] = [
  { key: 'home', title: 'Home', iconName: 'Home' },
  { key: 'history', title: 'History', iconName: 'History' },
  { key: 'settings', title: 'Settings', iconName: 'Settings' },
  { key: 'jobSettings', title: 'Job settings', iconName: 'Work' },
  { key: 'test', title: 'Test', iconName: 'TestBeaker' }
];

export default class OnboardingTracker extends React.Component<IOnboardingTrackerProps, IState> {
  public state: IState = { page: 'home', selectedEmployee: undefined, returnPage: 'home' };

  private _showEmployee = (employee: IEmployee, returnPage: 'home' | 'history'): void => {
    this.setState({ page: 'newEmployeeProcess', selectedEmployee: employee, returnPage });
  };

  private _renderPage(): React.ReactElement {
    switch (this.state.page) {
      case 'newEmployeeProcess':
        return this.state.selectedEmployee
          ? <NewEmployeeProcessPage employee={this.state.selectedEmployee} onBack={() => this.setState({ page: this.state.returnPage })} />
          : <HomePage onSelectEmployee={e => this._showEmployee(e, 'home')} />;
      case 'history':
        return <HistoryPage onSelectEmployee={e => this._showEmployee(e, 'history')} />;
      case 'settings':
        return <SettingsPage />;
      case 'jobSettings':
        return <JobSettingsPage {...this.props} />;
      case 'test':
        return <TestPage {...this.props} />;
      default:
        return <HomePage onSelectEmployee={e => this._showEmployee(e, 'home')} />;
    }
  }

  public render(): React.ReactElement<IOnboardingTrackerProps> {
    return (
      <div className={styles.onboardingTracker}>
        <header className={styles.appHeader}>Onboarding process tracker</header>
        <div className={styles.workspace}>
          <NavBar
            items={NAV_ITEMS}
            selectedKey={this.state.page === 'newEmployeeProcess' ? this.state.returnPage : this.state.page}
            onSelect={page => this.setState({ page, selectedEmployee: undefined })}
          />
          <main className={styles.content}>{this._renderPage()}</main>
        </div>
      </div>
    );
  }
}
