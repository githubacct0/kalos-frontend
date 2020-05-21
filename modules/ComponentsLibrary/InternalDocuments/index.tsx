import React, { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { SectionBar } from '../SectionBar';
import { InfoTable, Data, Columns } from '../InfoTable';
import { PlainForm, Schema, Option } from '../PlainForm';
import { Modal } from '../Modal';
import { FileTags } from '../FileTags';
import { Form } from '../Form';
import { ConfirmDelete } from '../ConfirmDelete';
import {
  makeFakeRows,
  InternalDocumentType,
  DocumentKeyType,
  InternalDocumentsFilter,
  InternalDocumentsSort,
  loadInternalDocuments,
  loadDocumentKeys,
  formatDate,
  openFile,
  updateInternalDocument,
  deleteInternalDocument,
} from '../../../helpers';
import { ROWS_PER_PAGE, OPTION_ALL } from '../../../constants';
import { InternalDocument } from '@kalos-core/kalos-rpc/InternalDocument';

const useStyles = makeStyles(theme => ({
  filter: {
    marginTop: theme.spacing(2),
  },
  name: {
    display: 'flex',
    alignItems: 'center',
  },
  tag: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    display: 'inline-block',
    marginRight: theme.spacing(),
    flexShrink: 0,
    borderRadius: '50%',
  },
}));

const defaultFilter: InternalDocumentsFilter = { tag: -1 };

export const InternalDocuments: FC = ({}) => {
  const classes = useStyles();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loadedFileTags, setLoadedFileTags] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingFileTags, setLoadingFileTags] = useState<boolean>(false);
  const [entries, setEntries] = useState<InternalDocumentType[]>([]);
  const [fileTags, setFileTags] = useState<DocumentKeyType[]>([]);
  const [filter, setFilter] = useState<InternalDocumentsFilter>(defaultFilter);
  const [fileTagsOpened, setFileTagsOpened] = useState<boolean>(false);
  const [editing, setEditing] = useState<InternalDocumentType>();
  const [deleting, setDeleting] = useState<InternalDocumentType>();
  const [documentFile, setDocumentFile] = useState<string>('');
  const [sort, setSort] = useState<InternalDocumentsSort>({
    orderByField: 'name',
    orderBy: 'name',
    orderDir: 'ASC',
  });
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const load = useCallback(async () => {
    setLoading(true);
    const { resultsList, totalCount } = await loadInternalDocuments({
      page,
      filter,
      sort,
    });
    setEntries(resultsList);
    setCount(totalCount);
    setLoading(false);
  }, [setLoading, setEntries, setCount, page, filter, sort]);
  const loadFileTags = useCallback(async () => {
    setLoadingFileTags(true);
    const fileTags = await loadDocumentKeys();
    setFileTags(fileTags);
    setLoadingFileTags(false);
  }, [setLoadingFileTags, setFileTags]);
  useEffect(() => {
    if (!loadedFileTags) {
      setLoadedFileTags(true);
      loadFileTags();
    }
    if (!loaded) {
      setLoaded(true);
      load();
    }
  }, [
    loaded,
    setLoaded,
    load,
    loadedFileTags,
    setLoadedFileTags,
    loadFileTags,
  ]);
  const handleSearch = useCallback(() => {
    setPage(0);
    setLoaded(false);
  }, [setPage, setLoaded]);
  const handleReset = useCallback(() => {
    setFilter(defaultFilter);
    handleSearch();
  }, [setFilter, handleSearch]);
  const handleChangePage = useCallback(
    (page: number) => {
      setPage(page);
      setLoaded(false);
    },
    [setPage, setLoaded],
  );
  const handleSortChange = useCallback(
    (sort: InternalDocumentsSort) => () => {
      setSort(sort);
      handleSearch();
    },
    [setSort, handleSearch],
  );
  const handleFileTagsOpenedToggle = useCallback(
    (fileTagsOpened: boolean) => () => setFileTagsOpened(fileTagsOpened),
    [setFileTagsOpened],
  );
  const handleView = useCallback(
    (entry: InternalDocumentType) => () => {
      console.log({ entry });
      openFile(entry.filename, 'kalos-internal-docs');
    },
    [],
  );
  const handleSetEditing = useCallback(
    (editing?: InternalDocumentType) => () => setEditing(editing),
    [setEditing],
  );
  const handleSetDeleting = useCallback(
    (deleting?: InternalDocumentType) => () => setDeleting(deleting),
    [setDeleting],
  );
  const handleSave = useCallback(
    async (data: InternalDocumentType) => {
      setEditing(undefined);
      setLoading(true);
      await updateInternalDocument(data);
      setLoaded(false);
    },
    [setEditing, setLoading, setLoaded],
  );
  const handleDelete = useCallback(async () => {
    if (deleting) {
      setDeleting(undefined);
      setLoading(true);
      await deleteInternalDocument(deleting);
      setLoaded(false);
    }
  }, [deleting, setDeleting, setLoading, setLoaded]);
  const handleFileLoad = useCallback(file => setDocumentFile(file), [
    setDocumentFile,
  ]);
  const COLUMNS: Columns = useMemo(
    () =>
      [
        {
          name: 'Document Description',
          ...(sort.orderByField === 'name'
            ? {
                dir: sort.orderDir,
              }
            : {}),
          onClick: handleSortChange({
            orderByField: 'name',
            orderBy: 'name',
            orderDir:
              sort.orderByField === 'name' && sort.orderDir === 'ASC'
                ? 'DESC'
                : 'ASC',
          }),
        },
        {
          name: 'Added',
          ...(sort.orderByField === 'dateCreated'
            ? {
                dir: sort.orderDir,
              }
            : {}),
          onClick: handleSortChange({
            orderByField: 'dateCreated',
            orderBy: 'idocument_date_created',
            orderDir:
              sort.orderByField === 'dateCreated' && sort.orderDir === 'ASC'
                ? 'DESC'
                : 'ASC',
          }),
        },
        {
          name: 'Modified',
          ...(sort.orderByField === 'dateModified'
            ? {
                dir: sort.orderDir,
              }
            : {}),
          onClick: handleSortChange({
            orderByField: 'dateModified',
            orderBy: 'idocument_date_modified',
            orderDir:
              sort.orderByField === 'dateModified' && sort.orderDir === 'ASC'
                ? 'DESC'
                : 'ASC',
          }),
        },
      ] as Columns,
    [sort],
  );
  const getFileTagsOptions = useCallback(
    (options = []) => [
      ...options,
      ...fileTags.map(({ id: value, name: label, color }) => ({
        value,
        label,
        color,
      })),
    ],
    [fileTags],
  );
  const SCHEMA_FILTER: Schema<InternalDocumentsFilter> = useMemo(
    () =>
      [
        [
          {
            name: 'tag',
            label: 'File Tag',
            options: getFileTagsOptions([
              { label: OPTION_ALL, value: defaultFilter.tag },
            ]),
            actions: [
              {
                label: 'View File Tags',
                onClick: handleFileTagsOpenedToggle(true),
                variant: 'text',
              },
            ],
            actionsInLabel: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'search',
            actions: [
              {
                label: 'Reset',
                variant: 'outlined',
                onClick: handleReset,
              },
              {
                label: 'Search',
                onClick: handleSearch,
              },
            ],
          },
        ],
      ] as Schema<InternalDocumentsFilter>,
    [fileTags],
  );
  const SCHEMA_EDIT: Schema<InternalDocumentType> = useMemo(
    () =>
      [
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
            label: 'Description',
            helperText: '(Short and Descriptive)',
            required: true,
          },
        ],
        [
          {
            name: 'tag',
            label: 'File Tag',
            options: getFileTagsOptions(),
            required: true,
          },
        ],
      ] as Schema<InternalDocumentType>,
    [fileTags],
  );
  const data: Data =
    loading || loadingFileTags
      ? makeFakeRows(3, 5)
      : (entries.map(entry => {
          const { description, dateCreated, dateModified, tagData } = entry;
          const backgroundColor = tagData ? tagData.color : '';
          const tagName = tagData ? tagData.name : '';
          return [
            {
              value: (
                <div className={classes.name}>
                  <span className={classes.tag} style={{ backgroundColor }} />
                  {tagName} {description}
                </div>
              ),
            },
            {
              value: formatDate(dateCreated),
            },
            {
              value: formatDate(dateModified),
              actions: [
                <IconButton key="view" size="small" onClick={handleView(entry)}>
                  <OpenInNewIcon />
                </IconButton>,
                <IconButton
                  key="edit"
                  size="small"
                  onClick={handleSetEditing(entry)}
                >
                  <EditIcon />
                </IconButton>,
                <IconButton
                  key="remove"
                  size="small"
                  onClick={handleSetDeleting(entry)}
                >
                  <DeleteIcon />
                </IconButton>,
              ],
            },
          ];
        }) as Data);
  return (
    <div>
      <SectionBar
        title="Kalos Documents"
        actions={[
          {
            label: 'Add Document',
            onClick: handleSetEditing(new InternalDocument().toObject()),
          },
        ]}
        fixedActions
        pagination={{
          count,
          rowsPerPage: ROWS_PER_PAGE,
          page,
          onChangePage: handleChangePage,
        }}
      />
      <PlainForm
        className={classes.filter}
        data={filter}
        schema={SCHEMA_FILTER}
        compact
        onChange={setFilter}
      />
      <InfoTable
        columns={COLUMNS}
        data={data}
        loading={loading || loadingFileTags}
      />
      {fileTagsOpened && (
        <Modal open onClose={handleFileTagsOpenedToggle(false)} fullScreen>
          <FileTags
            onClose={handleFileTagsOpenedToggle(false)}
            fileTags={fileTags}
            onFileTagsChange={setFileTags}
          />
        </Modal>
      )}
      {editing && (
        <Modal open onClose={handleSetEditing(undefined)}>
          <Form
            title={`${editing.id ? 'Edit' : 'Add'} Kalos Document`}
            schema={SCHEMA_EDIT}
            data={editing}
            onClose={handleSetEditing(undefined)}
            onSave={handleSave}
          />
        </Modal>
      )}
      {deleting && (
        <ConfirmDelete
          open
          kind="Internal Document"
          name={`${deleting.tagData?.name} ${deleting.description}`}
          onClose={handleSetDeleting(undefined)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};
