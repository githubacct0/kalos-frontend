import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
} from 'react';
import clsx from 'clsx';
import compact from 'lodash/compact';
import { format, parseISO } from 'date-fns';
import { Event } from '@kalos-core/kalos-rpc/Event/index';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import BackIcon from '@material-ui/icons/ArrowBack';
import ViewDayIcon from '@material-ui/icons/ViewDay';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useCalendarData } from '../hooks';
import { CallCard, TimeoffCard } from './CallCard';
import { SkeletonCard } from '../../ComponentsLibrary/SkeletonCard';
import { colorsMapping } from './constants';
import { CalendarDay } from '@kalos-core/kalos-rpc/compiled-protos/event_pb';
import { TimeoffRequest } from '@kalos-core/kalos-rpc/compiled-protos/timeoff_request_pb';
import './column.less';

type Props = {
  date: string;
  viewBy?: string;
  userId: number;
  isAdmin: number;
};

type CallsList = {
  [key: string]: Event.AsObject[] | TimeoffRequest.AsObject[];
  completedServiceCallsList: Event.AsObject[];
  remindersList: Event.AsObject[];
  serviceCallsList: Event.AsObject[];
  timeoffRequestsList: TimeoffRequest.AsObject[];
};

const Column = ({ date, viewBy, userId, isAdmin }: Props): JSX.Element => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [dayView, setDayView] = useState(false);
  const [autoScrollInitialized, setAutoScrollInitialized] = useState(false);
  useLayoutEffect(() => {
    document.body.style.overflow = dayView ? 'hidden' : 'visible';
  }, [dayView]);
  const theme = useTheme();
  const md = useMediaQuery(theme.breakpoints.down('md'));
  const { fetchingCalendarData, datesMap, filters } = useCalendarData();
  const dateObj = parseISO(date);
  useEffect(() => {
    if (!(fetchingCalendarData || !datesMap?.get(date))) {
      const id = `ServiceCalendarColumnDateHeading_${format(
        new Date(),
        'dd_MM_yyyy',
      )}`;
      const currBox = document.getElementById(id);
      if (!autoScrollInitialized && !dayView && currBox) {
        setAutoScrollInitialized(true);
        currBox.scrollIntoView({
          behavior: 'auto',
          block: 'start',
          inline: 'center',
        });
      }
    }
  }, [
    fetchingCalendarData,
    datesMap,
    dayView,
    autoScrollInitialized,
    setAutoScrollInitialized,
  ]);

  const filterCalls = useCallback(
    (calendarDay: CalendarDay): CallsList => {
      const {
        customers,
        zip,
        propertyUse,
        jobType,
        jobSubType,
        techIds: techIdsFilter,
      } = filters!;
      return Object.keys(calendarDay).reduce(
        (acc: CallsList, key) => {
          // @ts-ignore
          let calls = calendarDay[key];
          acc[key] = calls.filter((call: Event.AsObject) => {
            const techIdsFilterArr = compact((techIdsFilter || '0').split(','))
              .map(Number)
              .filter(e => e !== 0);
            if (techIdsFilterArr.length > 0) {
              if (!+call.logTechnicianAssigned) return false;
              const techIds = call.logTechnicianAssigned.split(',').map(Number);
              if (
                techIdsFilterArr.reduce(
                  (aggr, item) => aggr && !techIds.includes(item),
                  false,
                )
              ) {
                return false;
              }
            } else if (!isAdmin && call.logTechnicianAssigned) {
              const techIds = call.logTechnicianAssigned.split(',').map(Number);
              if (!techIds.includes(userId)) {
                return false;
              }
            }
            if (
              customers.length &&
              !customers.includes(`${call?.customer?.id}`)
            ) {
              return false;
            }
            if (zip.length && !zip.includes(call?.property?.zip || '')) {
              return false;
            }
            if (
              propertyUse.length &&
              !propertyUse.includes(`${call?.isResidential}`)
            ) {
              return false;
            }
            if (jobType && jobType !== call?.jobTypeId) {
              return false;
            }
            if (jobSubType && jobSubType !== call?.jobSubtypeId) {
              return false;
            }
            return true;
          });
          return acc;
        },
        {
          completedServiceCallsList: [],
          remindersList: [],
          serviceCallsList: [],
          timeoffRequestsList: [],
        },
      );
    },
    [filters],
  );

  if (fetchingCalendarData || !datesMap?.get(date)) {
    if (fetchingCalendarData)
      return (
        <>
          {[...Array(5)].map((e, i) => (
            <SkeletonCard key={`${date}-skeleton-${i}`} skipAvatar />
          ))}
        </>
      );
    return (
      <Box className={clsx(dayView && 'ServiceCalendarColumnDayView')}>
        {dayView && (
          <Button startIcon={<BackIcon />} onClick={() => setDayView(false)}>
            {`Back to ${viewBy} View`}
          </Button>
        )}
        <Box
          className="ServiceCalendarColumnDateHeading"
          id={`ServiceCalendarColumnDateHeading_${format(
            dateObj,
            'dd_MM_yyyy',
          )}`}
        >
          {viewBy === 'day' ? (
            <Typography
              className="ServiceCalendarColumnDayViewHeading"
              variant="subtitle2"
            >
              {format(dateObj, 'cccc, MMMM d, yyyy')}
            </Typography>
          ) : (
            <>
              <Typography className="ServiceCalendarColumnDayCircle">
                {format(dateObj, 'd')}
              </Typography>
              <Typography variant="subtitle2">
                {format(dateObj, 'cccc')}
              </Typography>
              <Tooltip title="Day View">
                <IconButton
                  className={clsx(
                    'ServiceCalendarColumnDayViewButton',
                    md && !dayView && 'visible',
                  )}
                  aria-label="dayview"
                  size="small"
                  onClick={() => setDayView(true)}
                >
                  <ViewDayIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    );
  }

  // @ts-ignore
  const calendarDay = datesMap?.get(date)?.toObject();
  const {
    completedServiceCallsList,
    remindersList,
    serviceCallsList,
    timeoffRequestsList,
  } = filterCalls(calendarDay);

  return (
    <Box className={clsx(dayView && 'ServiceCalendarColumnDayView')}>
      {dayView && (
        <Button startIcon={<BackIcon />} onClick={() => setDayView(false)}>
          {`Back to ${viewBy} View`}
        </Button>
      )}
      <Box
        className="ServiceCalendarColumnDateHeading"
        id={`ServiceCalendarColumnDateHeading_${format(dateObj, 'dd_MM_yyyy')}`}
      >
        {viewBy === 'day' ? (
          <Typography
            className="ServiceCalendarColumnDayViewHeading"
            variant="subtitle2"
          >
            {format(dateObj, 'cccc, MMMM d, yyyy')}
          </Typography>
        ) : (
          <>
            <Typography className="ServiceCalendarColumnDayCircle">
              {format(dateObj, 'd')}
            </Typography>
            <Typography variant="subtitle2">
              {format(dateObj, 'cccc')}
            </Typography>
            <Tooltip title="Day View">
              <IconButton
                className={clsx(
                  'ServiceCalendarColumnDayViewButton',
                  md && !dayView && 'visible',
                )}
                aria-label="dayview"
                size="small"
                onClick={() => setDayView(true)}
              >
                <ViewDayIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
      {!!completedServiceCallsList.length && (
        <Button
          className="ServiceCalendarColumnCompletedButton"
          onClick={() => setShowCompleted(!showCompleted)}
          style={{ background: colorsMapping.Completed }}
        >
          <ExpandMoreIcon
            className={clsx('ServiceCalendarColumnExpand', {
              ['ServiceCalendarColumnExpandOpen']: showCompleted,
            })}
          />
          Completed Service Calls
        </Button>
      )}
      <Collapse in={showCompleted}>
        {completedServiceCallsList
          .sort((a, b) => parseInt(a.timeStarted) - parseInt(b.timeStarted))
          .map(call => (
            <CallCard key={call.id} card={call} type="completed" />
          ))}
      </Collapse>
      {timeoffRequestsList
        .sort((a, b) => parseInt(a.timeStarted) - parseInt(b.timeStarted))
        .map(call => (
          <TimeoffCard key={call.id} card={call} />
        ))}
      {remindersList
        .sort((a, b) => parseInt(a.timeStarted) - parseInt(b.timeStarted))
        .map(call => (
          <CallCard key={call.id} card={call} type="reminder" />
        ))}
      {serviceCallsList
        .sort((a, b) => parseInt(a.timeStarted) - parseInt(b.timeStarted))
        .map(call => (
          <CallCard key={call.id} card={call} />
        ))}
    </Box>
  );
};

export default Column;
