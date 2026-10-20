import type { ListService } from '../services/ListService';

export interface IOnboardingTrackerProps {
  listName: string;
  listService: ListService;
  taskGroupsService: ListService;
  taskOwnerRolesService: ListService;
  jobGroupsService: ListService;
  jobsService: ListService;
  tasksForJobsService: ListService;
  isDarkTheme: boolean;
  userDisplayName: string;
}
