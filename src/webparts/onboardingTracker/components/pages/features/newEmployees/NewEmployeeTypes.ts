export interface INewEmployeeJob {
  id: number;
  title: string;
}

export interface IUserOption {
  id: number;
  title: string;
  email: string;
  loginName: string;
}

export interface IAnketPage {
  // list item id; undefined for pages added in the form but not saved yet
  id: number | undefined;
  // value stored in the Image column (JSON string); undefined while a new file waits for upload
  imageValue: string | undefined;
  previewUrl: string;
  file: File | undefined;
}

export interface INewEmployeeDraft {
  firstName: string;
  lastName: string;
  phone: string;
  personalEmail: string;
  mbti: string;
  extraversion: number;
  sensing: number;
  thinking: number;
  judging: number;
  workEmail: string;
  firstLineManagerId: number | undefined;
  probationStartDate: string;
  probationEndDate: string;
  jobId: number | undefined;
  // in page order
  ankets: IAnketPage[];
}

export interface INewEmployeeRecord extends INewEmployeeDraft {
  id: number;
}

export interface INewEmployeeData {
  employees: INewEmployeeRecord[];
  jobs: INewEmployeeJob[];
  users: IUserOption[];
}

export interface INewEmployeeFields {
  firstName: string;
  lastName: string;
  phone: string;
  personalEmail: string;
  mbti: string;
  extraversion: string;
  sensing: string;
  thinking: string;
  judging: string;
  workEmail: string;
  firstLineManager: string;
  probationStartDate: string;
  probationEndDate: string;
  jobId: string;
  anketEmployeeId: string;
  anketImage: string;
  anketIndex: string;
}

export const DEFAULT_NEW_EMPLOYEE_FIELDS: INewEmployeeFields = {
  firstName: 'FirstName',
  lastName: 'LastName',
  phone: 'Phone',
  personalEmail: 'PersonalEmailAddress',
  mbti: 'MBTI',
  extraversion: 'Extraversion',
  sensing: 'Sensing',
  thinking: 'Thinking',
  judging: 'Judging',
  workEmail: 'WorkEmailAddress',
  firstLineManager: 'FirstLineManagerId',
  probationStartDate: 'ProbationStartDate',
  probationEndDate: 'ProbationEndDate',
  jobId: 'JobIDId',
  anketEmployeeId: 'NewEmployeeIDId',
  anketImage: 'Image',
  anketIndex: 'Index'
};

export const EMPTY_NEW_EMPLOYEE_DATA: INewEmployeeData = { employees: [], jobs: [], users: [] };

export const EMPTY_DRAFT: INewEmployeeDraft = {
  firstName: '',
  lastName: '',
  phone: '',
  personalEmail: '',
  mbti: '',
  extraversion: 50,
  sensing: 50,
  thinking: 50,
  judging: 50,
  workEmail: '',
  firstLineManagerId: undefined,
  probationStartDate: '',
  probationEndDate: '',
  jobId: undefined,
  ankets: []
};

export const clampPercent = (value: number): number => Math.min(100, Math.max(1, Math.round(value) || 1));
