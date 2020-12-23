import React, { FC, useState, useCallback, useEffect, useMemo } from 'react';
import { Task } from '@kalos-core/kalos-rpc/Task';
import kebabCase from 'lodash/kebabCase';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import { SectionBar } from '../SectionBar';
import { InfoTable, Columns, Row } from '../InfoTable';
import { ActionsProps } from '../Actions';
import { Modal } from '../Modal';
import { ConfirmDelete } from '../ConfirmDelete';
import { Form, Schema } from '../Form';
import { PlainForm, SchemaProps, Option } from '../PlainForm';
import { PROJECT_TASK_PRIORITY_ICONS } from '../EditProject';
import { Documents } from '../Documents';
import {
  TaskType,
  loadTasks,
  makeFakeRows,
  timestamp,
  TaskClientService,
  TaskPriorityType,
  TaskStatusType,
  loadProjectTaskBillableTypes,
  upsertTask,
  formatDateTime,
  loadSpiffTypes,
  SpiffTypeType,
  escapeText,
  UserClientService,
  upsertTaskAssignments,
  uploadFileToS3Bucket,
  createTaskDocument,
  DocumentType,
  updateDocumentDescription,
  upsertTaskEvent,
  TaskEventType,
  loadTaskEventsByFilter,
  TaskEventClientService,
} from '../../../helpers';
import {
  ROWS_PER_PAGE,
  PROJECT_TASK_STATUS_COLORS,
  OPTION_ALL,
  OPTION_BLANK,
} from '../../../constants';
import './Tasks.less';

type ExternalCode = 'customers' | 'employee' | 'properties';
interface Props {
  loggedUserId: number;
  externalCode: ExternalCode;
  externalId: number;
  onClose?: () => void;
}

type TaskEdit = Partial<TaskType> & {
  assignedTechnicians: string;
};

const COLUMNS: Columns = [
  { name: 'Id' },
  { name: 'Reference #' },
  { name: 'Priority' },
  { name: 'Description' },
  { name: 'Status' },
  { name: 'Created' },
  { name: 'Due' },
];

type DocumentUplodad = {
  filename: '';
  description: '';
};

const SCHEMA_DOCUMENT_EDIT: Schema<DocumentType> = [
  [
    {
      name: 'filename',
      label: 'File',
      readOnly: true,
    },
  ],
  [
    {
      name: 'description',
      label: 'Title/Description',
      helperText: 'Keep as short/descriptive as possible',
    },
  ],
];

const SCHEMA_TASK_EVENT: Schema<TaskEventType> = [
  [
    {
      name: 'actionTaken',
      label: 'Action Taken',
      multiline: true,
    },
  ],
  [
    {
      name: 'actionNeeded',
      label: 'Action Needed',
      multiline: true,
    },
  ],
];

export const Tasks: FC<Props> = ({
  externalCode,
  externalId,
  loggedUserId,
  onClose,
}) => {
  const searchInit = useMemo(() => {
    const req = new Task();
    req.setStatusId(0);
    req.setPriorityId(0);
    return {
      ...req.toObject(),
      assignedTechnicians: '',
    };
  }, []);
  const [loadedInit, setLoadedInit] = useState<boolean>(false);
  const [loadingInit, setLoadingInit] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [priorities, setPriorities] = useState<TaskPriorityType[]>([]);
  const [search, setSearch] = useState<TaskEdit>(searchInit);
  const [statuses, setStatuses] = useState<TaskStatusType[]>([]);
  const [spiffTypes, setSpiffTypes] = useState<SpiffTypeType[]>([]);
  const [billableTypes, setBillableTypes] = useState<string[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [pendingEdit, setPendingEdit] = useState<TaskEdit>();
  const [pendingDelete, setPendingDelete] = useState<TaskType>();
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadFailed, setUploadFailed] = useState<boolean>(false);
  const [documentFile, setDocumentFile] = useState<string>('');
  const [documentSaving, setDocumentSaving] = useState<boolean>(false);
  const [taskEvents, setTaskEvents] = useState<TaskEventType[]>([]);
  const [taskEventsLoading, setTaskEventsLoading] = useState<boolean>(false);
  const [taskEventDeleting, setTaskEventDeleting] = useState<TaskEventType>();
  const [taskEventEditing, setTaskEventEditing] = useState<TaskEventType>();
  const loadInit = useCallback(async () => {
    setLoadingInit(true);
    await UserClientService.refreshToken();
    const priorities = await TaskClientService.loadProjectTaskPriorities();
    const statuses = await TaskClientService.loadProjectTaskStatuses();
    const billableTypes = await loadProjectTaskBillableTypes();
    const spiffTypes = await loadSpiffTypes();
    setPriorities(priorities);
    setStatuses(statuses);
    setBillableTypes(billableTypes);
    setSpiffTypes(spiffTypes);
    setLoadingInit(false);
    setLoadedInit(true);
  }, [
    setLoadedInit,
    setLoadingInit,
    setPriorities,
    setStatuses,
    setBillableTypes,
    setSpiffTypes,
  ]);
  const load = useCallback(async () => {
    setLoading(true);
    const { referenceNumber, priorityId, briefDescription, statusId } = search;
    const { resultsList, totalCount } = await loadTasks({
      pageNumber: page,
      externalCode,
      externalId,
      referenceNumber,
      priorityId,
      briefDescription,
      statusId,
    });
    setTasks(resultsList);
    setCount(totalCount);
    setLoading(false);
  }, [setLoading, setTasks, setCount, externalId, externalCode, page, search]);
  useEffect(() => {
    if (!loadedInit) {
      loadInit();
    }
    if (loadedInit && !loaded) {
      setLoaded(true);
      load();
    }
  }, [loadInit, loadedInit, loaded, setLoaded, load]);
  const handleSave = useCallback(
    async ({ assignedTechnicians, ...data }: TaskEdit) => {
      setSaving(true);
      const saveData = { ...data, externalCode, externalId };
      if (saveData.billableType === OPTION_BLANK) {
        saveData.billableType = '';
      }
      if (!saveData.hasOwnProperty('priorityId')) {
        saveData.priorityId = 2;
      }
      const technicianIds = assignedTechnicians
        ? assignedTechnicians.split(',').map(id => +id)
        : [];
      const id = await upsertTask(saveData);
      await upsertTaskAssignments(id, technicianIds); // FIXME resolve when task will return TaskAssigment[]
      setSaving(false);
      setPendingEdit(undefined);
      setLoaded(false);
    },
    [setSaving, externalCode, externalId],
  );
  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(undefined);
    setLoading(true);
    await TaskClientService.deleteSpiffTool(id);
    setLoaded(false);
  }, [pendingDelete, setPendingDelete, setLoading, setLoaded]);
  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
      setLoaded(false);
    },
    [setPage, setLoading],
  );
  const loadTaskEvents = useCallback(
    async (id: number) => {
      setTaskEventsLoading(true);
      const taskEvents = await loadTaskEventsByFilter({
        id,
        withTechnicianNames: true,
      });
      setTaskEvents(taskEvents);
      setTaskEventsLoading(false);
    },
    [setTaskEventsLoading, setTaskEvents],
  );
  const handleSetPendingEdit = useCallback(
    (pendingEdit?: TaskEdit) => async () => {
      setPendingEdit(pendingEdit);
      if (pendingEdit && pendingEdit.id) {
        loadTaskEvents(pendingEdit.id);
      }
    },
    [setPendingEdit, loadTaskEvents],
  );
  const handleSetPendingDelete = useCallback(
    (pendingDelete?: TaskType) => () => setPendingDelete(pendingDelete),
    [setPendingDelete],
  );
  const handleSearch = useCallback(() => setLoaded(false), [setLoaded]);
  const newTask = useMemo(() => {
    const req = new Task();
    req.setTimeDue(timestamp());
    req.setStatusId(1); // New
    req.setPriorityId(2); // Normal
    req.setBillableType(OPTION_BLANK);
    return { ...req.toObject(), assignedTechnicians: '' };
  }, []);
  const handleDocumentUpload = useCallback(
    (onClose, onReload) => async ({
      filename,
      description,
    }: DocumentUplodad) => {
      if (!pendingEdit || !pendingEdit.id) return;
      setUploadFailed(false);
      setUploading(true);
      const ext = filename.split('.').pop();
      const fileName =
        kebabCase(
          [
            pendingEdit.id,
            timestamp(true).split('-').reverse(),
            description.trim() || filename.replace('.' + ext, ''),
          ].join(' '),
        ) +
        '.' +
        ext;
      const status = await uploadFileToS3Bucket(
        fileName,
        documentFile,
        'testbuckethelios', // FIXME is it correct bucket name for those docs?
      );
      if (status === 'ok') {
        await createTaskDocument(
          fileName,
          pendingEdit.id,
          loggedUserId,
          description,
        );
        onClose();
        onReload();
        setUploading(false);
      } else {
        setUploadFailed(true);
        setUploading(false);
      }
    },
    [documentFile, loggedUserId, pendingEdit, setUploadFailed, setUploading],
  );
  const handleFileLoad = useCallback(file => setDocumentFile(file), [
    setDocumentFile,
  ]);
  const handleDocumentUpdate = useCallback(
    (onClose, onReload, { id }) => async (form: DocumentType) => {
      setDocumentSaving(true);
      const { description } = form;
      await updateDocumentDescription(id, description);
      setDocumentSaving(false);
      onClose();
      onReload();
    },
    [setDocumentSaving],
  );
  const SPIFF_TYPES_OPTIONS: Option[] = useMemo(
    () =>
      spiffTypes.map(({ type, id: value }) => ({
        label: escapeText(type),
        value,
      })),
    [spiffTypes],
  );
  const statusesMap: { [key: number]: string } = useMemo(
    () =>
      statuses.reduce(
        (aggr, { id, description }) => ({ ...aggr, [id]: description }),
        {},
      ),
    [statuses],
  );
  const prioritiesMap: { [key: number]: string } = useMemo(
    () =>
      priorities.reduce(
        (aggr, { id, description }) => ({ ...aggr, [id]: description }),
        {},
      ),
    [priorities],
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
  const priorityOptions = useMemo(
    () =>
      priorities.map(({ id, description }) => ({
        value: id,
        label: description,
        icon: PROJECT_TASK_PRIORITY_ICONS[id],
      })),
    [priorities],
  );
  const typeTitle = useMemo(() => {
    if (externalCode === 'customers') return 'Customer';
    if (externalCode === 'employee') return 'Employee';
    if (externalCode === 'properties') return 'Property';
    return '';
  }, [externalCode]);
  const handleStartTaskAction = useCallback(async () => {
    if (!pendingEdit || !pendingEdit.id) return;
    const data: Partial<TaskEventType> = {
      taskId: pendingEdit.id,
      technicianUserId: loggedUserId,
      timeStarted: timestamp(),
      statusId: 2,
    };
    setTaskEventsLoading(true);
    await upsertTaskEvent(data);
    loadTaskEvents(pendingEdit.id);
  }, [pendingEdit, loggedUserId, setTaskEventsLoading, loadTaskEvents]);
  const handleSetTaskEventEditing = useCallback(
    (taskEventEditing?: TaskEventType) => () =>
      setTaskEventEditing(taskEventEditing),
    [setTaskEventEditing],
  );
  const handleSetTaskEventDeleting = useCallback(
    (taskEventDeleting?: TaskEventType) => () =>
      setTaskEventDeleting(taskEventDeleting),
    [setTaskEventDeleting],
  );
  const handleDeleteTaskEvent = useCallback(async () => {
    if (!taskEventDeleting || !pendingEdit || !pendingEdit.id) return;
    const { id } = taskEventDeleting;
    setTaskEventDeleting(undefined);
    await TaskEventClientService.deleteTaskEvent(id);
    loadTaskEvents(pendingEdit.id);
  }, [taskEventDeleting, loadTaskEvents, pendingEdit]);
  const handleSaveTaskEvent = useCallback(
    async (formData: Partial<TaskEventType>) => {
      if (!taskEventEditing || !pendingEdit || !pendingEdit.id) return;
      const data: Partial<TaskEventType> = {
        id: taskEventEditing.id,
        ...formData,
        statusId: 4,
        ...(taskEventEditing.timeFinished
          ? {}
          : {
              timeFinished: timestamp(),
            }),
      };
      setTaskEventEditing(undefined);
      setTaskEventsLoading(true);
      await upsertTaskEvent(data);
      loadTaskEvents(pendingEdit.id);
    },
    [taskEventEditing, pendingEdit, setTaskEventsLoading, loadTaskEvents],
  );
  const SCHEMA_TASK: Schema<TaskEdit> = [
    [{ name: 'id', type: 'hidden' }],
    [
      {
        name: 'billableType',
        label: 'Task type',
        options: [OPTION_BLANK, ...billableTypes],
      },
    ],
    [
      {
        name: 'billable',
        label: 'Billable?',
        type: 'checkbox',
      },
    ],
    [
      {
        name: 'referenceNumber',
        label:
          pendingEdit && pendingEdit.billableType === 'Parts Run'
            ? 'Job / Reference #'
            : 'Reference #',
      },
    ],
    ...(pendingEdit &&
    ['Spiff', 'Tool Purchase'].includes(pendingEdit.billableType || '')
      ? []
      : [
          [
            {
              name: 'timeDue',
              label: 'Time Due',
              type: 'datetime',
            } as SchemaProps<TaskEdit>,
          ],
        ]),
    ...(pendingEdit && pendingEdit.billableType === 'Parts Run'
      ? [
          [
            {
              name: 'address',
              label: 'Destination',
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'orderNum',
              label: 'Order #',
            } as SchemaProps<TaskEdit>,
          ],
        ]
      : []),
    [
      {
        name: 'briefDescription',
        label: 'Brief Description',
        multiline: true,
      },
    ],
    ...(pendingEdit &&
    ['Spiff', 'Tool Purchase'].includes(pendingEdit.billableType || '')
      ? []
      : [
          [
            {
              name: 'details',
              label: 'Details',
              multiline: true,
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'notes',
              label: 'Notes',
              multiline: true,
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'statusId',
              label: 'Status',
              options: statusOptions,
              required: true,
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'priorityId',
              label: 'Proprity',
              options: priorityOptions,
              required: true,
            } as SchemaProps<TaskEdit>,
          ],
        ]),
    ...(pendingEdit && pendingEdit.billableType === 'Flat Rate'
      ? [
          [
            {
              name: 'flatRate',
              label: 'Flat Rate',
              startAdornment: '$',
            } as SchemaProps<TaskEdit>,
          ],
        ]
      : []),
    ...(pendingEdit && pendingEdit.billableType === 'Hourly'
      ? [
          [
            {
              name: 'hourlyStart',
              label: 'Time Start',
              type: 'datetime',
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'hourlyEnd',
              label: 'Time End',
              type: 'datetime',
            } as SchemaProps<TaskEdit>,
          ],
        ]
      : []),
    ...(pendingEdit &&
    ['Spiff', 'Tool Purchase'].includes(pendingEdit.billableType || '')
      ? []
      : [
          [
            {
              name: 'assignedTechnicians',
              label: 'Task Assignments(s)',
              type: 'technicians',
              required: true,
            } as SchemaProps<TaskEdit>,
          ],
        ]),
    ...(pendingEdit && pendingEdit.billableType === 'Spiff'
      ? [
          [
            {
              name: 'spiffAmount',
              label: 'Spiff Amount',
              type: 'number',
              startAdornment: '$',
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'spiffJobNumber',
              label: 'Job #',
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'datePerformed',
              label: 'Date Performed',
              type: 'date',
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'spiffTypeId',
              label: 'Spiff Type',
              options: SPIFF_TYPES_OPTIONS,
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'spiffAddress',
              label: 'Address',
              multiline: true,
            } as SchemaProps<TaskEdit>,
          ],
        ]
      : []),
    ...(pendingEdit && pendingEdit.billableType === 'Tool Purchase'
      ? [
          [
            {
              name: 'toolpurchaseDate',
              label: 'Purchase Date',
              type: 'date',
            } as SchemaProps<TaskEdit>,
          ],
          [
            {
              name: 'toolpurchaseCost',
              label: 'Tool Cost',
              type: 'number',
              startAdornment: '$',
            } as SchemaProps<TaskEdit>,
          ],
        ]
      : []),
  ];
  const SCHEMA_SEARCH: Schema<TaskEdit> = [
    [
      {
        name: 'referenceNumber',
        label: 'Reference #',
        type: 'search',
      },
      {
        name: 'priorityId',
        label: 'Proprity',
        options: [{ label: OPTION_ALL, value: 0 }, ...priorityOptions],
      },
      {
        name: 'briefDescription',
        label: 'Description',
        type: 'search',
      },
      {
        name: 'statusId',
        label: 'Status',
        options: [{ label: OPTION_ALL, value: 0 }, ...statusOptions],
        actions: [{ label: 'Search', onClick: handleSearch }],
      },
    ],
  ];
  const SCHEMA_DOCUMENT: Schema<DocumentUplodad> = [
    [
      {
        name: 'filename',
        label: 'File',
        type: 'file',
        required: true,
        onFileLoad: handleFileLoad,
      },
    ],
    [
      {
        name: 'description',
        label: 'Title/Description',
        helperText: 'Keep as short/descriptive as possible',
      },
    ],
  ];
  const formKey = useMemo(
    () =>
      SCHEMA_TASK.reduce((aggr, item) => [...aggr, ...item], [])
        .map(({ name }) => name)
        .join('_'),
    [SCHEMA_TASK],
  );
  const isLastTaskEventStarted = taskEvents[0] && taskEvents[0].statusId === 2;
  return (
    <>
      <div>
        <SectionBar
          title={`${typeTitle} Tasks`}
          actions={
            [
              {
                label: 'Add Task',
                onClick: handleSetPendingEdit(newTask),
                disabled: !loadedInit,
              },
              ...(onClose
                ? [{ label: 'Close', variant: 'outlined', onClick: onClose }]
                : []),
            ] as ActionsProps
          }
          pagination={{
            count,
            rowsPerPage: ROWS_PER_PAGE,
            page,
            onChangePage: handlePageChange,
          }}
        />
        <PlainForm schema={SCHEMA_SEARCH} data={search} onChange={setSearch} />
        <InfoTable
          columns={COLUMNS}
          data={
            loading || loadingInit
              ? makeFakeRows(7, 5)
              : tasks.map(task => {
                  const {
                    id,
                    referenceNumber,
                    priorityId,
                    briefDescription,
                    statusId,
                    timeCreated,
                    timeDue,
                  } = task;
                  return [
                    {
                      value: id,
                      onClick: handleSetPendingEdit({
                        ...task,
                        assignedTechnicians: '',
                      }),
                    },
                    {
                      value: referenceNumber,
                      onClick: handleSetPendingEdit({
                        ...task,
                        assignedTechnicians: '',
                      }),
                    },
                    {
                      value: prioritiesMap[priorityId],
                      onClick: handleSetPendingEdit({
                        ...task,
                        assignedTechnicians: '',
                      }),
                    },
                    {
                      value: briefDescription,
                      onClick: handleSetPendingEdit({
                        ...task,
                        assignedTechnicians: '',
                      }),
                    },
                    {
                      value: statusesMap[statusId],
                      onClick: handleSetPendingEdit({
                        ...task,
                        assignedTechnicians: '',
                      }),
                    },
                    {
                      value: formatDateTime(timeCreated),
                      onClick: handleSetPendingEdit({
                        ...task,
                        assignedTechnicians: '',
                      }),
                    },
                    {
                      value: formatDateTime(timeDue),
                      onClick: handleSetPendingEdit({
                        ...task,
                        assignedTechnicians: '',
                      }),
                      actions: [
                        <IconButton
                          key="edit"
                          size="small"
                          onClick={handleSetPendingEdit({
                            ...task,
                            assignedTechnicians: '',
                          })} // FIXME
                        >
                          <EditIcon />
                        </IconButton>,
                        <IconButton
                          key="delete"
                          size="small"
                          onClick={handleSetPendingDelete(task)}
                        >
                          <DeleteIcon />
                        </IconButton>,
                      ],
                    },
                  ] as Row;
                })
          }
          loading={loading || loadingInit}
        />
      </div>
      {pendingEdit && (
        <Modal
          open
          onClose={handleSetPendingEdit()}
          fullScreen={!!pendingEdit.id}
        >
          <div className="TasksEdit">
            <div className="TasksEditForm">
              <Form
                key={formKey}
                title={`${pendingEdit.id ? 'Edit' : 'Add'} ${typeTitle} Task`}
                onClose={handleSetPendingEdit()}
                onSave={handleSave}
                onChange={setPendingEdit}
                schema={SCHEMA_TASK}
                data={pendingEdit}
                disabled={saving}
              />
            </div>
            {!!pendingEdit.id && (
              <div className="TasksEditAside">
                <SectionBar
                  title="Task Actions"
                  actions={
                    taskEventsLoading
                      ? []
                      : [
                          {
                            label: isLastTaskEventStarted
                              ? 'Completed'
                              : 'Start',
                            onClick: isLastTaskEventStarted
                              ? handleSetTaskEventEditing(taskEvents[0])
                              : handleStartTaskAction,
                          },
                        ]
                  }
                  fixedActions
                />
                <InfoTable
                  columns={[
                    { name: 'Started / Finished' },
                    { name: 'Action Taken' },
                    { name: 'Action Needed' },
                    { name: 'Technician / Status' },
                  ]}
                  data={
                    taskEventsLoading
                      ? makeFakeRows(4, 3)
                      : taskEvents.map(taskEvent => {
                          const {
                            timeStarted,
                            timeFinished,
                            technicianName,
                            actionTaken,
                            actionNeeded,
                            statusId,
                          } = taskEvent;
                          return [
                            {
                              value: (
                                <>
                                  <div>
                                    {timeStarted
                                      ? formatDateTime(timeStarted)
                                      : '-'}
                                  </div>
                                  <div>
                                    {timeFinished
                                      ? formatDateTime(timeFinished)
                                      : '-'}
                                  </div>
                                </>
                              ),
                            },
                            { value: actionTaken },
                            { value: actionNeeded },
                            {
                              value: (
                                <>
                                  <div>{technicianName}</div>
                                  <div
                                    style={{
                                      color: statusId === 2 ? 'red' : 'green',
                                    }}
                                  >
                                    {statusId === 2
                                      ? 'In Progress'
                                      : 'Completed'}
                                  </div>
                                </>
                              ),
                              actions: [
                                ...(statusId === 2
                                  ? []
                                  : [
                                      <IconButton
                                        key="edit"
                                        size="small"
                                        onClick={handleSetTaskEventEditing(
                                          taskEvent,
                                        )}
                                      >
                                        <EditIcon />
                                      </IconButton>,
                                    ]),
                                <IconButton
                                  key="delete"
                                  size="small"
                                  onClick={handleSetTaskEventDeleting(
                                    taskEvent,
                                  )}
                                >
                                  <DeleteIcon />
                                </IconButton>,
                              ],
                            },
                          ];
                        })
                  }
                  loading={taskEventsLoading}
                />
                <Documents
                  title="Documents"
                  taskId={pendingEdit.id}
                  withDownloadIcon
                  withDateCreated
                  renderAdding={(onClose, onReload) => (
                    <Form<DocumentUplodad>
                      title="Add Document"
                      onClose={onClose}
                      onSave={handleDocumentUpload(onClose, onReload)}
                      data={{
                        filename: '',
                        description: '',
                      }}
                      schema={SCHEMA_DOCUMENT}
                      error={
                        uploadFailed ? (
                          <div>
                            There was an error during file upload.
                            <br />
                            Please try again later or contact administrator.
                          </div>
                        ) : undefined
                      }
                      disabled={uploading}
                    >
                      {uploading && (
                        <Typography className="SpiffToolLogEditUploading">
                          Please wait, file is uploading...
                        </Typography>
                      )}
                    </Form>
                  )}
                  renderEditing={(onClose, onReload, document) => (
                    <Form<DocumentType>
                      title="Edit Document"
                      data={document}
                      schema={SCHEMA_DOCUMENT_EDIT}
                      onClose={onClose}
                      onSave={handleDocumentUpdate(onClose, onReload, document)}
                      disabled={documentSaving}
                    />
                  )}
                />
              </div>
            )}
          </div>
        </Modal>
      )}
      {pendingDelete && (
        <ConfirmDelete
          open
          onClose={handleSetPendingDelete()}
          kind={`${typeTitle} Task`}
          name={`${pendingDelete.id}`}
          onConfirm={handleDelete}
        />
      )}
      {taskEventDeleting && (
        <ConfirmDelete
          open
          onClose={handleSetTaskEventDeleting()}
          kind="Task Action"
          name={`started at ${formatDateTime(taskEventDeleting.timeStarted)}`}
          onConfirm={handleDeleteTaskEvent}
        />
      )}
      {taskEventEditing && (
        <Modal open onClose={handleSetTaskEventEditing()}>
          <Form
            title={`${
              taskEventEditing.timeFinished ? 'Edit' : 'Complete'
            } Task Action`}
            schema={SCHEMA_TASK_EVENT}
            data={taskEventEditing}
            onClose={handleSetTaskEventEditing()}
            onSave={handleSaveTaskEvent}
          />
        </Modal>
      )}
    </>
  );
};
