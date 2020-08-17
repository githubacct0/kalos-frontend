import React from 'react';
import { Event, EventClient } from '@kalos-core/kalos-rpc/Event';
import {
  Table,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@material-ui/core';
import { ENDPOINT } from '../../constants';
import { PageWrapper } from '../PageWrapper/main';

interface props {
  loggedUserId: number;
  withPageHeader: boolean;
}

interface state {
  list: Event.AsObject[];
  page: number;
  totalCount: number;
}

export class ServiceCallTable extends React.PureComponent<props, state> {
  Client: EventClient;
  constructor(props: props) {
    super(props);
    this.state = {
      list: [],
      page: 0,
      totalCount: 0,
    };
    this.Client = new EventClient(ENDPOINT);
    this.fetchCalls = this.fetchCalls.bind(this);
  }

  getDateString() {
    const today = new Date();
    const date = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return `${year}-${month}-${date}`;
  }

  fetchCalls() {
    return new Promise(async (resolve) => {
      const dateStr = this.getDateString();
      const reqObj = new Event();
      reqObj.setDateStarted(`${dateStr}%`);
      reqObj.setPageNumber(this.state.page);
      reqObj.setIsActive(1);
      const res = (await this.Client.BatchGet(reqObj)).toObject();
      this.setState(
        (prevState) => ({
          list: prevState.list.concat(res.resultsList),
          page: prevState.page + 1,
          totalCount: res.totalCount,
        }),
        resolve
      );
    });
  }

  async fetchAll(): Promise<boolean> {
    await this.fetchCalls();
    if (this.state.list.length !== this.state.totalCount) {
      return this.fetchAll();
    } else {
      return true;
    }
  }

  async componentDidMount() {
    this.fetchAll();
  }

  render() {
    return (
      <PageWrapper
        userID={this.props.loggedUserId}
        withHeader={this.props.withPageHeader}
        padding={1}
      >
        <Paper style={{ width: '100%', overflowX: 'scroll' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Technician(s)</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Job Type</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.state.list.map((row) => (
                <TableRow>
                  <TableCell>
                    {row.timeStarted} - {row.timeEnded}
                  </TableCell>
                  <TableCell>{row.logTechnicianAssigned}</TableCell>
                  <TableCell>Wow!</TableCell>
                  <TableCell>{row.propertyId}</TableCell>
                  <TableCell>
                    {row.jobTypeId} - {row.jobSubtypeId}
                  </TableCell>
                  <TableCell>{row.logJobStatus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </PageWrapper>
    );
  }
}
