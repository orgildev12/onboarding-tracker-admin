import type { ListService } from '../services/ListService';

export interface IOnboardingTrackerProps {
  listName: string;
  listService: ListService;
  isDarkTheme: boolean;
  userDisplayName: string;
}
