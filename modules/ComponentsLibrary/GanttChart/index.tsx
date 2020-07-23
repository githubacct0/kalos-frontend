import React, {
  FC,
  useCallback,
  useState,
  useEffect,
  createRef,
  RefObject,
} from 'react';
import clsx from 'clsx';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { format, addDays, getDay, differenceInDays } from 'date-fns';
import { PROJECT_TASK_PRIORITY_ICONS } from '../EditProject';
import { formatDate, formatTime } from '../../../helpers';
import './styles.less';

export type CalendarEvent = {
  id: number;
  startDate: string;
  startHour: string;
  endDate: string;
  endHour: string;
  notes: string;
  status?: string;
  statusColor?: string;
  statusId?: number;
  priority?: string;
  priorityId?: number;
  assignee?: string;
  onClick?: () => void;
};

type Style = {
  loading?: boolean;
};

interface Props extends Style {
  events: CalendarEvent[];
  startDate: string;
  endDate: string;
  onAdd?: (startDate: string) => void;
}

export const GanttChart: FC<Props> = ({
  events,
  loading,
  startDate: dateStart,
  endDate: dateEnd,
  onAdd,
}) => {
  const [uncollapsed, setUncollapsed] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [heights, setHeights] = useState<{ [key: number]: number }>({});
  const [elRefs, setElRefs] = useState<RefObject<HTMLDivElement>[]>([]);
  const startDate = new Date(`${dateStart}T00:00:00`);
  const endDate = new Date(`${dateEnd}T00:00:00`);
  const totalDays = differenceInDays(endDate, startDate);
  const offsetStart = getDay(startDate);
  const offsetEnd = 6 - getDay(endDate);
  const arrLength = events.length;
  useEffect(
    () =>
      setElRefs(elRefs =>
        [...Array(arrLength)].map((_, i) => elRefs[i] || createRef()),
      ),
    [arrLength],
  );
  const handleAddClick = useCallback(
    (startDate: string) => () => {
      if (onAdd) {
        onAdd(startDate);
      }
    },
    [onAdd],
  );
  const handleToggleCollapse = useCallback(
    (id: number, idx: number) => () => {
      setUncollapsed({ ...uncollapsed, [id]: !uncollapsed[id] });
      if (elRefs[idx] && elRefs[idx].current !== null) {
        //@ts-ignore
        const height = elRefs[idx].current.getBoundingClientRect().height;
        setHeights({ ...heights, [id]: height });
      }
    },
    [setUncollapsed, uncollapsed, elRefs, setHeights, heights],
  );
  return (
    <div className={clsx('GanttChart', { loading })}>
      <div className="GanttChartAside">
        {events.map(
          (
            {
              id,
              notes,
              priorityId,
              assignee,
              startDate,
              endDate,
              startHour,
              endHour,
              priority,
              status,
            },
            idx,
          ) => {
            const PriorityIcon = priorityId
              ? PROJECT_TASK_PRIORITY_ICONS[priorityId]
              : null;
            return (
              <div
                key={id}
                className="GanttChartAsideRow"
                onClick={handleToggleCollapse(id, idx)}
              >
                <div className="GanttChartAsideRowTitle">
                  {uncollapsed[id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  {PriorityIcon && (
                    <PriorityIcon
                      style={{
                        fontSize: 16,
                        marginRight: 4,
                        verticalAlign: 'middle',
                        display: 'inline-flex',
                      }}
                    />
                  )}
                  <div className="GanttChartAsideRowDesc">{notes}</div>
                </div>
                <div
                  style={{
                    overflow: 'hidden',
                    height: uncollapsed[id] ? 'auto' : 0,
                  }}
                >
                  <div ref={elRefs[idx]}>
                    {assignee && (
                      <div>
                        <strong>Assigned Employee: </strong>
                        {assignee}
                      </div>
                    )}
                    <div>
                      <strong>Brief Description: </strong>
                      {notes}
                    </div>
                    <div>
                      <strong>Start Date: </strong>
                      {formatDate(startDate)} {formatTime(startHour)}
                    </div>
                    <div>
                      <strong>End Date: </strong>
                      {formatDate(endDate)} {formatTime(endHour)}
                    </div>
                    <div>
                      <strong>Status: </strong>
                      {status}
                    </div>
                    <div>
                      <strong>Priority: </strong>
                      {PriorityIcon && (
                        <PriorityIcon
                          style={{
                            fontSize: 16,
                            marginRight: 4,
                            verticalAlign: 'middle',
                            display: 'inline-flex',
                          }}
                        />
                      )}
                      {priority}
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>
      <div className="GanttChartGantt">
        <div className="GanttChartGanttRow">
          {[...Array(totalDays + offsetStart + offsetEnd + 1)].map((_, idx) => {
            const day = addDays(startDate, idx - offsetStart);
            const date = format(day, 'yyyy-MM-dd');
            const weekDay = +format(day, 'i');
            return (
              <div
                key={idx}
                className={clsx(
                  'GanttChartDay',
                  'GanttChartWeekDay',
                  weekDay >= 6 ? 'GanttChartWeekendDay' : '',
                )}
                onClick={handleAddClick(date)}
              >
                {format(day, 'MMMM yyyy')}
              </div>
            );
          })}
        </div>
        <div className="GanttChartGanttRow">
          {[...Array(totalDays + offsetStart + offsetEnd + 1)].map((_, idx) => {
            const day = addDays(startDate, idx - offsetStart);
            const date = format(day, 'yyyy-MM-dd');
            const weekDay = +format(day, 'i');
            return (
              <div
                key={idx}
                className={clsx(
                  'GanttChartDay',
                  'GanttChartWeekDay',
                  weekDay >= 6 ? 'GanttChartWeekendDay' : '',
                )}
                onClick={handleAddClick(date)}
              >
                {format(day, 'iiii, d')}
              </div>
            );
          })}
        </div>
        {events.map(
          ({
            id,
            startDate: dateStart,
            endDate: dateEnd,
            statusColor,
            startHour,
            endHour,
            onClick,
          }) => (
            <div key={id} className="GanttChartGanttRow">
              {[...Array(totalDays + offsetStart + offsetEnd + 1)].map(
                (_, idx) => {
                  const day = addDays(startDate, idx - offsetStart);
                  const date = format(day, 'yyyy-MM-dd');
                  const weekDay = +format(day, 'i');
                  return (
                    <div
                      key={idx}
                      className={clsx(
                        'GanttChartDay',
                        weekDay >= 6 ? 'GanttChartWeekendDay' : '',
                      )}
                    >
                      {dateStart <= date && date <= dateEnd && (
                        <div
                          className="GanttChartEvent"
                          style={{
                            backgroundColor: statusColor,
                            ...(dateStart === date ? { marginLeft: 4 } : {}),
                            ...(dateEnd === date ? { marginRight: 4 } : {}),
                            cursor: onClick ? 'pointer' : 'default',
                            marginBottom: uncollapsed[id] ? heights[id] - 4 : 0,
                          }}
                          onClick={onClick}
                        >
                          <div className="GanttChartHour">
                            {dateStart === date && formatTime(startHour, false)}
                          </div>
                          {dateEnd === date && (
                            <div className="GanttChartHour">
                              ends {formatTime(endHour, false)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
};