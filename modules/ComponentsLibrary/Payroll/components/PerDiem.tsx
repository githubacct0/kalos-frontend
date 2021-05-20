import React, { FC, useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/esm';
import IconButton from '@material-ui/core/IconButton';
import FlashOff from '@material-ui/icons/FlashOff';
import Visibility from '@material-ui/icons/Visibility';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import { Modal } from '../../Modal';
import { SectionBar } from '../../SectionBar';
import { PerDiemComponent } from '../../PerDiem';
import { InfoTable } from '../../InfoTable';
import { PlainForm, Schema } from '../../PlainForm';
import { TripInfoTable } from '../../TripInfoTable';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import { Tooltip } from '../../Tooltip';
import { Confirm } from '../../Confirm';
import { Button } from '../../Button';
import {
  PerDiemType,
  makeFakeRows,
  formatDate,
  PerDiemClientService,
  getSlackID,
  slackNotify,
} from '../../../../helpers';
import { NULL_TIME, OPTION_ALL, ROWS_PER_PAGE } from '../../../../constants';
import { RoleType } from '../index';
import { getDepartmentName } from '@kalos-core/kalos-rpc/Common';
import { PerDiem as PerDiemReq } from '@kalos-core/kalos-rpc/PerDiem';

interface Props {
  loggedUserId: number;
  departmentId: number;
  employeeId: number;
  week: string;
  role: RoleType;
}

const formatWeek = (date: string) => {
  const d = parseISO(date);
  return `Week of ${format(d, 'MMMM')}, ${format(d, 'do')}`;
};

export const PerDiem: FC<Props> = ({
  loggedUserId,
  departmentId,
  employeeId,
  week,
  role,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [perDiems, setPerDiems] = useState<PerDiemType[]>([]);
  const [page, setPage] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [perDiemViewed, setPerDiemViewed] = useState<PerDiemType>();
  const [pendingApprove, setPendingApprove] = useState<PerDiemType>();
  const [pendingAudited, setPendingAudited] = useState<PerDiemType>();
  const [pendingDeny, setPendingDeny] = useState<PerDiemType>();
  const [rejectionMessage, setRejectionMessage] = useState<string>('');
  const [toggleButton, setToggleButton] = useState<boolean>(false);
  const [pendingPayroll, setPendingPayroll] = useState<PerDiemType>();
  const [
    pendingPayrollReject,
    setPendingPayrollReject,
  ] = useState<PerDiemType>();
  const managerFilter = role === 'Manager';
  const auditorFilter = role == 'Auditor';
  const payrollFilter = role == 'Payroll';
  const load = useCallback(async () => {
    setLoading(true);
    const perDiems = await PerDiemClientService.loadPerDiemsForPayroll(
      page,
      auditorFilter,
      payrollFilter,
      managerFilter,
      departmentId,
      employeeId,
      week === OPTION_ALL ? undefined : week,
      toggleButton,
    );
    if (role == 'Payroll' && toggleButton == false) {
      let sortedList = perDiems.resultsList.sort((a, b) =>
        a.dateApproved > b.dateApproved ? -1 : 1,
      );
      setPerDiems(sortedList);
    } else {
      let sortedList = perDiems.resultsList.sort((a, b) =>
        a.dateStarted > b.dateStarted ? -1 : 1,
      );
      setPerDiems(sortedList);
    }
    setCount(perDiems.totalCount);
    setLoading(false);
  }, [
    departmentId,
    employeeId,
    week,
    role,
    page,
    managerFilter,
    payrollFilter,
    auditorFilter,
    toggleButton,
  ]);
  useEffect(() => {
    load();
  }, [load]);
  const handlePerDiemViewedToggle = useCallback(
    (perDiem?: PerDiemType) => () => setPerDiemViewed(perDiem),
    [setPerDiemViewed],
  );
  const handlePendingApproveToggle = useCallback(
    (perDiem?: PerDiemType) => () => setPendingApprove(perDiem),
    [setPendingApprove],
  );
  const handlePendingDenyToggle = useCallback(
    (perDiem?: PerDiemType) => () => setPendingDeny(perDiem),
    [setPendingDeny],
  );
  const handlePendingAuditedToggle = useCallback(
    (perDiem?: PerDiemType) => () => setPendingAudited(perDiem),
    [setPendingAudited],
  );
  const handlePendingPayrollToggle = useCallback(
    (perDiem?: PerDiemType) => () => setPendingPayroll(perDiem),
    [setPendingPayroll],
  );
  const handlePendingPayrollToggleReject = useCallback(
    (perDiem?: PerDiemType) => () => {
      setPendingPayrollReject(perDiem);
    },
    [setPendingPayrollReject],
  );
  const handleApprove = useCallback(async () => {
    if (!pendingApprove) return;
    const { id } = pendingApprove;
    setLoading(true);
    setPendingApprove(undefined);
    await PerDiemClientService.approvePerDiemById(id, loggedUserId);
    load();
  }, [load, loggedUserId, pendingApprove]);
  const handleDeny = useCallback(async () => {
    if (!pendingDeny) return;
    const { id } = pendingDeny;
    const slackID = await getSlackID(pendingDeny.ownerName);
    if (slackID != '0') {
      slackNotify(
        slackID,
        `Your PerDiem for ${formatWeek(
          pendingDeny.dateStarted,
        )} was denied by Manager for the following reason:` + rejectionMessage,
      );
    } else {
      console.log('We could not find the user, but we will still reject');
    }
    const req = new PerDiemReq();
    req.setId(id);
    req.setDateSubmitted(NULL_TIME);
    setLoading(true);
    setPendingDeny(undefined);
    await PerDiemClientService.Update(req);
    load();
  }, [load, pendingDeny, rejectionMessage]);
  const handleAudit = useCallback(async () => {
    if (pendingAudited) {
      const { id } = pendingAudited;
      setLoading(true);
      setPendingAudited(undefined);
      await PerDiemClientService.updatePerDiemNeedsAudit(id);
      load();
    }
  }, [load, pendingAudited]);
  const handlePayroll = useCallback(async () => {
    if (pendingPayroll) {
      const { id } = pendingPayroll;
      setLoading(true);
      setPendingPayroll(undefined);
      await PerDiemClientService.updatePerDiemPayrollProcessed(id);
      load();
    }
  }, [load, pendingPayroll]);
  const handlePayrollRejected = useCallback(async () => {
    if (pendingPayrollReject) {
      const { id } = pendingPayrollReject;
      const slackID = await getSlackID(pendingPayrollReject.ownerName);
      if (slackID != '0') {
        slackNotify(
          slackID,
          `Your PerDiem for ${formatWeek(
            pendingPayrollReject.dateStarted,
          )} was rejected by Payroll for the following reason:` +
            rejectionMessage,
        );
      } else {
        console.log('We could not find the user, but we will still reject');
      }
      setLoading(true);
      setPendingPayrollReject(undefined);
      const req = new PerDiemReq();
      req.setPayrollProcessed(false);
      req.setId(id);
      req.setDateApproved(NULL_TIME);
      req.setApprovedById(0);
      req.setFieldMaskList(['DateApproved', 'ApprovedById']);
      await PerDiemClientService.Update(req);
    }
    load();
  }, [load, pendingPayrollReject, rejectionMessage]);
  return (
    <div>
      <SectionBar
        title="Per Diems"
        pagination={{
          page,
          count,
          rowsPerPage: ROWS_PER_PAGE,
          onChangePage: setPage,
        }}
      />
      {role === 'Payroll' && (
        <Button
          label={
            toggleButton === false
              ? 'Show Processed Records'
              : 'Show Unprocessed Records'
          }
          onClick={() => setToggleButton(!toggleButton)}
        ></Button>
      )}
      <InfoTable
        columns={[
          { name: 'Employee' },
          { name: 'Department' },
          { name: 'Week' },
          { name: 'Date' },
          //         { name: 'Approved' },
          //         { name: 'Needs Auditing' },
          //          { name: 'Payroll Processed' },
        ]}
        data={
          loading
            ? makeFakeRows(6, 3)
            : perDiems.map(el => {
                return [
                  {
                    value: el.ownerName,
                    onClick: handlePerDiemViewedToggle(el),
                  },
                  {
                    value: getDepartmentName(el.department),
                    onClick: handlePerDiemViewedToggle(el),
                  },
                  {
                    value: formatWeek(el.dateStarted),
                    onClick: handlePerDiemViewedToggle(el),
                  },
                  {
                    value: `${formatDate(el.dateApproved)} by ${
                      el.approvedByName
                    }`,
                    onClick: handlePerDiemViewedToggle(el),
                    actions: [
                      <Tooltip
                        key="view"
                        content="View Per Diem"
                        placement="bottom"
                      >
                        <IconButton
                          size="small"
                          onClick={handlePerDiemViewedToggle(el)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>,
                      role === 'Manager' ? (
                        <Tooltip
                          key="approve"
                          content="Approve"
                          placement="bottom"
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={handlePendingApproveToggle(el)}
                            >
                              <CheckCircleOutlineIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null,
                      role === 'Manager' ? (
                        <Tooltip key="deny" content="Deny" placement="bottom">
                          <span>
                            <IconButton
                              size="small"
                              onClick={handlePendingDenyToggle(el)}
                            >
                              <NotInterestedIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null,
                      role === 'Auditor' ? (
                        <Tooltip
                          key="audit"
                          content="Auditing"
                          placement="bottom"
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={handlePendingAuditedToggle(el)}
                            >
                              <FlashOff />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null,
                      role === 'Payroll' ? (
                        <Tooltip
                          key="payroll process"
                          content="Payroll Process"
                          placement="bottom"
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={handlePendingPayrollToggle(el)}
                              disabled={
                                el.payrollProcessed ||
                                el.dateApproved === NULL_TIME
                              }
                            >
                              <AccountBalanceWalletIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null,
                      role === 'Payroll' ? (
                        <Tooltip
                          key="payroll reject "
                          content="Reject"
                          placement="bottom"
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={handlePendingPayrollToggleReject(el)}
                              disabled={
                                el.payrollProcessed ||
                                el.dateApproved === NULL_TIME
                              }
                            >
                              <NotInterestedIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null,
                    ],
                  },
                ];
              })
        }
        loading={loading}
      />
      {perDiemViewed && (
        <Modal open onClose={handlePerDiemViewedToggle(undefined)} fullScreen>
          <SectionBar
            title={`Per Diem: ${perDiemViewed.ownerName}`}
            subtitle={
              <>
                Department: {getDepartmentName(perDiemViewed.department)}
                <br />
                {formatWeek(perDiemViewed.dateStarted)}
              </>
            }
            actions={[
              { label: 'Close', onClick: handlePerDiemViewedToggle(undefined) },
            ]}
            fixedActions
            className="PerDiemNeedsAuditingModalBar"
          />
          <PerDiemComponent
            onClose={handlePerDiemViewedToggle(undefined)}
            perDiem={perDiemViewed}
            loggedUserId={loggedUserId}
          />
        </Modal>
      )}
      {pendingApprove && (
        <Confirm
          title="Confirm Approve"
          open
          onClose={handlePendingApproveToggle()}
          onConfirm={handleApprove}
        >
          Are you sure you want to approve this Per Diem?
        </Confirm>
      )}
      {pendingDeny && (
        <Confirm
          title="Confirm Deny"
          open
          onClose={handlePendingDenyToggle()}
          onConfirm={handleDeny}
        >
          Are you sure you want to deny this Per Diem?
          <br></br>
          <label>
            <strong>Reason:</strong>
          </label>
          <input
            type="text"
            value={rejectionMessage}
            autoFocus
            size={35}
            placeholder="Enter a rejection reason"
            onChange={e => setRejectionMessage(e.target.value)}
          />
        </Confirm>
      )}
      {pendingAudited && (
        <Confirm
          title="Confirm Auditing"
          open
          onClose={handlePendingAuditedToggle()}
          onConfirm={handleAudit}
        >
          Are you sure this Per Diem no longer needs auditing?
        </Confirm>
      )}
      {pendingPayroll && (
        <Confirm
          title="Confirm Approve"
          open
          onClose={handlePendingPayrollToggle()}
          onConfirm={handlePayroll}
        >
          Are you sure you want to process payroll for this Per Diem?
        </Confirm>
      )}
      {pendingPayrollReject && (
        <Confirm
          title="Confirm Rejection"
          open
          onClose={handlePendingPayrollToggleReject()}
          onConfirm={handlePayrollRejected}
        >
          Are you sure you want to reject this Per Diem?
          <br></br>
          <label>
            <strong>Reason:</strong>
          </label>
          <input
            type="text"
            value={rejectionMessage}
            autoFocus
            size={35}
            placeholder="Enter a rejection reason"
            onChange={e => setRejectionMessage(e.target.value)}
          />
        </Confirm>
      )}
    </div>
  );
};
