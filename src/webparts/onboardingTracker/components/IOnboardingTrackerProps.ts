import type { ListService } from '../services/ListService';
import type { GraphService } from '../services/GraphService';

export interface IOnboardingTrackerProps {
  listName: string;
  // true only when hosted as a Teams personal app/tab, where this web part owns the whole tab
  // area (vs. sharing a SharePoint page with other web parts) and should fill the viewport.
  isTeamsHost: boolean;
  listService: ListService;
  taskGroupsService: ListService;
  taskOwnerRolesService: ListService;
  jobGroupsService: ListService;
  jobsService: ListService;
  departmentsService: ListService;
  tasksForJobsService: ListService;
  newEmployeesService: ListService;
  anketsService: ListService;
  taskGroupProcessService: ListService;
  taskResultsStatusFieldsService: ListService;
  roleOwnersService: ListService;
  // one row per user: Employee (Person) + LastLoginDate (Date and Time)
  loginsService: ListService;
  // for lists chosen at runtime, e.g. Tasks.TaskFieldTableName
  createListService: (listName: string) => ListService;
  graphService: GraphService;
  userDisplayName: string;
  // claims login name of the current user, accepted by SharePoint ensureUser
  userLoginName: string;
}
