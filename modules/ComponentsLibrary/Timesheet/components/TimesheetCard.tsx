import React, { FC } from 'react';
import clsx from 'clsx';
import { ServicesRendered } from '@kalos-core/kalos-rpc/ServicesRendered';
import { TimesheetLine } from '@kalos-core/kalos-rpc/TimesheetLine';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { colorsMapping } from '../constants';
import { useEditTimesheet } from '../hooks';
import { roundNumber, getCFAppUrl } from '../../../../helpers';
import './timesheetCard.less';
import { NULL_TIME_VALUE } from '../constants';

type ColorIndicatorProps = {
  status: string;
};

const ColorIndicator = ({ status }: ColorIndicatorProps) => (
  <span
    className="TimesheetTimesheetCardColorIndicator"
    style={{ backgroundColor: colorsMapping[status] }}
  />
);

type TimesheetLineProps = {
  card: TimesheetLine.AsObject;
};

export const TimesheetLineCard: FC<TimesheetLineProps> = ({
  card,
}): JSX.Element => {
  const { editTimesheetCard } = useEditTimesheet();
  const {
    timeStarted,
    timeFinished,
    userApprovalDatetime,
    adminApprovalDatetime,
    briefDescription,
    classCode,
    referenceNumber,
    notes,
    eventId,
    eventUserId,
    eventPropertyId,
  } = card;
  let status;
  if (adminApprovalDatetime && adminApprovalDatetime != NULL_TIME_VALUE) {
    status = 'Approved';
  } else if (userApprovalDatetime && userApprovalDatetime != NULL_TIME_VALUE) {
    status = 'Submitted';
  } else {
    status = 'Pending';
  }

  const payrollDiff = classCode?.billable
    ? differenceInMinutes(parseISO(timeFinished), parseISO(timeStarted)) / 60
    : 0;

  return (
    <Card
      className="TimesheetTimesheetCardCard"
      onClick={() => {
        editTimesheetCard(card);
      }}
    >
      <CardActionArea>
        <CardHeader
          className="TimesheetTimesheetCardCardHeader"
          avatar={<ColorIndicator status={status} />}
          title={status}
        />
        <CardContent className="TimesheetTimesheetCardCardContent">
          <Typography className="TimesheetTimesheetCardDate" variant="body2">
            <span>
              {format(parseISO(timeStarted), 'p')}
              {timeFinished && ` - ${format(parseISO(timeFinished), 'p')}`}
            </span>
            {
              <strong>
                {roundNumber(
                  differenceInMinutes(
                    parseISO(timeFinished),
                    parseISO(timeStarted),
                  ) / 60,
                )}
              </strong>
            }
          </Typography>
          {!!eventId && (
            <Typography
              variant="body2"
              className="TimesheetTimesheetCardEventId"
              onClick={event => {
                event.stopPropagation();
                event.preventDefault();
                window.open(
                  [
                    getCFAppUrl('admin:service.editServicecall'),
                    `id=${eventId}`,
                    `user_id=${eventUserId}`,
                    `property_id=${eventPropertyId}`,
                  ].join('&'),
                  '_blank',
                );
              }}
            >
              {eventId}
            </Typography>
          )}
          <Typography>{classCode?.description}</Typography>
          {briefDescription && (
            <Typography variant="body2">
              Brief desc: {briefDescription}
            </Typography>
          )}
          {referenceNumber && (
            <Typography variant="body2">Ref #: {referenceNumber}</Typography>
          )}
          {notes && <Typography variant="body2">Notes: {notes}</Typography>}
          {!!eventId && (
            <Typography variant="body2">Service Call ID: {eventId}</Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

type ServicesRenderedProps = {
  card: ServicesRendered.AsObject;
};

export const ServicesRenderedCard: FC<ServicesRenderedProps> = ({
  card,
}): JSX.Element => {
  const { editServicesRenderedCard } = useEditTimesheet();
  const { timeStarted, timeFinished, status } = card;
  return (
    <Card
      className={clsx('TimesheetTimesheetCardCard', 'servicesRendered')}
      onClick={() => {
        editServicesRenderedCard(card);
      }}
    >
      <CardActionArea>
        <CardHeader
          className="TimesheetTimesheetCardCardHeader"
          avatar={<ColorIndicator status={status} />}
          title={status}
        />
        <CardContent className="TimesheetTimesheetCardCardContent">
          <Typography className="TimesheetTimesheetCardDate" variant="body2">
            {format(parseISO(timeStarted), 'p')}
            {timeFinished && ` - ${format(parseISO(timeFinished), 'p')}`}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};