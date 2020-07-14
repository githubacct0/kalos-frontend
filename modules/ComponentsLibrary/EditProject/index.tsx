import React, { FC, useState, useCallback, useEffect, useMemo } from 'react';
import { SvgIconProps } from '@material-ui/core/SvgIcon';
import { makeStyles } from '@material-ui/core/styles';
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
import { PrintPage, Status } from '../PrintPage';
import { PrintTable } from '../PrintTable';
import { PrintParagraph } from '../PrintParagraph';
import { ConfirmDelete } from '../ConfirmDelete';
import { CalendarEvents } from '../CalendarEvents';
import { GanttChart } from '../GanttChart';
import { Tabs } from '../Tabs';
import {
  loadEventById,
  loadProjectTasks,
  EventType,
  ProjectTaskType,
  getPropertyAddress,
  formatDate,
  upsertEventTask,
  loadProjectTaskStatuses,
  loadProjectTaskPriorities,
  TaskStatusType,
  TaskPriorityType,
  deleteProjectTaskById,
  loadTimesheetDepartments,
  TimesheetDepartmentType,
  upsertEvent,
  loadPerDiemsByEventId,
  PerDiemType,
  PerDiemRowType,
  getDepartmentName,
  usd,
  loadPerDiemsLodging,
} from '../../../helpers';
import {
  PROJECT_TASK_STATUS_COLORS,
  OPTION_ALL,
  MEALS_RATE,
} from '../../../constants';

export interface Props {
  serviceCallId: number;
  loggedUserId: number;
}

type SearchType = {
  technicians: string;
  statusId: number;
  priorityId: number;
};

type ExtendedProjectTaskType = ProjectTaskType & {
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

const SCHEMA_PROJECT: Schema<EventType> = [
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
];

const useStyles = makeStyles(theme => ({
  btnDelete: {
    textAlign: 'center',
  },
}));

export const EditProject: FC<Props> = ({ serviceCallId, loggedUserId }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingEvent, setLoadingEvent] = useState<boolean>(true);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loadedInit, setLoadedInit] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<ExtendedProjectTaskType>();
  const [pendingDelete, setPendingDelete] = useState<ExtendedProjectTaskType>();
  const [tasks, setTasks] = useState<ProjectTaskType[]>([]);
  const [statuses, setStatuses] = useState<TaskStatusType[]>([]);
  const [priorities, setPriorities] = useState<TaskPriorityType[]>([]);
  const [departments, setDepartments] = useState<TimesheetDepartmentType[]>([]);
  const [errorProject, setErrorProject] = useState<string>('');
  const [errorTask, setErrorTask] = useState<string>('');
  const [printStatus, setPrintStatus] = useState<Status>('idle');
  const [perDiems, setPerDiems] = useState<PerDiemType[]>([]);
  const [lodgings, setLodgings] = useState<{ [key: number]: number }>({});
  const [search, setSearch] = useState<SearchType>({
    technicians: '',
    statusId: 0,
    priorityId: 0,
  });
  const [event, setEvent] = useState<EventType>();
  const [editingProject, setEditingProject] = useState<boolean>(false);
  const loadEvent = useCallback(async () => {
    setLoadingEvent(true);
    const event = await loadEventById(serviceCallId);
    setEvent(event);
    setLoadingEvent(false);
  }, [setEvent, setLoadingEvent]);
  const loadInit = useCallback(async () => {
    await loadEvent();
    const statuses = await loadProjectTaskStatuses();
    const priorities = await loadProjectTaskPriorities();
    const departments = await loadTimesheetDepartments();
    setStatuses(statuses);
    setPriorities(priorities);
    setDepartments(departments);
    setLoadedInit(true);
  }, [loadEvent, setStatuses, setPriorities, setDepartments, setLoadedInit]);
  const load = useCallback(async () => {
    setLoading(true);
    const tasks = await loadProjectTasks(serviceCallId);
    setTasks(tasks);
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
  const handleSetEditing = useCallback(
    (editingTask?: ExtendedProjectTaskType) => () => {
      setErrorTask('');
      setEditingTask(editingTask);
    },
    [setEditingTask],
  );
  const handleSetPendingDelete = useCallback(
    (pendingDelete?: ExtendedProjectTaskType) => () =>
      setPendingDelete(pendingDelete),
    [setPendingDelete],
  );
  const isAnyManager = useMemo(
    () => departments.map(({ managerId }) => managerId).includes(loggedUserId),
    [departments],
  );
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
      ...formData
    }: ExtendedProjectTaskType) => {
      if (!event) return;
      if (startDate > endDate) {
        setErrorTask('Start Date cannot be after End Date.');
        return;
      }
      if (event.dateStarted.substr(0, 10) > startDate) {
        setErrorTask(
          "Task's Start Date cannot be before Project's Start Date.",
        );
        return;
      }
      if (event.dateEnded.substr(0, 10) < endDate) {
        setErrorTask("Task's End Date cannot be after Project's End Date.");
        return;
      }
      setEditingTask(undefined);
      setLoading(true);
      await upsertEventTask({
        ...formData,
        eventId: serviceCallId,
        startDate: `${startDate} ${startTime}:00`,
        endDate: `${endDate} ${endTime}:00`,
        ...(!formData.id ? { creatorUserId: loggedUserId } : {}),
      });
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
    if (pendingDelete) {
      const { id } = pendingDelete;
      setPendingDelete(undefined);
      setEditingTask(undefined);
      setLoading(true);
      await deleteProjectTaskById(id);
      setLoaded(false);
    }
  }, [pendingDelete, setPendingDelete]);
  const handleAddTask = useCallback(
    (startDate: string) =>
      setEditingTask({
        ...new ProjectTask().toObject(),
        startDate,
        endDate: startDate,
        startTime: '09:00',
        endTime: '10:00',
        statusId: 1,
        priorityId: 2,
      }),
    [setEditingTask],
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
        await upsertEvent({ ...formData, id: event.id });
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
  const loadPrintData = useCallback(async () => {
    const { resultsList } = await loadPerDiemsByEventId(serviceCallId);
    const lodgings = await loadPerDiemsLodging(resultsList);
    setLodgings(lodgings);
    setPerDiems(resultsList);
  }, [serviceCallId, setPerDiems, setLodgings]);
  const handlePrint = useCallback(async () => {
    setPrintStatus('loading');
    await loadPrintData();
    setPrintStatus('loaded');
  }, [setPrintStatus, loadPrintData]);
  const handlePrinted = useCallback(() => setPrintStatus('idle'), [
    setPrintStatus,
  ]);
  const SCHEMA_SEARCH: Schema<SearchType> = [
    [
      {
        name: 'technicians',
        label: 'Technicians',
        type: 'technicians',
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
        disabled: !isAnyManager,
      },
    ],
    [
      {
        name: 'briefDescription',
        label: 'Brief Description',
        multiline: true,
        required: !isAnyManager,
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
  const totalMeals =
    perDiems.reduce((aggr, { rowsList }) => aggr + rowsList.length, 0) *
    MEALS_RATE;
  const totalLodging = perDiems
    .reduce(
      (aggr, { rowsList }) => [...aggr, ...rowsList],
      [] as PerDiemRowType[],
    )
    .filter(({ mealsOnly }) => !mealsOnly)
    .reduce((aggr, { id }) => aggr + lodgings[id], 0);
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
            </>
          ) : (
            'Loading...'
          )
        }
        actions={[
          ...(isAnyManager
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
            disabled: loading || loadingEvent,
          },
        ]}
        fixedActions
        asideContent={
          <PrintPage
            buttonProps={{
              label: 'Print Cost Report',
              disabled: loading || loadingEvent || printStatus === 'loading',
            }}
            downloadLabel="Download Cost Report"
            downloadPdfFilename="Cost-Report"
            headerProps={{ title: 'Project Cost Report' }}
            onPrint={handlePrint}
            onPrinted={handlePrinted}
            status={printStatus}
            key={printStatus}
          >
            <PrintParagraph tag="h2">Costs</PrintParagraph>
            <PrintTable
              columns={[
                { title: 'Type', align: 'left' },
                { title: 'Cost', align: 'right' },
              ]}
              data={[
                ['Meals', usd(totalMeals)],
                ['Lodging', usd(totalLodging)],
                [<strong>TOTAL</strong>, usd(totalMeals + totalLodging)],
              ]}
            />
            <PrintParagraph tag="h2">Per Diems</PrintParagraph>
            {perDiems.map(
              ({
                id,
                department,
                ownerName,
                dateSubmitted,
                approvedByName,
                dateApproved,
                notes,
                rowsList,
              }) => {
                const totalMeals = MEALS_RATE * rowsList.length;
                const totalLodging = rowsList.reduce(
                  (aggr, { id, mealsOnly }) =>
                    aggr + (mealsOnly ? 0 : lodgings[id]),
                  0,
                );
                return (
                  <div key={id}>
                    <PrintTable
                      columns={[
                        {
                          title: 'Department',
                          align: 'left',
                        },
                        {
                          title: 'Owner',
                          align: 'left',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Submited At',
                          align: 'left',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Approved At',
                          align: 'left',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Approved By',
                          align: 'left',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Total Meals',
                          align: 'right',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Total Lodging',
                          align: 'right',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Notes',
                          align: 'left',
                          widthPercentage: 20,
                        },
                      ]}
                      data={[
                        [
                          getDepartmentName(department),
                          ownerName,
                          formatDate(dateSubmitted) || '-',
                          formatDate(dateApproved) || '-',
                          approvedByName || '-',
                          usd(totalMeals),
                          usd(totalLodging),
                          notes,
                        ],
                      ]}
                    />
                    <PrintTable
                      columns={[
                        {
                          title: '',
                          align: 'left',
                          widthPercentage: 3,
                        },
                        {
                          title: 'Date',
                          align: 'left',
                        },
                        {
                          title: 'Zip Code',
                          align: 'left',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Meals Only',
                          align: 'center',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Meals',
                          align: 'right',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Lodging',
                          align: 'right',
                          widthPercentage: 10,
                        },
                        {
                          title: 'Notes',
                          align: 'left',
                          widthPercentage: 20,
                        },
                      ]}
                      data={rowsList.map(
                        ({ id, dateString, zipCode, mealsOnly, notes }) => [
                          '',
                          formatDate(dateString),
                          zipCode,
                          mealsOnly ? 'Yes' : 'No',
                          usd(MEALS_RATE),
                          usd(mealsOnly ? 0 : lodgings[id]),
                          notes,
                        ],
                      )}
                    />
                  </div>
                );
              },
            )}
          </PrintPage>
        }
        asideContentFirst
        sticky={false}
      />
      <PlainForm
        schema={SCHEMA_SEARCH}
        data={search}
        onChange={setSearch}
        disabled={loading || loadingEvent}
      />
      <Tabs
        defaultOpenIdx={0}
        tabs={[
          {
            label: 'Calendar',
            content: event ? (
              <CalendarEvents
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
                    statusId,
                    priority: priorities.find(({ id }) => id === priorityId)
                      ?.description,
                    priorityId,
                    assignee: ownerName,
                    onClick:
                      creatorUserId === loggedUserId || isAnyManager
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
                    statusId,
                    priority: priorities.find(({ id }) => id === priorityId)
                      ?.description,
                    priorityId,
                    assignee: ownerName,
                    onClick:
                      creatorUserId === loggedUserId || isAnyManager
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
            {editingTask.id > 0 && editingTask.creatorUserId === loggedUserId && (
              <div className={classes.btnDelete}>
                <Button
                  variant="outlined"
                  label="Delete"
                  onClick={handleSetPendingDelete(editingTask)}
                />
              </div>
            )}
          </Form>
        </Modal>
      )}
      {pendingDelete && (
        <ConfirmDelete
          open
          kind="Task"
          name={pendingDelete.briefDescription}
          onClose={handleSetPendingDelete()}
          onConfirm={handleDeleteTask}
        />
      )}
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
    </div>
  );
};
