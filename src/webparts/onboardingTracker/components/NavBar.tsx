import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './OnboardingTracker.module.scss';

export interface INavItem {
  key: string;
  title: string;
  iconName: string;
}

export interface INavBarProps {
  items: INavItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export default class NavBar extends React.Component<INavBarProps> {
  public render(): React.ReactElement<INavBarProps> {
    const { items, selectedKey, onSelect } = this.props;

    return (
      <nav className={styles.nav} aria-label="Main navigation">
        {items.map(item => (
          <button
            key={item.key}
            type="button"
            title={item.title}
            aria-label={item.title}
            aria-current={item.key === selectedKey ? 'page' : undefined}
            className={`${styles.navItem} ${item.key === selectedKey ? styles.navItemActive : ''}`}
            onClick={() => onSelect(item.key)}
          >
            <Icon iconName={item.iconName} />
          </button>
        ))}
      </nav>
    );
  }
}
