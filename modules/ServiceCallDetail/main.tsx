import React, { ChangeEvent, ReactNode } from 'react';
import { Event, EventClient } from '@kalos-core/kalos-rpc/Event';
import Grid from '@material-ui/core/Grid';
import DateFnsUtils from '@date-io/date-fns';
import {
  DatePicker,
  MuiPickersUtilsProvider,
  TimePicker,
} from '@material-ui/pickers';
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date';
import { JobTypePicker } from '../ComponentsLibrary/Pickers/JobType';
import { JobSubtypePicker } from '../ComponentsLibrary/Pickers/JobSubtype';
import NativeSelect from '@material-ui/core/NativeSelect';
import {
  InputLabel,
  FormControl,
  TextField,
  Select,
  Input,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
} from '@material-ui/core';
import { User, UserClient } from '@kalos-core/kalos-rpc/User';
import {
  EVENT_STATUS_LIST,
  PAYMENT_TYPE_LIST,
  ENDPOINT,
} from '../../constants';
import { PageWrapper, PageWrapperProps } from '../PageWrapper/main';

interface props extends PageWrapperProps {
  eventID: number;
  userID: number;
}

interface state {
  technicians: User.AsObject[];
  event: Event.AsObject;
  callbacks: Event.AsObject[];
  isEditing: boolean;
}

export class ServiceCallDetail extends React.PureComponent<props, state> {
  EventClient: EventClient;
  UserClient: UserClient;

  constructor(props: props) {
    super(props);
    this.state = {
      event: new Event().toObject(),
      callbacks: [],
      technicians: [],
      isEditing: false,
    };
    const endpoint = 'https://core-dev.kalosflorida.com:8443';
    this.toggleEditing = this.toggleEditing.bind(this);
    this.UserClient = new UserClient(ENDPOINT);
    this.fetchTechnicians = this.fetchTechnicians.bind(this);
    this.fetchCallbacks = this.fetchCallbacks.bind(this);
    this.EventClient = new EventClient(ENDPOINT);
    this.fetchEvent = this.fetchEvent.bind(this);
    this.updateEvent = this.updateEvent.bind(this);
    this.onDateChange = this.onDateChange.bind(this);
    this.handleTechnicianSelect = this.handleTechnicianSelect.bind(this);
  }

  async fetchCallbacks() {
    const req = new Event();
    req.setPropertyId(this.state.event.propertyId);
    req.setIsActive(1);
    const result = await this.EventClient.BatchGet(req);
    this.setState({
      callbacks: result.toObject().resultsList,
    });
  }

  async fetchTechnicians(page = 0) {
    const req = new User();
    req.setIsEmployee(1);
    req.setIsActive(1);
    req.setIsOfficeStaff(0);
    req.setIsHvacTech(1);
    req.setPageNumber(page);
    const result = await this.UserClient.BatchGet(req);
    this.setState(
      prevState => ({
        technicians: prevState.technicians.concat(
          result.toObject().resultsList,
        ),
      }),
      async () => {
        if (this.state.technicians.length !== result.getTotalCount()) {
          page = page + 1;
          await this.fetchTechnicians(page);
        }
      },
    );
  }
  toggleEditing() {
    this.setState(prevState => ({
      isEditing: !prevState.isEditing,
    }));
  }

  updateEvent<K extends keyof Event.AsObject>(prop: K) {
    return async (value: Event.AsObject[K]) => {
      const event = new Event();
      const upperCaseProp = `${prop[0].toUpperCase()}${prop.slice(1)}`;
      const methodName = `set${upperCaseProp}`;
      event.setId(this.state.event.id);
      //@ts-ignore
      event[methodName](value);
      event.setFieldMaskList([upperCaseProp]);
      const updatedEvent = await this.EventClient.Update(event);
      this.setState(() => ({ event: updatedEvent }));
    };
  }

  updateAssignedTechnician = this.updateEvent('logTechnicianAssigned');
  updateCallBackOriginalId = this.updateEvent('callbackOriginalId');
  updateLogNotes = this.updateEvent('logNotes');
  updateDescription = this.updateEvent('description');
  updatePaymentType = this.updateEvent('logPaymentType');
  updateStatus = this.updateEvent('logJobStatus');
  updateJobType = this.updateEvent('jobTypeId');
  updateSubType = this.updateEvent('jobSubtypeId');
  updateBriefDescription = this.updateEvent('name');
  updateAmountQuoted = this.updateEvent('amountQuoted');
  updateIsCallback = this.updateEvent('isCallback');
  updateIsLMPC = this.updateEvent('isLmpc');
  updateIsDiagnosticQuoted = this.updateEvent('diagnosticQuoted');
  updateIsResidential = this.updateEvent('isResidential');
  updateDateStarted = this.updateEvent('dateStarted');
  updateDateEnded = this.updateEvent('dateEnded');
  updateTimeStarted = this.updateEvent('timeStarted');
  updateTimeEnded = this.updateEvent('timeEnded');

  handleTextInput(fn: (val: string) => Promise<void>) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      fn(e.target.value);
    };
  }
  handleDescription = this.handleTextInput(this.updateDescription);
  handleNotes = this.handleTextInput(this.updateLogNotes);
  handleAmountQuoted = this.handleTextInput(this.updateAmountQuoted);

  handleSelect(fn: (val: number) => Promise<void>) {
    return (e: React.SyntheticEvent<HTMLSelectElement>) => {
      const value = parseInt(e.currentTarget.value);
      if (value !== undefined) {
        fn(value);
      }
    };
  }

  handleCallbackSelect = this.handleSelect(this.updateCallBackOriginalId);
  handleIsCallback = this.handleSelect(this.updateIsCallback);
  handleIsLMPC = this.handleSelect(this.updateIsLMPC);
  handleIsResidentialChange = this.handleSelect(this.updateIsResidential);
  handleIsDiagnosticQuoted = this.handleSelect(this.updateIsDiagnosticQuoted);

  handleTechnicianSelect(
    e: ChangeEvent<{ name?: string | undefined; value: unknown }>,
    child: ReactNode,
  ) {
    const { event } = this.state;
    let assigned = event.logTechnicianAssigned.split(',');
    assigned = assigned.filter(a => a !== '0');
    const id = e.currentTarget.name;
    if (assigned.includes(id!)) {
      assigned = assigned.filter(a => a !== id);
    } else {
      assigned = assigned.concat(id!);
    }
    if (assigned.length === 0) {
      this.updateAssignedTechnician('0');
    } else {
      this.updateAssignedTechnician(assigned.join(','));
    }
    //this.updateAssignedTechnician(idStr);
  }

  onDateChange(fn: (str: string) => Promise<void>) {
    return (date: MaterialUiPickersDate) => {
      if (date) {
        const monthPrefix = date.getMonth() + 1 < 10 ? '0' : '';
        const dayPrefix = date.getDate() < 10 ? '0' : '';
        const dateString = `${date.getFullYear()}-${monthPrefix}${
          date.getMonth() + 1
        }-${dayPrefix}${date.getDate()} 00:00:00`;
        fn(dateString);
      }
    };
  }
  onStartDateChange = this.onDateChange(this.updateDateStarted);
  onEndDateChange = this.onDateChange(this.updateDateEnded);

  onTimeChange(fn: (str: string) => Promise<void>) {
    return (date: MaterialUiPickersDate) => {
      if (date) {
        const hourPrefix = date.getHours() < 10 ? '0' : '';
        const minutePrefix = date.getMinutes() < 10 ? '0' : '';
        const dateString = `${hourPrefix}${date.getHours()}:${minutePrefix}${date.getMinutes()}`;
        fn(dateString);
      }
    };
  }
  onStartTimeChange = this.onTimeChange(this.updateTimeStarted);
  onEndTimeChange = this.onTimeChange(this.updateTimeEnded);

  async fetchEvent() {
    const event = new Event();
    event.setId(this.props.eventID);
    const result = await this.EventClient.Get(event);
    this.setState({
      event: result,
    });
  }

  async componentDidMount() {
    await this.fetchEvent();
    await this.fetchCallbacks();
    await this.fetchTechnicians();
  }

  render() {
    const { event, isEditing } = this.state;
    const startTime = event.dateStarted.split(' ')[0] + 'T' + event.timeStarted;
    const endTime = event.dateEnded.split(' ')[0] + 'T' + event.timeEnded;

    if (event.id) {
      return (
        <PageWrapper {...this.props} userID={this.props.userID}>
          <Grid container direction="column" alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={this.state.isEditing}
                  onChange={this.toggleEditing}
                  value="isEditing"
                  color="primary"
                />
              }
              label={
                this.state.isEditing ? 'Editing Enabled' : 'Editing Disabled'
              }
            />
            <Grid
              container
              direction="row"
              justify="space-evenly"
              wrap="nowrap"
            >
              <Grid container direction="column" style={{ padding: 5 }}>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <DatePicker
                    format="MM/dd/yyyy"
                    margin="normal"
                    id="date-picker-inline"
                    label="Date Started"
                    value={new Date(event.dateStarted.replace(' ', 'T'))}
                    onChange={this.onStartDateChange}
                    disabled={!isEditing}
                  />
                  <DatePicker
                    format="MM/dd/yyyy"
                    margin="normal"
                    id="date-picker-inline"
                    label="Date Ended"
                    value={new Date(event.dateEnded.replace(' ', 'T'))}
                    onChange={this.onEndDateChange}
                    disabled={!isEditing}
                  />
                </MuiPickersUtilsProvider>
                <JobTypePicker
                  disabled={!isEditing}
                  selected={event.jobTypeId}
                  onSelect={this.updateJobType}
                />
                <JobSubtypePicker
                  disabled={!isEditing}
                  onSelect={this.updateSubType}
                  selected={event.jobSubtypeId}
                  jobTypeID={event.jobTypeId}
                />
                <FormControl style={{ marginTop: 10 }}>
                  <InputLabel htmlFor="Status-select">Job Status</InputLabel>
                  <NativeSelect
                    disabled={!isEditing}
                    value={event.logJobStatus}
                    onChange={e => this.updateStatus(e.currentTarget.value)}
                    inputProps={{
                      id: 'Status-select',
                    }}
                  >
                    {(EVENT_STATUS_LIST as string[]).map(status => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
                <FormControl style={{ marginTop: 10 }}>
                  <InputLabel htmlFor="Payment-select">Payment Type</InputLabel>
                  <NativeSelect
                    disabled={!isEditing}
                    value={event.logPaymentType}
                    onChange={e =>
                      this.updatePaymentType(e.currentTarget.value)
                    }
                    inputProps={{
                      id: 'Payment-select',
                    }}
                  >
                    {(PAYMENT_TYPE_LIST as string[]).map(type => (
                      <option value={type} key={type}>
                        {type}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
                <TextField
                  disabled={!isEditing}
                  onChange={this.handleAmountQuoted}
                  label="Amount Quoted"
                  margin="normal"
                  variant="outlined"
                  defaultValue={event.amountQuoted}
                />
                <FormControl style={{ marginTop: 10 }}>
                  <InputLabel htmlFor="tech-select-input">
                    Technician Assigned
                  </InputLabel>
                  <Select
                    disabled={!isEditing}
                    value={event.logTechnicianAssigned.split(',')}
                    multiple
                    onChange={this.handleTechnicianSelect}
                    input={<Input id="tech-select-input" />}
                    renderValue={selected => (
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {(selected as string[]).map(s => {
                          const tech = this.state.technicians.find(
                            t => t.id === parseInt(s),
                          );
                          if (tech) {
                            return (
                              <Chip
                                key={s}
                                label={`${tech.firstname} ${tech.lastname}`}
                                style={{ margin: 2 }}
                              />
                            );
                          } else {
                            return (
                              <Chip
                                key="unassigned"
                                label="unassigned"
                                style={{ margin: 2 }}
                              />
                            );
                          }
                        })}
                      </div>
                    )}
                  >
                    {this.state.technicians.map(t => (
                      <MenuItem
                        key={`${t.firstname}-${t.lastname}-${t.id}`}
                        value={`${t.id}`}
                      >
                        {t.firstname} {t.lastname}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid
                container
                direction="column"
                justify="space-between"
                style={{ padding: 5 }}
              >
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                  <TimePicker
                    disabled={!isEditing}
                    label="Start Time"
                    margin="normal"
                    value={startTime}
                    onChange={this.onStartTimeChange}
                    minutesStep={5}
                  />
                  <TimePicker
                    disabled={!isEditing}
                    label="End Time"
                    margin="normal"
                    value={endTime}
                    onChange={this.onEndTimeChange}
                    minutesStep={5}
                  />
                </MuiPickersUtilsProvider>
                <FormControl style={{ marginTop: 10 }}>
                  <InputLabel htmlFor="age-native-helper">Sector</InputLabel>
                  <NativeSelect
                    disabled={!isEditing}
                    value={event.isResidential}
                    onChange={this.handleIsResidentialChange}
                    inputProps={{
                      id: 'age-native-helper',
                    }}
                  >
                    <option value={0}>Commercial</option>
                    <option value={1}>Residential</option>
                  </NativeSelect>
                </FormControl>
                <FormControl style={{ marginTop: 10 }}>
                  <InputLabel htmlFor="dq-select">Diagnostic Quoted</InputLabel>
                  <NativeSelect
                    disabled={!isEditing}
                    value={event.diagnosticQuoted}
                    onChange={this.handleIsDiagnosticQuoted}
                    inputProps={{
                      id: 'dq-select',
                    }}
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </NativeSelect>
                </FormControl>
                <FormControl style={{ marginTop: 10 }}>
                  <InputLabel htmlFor="LMPC-select">Is LMPC?</InputLabel>
                  <NativeSelect
                    disabled={!isEditing}
                    value={event.isLmpc}
                    onChange={this.handleIsLMPC}
                    inputProps={{
                      id: 'LMPC-select',
                    }}
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </NativeSelect>
                </FormControl>
                <FormControl style={{ marginTop: 10 }}>
                  <InputLabel htmlFor="IsCallback-select">
                    Is Callback?
                  </InputLabel>
                  <NativeSelect
                    disabled={!isEditing}
                    value={event.isCallback}
                    onChange={this.handleIsCallback}
                    inputProps={{
                      id: 'IsCallback-select',
                    }}
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </NativeSelect>
                </FormControl>
                <FormControl style={{ marginTop: 10 }}>
                  <InputLabel htmlFor="Callback-select">
                    Reason Of Callback
                  </InputLabel>
                  <NativeSelect
                    disabled={!event.isCallback}
                    value={event.callbackOriginalId}
                    onChange={this.handleCallbackSelect}
                    inputProps={{
                      id: 'Callback-select',
                    }}
                  >
                    <option value={0}>Select Original Call</option>
                    {this.state.callbacks.map(cb => (
                      <option value={cb.id} key={`${cb.name}-${cb.id}`}>
                        {cb.name}
                      </option>
                    ))}
                  </NativeSelect>
                </FormControl>
              </Grid>
            </Grid>
            <Grid
              container
              direction="row"
              alignItems="center"
              justify="space-evenly"
              wrap="nowrap"
            >
              <TextField
                disabled={!isEditing}
                onChange={this.handleDescription}
                label="Service Needed"
                margin="normal"
                variant="outlined"
                defaultValue={event.description}
                multiline
                fullWidth
                style={{ padding: 5 }}
              />
              <TextField
                disabled={!isEditing}
                onChange={this.handleNotes}
                label="Service Call Notes"
                margin="normal"
                variant="outlined"
                defaultValue={event.logNotes}
                multiline
                fullWidth
                style={{ padding: 5 }}
              />
            </Grid>
            {/*<Button variant="contained" onClick={() => alert("No me likey")}>
          Click
    </Button>*/}
          </Grid>
        </PageWrapper>
      );
    } else return <PageWrapper {...this.props} userID={this.props.userID} />;
  }
}
