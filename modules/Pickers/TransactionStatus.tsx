import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import NativeSelect from '@material-ui/core/NativeSelect';
import {
  TransactionStatus,
  TransactionStatusClient,
} from '@kalos-core/kalos-rpc/TransactionStatus';
import { ENDPOINT } from '../../constants';

interface props {
  selected: number;
  disabled?: boolean;
  onSelect?(id: number): void;
  test?(item: TransactionStatus.AsObject): boolean;
  label?: string;
  useDevClient?: boolean;
}

interface state {
  list: TransactionStatus.AsObject[];
}

export class TxnStatusPicker extends React.PureComponent<props, state> {
  Client: TransactionStatusClient;
  constructor(props: props) {
    super(props);
    this.state = {
      list: [],
    };
    this.Client = new TransactionStatusClient(ENDPOINT);
    this.handleSelect = this.handleSelect.bind(this);
    this.addToList = this.addToList.bind(this);
  }

  handleSelect(e: React.SyntheticEvent<HTMLSelectElement>) {
    const id = parseInt(e.currentTarget.value);
    if (this.props.onSelect) {
      try {
        this.props.onSelect(id);
      } catch (err) {
        console.log(err);
      }
    }
  }

  addToList(item: TransactionStatus.AsObject) {
    this.setState(prevState => ({
      list: prevState.list.concat(item),
    }));
  }

  async fetchList() {
    const status = new TransactionStatus();
    this.Client.List(status, this.addToList);
  }

  componentDidMount() {
    this.fetchList();
  }

  render() {
    return (
      <FormControl style={{ marginBottom: 10 }}>
        <InputLabel htmlFor="txn-status-picker">
          {this.props.label || 'Status'}
        </InputLabel>
        <NativeSelect
          disabled={this.props.disabled}
          value={this.props.selected}
          onChange={this.handleSelect}
          inputProps={{ id: 'txn-status-picker' }}
        >
          <option value={0}>Select Status</option>
          {this.state.list.map(item => (
            <option value={item.id} key={`${item.description}-${item.id}`}>
              {item.description}
            </option>
          ))}
        </NativeSelect>
      </FormControl>
    );
  }
}
