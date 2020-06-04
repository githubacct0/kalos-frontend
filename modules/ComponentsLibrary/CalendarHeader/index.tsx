import React, { FC } from 'react';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import MuiToolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { Button } from '../Button';
import { WeekPicker } from '../WeekPicker';
import { Actions, ActionsProps } from '../Actions';

interface Props {
  selectedDate: Date;
  userName: string;
  onDateChange: (value: Date) => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  actions?: ActionsProps;
}

const useStyles = makeStyles(theme =>
  createStyles({
    bar: {
      background: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText,
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
      },
      [theme.breakpoints.down(400)]: {
        flexDirection: 'column',
        alignItems: 'stretch',
      },
    },
    userName: {
      margin: `0 ${theme.spacing(2)}px`,
      textAlign: 'center',
      [theme.breakpoints.down(400)]: {
        margin: theme.spacing(2),
      },
    },
    info: {
      flex: '1 0 auto',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      '& p': {
        color: 'white',
      },
      [theme.breakpoints.down(400)]: {
        flexDirection: 'column',
      },
    },
    children: {
      marginRight: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      [theme.breakpoints.down(400)]: {
        marginRight: 0,
        alignItems: 'center',
      },
    },
  }),
);

export const CalendarHeader: FC<Props> = ({
  selectedDate,
  userName,
  onDateChange,
  onSubmit,
  submitLabel = 'Submit',
  submitDisabled = false,
  weekStartsOn = 0,
  actions,
  children,
}) => {
  const classes = useStyles();
  return (
    <MuiToolbar className={classes.bar}>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <WeekPicker
          white
          label="Set a Period"
          inputVariant="outlined"
          size="small"
          value={selectedDate}
          onChange={onDateChange}
          weekStartsOn={weekStartsOn}
        />
        <Typography className={classes.userName} variant="subtitle1">
          {userName}
        </Typography>
        <Box className={classes.info}>
          <Box className={classes.children}>{children}</Box>
          <Button
            onClick={onSubmit}
            label={submitLabel}
            disabled={submitDisabled}
          />
          {actions && <Actions actions={actions} />}
        </Box>
      </MuiPickersUtilsProvider>
    </MuiToolbar>
  );
};