import React, { FC, useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { parseISO } from 'date-fns/esm';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import { SectionBar } from '../../../ComponentsLibrary/SectionBar';
import { InfoTable } from '../../../ComponentsLibrary/InfoTable';
import { Modal } from '../../../ComponentsLibrary/Modal';
import { Timesheet as TimesheetComponent } from '../../../ComponentsLibrary/Timesheet';
import { TimesheetLineType, makeFakeRows, UserType } from '../../../../helpers';
import { ROWS_PER_PAGE, OPTION_ALL } from '../../../../constants';
import {
  TimesheetLine,
  TimesheetLineClient,
} from '@kalos-core/kalos-rpc/TimesheetLine';
import { ENDPOINT, NULL_TIME } from '../../../../constants';
import { RoleType } from '../index';
import { PropertyService } from '@kalos-core/kalos-rpc/compiled-protos/property_pb_service';
import { Button } from '../../Button';
import { NULL_TIME_VALUE } from '../../Timesheet/constants';
import { stubFalse } from 'lodash';
import { CostSummary } from '../../CostSummary';
interface Props {
  departmentId: number;
  employeeId: number;
  week: string;
  type: RoleType;
  loggedUser: number;
}

const formatWeek = (date: string) => {
  const d = parseISO(date);
  return `Week of ${format(d, 'yyyy')} ${format(d, 'MMMM')}, ${format(
    d,
    'do',
  )}`;
};

export const PayrollSummary: FC<Props> = ({
  employeeId,
  week,
  type,
  loggedUser,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [timesheets, setTimesheets] = useState<TimesheetLineType[]>([]);
  const [page, setPage] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [toggle, setToggle] = useState<boolean>(false);
  const [pendingView, setPendingView] = useState<TimesheetLineType>();
  const load = useCallback(async () => {
    setLoading(true);
    const filter = {
      page,
      employeeId,
      type: type,
      toggle,
    };
    if (week !== OPTION_ALL) {
      Object.assign(filter, {
        startDate: week,
        endDate: format(addDays(new Date(week), 6), 'yyyy-MM-dd'),
      });
    }
    const getTimesheets = createTimesheetFetchFunction(filter);
    const { resultsList, totalCount } = (await getTimesheets()).toObject();
    setTimesheets(resultsList);
    setCount(totalCount);
    setLoading(false);
  }, [page, employeeId, week, type, toggle]);
  useEffect(() => {
    load();
  }, [load]);
  const handleTogglePendingView = useCallback(
    (pendingView?: TimesheetLineType) => () => {
      setPendingView(pendingView);
      load();
    },
    [load],
  );
  const handleSetToggle = () => {
    if (toggle === true) {
      setToggle(false);
    } else {
      setToggle(true);
    }
  };
  return (
    <div>
      <SectionBar
        title="Payroll Summary"
        pagination={{
          count,
          page,
          rowsPerPage: ROWS_PER_PAGE,
          onChangePage: setPage,
        }}
      />
      <Button label="Toggle For Values" onClick={handleSetToggle}></Button>
      <InfoTable
        columns={[
          { name: 'Employee' },
          { name: 'Department' },
          { name: 'Admin Approval Date' },
        ]}
        loading={loading}
        data={
          loading
            ? makeFakeRows(3, 4)
            : timesheets.map(e => {
                return [
                  {
                    value: e.technicianUserName,
                    onClick: handleTogglePendingView(e),
                  },
                  {
                    value: e.departmentName,
                    onClick: handleTogglePendingView(e),
                  },

                  {
                    value:
                      e.adminApprovalDatetime === NULL_TIME_VALUE
                        ? 'Not Approved'
                        : formatWeek(e.adminApprovalDatetime),
                    onClick: handleTogglePendingView(e),
                    actions: [
                      <IconButton
                        key="view"
                        onClick={handleTogglePendingView(e)}
                        size="small"
                      >
                        <Visibility />
                      </IconButton>,
                    ],
                  },
                ];
              })
        }
      />
      {pendingView && (
        <Modal
          open={pendingView ? true : false}
          onClose={handleTogglePendingView(undefined)}
        >
          <CostSummary
            userId={
              employeeId === 0 ? pendingView.technicianUserId : employeeId
            }
            username={pendingView.technicianUserName}
            onClose={handleTogglePendingView(undefined)}
            loggedUserId={loggedUser}
            notReady={toggle}
          ></CostSummary>
        </Modal>
      )}
    </div>
  );
};

interface GetTimesheetConfig {
  page?: number;
  departmentId?: number;
  employeeId: number;
  startDate?: string;
  endDate?: string;
  toggle: boolean;
}

const createTimesheetFetchFunction = (config: GetTimesheetConfig) => {
  const req = new TimesheetLine();
  console.log(config.toggle);
  req.setPageNumber(config.page || 0);
  req.setOrderBy('time_started');
  req.setGroupBy('technician_user_id');
  req.setIsActive(1);
  const client = new TimesheetLineClient(ENDPOINT);
  if (config.startDate && config.endDate) {
    req.setDateRangeList(['>=', config.startDate, '<=', config.endDate]);
  }
  if (config.employeeId) {
    req.setTechnicianUserId(config.employeeId);
  }

  if (config.toggle === true) {
    //look like manager
    req.setUserApprovalDatetime(NULL_TIME_VALUE);
    req.setNotEqualsList(['UserApprovalDatetime']);
  }
  if (config.toggle === false) {
    req.setAdminApprovalUserId(0);
    req.setNotEqualsList(['AdminApprovalUserId']);
  }
  if (config.toggle === true) {
    //return like manager
    console.log('we shall see what remains');
    return () => client.BatchGetManager(req); // Goes to the manager View in the database instead of the combined view from before, speed gains
  } else {
    return () => client.BatchGetPayroll(req); // Payroll does the same but to a specific Payroll view
  }
};

const getManagerTimesheets = () => {};

const getPayrollTimesheets = () => {};