import React, { FC, useState, useCallback, useEffect, ReactNode } from 'react';
import uniqueId from 'lodash/uniqueId';
import IconButton from '@material-ui/core/IconButton';
import LinkIcon from '@material-ui/icons/Link';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import {
  ServiceItemClient,
  ServiceItem,
} from '@kalos-core/kalos-rpc/ServiceItem';
import { ReadingClient, Reading } from '@kalos-core/kalos-rpc/Reading';
import {
  MaintenanceQuestionClient,
  MaintenanceQuestion,
} from '@kalos-core/kalos-rpc/MaintenanceQuestion';
import { MaterialClient, Material } from '@kalos-core/kalos-rpc/Material';
import { ENDPOINT, ROWS_PER_PAGE } from '../../../constants';
import { InfoTable, Data } from '../InfoTable';
import { SectionBar } from '../SectionBar';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { ActionsProps } from '../Actions';
import { Form, Schema, Options } from '../Form';
import { PlainForm } from '../PlainForm';
import { ConfirmDelete } from '../ConfirmDelete';
import { makeFakeRows, getRPCFields } from '../../../helpers';
import { ServiceItemLinks } from '../ServiceItemLinks';
import { ServiceItemReadings } from '../ServiceItemReadings';
import './styles.less';

const ServiceItemClientService = new ServiceItemClient(ENDPOINT);
const ReadingClientService = new ReadingClient(ENDPOINT);
const MaintenanceQuestionClientService = new MaintenanceQuestionClient(
  ENDPOINT,
);
const MaterialClientService = new MaterialClient(ENDPOINT);

export type Entry = ServiceItem.AsObject;
type MaterialType = Material.AsObject;

const SYSTEM_READINGS_TYPE_OPTIONS: Options = [
  { label: 'Straight-cool AC w/ heatstrips', value: '1' },
  { label: 'Heat-pump AC', value: '2' },
  { label: 'Furnace (Straight-Cool)', value: '3' },
  { label: 'Gas Pool Heater', value: '4' },
  { label: 'Heat Pump Pool Heater', value: '5' },
  { label: 'Furnace (Heat-pump)', value: '6' },
  { label: 'Cooler', value: '7' },
  { label: 'Freezer', value: '8' },
  { label: 'AC w/ Reheat', value: '9' },
  { label: 'Other', value: '10' },
];

const MATERIAL_SCHEMA: Schema<MaterialType> = [
  [
    { label: 'Name', name: 'name' },
    { label: 'Quantity', name: 'quantity' },
    { label: 'Part #', name: 'partNumber' },
    { label: 'Vendor', name: 'vendor' },
    { name: 'id', type: 'hidden' },
  ],
];

export type Repair = {
  id: string;
  serviceItemId: number;
  diagnosis: string;
  description: string;
  price: number;
};

interface Props {
  className?: string;
  userID: number;
  loggedUserId: number;
  propertyId: number;
  title?: string;
  loading?: boolean;
  selectable?: boolean;
  onSelect?: (entries: Entry[]) => void;
  repair?: boolean;
  disableRepair?: boolean;
  repairs?: Repair[];
  onRepairsChange?: (repairs: Repair[]) => void;
  actions?: ActionsProps;
  asideContent?: ReactNode;
}

const REPAIR_SCHEMA: Schema<Repair> = [
  [
    { name: 'diagnosis', label: 'Diagnosis' },
    { name: 'description', label: 'Description', multiline: true },
    { name: 'price', label: 'Price', type: 'number', startAdornment: '$' },
  ],
];

const sort = (a: Entry, b: Entry) => {
  if (a.sortOrder < b.sortOrder) return -1;
  if (a.sortOrder > b.sortOrder) return 1;
  return 0;
};

export const ServiceItems: FC<Props> = props => {
  const {
    propertyId,
    className,
    title = 'Service Items',
    selectable,
    onSelect,
    repair,
    disableRepair = false,
    repairs: repairsInitial = [],
    onRepairsChange,
    children,
    loading: loadingProp = false,
    actions = [],
    asideContent,
  } = props;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>(repairsInitial);
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [materialsIds, setMaterialsIds] = useState<number[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [editing, setEditing] = useState<Entry>();
  const [deletingEntry, setDeletingEntry] = useState<Entry>();
  const [saving, setSaving] = useState<boolean>(false);
  const [linkId, setLinkId] = useState<number>();
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [selected, setSelected] = useState<Entry[]>([]);

  const handleMaterialChange = useCallback(
    (idx: number) => (data: MaterialType) => {
      const newMaterials = [...materials];
      newMaterials[idx] = data;
      setMaterials(newMaterials);
    },
    [materials, setMaterials],
  );

  const handleAddMaterial = useCallback(() => {
    const newMaterial = new Material();
    newMaterial.setId(Date.now());
    const newMaterials = [...materials, newMaterial.toObject()];
    setMaterials(newMaterials);
  }, [materials, setMaterials]);

  const handleRemoveMaterial = useCallback(
    (idx: number) => () => {
      setMaterials(materials.filter((_, idy) => idx !== idy));
    },
    [materials, setMaterials],
  );

  const MATERIALS_SCHEMA = materials
    .map(
      (_, idx): Schema<Entry> => [
        [
          {
            label: `#${idx + 1}`,
            headline: true,
            actions: [
              {
                label: 'Remove',
                variant: 'outlined',
                onClick: handleRemoveMaterial(idx),
                compact: true,
                size: 'xsmall',
                disabled: saving,
              },
            ],
          },
        ],
        [
          {
            content: (
              <PlainForm<MaterialType>
                key={materials[idx].id}
                schema={MATERIAL_SCHEMA}
                data={materials[idx]}
                onChange={handleMaterialChange(idx)}
                disabled={saving}
              />
            ),
          },
        ],
      ],
    )
    .reduce((aggr, item) => [...aggr, ...item], []);

  const SCHEMA: Schema<Entry> = [
    [
      { label: 'System Description', name: 'type', required: true },
      {
        label: 'System Type',
        name: 'systemReadingsTypeId',
        required: true,
        options: SYSTEM_READINGS_TYPE_OPTIONS,
      },
    ],
    [
      { label: 'Start Date', name: 'startDate' },
      { label: 'Item Location', name: 'location' },
    ],
    [{ label: '#1', headline: true }],
    [
      { label: 'Item', name: 'item' },
      { label: 'Brand', name: 'brand' },
      { label: 'Model #', name: 'model' },
      { label: 'Serial #', name: 'serial' },
    ],
    [{ label: '#2', headline: true }],
    [
      { label: 'Item', name: 'item2' },
      { label: 'Brand', name: 'brand2' },
      { label: 'Model #', name: 'model2' },
      { label: 'Serial #', name: 'serial2' },
    ],
    [{ label: '#3', headline: true }],
    [
      { label: 'Item', name: 'item3' },
      { label: 'Brand', name: 'brand3' },
      { label: 'Model #', name: 'model3' },
      { label: 'Serial #', name: 'serial3' },
    ],
    [{ label: 'Filter', headline: true }],
    [
      { label: 'Width', name: 'filterWidth' },
      { label: 'Length', name: 'filterLength' },
      { label: 'Thickness', name: 'filterThickness' },
      { label: 'Quantity', name: 'filterQty' },
    ],
    [
      { label: 'Part #', name: 'filterPartNumber' },
      { label: 'Vendor', name: 'filterVendor' },
    ],
    [
      {
        label: 'Materials',
        headline: true,
        actions: [
          {
            label: 'Add',
            size: 'xsmall',
            variant: 'outlined',
            compact: true,
            onClick: handleAddMaterial,
            disabled: saving,
          },
        ],
      },
    ],
    ...(loadingMaterials
      ? [
          [
            {
              content: (
                <InfoTable
                  className="ServiceItemsLoadingMaterials"
                  data={makeFakeRows(4, 1)}
                  loading
                />
              ),
            },
          ],
        ]
      : MATERIALS_SCHEMA.length === 0
      ? [
          [
            {
              content: (
                <div className="ServiceItemsNoMaterials">No materials</div>
              ),
            },
          ],
        ]
      : MATERIALS_SCHEMA),
    [{ label: 'Notes', headline: true }],
    [{ label: 'Additional Notes', name: 'notes', multiline: true }],
  ];

  const load = useCallback(async () => {
    setLoading(true);
    const entry = new ServiceItem();
    entry.setPropertyId(propertyId);
    entry.setPageNumber(page);
    entry.setIsActive(1);
    try {
      const response = await ServiceItemClientService.BatchGet(entry);
      const { resultsList, totalCount: count } = response.toObject();
      setEntries(resultsList.sort(sort));
      setCount(count);
      setLoading(false);
      setLoaded(true);
    } catch (e) {
      setError(true);
      setLoading(false);
    }
  }, [setLoading, setEntries, setCount, setError, setLoaded, page]);

  useEffect(() => {
    if (!loaded) {
      load();
    }
  }, [loaded, load]);

  const handleMaterials = async (
    materials: MaterialType[],
    materialsIds: number[],
    serviceItemId: number,
  ) => {
    const formFields = MATERIAL_SCHEMA[0].map(({ name }) => name as string);
    const ids = materials.map(({ id }) => id);
    await Promise.all(
      materialsIds
        .filter(id => !ids.includes(id))
        .map(async id => {
          const entry = new Material();
          entry.setId(id);
          return await MaterialClientService.Delete(entry);
        }),
    );
    const operations: {
      operation: 'Create' | 'Update';
      entry: Material;
    }[] = [];
    for (let i = 0; i < materials.length; i += 1) {
      const entry = new Material();
      entry.setServiceItemId(serviceItemId);
      const fieldMaskList = ['ServiceItemId'];
      for (const fieldName in materials[i]) {
        if (!fieldName || fieldName === 'id' || !formFields.includes(fieldName))
          continue;
        const { upperCaseProp, methodName } = getRPCFields(fieldName);
        // @ts-ignore
        entry[methodName](materials[i][fieldName]);
        fieldMaskList.push(upperCaseProp);
      }
      entry.setFieldMaskList(fieldMaskList);
      if (materialsIds.includes(materials[i].id)) {
        entry.setId(materials[i].id);
        operations.push({ operation: 'Update', entry });
      } else {
        operations.push({ operation: 'Create', entry });
      }
    }
    await Promise.all(
      operations.map(
        async ({ operation, entry }) =>
          await MaterialClientService[operation](entry),
      ),
    );
  };

  const handleSave = useCallback(
    async (data: Entry) => {
      if (editing) {
        setSaving(true);
        const entry = new ServiceItem();
        entry.setPropertyId(propertyId);
        const fieldMaskList = ['PropertyId'];
        const isNew = !editing.id;
        if (!isNew) {
          entry.setId(editing.id);
        } else {
          const sortOrder = Math.max(
            entries[entries.length - 1].sortOrder + 1,
            entries.length,
          );
          entry.setSortOrder(sortOrder);
          fieldMaskList.push('SortOrder');
        }
        for (const fieldName in data) {
          const { upperCaseProp, methodName } = getRPCFields(fieldName);
          // @ts-ignore
          entry[methodName](data[fieldName]);
          fieldMaskList.push(upperCaseProp);
        }
        entry.setFieldMaskList(fieldMaskList);
        const { id } = await ServiceItemClientService[
          isNew ? 'Create' : 'Update'
        ](entry);
        await handleMaterials(materials, materialsIds, id);
        setSaving(false);
        setEditing(undefined);
        await load();
      }
    },
    [editing, setSaving, entries, setEditing, load, materials, materialsIds],
  );

  const handleDelete = useCallback(async () => {
    setDeletingEntry(undefined);
    if (deletingEntry) {
      setLoading(true);
      const reading = new Reading();
      reading.setServiceItemId(deletingEntry.id);
      const response = await ReadingClientService.BatchGet(reading);
      const readingIds = response.toObject().resultsList.map(({ id }) => id);
      await Promise.all(
        readingIds.map(async id => {
          const maintenanceQuestion = new MaintenanceQuestion();
          maintenanceQuestion.setReadingId(id);
          return await MaintenanceQuestionClientService.Delete(
            maintenanceQuestion,
          );
        }),
      );
      await Promise.all(
        readingIds.map(async id => {
          const reading = new Reading();
          reading.setId(id);
          return await ReadingClientService.Delete(reading);
        }),
      );
      const newRepairs = repairs.filter(
        ({ serviceItemId }) => serviceItemId !== deletingEntry.id,
      );
      setRepairs(newRepairs);
      if (onRepairsChange) {
        onRepairsChange(newRepairs);
      }
      const entry = new ServiceItem();
      entry.setId(deletingEntry.id);
      await ServiceItemClientService.Delete(entry);
      await load();
    }
  }, [
    setDeletingEntry,
    deletingEntry,
    setLoading,
    load,
    repairs,
    setRepairs,
    onRepairsChange,
  ]);

  const handleSelectedChange = useCallback(
    (entry: Entry) => () => {
      const newSelected: Entry[] = [...selected.filter(item => item !== entry)];
      const isSelected = selected.find(item => item === entry);
      if (!isSelected) {
        newSelected.push(entry);
      }
      setSelected(newSelected);
      if (onSelect) {
        onSelect(newSelected);
      }
    },
    [setSelected, selected, onSelect],
  );

  const handleReorder = useCallback(
    (idx: number, step: number) => async () => {
      setLoading(true);
      const currentItem = entries[idx];
      const nextItem = entries[idx + step];
      const entry = new ServiceItem();
      entry.setFieldMaskList(['SortOrder']);
      entry.setId(currentItem.id);
      entry.setSortOrder(nextItem.sortOrder);
      await ServiceItemClientService.Update(entry);
      entry.setId(nextItem.id);
      entry.setSortOrder(currentItem.sortOrder);
      await ServiceItemClientService.Update(entry);
      await load();
    },
    [setLoading, entries, load],
  );

  const handleSetLinkId = useCallback(
    (linkId?: number) => () => setLinkId(linkId),
    [setLinkId],
  );

  const handleAddRepair = useCallback(
    (entry: Entry) => () => {
      const { id } = entry;
      const repair: Repair = {
        id: uniqueId(),
        serviceItemId: id,
        diagnosis: '',
        description: '',
        price: 0,
      };
      const newRepairs = [...repairs, repair];
      setRepairs(newRepairs);
      if (onRepairsChange) {
        onRepairsChange(newRepairs);
      }
    },
    [setRepairs, repairs],
  );

  const handleDeleteRepair = useCallback(
    ({ id }: Repair) => () => {
      const newRepairs = repairs.filter(item => item.id !== id);
      setRepairs(newRepairs);
      if (onRepairsChange) {
        onRepairsChange(newRepairs);
      }
    },
    [setRepairs, repairs],
  );

  const handleChangeRepair = useCallback(
    (repair: Repair) => (data: Repair) => {
      const newRepairs = repairs.map(item =>
        item === repair ? { ...item, ...data } : item,
      );
      setRepairs(newRepairs);
      if (onRepairsChange) {
        onRepairsChange(newRepairs);
      }
    },
    [setRepairs, repairs, onRepairsChange],
  );

  const handleChangePage = useCallback(
    (page: number) => {
      setPage(page);
      setLoaded(false);
    },
    [setPage, setLoaded],
  );

  const handleEditing = useCallback(
    (editing?: Entry) => async () => {
      setEditing(editing);
      if (editing && editing.id) {
        const entry = new Material();
        entry.setServiceItemId(editing.id);
        setLoadingMaterials(true);
        const { resultsList } = (
          await MaterialClientService.BatchGet(entry)
        ).toObject();
        setMaterials(resultsList);
        setMaterialsIds(resultsList.map(({ id }) => id));
        setLoadingMaterials(false);
      } else {
        setMaterials([]);
        setMaterialsIds([]);
      }
    },
    [setEditing, setMaterials],
  );

  const setDeleting = useCallback(
    (deletingEntry?: Entry) => () => setDeletingEntry(deletingEntry),
    [setDeletingEntry],
  );

  const makeData = () => {
    const data: Data = [];
    entries.forEach((entry, idx) => {
      const { id, type: value } = entry;
      data.push([
        {
          value: (
            <>
              {selectable && (
                <Field
                  name="name"
                  type="checkbox"
                  value={!!selected.find(item => item.id === id)}
                  onChange={handleSelectedChange(entry)}
                  className="ServiceItemsCheckbox"
                />
              )}
              <IconButton
                style={{ marginRight: 4 }}
                size="small"
                disabled={idx === 0}
                onClick={handleReorder(idx, -1)}
              >
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton
                style={{ marginRight: 4 }}
                size="small"
                disabled={idx === entries.length - 1}
                onClick={handleReorder(idx, 1)}
              >
                <ArrowDownwardIcon />
              </IconButton>
              <span>{value}</span>
            </>
          ),
          actions: [
            ...(repair
              ? [
                  <IconButton
                    key={3}
                    style={{ marginLeft: 4 }}
                    size="small"
                    onClick={handleAddRepair(entry)}
                    disabled={disableRepair}
                  >
                    <AddIcon />
                  </IconButton>,
                ]
              : []),
            <IconButton
              key={0}
              style={{ marginLeft: 4 }}
              size="small"
              onClick={handleSetLinkId(id)}
            >
              <LinkIcon />
            </IconButton>,
            <IconButton
              key={1}
              style={{ marginLeft: 4 }}
              size="small"
              onClick={handleEditing(entry)}
            >
              <EditIcon />
            </IconButton>,
            <IconButton
              key={2}
              style={{ marginLeft: 4 }}
              size="small"
              onClick={setDeleting(entry)}
            >
              <DeleteIcon />
            </IconButton>,
          ],
        },
      ]);
      repairs
        .filter(({ serviceItemId }) => serviceItemId === id)
        .forEach(repair => {
          data.push([
            {
              value: (
                <PlainForm<Repair>
                  key={repair.id}
                  schema={REPAIR_SCHEMA}
                  data={repair}
                  onChange={handleChangeRepair(repair)}
                  className="ServiceItemsRepairs"
                />
              ),
              actions: [
                <IconButton
                  key={0}
                  style={{ marginLeft: 4 }}
                  size="small"
                  onClick={handleDeleteRepair(repair)}
                >
                  <DeleteIcon />
                </IconButton>,
              ],
            },
          ]);
        });
    });
    return data;
  };
  const data: Data = loading || loadingProp ? makeFakeRows() : makeData();
  return (
    <div className={className}>
      <SectionBar
        title={title}
        actions={[
          ...actions.map(item => ({
            ...item,
            disabled: loading || loadingProp,
          })),
          {
            label: 'Add',
            onClick: handleEditing({} as Entry),
            disabled: loading || loadingProp,
          },
        ]}
        pagination={{
          count,
          page,
          rowsPerPage: ROWS_PER_PAGE,
          onChangePage: handleChangePage,
        }}
        asideContent={asideContent}
        asideContentFirst
      >
        {children}
        <InfoTable
          data={data}
          loading={loading || loadingProp}
          error={error}
          compact
          hoverable
        />
      </SectionBar>
      {linkId && (
        <Modal open onClose={handleSetLinkId(undefined)}>
          <ServiceItemLinks
            kind="Service Item Link"
            title={entries.find(({ id }) => id === linkId)?.type}
            serviceItemId={linkId}
            onClose={handleSetLinkId(undefined)}
          />
        </Modal>
      )}
      {editing && (
        <Modal open onClose={handleEditing()} fullScreen>
          <div className="ServiceItemsModal">
            <Form<Entry>
              title={`${editing.id ? 'Edit' : 'Add'} Service Item`}
              schema={SCHEMA}
              data={editing}
              onSave={handleSave}
              onClose={handleEditing()}
              disabled={saving}
              className="ServiceItemsForm"
            />
            {editing.id && (
              <div className="ServiceItemsReadings">
                <ServiceItemReadings {...props} serviceItemId={editing.id} />
              </div>
            )}
          </div>
        </Modal>
      )}
      {deletingEntry && (
        <ConfirmDelete
          open
          onClose={setDeleting()}
          onConfirm={handleDelete}
          kind="Service Item"
          name={deletingEntry.type}
        />
      )}
    </div>
  );
};
