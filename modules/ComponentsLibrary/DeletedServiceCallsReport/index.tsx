import React, { FC, useState, useCallback, useEffect } from 'react';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { SectionBar } from '../SectionBar';
import { InfoTable, Data } from '../InfoTable';
import { PrintPage, Status } from '../PrintPage';
import { PrintTable } from '../PrintTable';
import { PrintHeaderSubtitleItem } from '../PrintHeader';
import { PlainForm, Schema } from '../PlainForm';
import { Button } from '../Button';
import { ServiceCall } from '../ServiceCall';
import { Modal } from '../Modal';
import {
  makeFakeRows,
  loadDeletedServiceCallsByFilter,
  EventType,
  formatDate,
  getPropertyAddress,
  getCustomerName,
  getCFAppUrl,
  loadEventsByFilterDeleted,
} from '../../../helpers';
import { ROWS_PER_PAGE } from '../../../constants';

interface Props {
  loggedUserId: number;
  onClose?: () => void;
  dateStarted: string;
  dateEnded: string;
  businessname?: string;
  lastname?: string;
}

type FilterForm = {
  businessname?: string;
  lastname?: string;
  dateStarted: string;
  dateEnded: string;
  isActive?: boolean;
};

const COLUMNS = ['Property', 'Customer Name', 'Job', 'Date', 'Job Status'];

export const DeletedServiceCallsReport: FC<Props> = ({
  loggedUserId,
  dateStarted,
  dateEnded,
  businessname,
  lastname,
  onClose,
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<EventType[]>([]);
  const [printEntries, setPrintEntries] = useState<EventType[]>([]);
  const [page, setPage] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [form, setForm] = useState<FilterForm>({
    dateStarted,
    dateEnded,
    businessname,
    lastname,
    isActive: false,
  });
  const [printStatus, setPrintStatus] = useState<Status>('idle');
  const [pendingEdit, setPendingEdit] = useState<EventType>();
  const load = useCallback(async () => {
    setLoading(true);
    console.log({ form });
    const { results, totalCount } = await loadEventsByFilterDeleted({
      page: -1,
      filter: form,
      sort: {
        orderBy: 'date_started',
        orderByField: 'dateStarted',
        orderDir: 'ASC',
      },
    });
    setEntries(results);
    console.log({ results });
    setCount(totalCount);
    setLoading(false);
  }, [setLoading, form]);
  useEffect(() => {
    if (!loaded) {
      setLoaded(true);
      load();
    }
  }, [setLoaded, loaded, load]);
  const reload = useCallback(() => setLoaded(false), [setLoaded]);
  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
      reload();
    },
    [setPage, reload],
  );
  const loadPrintEntries = useCallback(async () => {
    if (printEntries.length === count) return;
    const { results } = await loadEventsByFilterDeleted({
      page: -1,
      filter: form,
      sort: {
        orderBy: 'date_started',
        orderByField: 'dateStarted',
        orderDir: 'ASC',
      },
    });
    setPrintEntries(results);
  }, [setPrintEntries, form, printEntries, count]);
  const handlePrint = useCallback(async () => {
    setPrintStatus('loading');
    await loadPrintEntries();
    setPrintStatus('loaded');
  }, [loadPrintEntries, setPrintStatus]);
  const handlePrinted = useCallback(() => setPrintStatus('idle'), [
    setPrintStatus,
  ]);
  const handleSearch = useCallback(() => setLoaded(false), [setForm]);
  const handleSetPendingEdit = useCallback(
    (pendingEdit?: EventType) => () => setPendingEdit(pendingEdit),
    [setPendingEdit],
  );
  const handleOpenTasks = useCallback(
    (entry: EventType) => () => {
      // TODO Replace with react Tasks module, once it's built
      window.open(
        [
          getCFAppUrl('admin:tasks.list'),
          'code=servicecall',
          `id=${entry.id}`,
        ].join('&'),
      );
    },
    [],
  );
  const SCHEMA: Schema<FilterForm> = [
    [
      {
        name: 'lastname',
        label: 'Last Name',
        type: 'search',
      },
      {
        name: 'businessname',
        label: 'Business Name',
        type: 'search',
      },
      {
        name: 'dateStarted',
        label: 'Start Date',
        type: 'date',
      },
      {
        name: 'dateEnded',
        label: 'End Date',
        type: 'date',
        actions: [{ label: 'Search', onClick: handleSearch }],
      },
    ],
  ];
  const getData = (entries: EventType[]): Data =>
    loading
      ? makeFakeRows(5, 5)
      : entries.map(entry => {
          const {
            id,
            property,
            customer,
            name,
            dateStarted,
            logJobStatus,
          } = entry;
          const disabled = !property || !customer;
          return [
            {
              value: getPropertyAddress(property),
              onClick: handleSetPendingEdit(entry),
            },
            {
              value: getCustomerName(customer),
              onClick: handleSetPendingEdit(entry),
            },
            { value: name, onClick: handleSetPendingEdit(entry) },
            {
              value: formatDate(dateStarted),
              onClick: handleSetPendingEdit(entry),
            },
            {
              value: logJobStatus,
              onClick: handleSetPendingEdit(entry),
              actions: [
                <IconButton
                  key="tasks"
                  size="small"
                  onClick={handleOpenTasks(entry)}
                >
                  <AssignmentIcon />
                </IconButton>,
                <IconButton
                  key="edit"
                  size="small"
                  disabled={disabled}
                  onClick={handleSetPendingEdit(entry)}
                >
                  <EditIcon />
                </IconButton>,
              ],
            },
          ];
        });
  const allPrintData = entries.length === count;
  const printHeaderSubtitle = (
    <>
      {dateStarted && (
        <PrintHeaderSubtitleItem label="Start date" value={dateStarted} />
      )}
      {dateEnded && (
        <PrintHeaderSubtitleItem label="End date" value={dateEnded} />
      )}
    </>
  );
  return (
    <div>
      <SectionBar
        title="Deleted Service Calls Report"
        pagination={{
          page,
          count,
          rowsPerPage: ROWS_PER_PAGE,
          onChangePage: handlePageChange,
        }}
        asideContent={
          <>
            <PrintPage
              headerProps={{
                title: 'Deleted Service Calls Report',
                subtitle: printHeaderSubtitle,
              }}
              onPrint={allPrintData ? undefined : handlePrint}
              onPrinted={handlePrinted}
              status={printStatus}
            >
              <PrintTable
                columns={COLUMNS}
                data={getData(allPrintData ? entries : printEntries).map(row =>
                  row.map(({ value }) => value),
                )}
              />
            </PrintPage>
            {onClose && <Button label="Close" onClick={onClose} />}
          </>
        }
      />
      <PlainForm schema={SCHEMA} data={form} onChange={setForm} />
      <InfoTable
        columns={COLUMNS.map(name => ({ name }))}
        data={getData(entries)}
        loading={loading}
        skipPreLine
      />
      {pendingEdit && (
        <Modal open onClose={handleSetPendingEdit()} fullScreen>
          <ServiceCall
            serviceCallId={pendingEdit.id}
            userID={pendingEdit.customer!.id}
            propertyId={pendingEdit.property!.id}
            loggedUserId={loggedUserId}
            onClose={handleSetPendingEdit()}
          />
        </Modal>
      )}
    </div>
  );
};
