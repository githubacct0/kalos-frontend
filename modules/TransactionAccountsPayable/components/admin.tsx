import * as React from 'react';
import {
  Transaction,
  TransactionClient,
} from '@kalos-core/kalos-rpc/Transaction';
import { TransactionRow, prettyMoney } from './row';
import {
  AccountPicker,
  DepartmentPicker,
} from '../../ComponentsLibrary/Pickers';
import { EmployeePicker } from '../../ComponentsLibrary/Pickers/Employee';
import { TxnStatusPicker } from '../../ComponentsLibrary/Pickers/TransactionStatus';
import {
  TransactionActivityClient,
  TransactionActivity,
} from '@kalos-core/kalos-rpc/TransactionActivity';
import { PropertyClient, Property } from '@kalos-core/kalos-rpc/Property';
import { User } from '@kalos-core/kalos-rpc/User';
import { EventClient, Event } from '@kalos-core/kalos-rpc/Event';
import { ENDPOINT } from '../../../constants';
import { makeFakeRows, makeMonthsOptions } from '../../../helpers';
import {
  RecordPageReq,
  TransactionList,
} from '@kalos-core/kalos-rpc/compiled-protos/transaction_pb';
import { Prompt } from '../../Prompt/main';
import { SectionBar } from '../../ComponentsLibrary/SectionBar';
import { InfoTable } from '../../ComponentsLibrary/InfoTable';
import { Button } from '../../ComponentsLibrary/Button';
import { Field } from '../../ComponentsLibrary/Field';
import CreateModal from './CreateModal';

interface props {
  userID: number;
  departmentID: number;
  userName: string;
  isSU: boolean;
  isProd?: boolean;
  showMultipleDepartments?: boolean;
  departmentIDList?: string;
}

interface state {
  page: number;
  isLoading: boolean;
  transactions: Transaction.AsObject[];
  filters: IFilter;
  departmentView: boolean;
  count: number;
  acceptOverride: boolean;
  search: string;
  editingCostCenter: { [key: number]: boolean };
  showCreateModal: boolean;
}

interface IFilter {
  [key: string]: number | string | ISort | undefined;
  userID?: number;
  dateCreated?: string;
  yearCreated: string;
  dateSubmitted?: string;
  approvedByID?: number;
  costCenterID?: number;
  departmentID?: number;
  statusID?: number;
  sort: ISort;
}

interface ISort {
  sortBy: sortString;
  sortDir: 'asc' | 'desc';
}

type sortString =
  | 'description'
  | 'timestamp'
  | 'owner_id'
  | 'cost_center_id'
  | 'department_id'
  | 'job_number'
  | 'amount';

export class TransactionAdminView extends React.Component<props, state> {
  TxnClient: TransactionClient;
  EventClient: EventClient;
  PropertyClient: PropertyClient;

  constructor(props: props) {
    super(props);
    this.state = {
      page: 0,
      acceptOverride: ![1734, 9646, 8418].includes(props.userID),
      isLoading: false,
      departmentView: !props.isSU,
      transactions: [],
      filters: {
        statusID: props.isSU ? 8 : 2,
        yearCreated: '-- All --',
        dateCreated: '0',
        departmentID: props.isSU ? undefined : props.departmentID,
        sort: {
          sortBy: 'timestamp',
          sortDir: 'asc',
        },
      },
      count: 0,
      search: '',
      editingCostCenter: {},
      showCreateModal: false,
    };
    this.TxnClient = new TransactionClient(ENDPOINT);
    this.EventClient = new EventClient(ENDPOINT);
    this.PropertyClient = new PropertyClient(ENDPOINT);

    this.fetchTxns = this.fetchTxns.bind(this);
    this.search = this.search.bind(this);
    this.setFilter = this.setFilter.bind(this);
    this.clearFilters = this.clearFilters.bind(this);
    this.checkFilters = this.checkFilters.bind(this);
    this.toggleView = this.toggleView.bind(this);
    this.altChangePage = this.altChangePage.bind(this);
    this.handleRecordPage = this.handleRecordPage.bind(this);
    this.handleSubmitPage = this.handleSubmitPage.bind(this);
    this.copyPage = this.copyPage.bind(this);
    this.makeAddJobNumber = this.makeAddJobNumber.bind(this);
    this.makeUpdateNotes = this.makeUpdateNotes.bind(this);
    this.makeUpdateCostCenter = this.makeUpdateCostCenter.bind(this);
    this.toggleLoading = this.toggleLoading.bind(this);
    this.setSort = this.setSort.bind(this);
    this.sortTxns = this.sortTxns.bind(this);
    this.toggleEditingCostCenter = this.toggleEditingCostCenter.bind(this);
  }

  toggleLoading = (cb?: () => void) => {
    this.setState(
      prevState => ({
        isLoading: !prevState.isLoading,
      }),
      () => {
        cb && cb();
      },
    );
  };

  toggleEditingCostCenter = (id: number) => {
    this.setState(prevState => ({
      editingCostCenter: {
        ...prevState.editingCostCenter,
        [id]: !prevState.editingCostCenter[id],
      },
    }));
  };

  toggleView() {
    this.setState(prevState => ({
      departmentView: !prevState.departmentView,
      filters: {
        ...prevState.filters,
        statusID: prevState.departmentView ? 3 : 2,
      },
    }));
  }

  copyPage() {
    const dataStr = this.state.transactions.reduce(
      (acc: string, curr: Transaction.AsObject) => {
        if (acc.length === 0) {
          return `${new Date(
            curr.timestamp.split(' ').join('T'),
          ).toLocaleDateString()},${curr.description},${prettyMoney(
            curr.amount,
          )},${curr.ownerName},${curr.vendor}`;
        } else {
          return `${acc}\n${new Date(
            curr.timestamp.split(' ').join('T'),
          ).toLocaleDateString()},${curr.description},${prettyMoney(
            curr.amount,
          )},${curr.ownerName},${curr.vendor}`;
        }
      },
      '',
    );
    const el = document.createElement('textarea');
    el.value = dataStr;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  altChangePage(newPage: number) {
    if (!this.state.isLoading) {
      this.setState({ page: newPage }, this.fetchTxns);
    }
  }

  setFilter<T extends keyof IFilter>(key: T, value: IFilter[T]) {
    if (value === 'Select Month') {
      value = undefined;
    }
    this.setState(
      prevState => ({
        filters: { ...prevState.filters, [key]: value },
        count: 0,
        page: 0,
      }),
      this.fetchTxns,
    );
  }

  clearFilters() {
    this.setState(
      {
        filters: {
          yearCreated: `${new Date().getFullYear()}`,
          dateCreated: '0',
          sort: {
            sortBy: 'timestamp',
            sortDir: 'asc',
          },
        },
        page: 0,
        count: 0,
        search: '',
      },
      this.fetchTxns,
    );
  }

  makeAddJobNumber(id: number) {
    return async (jobString: string) => {
      try {
        let jobNumber;
        if (jobString.includes('-')) {
          jobNumber = parseInt(jobString.split('-')[1]);
        } else {
          jobNumber = parseInt(jobString);
        }
        const txn = new Transaction();
        txn.setId(id);
        txn.setJobId(jobNumber);
        txn.setFieldMaskList(['JobId']);
        await this.TxnClient.Update(txn);
        await this.fetchTxns();
      } catch (err) {
        alert('Job number could not be set');
        console.log(err);
      }
    };
  }

  makeUpdateNotes(id: number) {
    return async (notes: string) => {
      const txn = new Transaction();
      txn.setId(id);
      txn.setNotes(notes);
      txn.setFieldMaskList(['Notes']);
      await this.TxnClient.Update(txn);
      await this.fetchTxns();
    };
  }

  makeUpdateCostCenter(id: number) {
    return async (costCenterID: number) => {
      const txn = new Transaction();
      txn.setId(id);
      txn.setCostCenterId(costCenterID);
      txn.setFieldMaskList(['CostCenterId']);
      await this.TxnClient.Update(txn);
      await this.fetchTxns();
    };
  }

  makeRecordTransaction(id: number) {
    return async () => {
      const txn = new Transaction();
      txn.setIsRecorded(true);
      txn.setFieldMaskList(['IsRecorded']);
      txn.setId(id);
      await this.TxnClient.Update(txn);
      await this.makeLog('Transaction recorded', id);
      await this.fetchTxns();
    };
  }

  makeAuditTransaction(id: number) {
    return async () => {
      const txn = new Transaction();
      txn.setIsAudited(true);
      txn.setFieldMaskList(['IsAudited']);
      txn.setId(id);
      await this.TxnClient.Update(txn);
      await this.makeLog('Transaction audited', id);
      await this.fetchTxns();
    };
  }

  makeUpdateStatus(id: number, statusID: number, description: string) {
    return async (reason?: string) => {
      const txn = new Transaction();
      txn.setId(id);
      txn.setStatusId(statusID);
      txn.setFieldMaskList(['StatusId']);
      await this.TxnClient.Update(txn);
      await this.makeLog(`${description} ${reason || ''}`, id);
    };
  }

  makeUpdateDepartment(id: number) {
    return async (departmentID: number) => {
      const txn = new Transaction();
      txn.setId(id);
      txn.setDepartmentId(departmentID);
      txn.setFieldMaskList(['DepartmentId']);
      await this.TxnClient.Update(txn);
    };
  }

  applyFilters(obj: Transaction) {
    const { filters } = this.state;
    if (filters.userID) {
      obj.setOwnerId(filters.userID);
    }
    if (filters.costCenterID) {
      obj.setCostCenterId(filters.costCenterID);
    }
    if (this.props.showMultipleDepartments && this.props.departmentIDList) {
      console.log('setting department id list in applyFilters');
      obj.setDepartmentIdList(this.props.departmentIDList);
    }
    if (filters.departmentID) {
      if (obj.getDepartmentIdList() === '') {
        console.log('setting department id in applyFilters');
        obj.setDepartmentId(filters.departmentID);
      }
    }
    if (filters.dateCreated && filters.dateCreated !== '0') {
      obj.setTimestamp(`${filters.yearCreated}-${filters.dateCreated}%`);
    } else if (filters.yearCreated !== '-- All --') {
      obj.setTimestamp(`${filters.yearCreated}-%`);
    }
    if (filters.statusID) {
      switch (filters.statusID) {
        case 5:
          obj.setIsRecorded(true);
          break;
        case 6:
          obj.setIsAudited(true);
          break;
        case 7:
          obj.setIsAudited(false);
          obj.setFieldMaskList(['IsAudited']);
          obj.setStatusId(3);
          break;
        case 8:
          obj.setIsRecorded(false);
          obj.setFieldMaskList(['IsRecorded']);
          obj.setStatusId(3);
          break;
        default:
          obj.setStatusId(filters.statusID);
          break;
      }
    }
    obj.setOrderBy(filters.sort.sortBy);
    obj.setOrderDir(filters.sort.sortDir);
    console.log({ filters });
    return obj;
  }

  checkFilters() {
    return Object.keys(this.state.filters).reduce((acc, curr) => {
      if (acc) {
        return acc;
      } else {
        return !!this.state.filters[curr];
      }
    }, false);
  }

  makeGoToServiceCall(id: string) {
    return async () => {
      const eventID = parseInt(id);
      if (eventID) {
        let url = `https://app.kalosflorida.com/index.cfm?action=admin:service.editServiceCall&id=${eventID}`;
        const evtReq = new Event();
        evtReq.setId(eventID);
        const evt = await this.EventClient.Get(evtReq);
        url = `${url}&property_id=${evt.propertyId}`;
        const propertyReq = new Property();
        propertyReq.setId(evt.propertyId);
        const property = await this.PropertyClient.Get(propertyReq);
        url = `${url}&user_id=${property.userId}`;
        const el = document.createElement('a');
        el.target = '_blank';
        el.href = url;
        el.click();
        el.remove();
      }
    };
  }

  async fetchTxns() {
    let reqObj = new Transaction();
    reqObj = this.applyFilters(reqObj);
    reqObj.setPageNumber(this.state.page);
    reqObj.setIsActive(1);
    this.setState(
      { isLoading: true },
      await (async () => {
        let res: TransactionList;
        if (this.state.search !== '') {
          reqObj.setSearchPhrase(`%${this.state.search}%`);
          res = await this.TxnClient.Search(reqObj);
        } else {
          res = await this.TxnClient.BatchGet(reqObj);
        }
        console.log('request', reqObj.toObject());
        const asObject = res.toObject();
        console.log(asObject);
        this.setState({
          transactions: asObject.resultsList,
          count: asObject.totalCount,
          isLoading: false,
        });
      }),
    );
  }

  setSort(sortBy: sortString) {
    this.setState(prevState => {
      let newDir: 'desc' | 'asc' = 'desc';
      if (
        prevState.filters.sort.sortDir === newDir &&
        prevState.filters.sort.sortBy === sortBy
      ) {
        newDir = 'asc';
      }
      return {
        filters: {
          ...prevState.filters,
          sort: {
            sortDir: newDir,
            sortBy,
          },
        },
      };
    }, this.fetchTxns);
  }

  copyText(text: string): void {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  async handleRecordPage() {
    const ok = confirm(
      'Are you sure want to mark the current page as recorded?',
    );
    if (ok) {
      const ids = this.state.transactions.map(t => t.id);
      const req = new RecordPageReq();
      req.setTransactionIdsList(ids);
      req.setAdminId(this.props.userID);
      let reqObj = new Transaction();
      reqObj = this.applyFilters(reqObj);
      if (this.state.departmentView) {
        console.log('department view is true');
        if (this.props.showMultipleDepartments && this.props.departmentIDList) {
          console.log('setting department id list');
          reqObj.setDepartmentIdList(this.props.departmentIDList);
        } else {
          reqObj.setDepartmentId(this.props.departmentID);
        }
      }
      reqObj.setPageNumber(this.state.page);
      reqObj.setIsActive(1);
      req.setRequestData(reqObj);
      this.toggleLoading(async () => {
        const transactionList = (
          await this.TxnClient.RecordPage(req)
        ).toObject();
        this.setState({
          transactions: transactionList.resultsList,
          count: transactionList.totalCount,
          isLoading: false,
        });
      });
    }
  }

  search(text: string) {
    this.setState({ search: text });
  }

  async handleSubmitPage() {
    const ok = confirm(
      `Are you sure you want to mark the current page as ${
        this.state.acceptOverride ? 'accepted' : 'recorded'
      }?`,
    );
    if (ok) {
      const fns = this.state.transactions
        .map(t => {
          if (this.state.acceptOverride) {
            return this.makeUpdateStatus(t.id, 3, 'accepted');
          } else {
            return this.makeRecordTransaction(t.id);
          }
        })
        .map(f => f());
      this.setState({ isLoading: true }, async () => {
        try {
          await Promise.all(fns);
          await this.fetchTxns();
        } catch (err) {
          console.log(err);
          alert('An error has occurred');
          this.setState({ isLoading: false });
        }
      });
    }
  }

  async makeLog(description: string, id: number) {
    const client = new TransactionActivityClient(ENDPOINT);
    const activity = new TransactionActivity();
    activity.setIsActive(1);
    activity.setTimestamp(timestamp());
    activity.setUserId(this.props.userID);
    activity.setDescription(description);
    activity.setTransactionId(id);
    await client.Create(activity);
  }

  componentDidUpdate(prevProps: props, prevState: state) {
    if (prevState.departmentView !== this.state.departmentView) {
      this.fetchTxns();
    }
  }

  getYearList() {
    let start = 2019;
    let options: React.ReactNode[] = [];
    const end = new Date().getFullYear();

    while (start <= end) {
      options = options.concat(
        <option key={`year_${start}`} value={`${start}`}>
          {start}
        </option>,
      );
      start = start + 1;
    }
    return options;
  }

  getYearListNew() {
    let start = 2019;
    let options: string[] = [];
    const end = new Date().getFullYear();

    while (start <= end) {
      options = options.concat(start.toString());
      start = start + 1;
    }
    return options;
  }

  async componentDidMount() {
    await this.fetchTxns();
  }

  sortTxns() {
    console.log('state transactions: ', this.state.transactions);
    const { sortBy, sortDir } = this.state.filters.sort;
    if (sortBy === 'timestamp') {
      return this.state.transactions.sort((a, b) => {
        const dateA = new Date(a.timestamp.split(' ')[0]);
        const dateB = new Date(b.timestamp.split(' ')[0]);

        if (sortDir === 'asc') {
          return dateA.valueOf() - dateB.valueOf();
        } else {
          return dateB.valueOf() - dateA.valueOf();
        }
      });
    }

    if (sortBy === 'amount') {
      return this.state.transactions.sort((a, b) => {
        if (sortDir === 'asc') {
          return a.amount - b.amount;
        } else {
          return b.amount - a.amount;
        }
      });
    }

    if (sortBy === 'cost_center_id') {
      return this.state.transactions.sort((a, b) => {
        if (sortDir === 'asc') {
          return a.costCenterId - b.costCenterId;
        } else {
          return b.costCenterId - a.costCenterId;
        }
      });
    }

    if (sortBy === 'job_number') {
      return this.state.transactions.sort((a, b) => {
        if (sortDir === 'asc') {
          return a.jobId - b.jobId;
        } else {
          return b.jobId - a.jobId;
        }
      });
    }

    if (sortBy === 'description') {
      return this.state.transactions.sort((a, b) => {
        if (sortDir === 'asc') {
          return a.vendor.localeCompare(b.vendor);
        } else {
          return b.vendor.localeCompare(a.vendor);
        }
      });
    }

    return this.state.transactions;
  }

  toggleCreateModal = () => {
    this.setState(prev => ({
      ...prev,
      showCreateModal: !prev.showCreateModal,
    }));
  };

  handleSave = (entry: Transaction.AsObject): void => {
    this.setState(prev => ({
      ...prev,
      showCreateModal: false,
      transactions: [entry, ...prev.transactions],
      count: prev.count + 1,
    }));
  };

  render() {
    const txns = this.sortTxns();
    let employeeTest;
    if (this.state.departmentView) {
      employeeTest = makeEmployeeTest(this.props.departmentID);
    }
    return (
      <>
        <SectionBar
          title="Transactions"
          pagination={{
            count: this.state.count,
            rowsPerPage: 25,
            page: this.state.page,
            onChangePage: this.altChangePage,
          }}
          actions={[
            {
              label: 'Copy current page as CSV',
              onClick: this.copyPage,
              disabled: this.state.isLoading,
            },
            {
              label: `Mark current page as ${
                this.state.acceptOverride ? 'approved' : 'recorded'
              }`,
              onClick: this.state.acceptOverride
                ? this.handleSubmitPage
                : this.handleRecordPage,
              disabled: this.state.isLoading,
            },
          ]}
        />
        <div style={{ padding: 16 }}>
          <Field
            name="yearCreated"
            value={this.state.filters.yearCreated}
            label="Filter by Year"
            onChange={val => this.setFilter('yearCreated', val.toString())}
            options={['-- All --'].concat(this.getYearListNew())}
            compact
            style={{
              display: 'inline-block',
              width: 85,
              height: 46,
              marginRight: 16,
              marginBottom: 10,
              float: 'left',
            }}
          />
          <Field
            name="dateCreated"
            value={this.state.filters.dateCreated}
            label="Filter by Month"
            onChange={val => this.setFilter('dateCreated', val.toString())}
            options={makeMonthsOptions(true)}
            compact
            style={{
              display: 'inline-block',
              width: 95,
              height: 46,
              marginRight: 16,
              marginBottom: 10,
              float: 'left',
            }}
          />
          {!this.state.departmentView && (
            <div
              style={{
                height: 46,
                marginRight: 16,
                marginBottom: 10,
                display: 'inline-block',
                float: 'left',
              }}
            >
              <DepartmentPicker
                disabled={this.state.isLoading}
                selected={this.state.filters.departmentID || 0}
                onSelect={departmentID => {
                  if (typeof departmentID === 'number') {
                    this.setFilter('departmentID', departmentID);
                  }
                }}
                renderItem={i => (
                  <option value={i.id} key={`${i.id}-department-select`}>
                    {i.description} - {i.value}
                  </option>
                )}
              />
            </div>
          )}
          {this.props.isSU && (
            <div
              style={{
                height: 46,
                marginBottom: 10,
                display: 'inline-block',
                width: 'auto',
                float: 'left',
              }}
            >
              <Field
                name="departmentView"
                label="Show Your Departments"
                value={this.state.departmentView ? 1 : 0}
                type="checkbox"
                onChange={this.toggleView}
              />
            </div>
          )}
          <div
            style={{
              height: 46,
              marginRight: 16,
              marginBottom: 10,
              display: 'inline-block',
              float: 'left',
            }}
          >
            <TxnStatusPicker
              disabled={this.state.isLoading}
              selected={this.state.filters.statusID || 0}
              onSelect={statusID => this.setFilter('statusID', statusID)}
              label="Filter by Status"
            />
          </div>
          <div
            style={{
              height: 46,
              marginRight: 16,
              marginBottom: 10,
              display: 'inline-block',
              float: 'left',
            }}
          >
            <AccountPicker
              disabled={this.state.isLoading}
              selected={this.state.filters.costCenterID || 0}
              onSelect={costCenterID => {
                if (typeof costCenterID === 'number') {
                  this.setFilter('costCenterID', costCenterID);
                }
              }}
              sort={(a, b) => a.description.localeCompare(b.description)}
              renderItem={i => (
                <option value={i.id} key={`${i.id}-account-select`}>
                  {i.description} ({i.id})
                </option>
              )}
            />
          </div>
          <div
            style={{
              height: 46,
              marginRight: 16,
              marginBottom: 10,
              display: 'inline-block',
              float: 'left',
            }}
          >
            <EmployeePicker
              disabled={this.state.isLoading}
              selected={this.state.filters.userID || 0}
              onSelect={userID => this.setFilter('userID', userID)}
              label="Filter by User"
              test={employeeTest}
            />
          </div>
          <div
            style={{
              display: 'inline-block',
              width: 100,
              height: 46,
              marginRight: 8,
              marginTop: 8,
              marginBottom: 8,
              float: 'left',
            }}
          >
            <Prompt
              disabled={this.state.isLoading}
              text="Search"
              confirmFn={this.search}
              prompt="Search for: "
            />
          </div>
          <Button
            label="Clear"
            variant="outlined"
            onClick={this.clearFilters}
            disabled={!this.checkFilters()}
            style={{ float: 'left' }}
          />
          <Button
            label="Create"
            variant="outlined"
            onClick={this.toggleCreateModal}
            style={{ float: 'left' }}
          />
        </div>
        <CreateModal
          show={this.state.showCreateModal}
          entry={{} as Transaction.AsObject}
          onClose={this.toggleCreateModal}
          onSave={this.handleSave}
        />
        <div style={{ content: '', clear: 'both', display: 'table' }} />
        <InfoTable
          columns={[
            {
              name: 'Date',
              dir: 'DESC',
              onClick: () => this.setSort('timestamp'),
            },
            { name: 'Purchaser' },
            { name: 'Account', onClick: () => this.setSort('cost_center_id') },
            {
              name: 'Department',
              onClick: () => this.setSort('department_id'),
            },
            { name: 'Job #', onClick: () => this.setSort('job_number') },
            {
              name: 'Amount',
              dir: 'DESC',
              onClick: () => this.setSort('amount'),
            },
            { name: 'Description' },
            { name: 'Actions' },
          ]}
          data={
            this.state.isLoading
              ? makeFakeRows(8, 5)
              : txns.map(txn =>
                  TransactionRow({
                    txn,
                    userID: this.props.userID,
                    acceptOverride: this.state.acceptOverride,
                    departmentView: this.state.departmentView,
                    enter: this.makeRecordTransaction(txn.id),
                    audit: this.makeAuditTransaction(txn.id),
                    accept: this.makeUpdateStatus(txn.id, 3, 'accepted'),
                    reject: this.makeUpdateStatus(txn.id, 4, 'rejected'),
                    refresh: this.fetchTxns,
                    addJobNumber: this.makeAddJobNumber(txn.id),
                    updateNotes: this.makeUpdateNotes(txn.id),
                    updateCostCenter: this.makeUpdateCostCenter(txn.id),
                    updateDepartment: this.makeUpdateDepartment(txn.id),
                    toggleLoading: this.toggleLoading,
                    editingCostCenter: this.state.editingCostCenter[txn.id],
                    toggleEditingCostCenter: () =>
                      this.toggleEditingCostCenter(txn.id),
                  }),
                )
          }
          loading={this.state.isLoading}
        />
      </>
    );
  }
}

function makeEmployeeTest(departmentID: number) {
  return (user: User.AsObject) => {
    return user.employeeDepartmentId === departmentID;
  };
}

function timestamp() {
  const dateObj = new Date();
  let month = `${dateObj.getMonth() + 1}`;
  if (month.length === 1) {
    month = `0${month}`;
  }
  let day = `${dateObj.getDate()}`;
  if (day.length === 1) {
    day = `0${day}`;
  }
  let hour = `${dateObj.getHours()}`;
  if (hour.length === 1) {
    hour = `0${hour}`;
  }
  let minute = `${dateObj.getMinutes()}`;
  if (minute.length === 1) {
    minute = `0${minute}`;
  }

  return `${dateObj.getFullYear()}-${month}-${day} ${hour}:${minute}:00`;
}
