import React, { FC, useState, useCallback, useEffect, useMemo } from 'react';
import { ENROUTE, CHECKIN, CHECKOUT } from '@kalos-core/kalos-rpc/TaskEvent';
import { SvgIconProps } from '@material-ui/core/SvgIcon';
import HighestIcon from '@material-ui/icons/Block';
import HighIcon from '@material-ui/icons/ChangeHistory';
import NormalIcon from '@material-ui/icons/RadioButtonUnchecked';
import LowIcon from '@material-ui/icons/Details';
import { ProjectTask } from '@kalos-core/kalos-rpc/Task';
import { SectionBar } from '../SectionBar';
import { Modal } from '../Modal';
import { Form, Schema } from '../Form';
import { PlainForm } from '../PlainForm';
import { Button } from '../Button';
import { ConfirmDelete } from '../ConfirmDelete';
import { Confirm } from '../Confirm';
import { CalendarEvents } from '../CalendarEvents';
import { GanttChart } from '../GanttChart';
import { Tabs } from '../Tabs';
import {
  EventType,
  ProjectTaskType,
  formatDate,
  TaskStatusType,
  TaskPriorityType,
  TaskClientService,
  TimesheetDepartmentType,
  TaskEventType,
  timestamp,
  UserType,
  EventClientService,
  UserClientService,
  TaskEventClientService,
  loadProjects,
  TimesheetDepartmentClientService,
  ActivityLogClientService,
} from '../../../helpers';
import { PROJECT_TASK_STATUS_COLORS, OPTION_ALL } from '../../../constants';
import './styles.less';
import { format } from 'date-fns';
import { CostReport } from '../CostReport';
import { Loader } from '../../Loader/main';
import { CheckInProjectTask } from '../CheckInProjectTask';
import { getPropertyAddress } from '@kalos-core/kalos-rpc/Property';
import { ActivityLog } from '@kalos-core/kalos-rpc/ActivityLog';

export interface Props {
  serviceCallId: number;
  loggedUserId: number;
  onClose?: () => void;
}

export type SearchType = {
  technicians: string;
  statusId: number;
  priorityId: number;
};

export type ExtendedProjectTaskType = ProjectTaskType & {
  startTime: string;
  endTime: string;
};

export const PROJECT_TASK_PRIORITY_ICONS: {
  [key: number]: FC<SvgIconProps>;
} = {
  1: LowIcon,
  2: NormalIcon,
  3: HighIcon,
  4: HighestIcon,
};

export const SCHEMA_PROJECT: Schema<EventType> = [
  [
    {
      name: 'dateStarted',
      label: 'Start Date',
      type: 'date',
    },

    {
      name: 'dateEnded',
      label: 'End Date',
      type: 'date',
    },
  ],
  [
    {
      name: 'departmentId',
      label: 'Department',
      type: 'department',
    },
  ],
  [
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      multiline: true,
    },
  ],
];

export const EditProject: FC<Props> = ({
  serviceCallId: serviceCallIdInit,
  loggedUserId,
  onClose,
}) => {
  const [serviceCallId, setServiceCallId] = useState<number>(serviceCallIdInit);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingEvent, setLoadingEvent] = useState<boolean>(true);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loadedInit, setLoadedInit] = useState<boolean>(false);
  const [loggedUser, setLoggedUser] = useState<UserType>();
  const [editingTask, setEditingTask] = useState<ExtendedProjectTaskType>();
  const [deletingEvent, setDeletingEvent] = useState<boolean>(false);
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<EventType>();
  const [pendingDeleteTask, setPendingDeleteTask] =
    useState<ExtendedProjectTaskType>();
  const [tasks, setTasks] = useState<ProjectTaskType[]>([]);

  const [taskEvents, setTaskEvents] = useState<TaskEventType[]>([]);
  const [taskEventsLoaded, setTaskEventsLoaded] = useState<boolean>(false);
  const [pendingCheckout, setPendingCheckout] = useState<boolean>(false);
  const [pendingCheckoutChange, setPendingCheckoutChange] =
    useState<boolean>(false);
  const [pendingCheckoutDelete, setPendingCheckoutDelete] =
    useState<boolean>(false);
  const [statuses, setStatuses] = useState<TaskStatusType[]>([]);
  const [priorities, setPriorities] = useState<TaskPriorityType[]>([]);
  const [departments, setDepartments] = useState<TimesheetDepartmentType[]>([]);
  const [errorProject, setErrorProject] = useState<string>('');
  const [errorTask, setErrorTask] = useState<string>('');

  const [search, setSearch] = useState<SearchType>({
    technicians: '',
    statusId: 0,
    priorityId: 0,
  });
  const [event, setEvent] = useState<EventType>();
  const [projects, setProjects] = useState<EventType[]>([]);
  const [editingProject, setEditingProject] = useState<boolean>(false);

  const loadEvent = useCallback(async () => {
    setLoadingEvent(true);
    try {
      const event = await EventClientService.LoadEventByServiceCallID(
        serviceCallId,
      );
      setEvent(event);
    } catch (err) {
      console.log({ err });
      if (!err.message.includes('failed to scan to struct')) {
        console.error('Error occurred during ProjectTask query:', err);
      }
    }
    setLoadingEvent(false);
  }, [setEvent, setLoadingEvent, serviceCallId]);
  const loadInit = useCallback(async () => {
    let promises = [];

    promises.push(
      new Promise<void>(async resolve => {
        const projects = await loadProjects();
        setProjects(projects);
        resolve();
      }),
    );

    promises.push(
      new Promise<void>(async resolve => {
        await loadEvent();
        resolve();
      }),
    );

    promises.push(
      new Promise<void>(async resolve => {
        try {
          const statuses = await TaskClientService.loadProjectTaskStatuses();
          setStatuses(statuses);
        } catch (err) {
          console.log({ err });
          if (!err.message.includes('failed to scan to struct')) {
            console.error('Error occurred during ProjectTask query:', err);
          }
        }
        resolve();
      }),
    );

    promises.push(
      new Promise<void>(async resolve => {
        try {
          const priorities =
            await TaskClientService.loadProjectTaskPriorities();
          setPriorities(priorities);
        } catch (err) {
          console.log({ err });
          if (!err.message.includes('failed to scan to struct')) {
            console.error('Error occurred during ProjectTask query:', err);
          }
        }
        resolve();
      }),
    );

    promises.push(
      new Promise<void>(async resolve => {
        try {
          const departments =
            await TimesheetDepartmentClientService.loadTimeSheetDepartments();
          setDepartments(departments);
        } catch (err) {
          console.log({ err });
          if (!err.message.includes('failed to scan to struct')) {
            console.error('Error occurred during ProjectTask query:', err);
          }
        }
        resolve();
      }),
    );

    promises.push(
      new Promise<void>(async resolve => {
        try {
          const loggedUser = await UserClientService.loadUserById(loggedUserId);
          setLoggedUser(loggedUser);
        } catch (err) {
          console.log({ err });
          if (!err.message.includes('failed to scan to struct')) {
            console.error('Error occurred during ProjectTask query:', err);
          }
        }
        resolve();
      }),
    );

    await Promise.all(promises);

    setLoadedInit(true);
  }, [
    loadEvent,
    setProjects,
    setStatuses,
    setPriorities,
    setDepartments,
    setLoadedInit,
    loggedUserId,
  ]);

  const load = useCallback(async () => {
    try {
      const tasks = await EventClientService.loadProjectTasks(serviceCallId);
      setTasks(tasks);
    } catch (err) {
      console.log({ err });
      if (!err.message.includes('failed to scan to struct')) {
        console.error('Error occurred during ProjectTask query:', err);
      }
    }
    setLoading(false);
  }, [setLoading, serviceCallId, setTasks]);
  useEffect(() => {
    if (!loadedInit) {
      loadInit();
    }
    if (loadedInit && !loaded) {
      setLoaded(true);
      load();
    }
  }, [loadedInit, loadInit, loaded, setLoaded, load]);
  const loadTaskEvents = useCallback(
    async (taskId: number) => {
      setTaskEventsLoaded(false);
      const taskEvents = await TaskEventClientService.loadTaskEventsByFilter({
        id: taskId,
        technicianUserId: loggedUserId,
      });
      setTaskEvents(taskEvents);
      setTaskEventsLoaded(true);
    },
    [setTaskEventsLoaded, setTaskEvents, loggedUserId],
  );
  const handleSetEditing = useCallback(
    (editingTask?: ExtendedProjectTaskType) => async () => {
      setErrorTask('');
      setEditingTask(editingTask);
      if (editingTask && editingTask.id) {
        await loadTaskEvents(editingTask.id);
      }
    },
    [setEditingTask, loadTaskEvents],
  );

  const handleUploadLog = useCallback(async (req: ActivityLog) => {
    try {
      let log = await ActivityLogClientService.Create(req);
    } catch (err) {
      console.error(
        `An error occurred while attempting to create an activity log: ${err}`,
      );
    }
  }, []);

  const handleDeleteEvent = useCallback(
    async (eventId: number) => {
      setDeletingEvent(true);
      try {
        await EventClientService.deleteEventById(eventId);
        setDeletingEvent(false);

        let req = new ActivityLog();
        req.setActivityName(`Deleted event: ${eventId}`);
        req.setActivityDate(format(new Date(), 'yyyy-MM-dd hh:mm:ss'));
        req.setUserId(loggedUserId);
        req.setEventId(eventId);
        handleUploadLog(req);
      } catch (err) {
        console.error(
          `An error occurred while attempting to delete an event by ID: ${err}`,
        );
      }

      setPendingDeleteEvent(undefined);
      if (onClose) onClose();
    },
    [handleUploadLog, loggedUserId, onClose],
  );

  // The function used to actually delete projects (projects are of event type)
  const handleSetPendingDeleteEvent = useCallback(
    (pendingDelete?: EventType) => () => {
      setPendingDeleteEvent(pendingDelete);
    },
    [setPendingDeleteEvent],
  );

  const handleSetPendingDeleteTask = useCallback(
    (pendingDelete?: ExtendedProjectTaskType) => () =>
      setPendingDeleteTask(pendingDelete),
    [setPendingDeleteTask],
  );
  const handleCheckout = useCallback(async () => {
    if (!editingTask) return;
    setPendingCheckout(false);
    setPendingCheckoutChange(true);
    const isEnroute =
      taskEvents.length === 0 ||
      (taskEvents[0] && taskEvents[0].actionTaken === CHECKOUT);
    const isCheckIn =
      taskEvents.length > 0 && taskEvents[0].actionTaken === ENROUTE;
    const timeStarted = timestamp();
    if (isEnroute) {
      await TaskEventClientService.upsertTaskEvent({
        taskId: editingTask.id,
        technicianUserId: loggedUserId,
        timeStarted,
        statusId: 1,
        actionTaken: ENROUTE,
      });
    } else if (isCheckIn) {
      await TaskEventClientService.upsertTaskEvent({
        taskId: editingTask.id,
        technicianUserId: loggedUserId,
        timeStarted,
        statusId: 1,
        actionTaken: CHECKIN,
      });
    } else {
      await TaskEventClientService.upsertTaskEvent({
        taskId: editingTask.id,
        technicianUserId: loggedUserId,
        timeStarted,
        timeFinished: timeStarted,
        statusId: 1,
        actionTaken: CHECKOUT,
      });
    }
    if (isEnroute || isCheckIn) {
      await TaskClientService.upsertEventTask({
        id: editingTask.id,
        externalCode: 'user',
        externalId: loggedUserId,
      });
      setEditingTask(undefined);
      setEditingTask({
        ...editingTask,
        externalCode: 'user',
        externalId: loggedUserId,
      });
      setLoaded(false);
    }
    await loadTaskEvents(editingTask.id);
    setPendingCheckoutChange(false);
  }, [
    editingTask,
    taskEvents,
    loggedUserId,
    setPendingCheckout,
    setLoaded,
    loadTaskEvents,
    setEditingTask,
    setPendingCheckoutChange,
  ]);
  const handleCheckoutDelete = useCallback(async () => {
    if (!editingTask || taskEvents.length === 0) return;
    setPendingCheckoutDelete(false);
    setPendingCheckoutChange(true);
    try {
      await TaskEventClientService.deleteTaskEvent(taskEvents[0].id);
    } catch (err) {
      console.error(
        `An error occurred while trying to delete a task event: ${err}`,
      );
    }
    try {
      await loadTaskEvents(editingTask.id);
    } catch (err) {
      console.log({ err });
      if (!err.message.includes('failed to scan to struct')) {
        console.error('Error occurred during ProjectTask query:', err);
      }
    }
    setPendingCheckoutChange(false);
  }, [
    setPendingCheckoutChange,
    taskEvents,
    loadTaskEvents,
    editingTask,
    setPendingCheckoutDelete,
  ]);
  const handleSetPendingCheckout = useCallback(
    (pendingCheckout: boolean) => () => setPendingCheckout(pendingCheckout),
    [setPendingCheckout],
  );
  const handleSetPendingCheckoutDelete = useCallback(
    (pendingCheckoutDelete: boolean) => () =>
      setPendingCheckoutDelete(pendingCheckoutDelete),
    [setPendingCheckoutDelete],
  );

  const isAnyManager = useMemo(
    () => departments.map(({ managerId }) => managerId).includes(loggedUserId),
    [departments, loggedUserId],
  );
  const isAssignedToAnyTask = useMemo(
    () =>
      tasks.some(
        ({ externalCode, externalId }) =>
          externalCode === 'user' && externalId === loggedUserId,
      ),
    [tasks, loggedUserId],
  );
  const hasEditRights = isAnyManager || isAssignedToAnyTask;
  const isOwner = useMemo(
    () =>
      editingTask &&
      (editingTask.creatorUserId === loggedUserId || !editingTask.id),
    [editingTask, loggedUserId],
  );
  const statusOptions = useMemo(
    () =>
      statuses.map(({ id, description }) => ({
        value: id,
        label: description,
        color: PROJECT_TASK_STATUS_COLORS[id],
      })),
    [statuses],
  );
  const statusOptionsWithAll = useMemo(
    () => [{ label: OPTION_ALL, value: 0 }, ...statusOptions],
    [statusOptions],
  );
  const priorityOptions = useMemo(
    () =>
      priorities.map(({ id, description }) => ({
        value: id,
        label: description,
        icon: PROJECT_TASK_PRIORITY_ICONS[id],
      })),
    [priorities],
  );
  const priorityOptionsWithAll = useMemo(
    () => [{ label: OPTION_ALL, value: 0 }, ...priorityOptions],
    [priorityOptions],
  );
  const handleSaveTask = useCallback(
    async ({
      startDate,
      startTime,
      endDate,
      endTime,
      checkedIn,
      id,
      ...formData
    }: ExtendedProjectTaskType) => {
      if (!event) return;
      if (startDate > endDate && endDate != '') {
        setErrorTask('Start Date cannot be after End Date.');
        console.error('Start Date cannot be after End Date.');
        return;
      }
      if (event.dateStarted.substr(0, 10) > startDate) {
        setErrorTask(
          "Task's Start Date cannot be before Project's Start Date.",
        );
        console.error(
          "Task's Start Date cannot be before Project's Start Date.",
        );
        return;
      }
      if (event.dateEnded.substr(0, 10) < endDate) {
        setErrorTask("Task's End Date cannot be after Project's End Date.");
        console.error("Task's End Date cannot be after Project's End Date.");
        return;
      }
      setEditingTask(undefined);
      setLoading(true);
      try {
        await TaskClientService.upsertEventTask({
          ...formData,
          eventId: serviceCallId,
          startDate: `${startDate} ${startTime}:00`,
          endDate: `${endDate} ${endTime}:00`,
          checkedIn: checkedIn,
          ...(!formData.eventId ? { creatorUserId: loggedUserId } : {}), // There was a !formData.id here in the conditional part of the ternary, I'm guessing
          // he wanted eventId instead
        });
        try {
          let req = new ActivityLog();
          req.setUserId(loggedUserId);
          req.setActivityName(`Created task for project ${serviceCallId}`);
          req.setActivityDate(format(new Date(), 'yyyy-MM-dd hh:mm:ss'));
          req.setEventId(serviceCallId);
          const log = await ActivityLogClientService.Create(req);
          console.log('Made log: ', log);
        } catch (err) {
          console.error(
            `An error occurred while trying to create a log: ${err}`,
          );
        }
      } catch (err) {
        console.error(
          `An error occurred while trying to upsert an event task: ${err}`,
        );
      }

      setLoaded(false);
    },
    [
      event,
      serviceCallId,
      loggedUserId,
      setLoaded,
      setEditingTask,
      setLoading,
      setErrorTask,
    ],
  );
  const handleDeleteTask = useCallback(async () => {
    if (pendingDeleteTask) {
      const { id } = pendingDeleteTask;
      setPendingDeleteTask(undefined);
      setEditingTask(undefined);
      setLoading(true);
      try {
        await TaskClientService.deleteProjectTaskById(id);
      } catch (err) {
        console.error(
          `An error occurred while trying to delete a project task by ID: ${err}`,
        );
      }
      setLoaded(false);
    }
  }, [pendingDeleteTask, setPendingDeleteTask]);
  const handleAddTask = useCallback(
    (startDate: string) => {
      if (!loggedUser || !event) return;
      if (
        !(
          isAnyManager || event.departmentId === loggedUser.employeeDepartmentId
        )
      )
        return;
      setEditingTask({
        ...new ProjectTask().toObject(),
        startDate,
        endDate: startDate,
        startTime: '09:00',
        endTime: '10:00',
        statusId: 1,
        priorityId: 2,
      });
    },
    [setEditingTask, loggedUser, event, isAnyManager],
  );
  const handleSetEditingProject = useCallback(
    (editingProject: boolean) => () => {
      setErrorProject('');
      setEditingProject(editingProject);
    },
    [setEditingProject],
  );
  const handleSaveProject = useCallback(
    async (formData: EventType) => {
      if (event) {
        if (
          formData.dateEnded.substr(0, 10) < formData.dateStarted.substr(0, 10)
        ) {
          setErrorProject('Start Date cannot be after End date.');
          return;
        }
        if (
          tasks.some(
            ({ startDate }) =>
              startDate.substr(0, 10) < formData.dateStarted.substr(0, 10),
          )
        ) {
          setErrorProject(
            'Some existing tasks are already defined before new project Start Date.',
          );
          return;
        }
        if (
          tasks.some(
            ({ endDate }) =>
              endDate.substr(0, 10) > formData.dateEnded.substr(0, 10),
          )
        ) {
          setErrorProject(
            'Some existing tasks are already defined after new project End Date.',
          );
          return;
        }
        setEditingProject(false);
        setLoadingEvent(true);
        await EventClientService.upsertEvent({ ...formData, id: event.id });
        loadEvent();
      }
    },
    [
      event,
      loadEvent,
      setEditingProject,
      setLoadingEvent,
      tasks,
      setErrorProject,
    ],
  );

  const SCHEMA_SEARCH: Schema<SearchType> = [
    [
      {
        name: 'technicians',
        label: 'Employees',
        type: 'technicians',
        technicianAsEmployee: true,
      },
      {
        name: 'statusId',
        label: 'Status',
        options: statusOptionsWithAll,
      },
      {
        name: 'priorityId',
        label: 'Priority',
        options: priorityOptionsWithAll,
      },
    ],
  ];
  const SCHEMA: Schema<ExtendedProjectTaskType> = [
    [
      {
        name: 'id',
        type: 'hidden',
      },
    ],
    [
      {
        name: 'externalId',
        label: 'Assigned Employee',
        type: 'technician',
        disabled: !hasEditRights,
        technicianAsEmployee: true,
      },
    ],
    [
      {
        name: 'briefDescription',
        label: 'Brief Description',
        multiline: true,
        required: !hasEditRights,
        disabled: !isOwner,
      },
    ],
    [
      {
        name: 'startDate',
        label: 'Start Date',
        type: 'date',
        required: true,
        disabled: !isOwner,
      },
      {
        name: 'startTime',
        label: 'Start Time',
        type: 'time',
        required: true,
        disabled: !isOwner,
      },
    ],
    [
      {
        name: 'endDate',
        label: 'End Date',
        type: 'date',
        required: true,
        disabled: !isOwner,
      },
      {
        name: 'endTime',
        label: 'End Time',
        type: 'time',
        required: true,
        disabled: !isOwner,
      },
    ],
    [
      {
        name: 'statusId',
        label: 'Status',
        required: true,
        options: statusOptions,
        disabled: !isOwner,
      },
    ],
    [
      {
        name: 'priorityId',
        label: 'Priority',
        required: true,
        options: priorityOptions,
        disabled: !isOwner,
      },
    ],
  ];
  const filteredTasks = tasks.filter(
    ({ statusId, priorityId, externalCode, externalId }) => {
      if (search.statusId) {
        if (statusId !== search.statusId) return false;
      }
      if (search.priorityId) {
        if (priorityId !== search.priorityId) return false;
      }
      if (search.technicians) {
        if (
          externalCode === 'project' ||
          (externalCode === 'user' &&
            !search.technicians
              .split(',')
              .map(id => +id)
              .includes(externalId))
        )
          return false;
      }
      return true;
    },
  );

  return (
    <div>
      <SectionBar
        title="Project Management"
        footer={
          event && !loadingEvent ? (
            <>
              <div>Address: {getPropertyAddress(event.property)}</div>
              <div>Start date: {formatDate(event.dateStarted)}</div>
              <div>End date: {formatDate(event.dateEnded)}</div>
              <div>Job Number: {event.logJobNumber}</div>
              <div>Description: {event.description}</div>
            </>
          ) : (
            'Loading...'
          )
        }
        actions={[
          ...(hasEditRights
            ? [
                {
                  label: 'Edit Project',
                  onClick: handleSetEditingProject(true),
                  disabled: loading || loadingEvent,
                },
              ]
            : []),
          {
            label: 'Add Task',
            onClick: handleSetEditing({
              ...new ProjectTask().toObject(),
              startDate: event ? event.dateStarted.substr(0, 10) : '',
              endDate: event ? event.dateStarted.substr(0, 10) : '',
              startTime: '09:00',
              endTime: '10:00',
              statusId: 1,
              priorityId: 2,
            }),
            disabled:
              loading ||
              loadingEvent ||
              !event ||
              !loggedUser ||
              !(
                isAnyManager ||
                event.departmentId === loggedUser.employeeDepartmentId
              ),
          },
          {
            label: 'Delete Project',
            onClick: handleSetPendingDeleteEvent(event),
            disabled:
              loading ||
              loadingEvent ||
              !event ||
              !loggedUser ||
              !event.isActive ||
              !(
                isAnyManager ||
                event.departmentId === loggedUser.employeeDepartmentId
              ),
          },
          ...(onClose
            ? [
                {
                  label: 'Close',
                  onClick: onClose,
                },
              ]
            : []),
        ]}
        fixedActions
        actionsAndAsideContentResponsive
        asideContent={
          <CostReport
            serviceCallId={serviceCallId}
            loggedUserId={loggedUserId}
          />
        } // CostReport will go here once it is more stable
        asideContentFirst
        sticky={false}
      />
      <PlainForm
        schema={SCHEMA_SEARCH}
        data={search}
        onChange={setSearch}
        disabled={loading || loadingEvent}
      />
      {event ? (
        <CheckInProjectTask
          projectToUse={event}
          loggedUserId={loggedUserId}
          serviceCallId={serviceCallId}
        />
      ) : (
        <></>
      )}
      <Tabs
        defaultOpenIdx={0}
        tabs={[
          {
            label: 'Calendar',
            content: event ? (
              <CalendarEvents
                events={filteredTasks.map(task => {
                  if (task.endDate == '0000-00-00 00:00:00') {
                    let date = new Date();
                    date.setMinutes(date.getMinutes() + 1);
                    task.endDate = format(date, 'yyyy-MM-dd hh-mm-ss');
                  }
                  const {
                    id,
                    briefDescription,
                    startDate: dateStart,
                    endDate: dateEnd,
                    statusId,
                    priorityId,
                    ownerName,
                    creatorUserId,
                  } = task;
                  const [startDate, startHour] = dateStart.split(' ');
                  const [endDate, endHour] = dateEnd.split(' ');
                  return {
                    id,
                    startDate,
                    endDate,
                    startHour,
                    endHour,
                    notes: briefDescription,
                    status: statuses.find(({ id }) => id === statusId)
                      ?.description,
                    statusColor: PROJECT_TASK_STATUS_COLORS[statusId],
                    priority: priorities.find(({ id }) => id === priorityId)
                      ?.description,
                    priorityId,
                    assignee: ownerName,
                    onClick:
                      creatorUserId === loggedUserId || hasEditRights
                        ? handleSetEditing({
                            ...task,
                            startDate,
                            endDate,
                            startTime: startHour.substr(0, 5),
                            endTime: endHour.substr(0, 5),
                          })
                        : undefined,
                  };
                })}
                startDate={event.dateStarted.substr(0, 10)}
                endDate={event.dateEnded.substr(0, 10)}
                loading={loading || loadingEvent}
                onAdd={handleAddTask}
              />
            ) : null,
          },
          {
            label: 'Gantt Chart',
            content: event ? (
              <GanttChart
                events={filteredTasks.map(task => {
                  const {
                    id,
                    briefDescription,
                    startDate: dateStart,
                    endDate: dateEnd,
                    statusId,
                    priorityId,
                    ownerName,
                    creatorUserId,
                  } = task;
                  const [startDate, startHour] = dateStart.split(' ');
                  const [endDate, endHour] = dateEnd.split(' ');
                  return {
                    id,
                    startDate,
                    endDate,
                    startHour,
                    endHour,
                    notes: briefDescription,
                    status: statuses.find(({ id }) => id === statusId)
                      ?.description,
                    statusColor: PROJECT_TASK_STATUS_COLORS[statusId],
                    priority: priorities.find(({ id }) => id === priorityId)
                      ?.description,
                    priorityId,
                    assignee: ownerName,
                    onClick:
                      creatorUserId === loggedUserId || hasEditRights
                        ? handleSetEditing({
                            ...task,
                            startDate,
                            endDate,
                            startTime: startHour.substr(0, 5),
                            endTime: endHour.substr(0, 5),
                          })
                        : undefined,
                  };
                })}
                startDate={event.dateStarted.substr(0, 10)}
                endDate={event.dateEnded.substr(0, 10)}
                loading={loading || loadingEvent}
                onAdd={handleAddTask}
              />
            ) : null,
          },
          {
            label: 'Projects Gantt Chart',
            content:
              projects.length > 0 ? (
                <GanttChart
                  events={projects.map(task => {
                    const {
                      id,
                      description,
                      dateStarted: dateStart,
                      dateEnded: dateEnd,
                      logJobStatus,
                      color,
                    } = task;
                    const [startDate, startHour] = dateStart.split(' ');
                    const [endDate, endHour] = dateEnd.split(' ');
                    return {
                      id,
                      startDate,
                      endDate,
                      startHour,
                      endHour,
                      notes: description,
                      statusColor: '#' + color,
                      onClick: () => {
                        setServiceCallId(id);
                        setLoaded(false);
                        setLoadedInit(false);
                        // load();
                      },
                    };
                  })}
                  startDate={projects[0].dateStarted.substr(0, 10)}
                  endDate={projects[projects.length - 1].dateEnded.substr(
                    0,
                    10,
                  )}
                  loading={loading || loadingEvent}
                />
              ) : (
                <div />
              ),
          },
        ]}
      />
      {editingTask && (
        <Modal open onClose={handleSetEditing()}>
          <Form
            schema={SCHEMA}
            data={editingTask}
            onClose={handleSetEditing()}
            onSave={handleSaveTask}
            title={`${editingTask.id ? 'Edit' : 'Add'} Task`}
            error={errorTask}
          >
            <div className="EditProjectDelete">
              {taskEventsLoaded && !isAnyManager && (
                <>
                  <Button
                    variant="outlined"
                    label={
                      taskEvents.length === 0 ||
                      (taskEvents[0] && taskEvents[0].actionTaken === CHECKOUT)
                        ? 'Enroute'
                        : `Check ${
                            taskEvents.length > 0 &&
                            taskEvents[0].actionTaken === CHECKIN
                              ? 'Out'
                              : 'In'
                          }`
                    }
                    onClick={handleSetPendingCheckout(true)}
                    disabled={pendingCheckoutChange}
                  />
                  {taskEvents.length > 0 && (
                    <Button
                      variant="outlined"
                      label={`Delete ${taskEvents[0].actionTaken}`}
                      onClick={handleSetPendingCheckoutDelete(true)}
                      disabled={pendingCheckoutChange}
                    />
                  )}
                </>
              )}
              {editingTask.id > 0 &&
                editingTask.creatorUserId === loggedUserId && (
                  <Button
                    variant="outlined"
                    label="Delete Task"
                    onClick={handleSetPendingDeleteTask(editingTask)}
                  />
                )}
            </div>
          </Form>
        </Modal>
      )}
      {pendingDeleteTask && (
        <ConfirmDelete
          open
          kind="Task"
          name={pendingDeleteTask.briefDescription}
          onClose={handleSetPendingDeleteTask()}
          onConfirm={handleDeleteTask}
        />
      )}
      {pendingDeleteEvent && (
        <ConfirmDelete
          open
          kind="this project"
          name={''}
          onClose={handleSetPendingDeleteEvent()}
          onConfirm={() => {
            handleDeleteEvent(pendingDeleteEvent.id);
          }}
        />
      )}
      {deletingEvent && <Loader />}
      {editingProject && event && (
        <Modal open onClose={handleSetEditingProject(false)}>
          <Form
            title="Edit Project"
            onClose={handleSetEditingProject(false)}
            onSave={handleSaveProject}
            schema={SCHEMA_PROJECT}
            data={event}
            error={errorProject}
          />
        </Modal>
      )}
      {pendingCheckout && (
        <Confirm
          open
          title={
            taskEvents.length === 0 ||
            (taskEvents[0] && taskEvents[0].actionTaken === CHECKOUT)
              ? 'Confirm Enroute'
              : `Confirm Check ${
                  taskEvents.length > 0 && taskEvents[0].actionTaken === CHECKIN
                    ? 'Out'
                    : 'In'
                }`
          }
          onClose={handleSetPendingCheckout(false)}
          onConfirm={handleCheckout}
        >
          {taskEvents.length === 0 ||
          (taskEvents[0] && taskEvents[0].actionTaken === CHECKOUT) ? (
            <div>
              Are you sure you want to Enroute and assign yourself to this task?
            </div>
          ) : taskEvents.length > 0 && taskEvents[0].actionTaken === CHECKIN ? (
            <div>Are you sure you want to Check Out from this task?</div>
          ) : (
            <div>
              Are you sure you want to Check In and assign yourself to this
              task?
            </div>
          )}
        </Confirm>
      )}
      {pendingCheckoutDelete && taskEvents[0] && (
        <ConfirmDelete
          open
          kind="action"
          name={taskEvents[0].actionTaken}
          onClose={handleSetPendingCheckoutDelete(false)}
          onConfirm={handleCheckoutDelete}
        />
      )}
    </div>
  );
};
