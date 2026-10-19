import type { IProcessTask } from '../models/OnboardingProcess';

export const DUMMY_PROCESS_TASKS: IProcessTask[] = [
  {
    id: 'guarantee',
    title: 'Батлан даалтын гэрээ',
    assignee: 'Д.Должин',
    role: 'Ня мэргэжил Хөдөлмөрийн харилцаа',
    status: 'completedLate',
    completed: true,
    result: 'Гэрээ харах'
  },
  {
    id: 'employment',
    title: 'Хөдөлмөрийн гэрээ',
    assignee: 'Д.Должин',
    role: 'Ня мэргэжил Хөдөлмөрийн харилцаа',
    status: 'delayed',
    completed: false,
    result: 'Гэрээнүүд харах'
  },
  {
    id: 'confidentiality',
    title: 'Нууцын гэрээ',
    assignee: 'Д.Должин',
    role: 'Ня мэргэжил Хөдөлмөрийн харилцаа',
    status: 'notStarted',
    completed: false,
    result: 'Гэрээ харах'
  },
  {
    id: 'job-description',
    title: 'Ажлын байрны тодорхойлолт',
    assignee: 'Д.Должин',
    role: 'Ня мэргэжил Хөдөлмөрийн харилцаа',
    status: 'notStarted',
    completed: false
  },
  {
    id: 'appointment',
    title: 'Ажилтан авах тушаал, ажилтан идэвхтэй болгох',
    assignee: 'Д.Должин',
    role: 'Ня мэргэжил Хөдөлмөрийн харилцаа',
    status: 'notStarted',
    completed: false
  },
  {
    id: 'internal-rules',
    title: 'Дотоод журам өгөх',
    assignee: 'Систем',
    role: 'Автоматаар хийгдэх',
    status: 'notStarted',
    completed: false,
    result: 'Анкет харах'
  },
  {
    id: 'orientation',
    title: 'Шинэ ажилтанд дотоод журам болон холбогдох журмуудыг танилцуулах',
    assignee: 'Б.Оргил',
    role: 'Ажилтан өөрөө',
    status: 'notStarted',
    completed: false
  }
];
