import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import NativeSelect from '@material-ui/core/NativeSelect';
import { JobSubtype, JobSubtypeClient } from '@kalos-core/kalos-rpc/JobSubtype';
import {
  JobTypeSubtype,
  JobTypeSubtypeClient,
} from '@kalos-core/kalos-rpc/JobTypeSubtype';
import Divider from '@material-ui/core/Divider';
import { JobType } from '@kalos-core/kalos-rpc/JobType';

interface props {
  selected: number;
  jobTypeID: number;
  disabled?: boolean;
  onSelect?(id: number): void;
  useDevClient?: boolean;
}

interface state {
  list: JobSubtype.AsObject[];
  allowed: number[];
}

export class JobSubtypePicker extends React.PureComponent<props, state> {
  Client: JobSubtypeClient;
  JobTypeSubtypeClient: JobTypeSubtypeClient;
  constructor(props: props) {
    super(props);
    this.state = {
      list: [],
      allowed: [],
    };
    this.Client = new JobSubtypeClient(
      'https://core-dev.kalosflorida.com:8443',
    );
    this.JobTypeSubtypeClient = new JobTypeSubtypeClient(
      'https://core-dev.kalosflorida.com:8443',
    );
    this.handleSelect = this.handleSelect.bind(this);
    this.addItem = this.addItem.bind(this);
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

  addItem(item: JobSubtype.AsObject) {
    if (this.state.allowed.includes(item.id)) {
      this.setState(prevState => ({
        list: prevState.list.concat(item),
      }));
    }
  }

  fetchSubtypeList() {
    return new Promise(async resolve => {
      const jtst = new JobTypeSubtype();
      jtst.setJobTypeId(this.props.jobTypeID);
      const res = (await this.JobTypeSubtypeClient.BatchGet(jtst)).toObject();
      const allowed = res.resultsList.map(st => st.jobSubtypeId);
      this.setState({ allowed }, () => resolve(true));
    });
  }

  async fetchAccounts() {
    await this.fetchSubtypeList();
    this.Client.List(new JobSubtype(), this.addItem);
  }

  componentDidMount() {
    this.fetchAccounts();
  }

  render() {
    return (
      <FormControl style={{ marginTop: 10 }}>
        <InputLabel htmlFor="job-type-picker">Subtype</InputLabel>
        <NativeSelect
          disabled={this.props.disabled}
          value={this.props.selected}
          onChange={this.handleSelect}
          inputProps={{ id: 'job-type-picker' }}
          variant="outlined"
          fullWidth
        >
          <option value={0}>Select Job Type</option>
          {this.state.list.map(item => (
            <option value={item.id} key={`${item.name}-${item.id}`}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        <Divider />
      </FormControl>
    );
  }
}
