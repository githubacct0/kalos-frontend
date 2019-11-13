import * as React from 'react';
import { UserClient, User } from '@kalos-core/kalos-rpc/User';
import { TransactionUserView } from './components/user';
import { TransactionAdminView } from './components/admin';
import { LoginHelper } from '../LoginHelper/main';
import Grid from '@material-ui/core/Grid';
import CssBaseline from '@material-ui/core/CssBaseline';

interface props {
  userID: number;
  isProd?: boolean;
}

interface state {
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  userDepartmentID: number;
  userName: string;
  isSU: boolean;
}

export default class Transaction extends React.PureComponent<props, state> {
  UserClient: UserClient;

  constructor(props: props) {
    super(props);
    this.state = {
      isLoading: false,
      isAdmin: false,
      isManager: false,
      userDepartmentID: 0,
      userName: '',
      isSU: false,
    };
    const endpoint = this.props.isProd
      ? 'https://core.kalosflorida.com:8443'
      : 'https://core-dev.kalosflorida.com:8443';
    console.log(endpoint);
    this.UserClient = new UserClient(endpoint);

    this.getUserData = this.getUserData.bind(this);
  }

  async getUserData() {
    const user = new User();
    user.setId(this.props.userID);
    const userData = await this.UserClient.Get(user);
    this.setState({
      isAdmin: userData.isAdmin === 1,
      isSU: userData.isSu === 1,
      userDepartmentID: userData.employeeDepartmentId,
      userName: `${userData.firstname} ${userData.lastname}`,
    });
  }

  async componentDidMount() {
    await this.UserClient.GetToken('test', 'test');
    await this.getUserData();
  }

  render() {
    if (this.state.userName) {
      return (
        <>
          <CssBaseline />
          <Grid
            container
            direction="column"
            justify="flex-start"
            alignItems="center"
          >
            {!this.state.isAdmin && (
              <TransactionUserView
                userID={this.props.userID}
                userName={this.state.userName}
                departmentId={this.state.userDepartmentID}
                isProd={this.props.isProd}
              />
            )}
            {this.state.isAdmin && (
              <TransactionAdminView
                userID={this.props.userID}
                userName={this.state.userName}
                departmentId={this.state.userDepartmentID}
                isSU={this.state.isSU}
                isProd={this.props.isProd}
              />
            )}
          </Grid>
        </>
      );
    } else {
      return (
        <Grid
          container
          direction="column"
          justify="flex-start"
          alignItems="center"
        >
          <LoginHelper />
        </Grid>
      );
    }
  }
}
