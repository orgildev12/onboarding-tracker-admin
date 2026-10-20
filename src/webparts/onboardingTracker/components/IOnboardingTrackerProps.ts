import type { ListService } from '../services/ListService';
import type { GraphService } from '../services/GraphService';

export interface IOnboardingTrackerProps {
  listName: string;
  listService: ListService;
  taskGroupsService: ListService;
  taskOwnerRolesService: ListService;
  jobGroupsService: ListService;
  jobsService: ListService;
  tasksForJobsService: ListService;
  newEmployeesService: ListService;
  anketsService: ListService;
  graphService: GraphService;
  isDarkTheme: boolean;
  userDisplayName: string;
}
