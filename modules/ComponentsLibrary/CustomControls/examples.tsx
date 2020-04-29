import React, { useState } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import { WeekPicker } from '../WeekPicker';
import { DatePicker, TextField } from './';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    bar: {
      background: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText,
      justifyContent: 'space-between',
      [theme.breakpoints.only('xs')]: {
        padding: theme.spacing(2),
      },
      marginBottom: theme.spacing(1),
    },
  })
);

export default () => {
  const classes = useStyles();
  const [week, setWeek] = useState(new Date());
  const [date, setDate] = useState(new Date());
  const [value, setValue] = useState('');

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Toolbar className={classes.bar}>
        <WeekPicker
          white
          label="Standard Weekpicker"
          inputVariant="standard"
          size="small"
          value={week}
          onChange={val => setWeek(val)}
        />
        <WeekPicker
          white
          label="Filled Weekpicker"
          inputVariant="filled"
          size="small"
          value={week}
          onChange={val => setWeek(val)}
        />
        <WeekPicker
          white
          label="Outlined Weekpicker"
          inputVariant="outlined"
          size="small"
          value={week}
          onChange={val => setWeek(val)}
        />
      </Toolbar>
      <Toolbar className={classes.bar}>
        <DatePicker
          white
          label="Standard Datepicker"
          inputVariant="standard"
          size="small"
          value={date}
          onChange={val => setDate(val || new Date())}
        />
        <DatePicker
          white
          label="Filled Datepicker"
          inputVariant="filled"
          size="small"
          value={date}
          onChange={val => setDate(val || new Date())}
        />
        <DatePicker
          white
          label="Outlined Datepicker"
          inputVariant="outlined"
          size="small"
          value={date}
          onChange={val => setDate(val || new Date())}
        />
      </Toolbar>
      <Toolbar className={classes.bar}>
        <TextField
          white
          label="Standard Input"
          size="small"
          placeholder="Type anything you want"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <TextField
          white
          label="Filled Input"
          variant="filled"
          size="small"
          placeholder="Type anything you want"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <TextField
          white
          label="Outlined Input"
          variant="outlined"
          size="small"
          placeholder="Type anything you want"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </Toolbar>
    </MuiPickersUtilsProvider>
  );
};
