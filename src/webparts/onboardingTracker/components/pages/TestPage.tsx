import * as React from 'react';
import styles from '../OnboardingTracker.module.scss';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import type { IListField, ListItem } from '../../services/ListService';
import TaskEditor from './features/test/TaskEditor';
import TaskGroupEditor from './features/test/TaskGroupEditor';
import TaskGroupSection from './features/test/TaskGroupSection';
import type {
  ITask,
  ITaskAdminLookups,
  ITaskDraft,
  ITaskGroup,
  ITaskGroupDraft,
  ITaskOwnerRole
} from './features/test/TaskAdminTypes';
import { MAX_TASKS_PER_GROUP, TASK_RESULT_TABLE_BY_TYPE } from './features/test/TaskAdminTypes';
import {
  findFieldName,
  findLookupField,
  numberValue,
  readLookupId,
  readValue,
  textValue
} from '../../utils/listFields';

interface ITaskAdminData {
  taskFields: IListField[];
  groupFields: IListField[];
  tasks: ITask[];
  groups: ITaskGroup[];
  ownerRoles: ITaskOwnerRole[];
  lookups: ITaskAdminLookups;
  taskOrderField: string;
  groupOrderField: string;
}

interface IState extends ITaskAdminData {
  loading: boolean;
  error: string;
  taskEditorOpen: boolean;
  editingTask: ITask | undefined;
  taskEditorGroupId: number;
  groupEditorOpen: boolean;
  editingGroup: ITaskGroup | undefined;
}

const EMPTY_DATA: ITaskAdminData = {
  taskFields: [],
  groupFields: [],
  tasks: [],
  groups: [],
  ownerRoles: [],
  lookups: { triggerTaskField: 'TriggerTaskID', ownerRoleField: 'TaskOwnerRoleID', taskGroupField: 'TaskGroupID' },
  taskOrderField: 'TaskOrderInTheGroup',
  groupOrderField: 'Order'
};

function mapTask(item: ListItem, lookups: ITaskAdminLookups, taskOrderField: string): ITask {
  const id = numberValue(item.Id);
  return {
    id,
    title: textValue(item.Title),
    triggerType: textValue(item.TriggerType),
    dayShouldBegin: textValue(item.DayShouldBegin),
    dayShouldEnd: textValue(item.DayShouldEnd),
    triggerTaskId: readLookupId(item, lookups.triggerTaskField, ['TriggerTaskID', 'TriggerTaskId', 'TriggerTask']),
    dayShouldTake: textValue(item.DayShouldTake),
    handlerType: textValue(item.HandlerType),
    taskOwnerRoleId: readLookupId(item, lookups.ownerRoleField, ['TaskOwnerRoleID', 'TaskOwnerRoleId', 'TaskOwnerRole']),
    taskType: textValue(item.TaskType),
    taskFieldTableName: textValue(item.TaskFieldTableName),
    taskDefaultBodyText: textValue(item.TaskDefaultBodyText),
    taskGroupId: readLookupId(item, lookups.taskGroupField, ['TaskGroupID', 'TaskGroupId', 'TaskGroup']) || 0,
    taskOrder: numberValue(readValue(item, [taskOrderField, 'TaskOrderInTheGroup'])),
    item
  };
}

function mapGroup(item: ListItem, orderField: string): ITaskGroup {
  return {
    id: numberValue(item.Id),
    title: textValue(item.Title),
    order: numberValue(readValue(item, [orderField, 'Order'])),
    item
  };
}

function mapOwnerRole(item: ListItem): ITaskOwnerRole {
  return { id: numberValue(item.Id), title: textValue(item.Title) };
}

function compareOrder<T extends { order?: number; taskOrder?: number; id: number }>(a: T, b: T): number {
  const orderDifference = numberValue(a.order ?? a.taskOrder) - numberValue(b.order ?? b.taskOrder);
  return orderDifference || a.id - b.id;
}

export default class TestPage extends React.Component<IOnboardingTrackerProps, IState> {
  public state: IState = {
    ...EMPTY_DATA,
    loading: true,
    error: '',
    taskEditorOpen: false,
    editingTask: undefined,
    taskEditorGroupId: 0,
    groupEditorOpen: false,
    editingGroup: undefined
  };

  private _pendingMutations = 0;

  public componentDidMount(): void {
    void this._load();
  }

  public componentDidUpdate(prev: IOnboardingTrackerProps): void {
    if (
      prev.listService !== this.props.listService ||
      prev.taskGroupsService !== this.props.taskGroupsService ||
      prev.taskOwnerRolesService !== this.props.taskOwnerRolesService
    ) {
      void this._load();
    }
  }

  private async _loadData(): Promise<ITaskAdminData> {
    const [taskFields, groupFields, taskItems, groupItems, ownerRoleItems] = await Promise.all([
      this.props.listService.getFields(),
      this.props.taskGroupsService.getFields(),
      this.props.listService.getItems(),
      this.props.taskGroupsService.getItems(),
      this.props.taskOwnerRolesService.getItems()
    ]);
    const lookups: ITaskAdminLookups = {
      triggerTaskField: findLookupField(taskFields, ['TriggerTaskID', 'TriggerTaskId', 'TriggerTask'], 'TriggerTaskID'),
      ownerRoleField: findLookupField(taskFields, ['TaskOwnerRoleID', 'TaskOwnerRoleId', 'TaskOwnerRole'], 'TaskOwnerRoleID'),
      taskGroupField: findLookupField(taskFields, ['TaskGroupID', 'TaskGroupId', 'TaskGroup'], 'TaskGroupID')
    };
    const taskOrderField = findFieldName(taskFields, ['TaskOrderInTheGroup'], 'TaskOrderInTheGroup');
    const groupOrderField = findFieldName(groupFields, ['Order'], 'Order');
    return {
      taskFields,
      groupFields,
      lookups,
      taskOrderField,
      groupOrderField,
      tasks: taskItems.map(item => mapTask(item, lookups, taskOrderField)).sort(compareOrder),
      groups: groupItems.map(item => mapGroup(item, groupOrderField)).sort(compareOrder),
      ownerRoles: ownerRoleItems.map(mapOwnerRole).sort((a, b) => a.title.localeCompare(b.title))
    };
  }

  private async _load(): Promise<void> {
    this.setState({ loading: true, error: '' });
    try {
      this.setState(await this._loadData());
    } catch (e) {
      this.setState({ error: (e as Error).message });
    } finally {
      this.setState({ loading: false });
    }
  }

  // With `optimistic`, the page updates at once and syncs with the list in the background.
  private async _mutate(action: () => Promise<void>, optimistic?: Partial<ITaskAdminData>): Promise<void> {
    this._pendingMutations++;
    if (optimistic) {
      this.setState({ ...optimistic, error: '' } as Pick<IState, keyof IState>);
    } else {
      this.setState({ loading: true, error: '' });
    }
    let failure: Error | undefined;
    try {
      await action();
    } catch (e) {
      failure = e as Error;
    }

    let fresh: ITaskAdminData | undefined;
    try {
      fresh = await this._loadData();
    } catch (e) {
      const reloadError = e as Error;
      failure = failure
        ? new Error(`${failure.message}\nRefresh also failed: ${reloadError.message}`)
        : reloadError;
    }
    this._pendingMutations--;
    // only the last running change applies the reloaded data, so older reloads can't undo newer edits
    if (fresh && this._pendingMutations === 0) {
      this.setState(fresh);
    }
    this.setState({ loading: false, error: failure ? failure.message : '' });
    if (failure) {
      throw failure;
    }
  }

  private _groupTasks(groupId: number): ITask[] {
    return this.state.tasks.filter(task => task.taskGroupId === groupId).sort(compareOrder);
  }

  private _openNewTask = (group: ITaskGroup): void => {
    this.setState({ taskEditorOpen: true, editingTask: undefined, taskEditorGroupId: group.id, error: '' });
  };

  private _openTaskEditor = (task: ITask): void => {
    this.setState({ taskEditorOpen: true, editingTask: task, taskEditorGroupId: task.taskGroupId, error: '' });
  };

  private _saveTask = async (draft: ITaskDraft): Promise<void> => {
    const groupTasks = this._groupTasks(draft.taskGroupId);
    const existing = this.state.editingTask;
    const moving = !!existing && existing.taskGroupId !== draft.taskGroupId;
    if ((!existing || moving) && groupTasks.length >= MAX_TASKS_PER_GROUP) {
      throw new Error(`A task group cannot contain more than ${MAX_TASKS_PER_GROUP} tasks.`);
    }
    if (!draft.title.trim()) {
      throw new Error('Task title is required.');
    }

    const taskPayload: ListItem = {
      Title: draft.title.trim(),
      TriggerType: draft.triggerType,
      HandlerType: draft.handlerType,
      TaskType: draft.handlerType === 'ByTaskOwner' ? draft.taskType : null,
      TaskFieldTableName: draft.handlerType === 'ByTaskOwner'
        ? TASK_RESULT_TABLE_BY_TYPE[draft.taskType]
        : draft.handlerType === 'ByOtherSystem' ? draft.taskFieldTableName.trim() || null : null,
      TaskDefaultBodyText: draft.taskDefaultBodyText.trim() || null,
      [this.state.lookups.taskGroupField]: draft.taskGroupId
    };
    const numberField = (value: string, label: string): number => {
      const parsed = Number(value);
      if (!value.trim() || !Number.isFinite(parsed)) {
        throw new Error(`${label} must be a number.`);
      }
      return parsed;
    };

    if (draft.triggerType === 'ByDate') {
      taskPayload.DayShouldBegin = numberField(draft.dayShouldBegin, 'Day should begin');
      taskPayload.DayShouldEnd = numberField(draft.dayShouldEnd, 'Day should end');
      taskPayload[this.state.lookups.triggerTaskField] = null;
      taskPayload.DayShouldTake = null;
    } else {
      const triggerTaskId = numberField(draft.triggerTaskId, 'Trigger task');
      if (triggerTaskId === existing?.id) {
        throw new Error('A task cannot be triggered by itself.');
      }
      taskPayload.DayShouldBegin = null;
      taskPayload.DayShouldEnd = null;
      taskPayload[this.state.lookups.triggerTaskField] = triggerTaskId;
      taskPayload.DayShouldTake = numberField(draft.dayShouldTake, 'Day should take');
    }

    if (draft.handlerType === 'ByTaskOwner') {
      taskPayload[this.state.lookups.ownerRoleField] = numberField(draft.taskOwnerRoleId, 'Task owner role');
    } else {
      taskPayload[this.state.lookups.ownerRoleField] = null;
    }

    const newTaskOrder = moving
      ? Math.max(0, ...groupTasks.map(task => task.taskOrder)) + 1
      : existing ? existing.taskOrder : Math.max(0, ...groupTasks.map(task => task.taskOrder)) + 1;
    taskPayload[this.state.taskOrderField] = newTaskOrder;

    await this._mutate(async () => {
      if (existing) {
        await this.props.listService.updateItem(existing.id, taskPayload);
      } else {
        await this.props.listService.createItem(taskPayload);
      }

      if (moving) {
        const remainingSourceTasks = this._groupTasks(existing.taskGroupId).filter(task => task.id !== existing.id);
        await Promise.all(remainingSourceTasks.map((task, index) =>
          this.props.listService.updateItem(task.id, { [this.state.taskOrderField]: index + 1 })
        ));
      }
    });
    this.setState({ taskEditorOpen: false, editingTask: undefined });
  };

  private _deleteTask = (task: ITask): void => {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) {
      return;
    }
    void this._mutate(async () => {
      await this.props.listService.deleteItem(task.id);
      const remaining = this._groupTasks(task.taskGroupId).filter(item => item.id !== task.id);
      await Promise.all(remaining.map((item, index) =>
        this.props.listService.updateItem(item.id, { [this.state.taskOrderField]: index + 1 })
      ));
    }).catch(() => undefined);
  };

  private _reorderTasks = (group: ITaskGroup, sourceId: number, targetId: number): void => {
    const tasks = this._groupTasks(group.id);
    const sourceIndex = tasks.findIndex(task => task.id === sourceId);
    const targetIndex = tasks.findIndex(task => task.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }
    const [moved] = tasks.splice(sourceIndex, 1);
    tasks.splice(targetIndex, 0, moved);
    const newOrder = new Map(tasks.map((task, index) => [task.id, index + 1]));
    const reordered = this.state.tasks
      .map(task => newOrder.has(task.id) ? { ...task, taskOrder: newOrder.get(task.id) as number } : task)
      .sort(compareOrder);
    void this._mutate(async () => {
      await Promise.all(tasks.map((task, index) =>
        this.props.listService.updateItem(task.id, { [this.state.taskOrderField]: index + 1 })
      ));
    }, { tasks: reordered }).catch(() => undefined);
  };

  // TEMPORARY: wipes every row of TaskResultsStatusFields. Remove together with its button.
  // private _clearStatusResults = (): void => {
  //   if (!window.confirm('Delete ALL rows of TaskResultsStatusFields (every employee)? This cannot be undone.')) {
  //     return;
  //   }
  //   const service = this.props.taskResultsStatusFieldsService;
  //   void this._mutate(async () => {
  //     const rows = await service.getAllItems();
  //     for (let i = 0; i < rows.length; i += 10) {
  //       await Promise.all(rows.slice(i, i + 10).map(row => service.deleteItem(numberValue(row.Id))));
  //     }
  //   }).catch(() => undefined);
  // };

  private _openNewGroup = (): void => {
    this.setState({ groupEditorOpen: true, editingGroup: undefined, error: '' });
  };

  private _openGroupEditor = (group: ITaskGroup): void => {
    this.setState({ groupEditorOpen: true, editingGroup: group, error: '' });
  };

  private _saveGroup = async (draft: ITaskGroupDraft): Promise<void> => {
    if (!draft.title.trim()) {
      throw new Error('Task group title is required.');
    }
    const group = this.state.editingGroup;
    const fields: ListItem = { Title: draft.title.trim() };
    if (!group) {
      fields[this.state.groupOrderField] = Math.max(0, ...this.state.groups.map(item => item.order)) + 1;
    }
    await this._mutate(() => group
      ? this.props.taskGroupsService.updateItem(group.id, fields)
      : this.props.taskGroupsService.createItem(fields));
    this.setState({ groupEditorOpen: false, editingGroup: undefined });
  };

  private _moveGroup = (group: ITaskGroup, direction: -1 | 1): void => {
    const groups = [...this.state.groups];
    const index = groups.findIndex(item => item.id === group.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= groups.length) {
      return;
    }
    [groups[index], groups[target]] = [groups[target], groups[index]];
    void this._mutate(async () => {
      await Promise.all(groups.map((item, position) =>
        item.order === position + 1
          ? Promise.resolve()
          : this.props.taskGroupsService.updateItem(item.id, { [this.state.groupOrderField]: position + 1 })
      ));
    }).catch(() => undefined);
  };

  private _deleteGroup = (group: ITaskGroup): void => {
    if (this._groupTasks(group.id).length > 0) {
      this.setState({ error: 'Move or delete this group’s tasks before deleting the group.' });
      return;
    }
    if (!window.confirm(`Delete task group "${group.title}"? This cannot be undone.`)) {
      return;
    }
    void this._mutate(() => this.props.taskGroupsService.deleteItem(group.id)).catch(() => undefined);
  };

  private _taskTitlesById(): Record<number, string> {
    return this.state.tasks.reduce<Record<number, string>>((result, task) => {
      result[task.id] = task.title;
      return result;
    }, {});
  }

  private _ownerRoleTitlesById(): Record<number, string> {
    return this.state.ownerRoles.reduce<Record<number, string>>((result, role) => {
      result[role.id] = role.title;
      return result;
    }, {});
  }

  public render(): React.ReactElement<IOnboardingTrackerProps> {
    const { groups, tasks, ownerRoles, loading, error, taskEditorOpen, editingTask, taskEditorGroupId,
      groupEditorOpen, editingGroup } = this.state;
    const taskTitlesById = this._taskTitlesById();
    const ownerRoleTitlesById = this._ownerRoleTitlesById();
    const taskEditorGroup = groups.find(group => group.id === taskEditorGroupId);

    return (
      <section className={styles.page}>
        <div className={styles.header}>
          <h2>Tasks</h2>
          <div>
            <button type="button" disabled={loading} onClick={this._openNewGroup}>New task group</button>
            <button type="button" disabled={loading} onClick={() => { void this._load(); }}>Refresh</button>
            {/* <button type="button" disabled={loading} onClick={this._clearStatusResults}>Delete all TaskResultsStatusFields (temporary)</button>? */}
          </div>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {loading && <p>Loading...</p>}
        {!loading && groups.length === 0 && <p>No task groups found. Create a group to begin.</p>}
        {groups.map((group, index) => (
          <TaskGroupSection
            key={group.id}
            isFirst={index === 0}
            isLast={index === groups.length - 1}
            onMoveGroup={this._moveGroup}
            group={group}
            tasks={tasks.filter(task => task.taskGroupId === group.id).sort(compareOrder)}
            taskTitlesById={taskTitlesById}
            ownerRoleTitlesById={ownerRoleTitlesById}
            disabled={loading}
            onCreateTask={this._openNewTask}
            onEditTask={this._openTaskEditor}
            onDeleteTask={this._deleteTask}
            onEditGroup={this._openGroupEditor}
            onDeleteGroup={this._deleteGroup}
            onReorder={this._reorderTasks}
          />
        ))}
        {groups.length > 0 && (
          <div className={styles.groupFooter}>
            <button type="button" disabled={loading} onClick={this._openNewGroup}>+ New task group</button>
          </div>
        )}

        {taskEditorOpen && taskEditorGroup && (
          <TaskEditor
            task={editingTask}
            initialGroupId={taskEditorGroupId}
            groups={groups}
            tasks={tasks}
            ownerRoles={ownerRoles}
            onSave={this._saveTask}
            onCancel={() => this.setState({ taskEditorOpen: false, editingTask: undefined })}
          />
        )}
        {groupEditorOpen && (
          <TaskGroupEditor
            group={editingGroup}
            onSave={this._saveGroup}
            onCancel={() => this.setState({ groupEditorOpen: false, editingGroup: undefined })}
          />
        )}
      </section>
    );
  }
}
