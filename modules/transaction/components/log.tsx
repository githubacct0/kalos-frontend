import React from 'react';
import {
  TransactionActivity,
  TransactionActivityClient,
} from '@kalos-core/kalos-rpc/TransactionActivity';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Modal from '@material-ui/core/Modal';
import Button from '@material-ui/core/Button';
import CloseIcon from '@material-ui/icons/CloseSharp';
import IconButton from '@material-ui/core/IconButton';
import ListIcon from '@material-ui/icons/ListSharp';
import Tooltip from '@material-ui/core/Tooltip';
import Grid from '@material-ui/core/Grid';
import { UserClient, User } from '@kalos-core/kalos-rpc/User';
import { ENDPOINT } from '../../../constants';

interface props {
  txnID: number;
  iconButton?: boolean;
}

interface state {
  list: TransactionActivity.AsObject[];
  actorMap: Map<number, string>;
  isOpen: boolean;
}

export class TxnLog extends React.PureComponent<props, state> {
  LogClient: TransactionActivityClient;
  UserClient: UserClient;

  constructor(props: props) {
    super(props);

    this.state = {
      list: [],
      isOpen: false,
      actorMap: new Map<number, string>(),
    };

    this.LogClient = new TransactionActivityClient(ENDPOINT);
    this.UserClient = new UserClient(ENDPOINT);

    this.toggleVisibility = this.toggleVisibility.bind(this);
    this.addLog = this.addLog.bind(this);
  }

  toggleVisibility() {
    this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
  }

  async addLog(log: TransactionActivity.AsObject) {
    const user = new User();
    user.setId(log.userId);
    const res = await this.UserClient.Get(user);
    this.setState((prevState) => {
      const map = new Map(prevState.actorMap);
      map.set(log.id, `${res.firstname} ${res.lastname} ${res.id}`);
      return {
        list: prevState.list.concat(log),
        actorMap: map,
      };
    });
  }

  componentDidUpdate(prevProps: props, prevState: state) {
    if (prevState.isOpen === false && this.state.isOpen === true) {
      const log = new TransactionActivity();
      log.setTransactionId(this.props.txnID);
      this.LogClient.List(log, this.addLog);
    }

    if (
      prevState.isOpen === true &&
      this.state.isOpen === false &&
      this.state.list.length !== 0
    ) {
      this.setState({ list: [] });
    }
  }

  render() {
    const button = this.props.iconButton ? (
      <Tooltip title="View activity log" placement="top">
        <IconButton onClick={this.toggleVisibility}>
          <ListIcon />
        </IconButton>
      </Tooltip>
    ) : (
      <Button
        variant="outlined"
        size="large"
        fullWidth
        style={{ height: 44, marginBottom: 10 }}
        onClick={this.toggleVisibility}
      >
        View Activity Log
      </Button>
    );
    return (
      <>
        {button}
        <Modal
          open={this.state.isOpen}
          onClose={this.toggleVisibility}
          style={{
            position: 'fixed',
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper style={{ width: '60%', overflowX: 'scroll' }}>
            <IconButton onClick={this.toggleVisibility}>
              <CloseIcon />
            </IconButton>
            <Table aria-label="transaction activity log table">
              <TableHead>
                <TableRow>
                  <TableCell>Action Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.state.list
                  .filter(
                    (activity) =>
                      !activity.description.includes('[old.') ||
                      !activity.description.includes('[new.'),
                  )
                  .map((activity) => (
                    <TableRow key={`activity_${activity.id}`}>
                      <TableCell>{activity.timestamp}</TableCell>
                      <TableCell>{activity.description}</TableCell>
                      <TableCell>
                        {this.state.actorMap.get(activity.id)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Paper>
        </Modal>
      </>
    );
  }
}
