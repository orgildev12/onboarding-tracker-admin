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
  taskGroupProcessService: ListService;
  taskResultsStatusFieldsService: ListService;
  roleOwnersService: ListService;
  // for lists chosen at runtime, e.g. Tasks.TaskFieldTableName
  createListService: (listName: string) => ListService;
  graphService: GraphService;
  isDarkTheme: boolean;
  userDisplayName: string;
}
