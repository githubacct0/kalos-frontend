import React, { FC, useState, useEffect, useCallback } from 'react';
import {
  TimesheetLine,
  TimesheetLineClient,
  TimesheetLineList,
} from '@kalos-core/kalos-rpc/TimesheetLine';
import { Button } from '../Button';
import CheckIcon from '@material-ui/icons/Check';
import IconButton from '@material-ui/core/IconButton';
import { PerDiem } from '@kalos-core/kalos-rpc/PerDiem';
import { InfoTable } from '../InfoTable';
import { Loader } from '../../Loader/main';
import { SectionBar } from '../SectionBar';
import { ENDPOINT, MEALS_RATE } from '../../../constants';
import { SpiffToolAdminAction } from '@kalos-core/kalos-rpc/SpiffToolAdminAction';
import { TaskClient, Task } from '@kalos-core/kalos-rpc/Task';
import {
  differenceInMinutes,
  parseISO,
  differenceInCalendarDays,
  subDays,
  addDays,
  startOfWeek,
  format,
  endOfWeek,
} from 'date-fns';
import {
  Trip,
  TripList,
} from '@kalos-core/kalos-rpc/compiled-protos/perdiem_pb';
import {
  roundNumber,
  formatDate,
  TaskClientService,
  TimeoffRequestClientService,
  PerDiemRowType,
  PerDiemClientService,
  PerDiemType,
  usd,
  timestamp,
  SpiffToolAdminActionClientService,
} from '../../../helpers';
import { NULL_TIME_VALUE } from '../Timesheet/constants';
interface Props {
  userId: number;
  loggedUserId: number;
  notReady: boolean;
  onClose: (() => void) | null;
  onNext?: (() => void) | null;
  username: string;
}

export const CostSummary: FC<Props> = ({
  userId,
  notReady,
  onClose,
  onNext,
  username,
}) => {
  const [totalHoursProcessed, setTotalHoursProcessed] = useState<number>(0);

  const [totalSpiffsProcessed, setTotalSpiffsProcessed] = useState<number>(0);

  const [totalSpiffsWeekly, setTotalSpiffsWeekly] = useState<number>(0);
  const [spiffsWeekly, setSpiffsWeekly] = useState<Task[]>();
  const [totalPTO, setTotalPTO] = useState<number>(0);
  const [totalPerDiem, setTotalPerDiem] = useState<{
    totalMeals: number;
    totalLodging: number;
    totalMileage: number;
    processed: number;
  }>({ totalMeals: 0, totalLodging: 0, totalMileage: 0, processed: 0 });
  const [totalPerDiemProcessed, setTotalPerDiemProcessed] = useState<{
    totalMeals: number;
    totalLodging: number;
    totalMileage: number;
    processed: number;
  }>({ totalMeals: 0, totalLodging: 0, totalMileage: 0, processed: 0 });
  const [perDiems, setPerDiems] = useState<PerDiemType[]>([]);
  const [trips, setTrips] = useState<Trip[]>();
  const [tripsTotal, setTripsTotal] = useState<{
    totalDistance: number;
    processed: boolean;
  }>({ totalDistance: 0, processed: true });

  const [tripsTotalProcessed, setTripsTotalProcessed] = useState<{
    totalDistance: number;
    processed: boolean;
  }>({ totalDistance: 0, processed: true });
  const [loaded, setLoaded] = useState<boolean>(false);
  const today = new Date();
  const startDay = startOfWeek(subDays(today, 7), { weekStartsOn: 6 });
  const endDay = addDays(startDay, 7);
  const perDiemEndDay = addDays(startOfWeek(today, { weekStartsOn: 6 }), 4);
  const formatDateFns = (date: Date) => format(date, 'yyyy-MM-dd');
  const getTrips = useCallback(async () => {
    let trip = new Trip();
    trip.setUserId(userId);
    let processed = true;

    trip.setApproved(true);
    trip.setDateTargetList(['date_processed', 'date_processed']);
    trip.setDateRangeList(['>=', '0001-01-01', '<=', formatDateFns(endDay)]);
    let tempTripList = (
      await PerDiemClientService.BatchGetTrips(trip)
    ).getResultsList();
    setTrips(tempTripList);
    let distanceSubtotal = 0;
    for (let j = 0; j < tempTripList.length; j++) {
      if (tempTripList[j].getHomeTravel()) {
        if (tempTripList[j].getDistanceInMiles() < 30) {
          distanceSubtotal += 0;
        } else {
          distanceSubtotal += tempTripList[j].getDistanceInMiles() - 30;
        }
      } else {
        distanceSubtotal += tempTripList[j].toObject().distanceInMiles;
      }
      if (tempTripList[j].toObject().payrollProcessed === false) {
        processed = false;
      }
    }
    return { totalDistance: distanceSubtotal, processed };
  }, [endDay, userId]);
  const getTripsProcessed = useCallback(async () => {
    let trip = new Trip();
    trip.setUserId(userId);
    let processed = true;

    trip.setDateTargetList(['date_processed', 'date_processed']);
    trip.setDateRangeList([
      '>=',
      formatDateFns(startOfWeek(new Date())),
      '<=',
      formatDateFns(endOfWeek(new Date())),
    ]);
    let tempTripList = (
      await PerDiemClientService.BatchGetTrips(trip)
    ).getResultsList();
    let distanceSubtotal = 0;
    for (let j = 0; j < tempTripList.length; j++) {
      if (tempTripList[j].getHomeTravel()) {
        if (tempTripList[j].getDistanceInMiles() < 30) {
          distanceSubtotal += 0;
        } else {
          tempTripList[j].setDistanceInMiles(
            (distanceSubtotal += tempTripList[j].getDistanceInMiles() - 30),
          );
        }
      } else {
        distanceSubtotal += tempTripList[j].toObject().distanceInMiles;
      }
      if (tempTripList[j].toObject().payrollProcessed === false) {
        processed = false;
      }
    }
    return { totalDistance: distanceSubtotal, processed };
  }, [userId]);
  const getPerDiemTotals = useCallback(async () => {
    const {
      resultsList,
    } = await PerDiemClientService.loadPerDiemByUserIdAndDateStartedAudited(
      userId,
      formatDateFns(perDiemEndDay),
    );
    //get PerDiems, set them
    setPerDiems(resultsList);
    const year = +format(startDay, 'yyyy');
    const month = +format(startDay, 'M');
    const zipCodesList = [];
    for (let i = 0; i < resultsList.length; i++) {
      let zipCodes = [resultsList[i]]
        .reduce(
          (aggr, { rowsList }) => [...aggr, ...rowsList],
          [] as PerDiemRowType[],
        )
        .map(({ zipCode }) => zipCode);
      for (let j = 0; j < zipCodes.length; j++) {
        zipCodesList.push(zipCodes[j]);
      }
    }
    const govPerDiemsTemp = await PerDiemClientService.loadGovPerDiem(
      zipCodesList,
      year,
      month,
    );
    let processed = 0;
    let filteredPerDiems = resultsList;
    if (resultsList.length > 0) {
      for (let i = 0; i < resultsList.length; i++) {
        if (resultsList[i].payrollProcessed) {
          processed = 1;
        }
      }
    }
    function govPerDiemByZipCode(zipCode: string) {
      const govPerDiem = govPerDiemsTemp[zipCode];
      if (govPerDiem) return govPerDiem;
      return {
        meals: MEALS_RATE,
        lodging: 0,
      };
    }
    let allRowsList = filteredPerDiems.reduce(
      (aggr, { rowsList }) => [...aggr, ...rowsList],
      [] as PerDiemRowType[],
    );
    let totalMeals = allRowsList.reduce(
      (aggr, { zipCode }) => aggr + govPerDiemByZipCode(zipCode).meals,
      0,
    );
    let totalLodging = allRowsList.reduce(
      (aggr, { zipCode, mealsOnly }) =>
        aggr + (mealsOnly ? 0 : govPerDiemByZipCode(zipCode).lodging),
      0,
    );
    let totalMileage = 0;
    for (let i = 0; i < allRowsList.length; i++) {
      totalMileage = allRowsList[i].tripsList.reduce(
        (aggr, { distanceInMiles }) => aggr + distanceInMiles,
        0,
      );
    }

    const totals = { totalMeals, totalLodging, totalMileage, processed };

    return totals;
  }, [perDiemEndDay, userId, startDay]);

  const getPerDiemTotalsProcessed = useCallback(async () => {
    const perDiemReq = new PerDiem();
    perDiemReq.setDateTargetList(['date_processed', 'date_processed']);
    perDiemReq.setUserId(userId);
    perDiemReq.setDateRangeList([
      '>=',
      formatDateFns(startOfWeek(new Date())),
      '<=',
      formatDateFns(endOfWeek(new Date())),
    ]);
    const resultsList = (
      await PerDiemClientService.BatchGet(perDiemReq)
    ).getResultsList();

    //get PerDiems, set them
    const year = +format(startDay, 'yyyy');
    const month = +format(startDay, 'M');
    const zipCodesList = [];
    for (let i = 0; i < resultsList.length; i++) {
      let zipCodes = [resultsList[i].toObject()]
        .reduce(
          (aggr, { rowsList }) => [...aggr, ...rowsList],
          [] as PerDiemRowType[],
        )
        .map(({ zipCode }) => zipCode);
      for (let j = 0; j < zipCodes.length; j++) {
        zipCodesList.push(zipCodes[j]);
      }
    }
    const govPerDiemsTemp = await PerDiemClientService.loadGovPerDiem(
      zipCodesList,
      year,
      month,
    );

    let filteredPerDiems = resultsList;
    function govPerDiemByZipCode(zipCode: string) {
      const govPerDiem = govPerDiemsTemp[zipCode];
      if (govPerDiem) return govPerDiem;
      return {
        meals: MEALS_RATE,
        lodging: 0,
      };
    }
    const processed = 1;
    let allRowsList = filteredPerDiems.reduce(
      (aggr: PerDiemRowType[], pd) => [...aggr, ...pd.toObject().rowsList],
      [],
    );
    let totalMeals = allRowsList.reduce(
      (aggr, { zipCode }) => aggr + govPerDiemByZipCode(zipCode).meals,
      0,
    );
    let totalLodging = allRowsList.reduce(
      (aggr, { zipCode, mealsOnly }) =>
        aggr + (mealsOnly ? 0 : govPerDiemByZipCode(zipCode).lodging),
      0,
    );
    let totalMileage = 0;
    for (let i = 0; i < allRowsList.length; i++) {
      totalMileage = allRowsList[i].tripsList.reduce(
        (aggr, { distanceInMiles }) => aggr + distanceInMiles,
        0,
      );
    }

    const totals = {
      totalMeals,
      totalLodging,
      totalMileage,
      processed: processed,
    };

    return totals;
  }, [startDay]);
  const getSpiffToolTotals = useCallback(
    async (spiffType: string, dateType = 'Weekly') => {
      const req = new Task();
      const action = new SpiffToolAdminAction();
      req.setPayrollProcessed(false);
      req.setExternalId(userId);
      if (spiffType === 'Spiff') {
        const startDate = '0001-01-01';
        const endDate = format(endDay, 'yyyy-MM-dd');
        req.setDateRangeList(['>=', startDate, '<', endDate]);
      }
      if (!notReady) {
        action.setStatus(1);
        req.setSearchAction(action);
        req.setFieldMaskList(['PayrollProcessed']);
      }
      if (notReady) {
        req.setFieldMaskList(['AdminActionId', 'PayrollProcessed']);
      }
      if (spiffType == 'Spiff') {
        req.setBillableType('Spiff');
      } else {
        req.setBillableType('Tool Purchase');
      }
      const results = (
        await new TaskClient(ENDPOINT).BatchGet(req)
      ).getResultsList();
      //Here, we'll run another request for revoked, and if it pops up, we will remove the approved,
      //and treat the value as a negative
      const revokeReq = req;
      const revokeAction = action;
      revokeAction.setStatus(3);
      revokeReq.setSearchAction(revokeAction);
      const revokeResults = (
        await new TaskClient(ENDPOINT).BatchGet(revokeReq)
      ).getResultsList();
      for (let i = 0; i < revokeResults.length; i++) {
        for (let j = 0; j < results.length; j++) {
          if (revokeResults[i].getId() === results[j].getId()) {
            const amount = revokeResults[i].getSpiffAmount();
            revokeResults[i].setSpiffAmount(amount - 2 * amount);
            results[j].setSpiffAmount(revokeResults[i].getSpiffAmount());
          }
        }
      }
      let spiffTotal = 0;
      let toolTotal = 0;
      for (let i = 0; i < results.length; i++) {
        if (spiffType == 'Spiff') {
          spiffTotal += results[i].toObject().spiffAmount;
        } else {
          toolTotal += results[i].toObject().toolpurchaseCost;
        }
      }
      if (spiffType === 'Spiff') {
        if (dateType === 'Weekly') {
          setSpiffsWeekly(results);
        }
        return spiffTotal;
      } else {
        return toolTotal;
      }
    },
    [notReady, userId, endDay],
  );
  const getSpiffToolTotalsProcessed = useCallback(
    async (spiffType: string, dateType = 'Weekly') => {
      const req = new Task();
      const action = new SpiffToolAdminAction();
      req.setExternalId(userId);
      if (spiffType == 'Spiff') {
        req.setBillableType('Spiff');
      } else {
        req.setBillableType('Tool Purchase');
      }
      const results = [];

      action.setDateRangeList([
        '>=',
        formatDateFns(startOfWeek(new Date())),
        '<=',
        formatDateFns(endOfWeek(new Date())),
      ]);
      action.setDateTargetList(['date_processed', 'date_processed']);

      req.setSearchAction(action);

      console.log({ req });
      const tempResults = (
        await new TaskClient(ENDPOINT).BatchGet(req)
      ).getResultsList();
      if (tempResults.length > 0) {
        for (let j = 0; j < tempResults.length; j++) {
          results.push(tempResults[j]);
        }
      }

      //Here, we'll run another request for revoked, and if it pops up, we will remove the approved,
      //and treat the value as a negative
      const revokeReq = req;
      const revokeAction = action;
      revokeAction.setStatus(3);
      revokeReq.setSearchAction(revokeAction);
      const revokeResults = (
        await new TaskClient(ENDPOINT).BatchGet(revokeReq)
      ).getResultsList();
      for (let i = 0; i < revokeResults.length; i++) {
        for (let j = 0; j < results.length; j++) {
          if (revokeResults[i].getId() === results[j].getId()) {
            const amount = revokeResults[i].getSpiffAmount();
            revokeResults[i].setSpiffAmount(amount - 2 * amount);
            results[j].setSpiffAmount(revokeResults[i].getSpiffAmount());
          }
        }
      }
      console.log({ results });
      let spiffTotal = 0;
      let toolTotal = 0;
      for (let i = 0; i < results.length; i++) {
        if (spiffType == 'Spiff') {
          console.log(results[i].getActionsList()[0].getDateProcessed());
          spiffTotal += results[i].toObject().spiffAmount;
        } else {
          toolTotal += results[i].toObject().toolpurchaseCost;
        }
      }
      if (spiffType === 'Spiff') {
        return spiffTotal;
      } else {
        return toolTotal;
      }
    },
    [userId],
  );
  const getTimeoffTotals = useCallback(async () => {
    const startDate = format(startDay, 'yyyy-MM-dd');
    const endDate = format(endDay, 'yyyy-MM-dd');
    const filter = {
      technicianUserID: userId,
      requestType: notReady ? 10 : 9,
      startDate: startDate,
      endDate: endDate,
      payrollProcessed: true,
    };
    const results = (
      await TimeoffRequestClientService.loadTimeoffRequests(filter)
    ).resultsList;
    let total = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i].allDayOff === 0) {
        const timeFinished = results[i].timeFinished;
        const timeStarted = results[i].timeStarted;
        const subtotal = roundNumber(
          differenceInMinutes(parseISO(timeFinished), parseISO(timeStarted)) /
            60,
        );

        total += subtotal;
      } else {
        const timeFinished = results[i].timeFinished;
        const timeStarted = results[i].timeStarted;
        const numberOfDays =
          differenceInCalendarDays(
            parseISO(timeFinished),
            parseISO(timeStarted),
          ) + 1;
        total += numberOfDays * 8;
      }
    }
    return total;
  }, [userId, notReady, endDay, startDay]);
  const getProcessedHoursTotals = useCallback(async () => {
    const timesheetReq = new TimesheetLine();
    timesheetReq.setTechnicianUserId(userId);
    timesheetReq.setIsActive(1);
    timesheetReq.setWithoutLimit(true);
    const startDate = format(startDay, 'yyyy-MM-dd');
    const endDate = format(endDay, 'yyyy-MM-dd');
    timesheetReq.setDateRangeList(['>=', startDate, '<', endDate]);
    const client = new TimesheetLineClient(ENDPOINT);
    let results = new TimesheetLineList().getResultsList();
    timesheetReq.setOrderBy('time_started');
    timesheetReq.setNotEqualsList(['PayrollProcessed']);
    results = (await client.BatchGetPayroll(timesheetReq)).getResultsList();

    let total = 0;
    for (let i = 0; i < results.length; i++) {
      if (
        !results[i].toObject().referenceNumber.includes('PTO') &&
        !results[i].toObject().briefDescription.includes('PTO')
      ) {
        const timeFinished = results[i].toObject().timeFinished;
        const timeStarted = results[i].toObject().timeStarted;
        const subtotal = roundNumber(
          differenceInMinutes(parseISO(timeFinished), parseISO(timeStarted)) /
            60,
        );

        total += subtotal;
      }
    }
    return total;
  }, [endDay, startDay, userId]);

  const toggleProcessSpiffTool = async (spiffTool: Task.AsObject) => {
    spiffTool.payrollProcessed = true;
    const { id } = spiffTool;
    const req = new Task();
    req.setId(id);
    req.setFieldMaskList(['PayrollProcessed']);
    req.setPayrollProcessed(true);
    const adminReq = new SpiffToolAdminAction();
    await TaskClientService.Update(req);
    if (spiffTool.actionsList) {
      for (let i = 0; i < spiffTool.actionsList.length; i++) {
        if (spiffTool.actionsList[i].dateProcessed === NULL_TIME_VALUE) {
          adminReq.setId(spiffTool.actionsList[i].id);
          adminReq.setDateProcessed(timestamp());
          adminReq.setFieldMaskList(['DateProcessed']);
          await SpiffToolAdminActionClientService.Update(adminReq);
        }
      }
    }
  };
  const toggleProcessPerDiems = async (perDiems: PerDiem.AsObject[]) => {
    for (let i = 0; i < perDiems.length; i++) {
      let req = new PerDiem();
      req.setId(perDiems[i].id);
      req.setPayrollProcessed(true);
      req.setFieldMaskList(['Payroll{Processed', 'DateProcessed']);
      req.setDateProcessed(timestamp());
      await PerDiemClientService.Update(req);
    }
    if (trips && trips.length > 0) {
      for (let i = 0; i < trips.length; i++) {
        await PerDiemClientService.updateTripPayrollProcessed(
          trips[i].toObject().id,
        );
      }
    }
  };
  useEffect(() => {
    const load = async () => {
      let promises = [];

      promises.push(
        new Promise<void>(async (resolve, reject) => {
          try {
            const totalPTO = await getTimeoffTotals();
            setTotalPTO(totalPTO);
            resolve();
          } catch (err) {
            console.log('error setting total PTO', err);
            reject(err);
          }
        }),
      );
      promises.push(
        new Promise<void>(async (resolve, reject) => {
          try {
            const processedHours = await getProcessedHoursTotals();
            setTotalHoursProcessed(processedHours);
            resolve();
          } catch (err) {
            console.log('error setting total hours', err);
            reject(err);
          }
        }),
      );
      promises.push(
        new Promise<void>(async (resolve, reject) => {
          try {
            const spiffToolTotals = await getSpiffToolTotals('Spiff');
            setTotalSpiffsWeekly(spiffToolTotals);
            resolve();
          } catch (err) {
            console.log('error fetching total spiffs', err);
            reject(err);
          }
        }),
      );
      promises.push(
        new Promise<void>(async (resolve, reject) => {
          try {
            const spiffToolTotalsProcessed = await getSpiffToolTotalsProcessed(
              'Spiff',
            );
            setTotalSpiffsProcessed(spiffToolTotalsProcessed);
            resolve();
          } catch (err) {
            console.log('error fetching total spiffs processed', err);
            reject(err);
          }
        }),
      );
      promises.push(
        new Promise<void>(async (resolve, reject) => {
          try {
            resolve();
            const perDiemTotals = await getPerDiemTotals();
            setTotalPerDiem(perDiemTotals);
          } catch (err) {
            reject(err);
          }
        }),
      );
      promises.push(
        new Promise<void>(async (resolve, reject) => {
          try {
            resolve();
            const perDiemTotals = await getPerDiemTotals();
            setTotalPerDiemProcessed(await getPerDiemTotalsProcessed());
          } catch (err) {
            reject(err);
          }
        }),
      );
      promises.push(
        new Promise<void>(async (resolve, reject) => {
          try {
            const tripsData = await getTrips();
            setTripsTotal(tripsData);
            resolve();
          } catch (err) {
            console.log('error getting trips', err);
            reject(err);
          }
        }),
      );
      promises.push(
        new Promise<void>(async (resolve, reject) => {
          try {
            const tripsDataProcessed = await getTripsProcessed();
            setTripsTotalProcessed(tripsDataProcessed);
            console.log(tripsDataProcessed);
            resolve();
          } catch (err) {
            console.log('error getting trips', err);
            reject(err);
          }
        }),
      );
      setLoaded(true);
      try {
        await Promise.all(promises);
        // const res = await loadPayroll({PAYROLL PROTOBUFFER})
        console.log('all promises executed without error, setting loaded');
        setLoaded(true);
      } catch (err) {
        console.log('a promise failed');
        setLoaded(true);
      }
    };
    if (!loaded) load();
  }, [
    getProcessedHoursTotals,
    getTimeoffTotals,
    loaded,
    getPerDiemTotals,
    getSpiffToolTotals,
    getTrips,
    getSpiffToolTotalsProcessed,
    getTripsProcessed,
    getPerDiemTotalsProcessed,
  ]);
  return loaded ? (
    <div>
      <strong>{username}</strong>
      {onClose ? <Button label="Close" onClick={() => onClose()}></Button> : []}
      <InfoTable
        columns={[
          { name: 'Week' },
          { name: 'Total Hours Processed' },
          { name: 'PerDiem Lodging total Processed Last Week' },
          { name: 'PerDiem Meals total Processed Last Week' },
          { name: 'Trips Total Last Week' },
          { name: 'Total Spiffs Last Week' },
        ]}
        data={[
          [
            {
              value: formatDateFns(startDay),
            },
            {
              value: totalPTO + totalHoursProcessed,
            },
            {
              value: usd(totalPerDiemProcessed.totalLodging),
            },
            {
              value: usd(totalPerDiemProcessed.totalMeals),
            },
            {
              value: tripsTotalProcessed.totalDistance.toFixed(2) + ' miles',
            },
            {
              value: usd(totalSpiffsProcessed),
            },
          ],
        ]}
      ></InfoTable>

      <SectionBar
        title="Spiff Current Total"
        asideContent={
          <strong>Spiff Weekly Total : {usd(totalSpiffsWeekly)}</strong>
        }
        actionsAndAsideContentResponsive
      >
        <InfoTable
          columns={[
            { name: 'Date Created' },
            { name: 'Amount' },
            { name: 'Job Number' },
            { name: 'Processed' },
          ]}
          data={
            spiffsWeekly
              ? spiffsWeekly.map(spiff => {
                  return [
                    {
                      value: formatDate(spiff.toObject().timeCreated),
                    },
                    {
                      value: usd(spiff.toObject().spiffAmount),
                    },
                    {
                      value: spiff.toObject().spiffJobNumber,
                    },
                    {
                      value:
                        spiff.toObject().payrollProcessed === true
                          ? 'Complete'
                          : 'Incomplete',
                      actions:
                        spiff.toObject().payrollProcessed === false
                          ? [
                              <IconButton
                                key="processSpiffWeekly"
                                size="small"
                                onClick={() =>
                                  toggleProcessSpiffTool(spiff.toObject())
                                }
                              >
                                <CheckIcon />
                              </IconButton>,
                            ]
                          : [],
                    },
                  ];
                })
              : []
          }
        />
      </SectionBar>
      {/*
      <SectionBar
        title="Tool Current Total"
        asideContent={<strong>Tool Fund: {toolFund}</strong>}
        actionsAndAsideContentResponsive
      >
        <InfoTable
          columns={[
            { name: 'Date Created' },
            { name: 'Date Approved' },
            { name: 'Amount' },
            { name: 'Additional Info' },
          ]}
          data={tools!.map(tool => {
            return [
              {
                value: formatDate(tool.toObject().toolpurchaseDate),
              },
              {
                value: tool.toObject().searchAction?.reviewedBy,
              },
              {
                value: tool.toObject().toolpurchaseCost,
              },
              {
                value: tool.toObject().briefDescription,
                actions:
                  tool.toObject().payrollProcessed === false &&
                  tool.toObject().adminActionId != 0
                    ? [
                        <IconButton
                          key="processTool"
                          size="small"
                          onClick={() =>
                            toggleProcessSpiffTool(tool.toObject())
                          }
                        >
                          <CheckIcon />
                        </IconButton>,
                      ]
                    : [],
              },
            ];
          })}
        />
      </SectionBar>
      <SectionBar title="Totals" small>
        <InfoTable
          columns={[
            { name: 'Total Purchases for the Month' },
            { name: 'Absolute Total' },
          ]}
          data={[
            [
              {
                value: totalTools,
              },
              {
                value: toolFund - (totalTools === undefined ? 0 : totalTools),
              },
            ],
          ]}
        />
      </SectionBar>
      */}
      <SectionBar
        key="PerDiemWeek"
        title={`Total PerDiem for the Week of ${formatDateFns(startDay)}`}
      >
        {(perDiems || trips) && (
          <InfoTable
            key="PerDiem Totals"
            columns={[
              { name: 'Total Lodging' },
              { name: 'Total Meals' },
              { name: 'Total Mileage' },
              { name: 'Status' },
            ]}
            data={[
              [
                {
                  value: usd(totalPerDiem.totalLodging),
                },
                {
                  value: usd(totalPerDiem.totalMeals),
                },
                {
                  value: tripsTotal.totalDistance.toFixed(2) + ' miles',
                },
                {
                  value:
                    totalPerDiem.totalLodging != 0 ||
                    totalPerDiem.totalMeals != 0 ||
                    tripsTotal.totalDistance != 0
                      ? 'Incomplete'
                      : 'No PerDiems or Trips Remain',
                  actions:
                    totalPerDiem.totalLodging != 0 ||
                    totalPerDiem.totalMeals != 0 ||
                    tripsTotal.totalDistance != 0
                      ? [
                          <IconButton
                            key="processPerdiem"
                            size="small"
                            onClick={() => toggleProcessPerDiems(perDiems)}
                          >
                            <CheckIcon />
                          </IconButton>,
                        ]
                      : [],
                },
              ],
            ]}
          />
        )}
      </SectionBar>
      {onNext != null ? (
        <Button label="Next Employee" onClick={() => onNext()}></Button>
      ) : (
        []
      )}
    </div>
  ) : (
    <Loader />
  );
};
