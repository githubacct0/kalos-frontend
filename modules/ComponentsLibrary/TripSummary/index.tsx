import React from 'react';
import { InfoTable } from '../InfoTable';
import { SectionBar } from '../SectionBar';
import {
  PerDiem,
  Trip,
  TripList,
} from '@kalos-core/kalos-rpc/compiled-protos/perdiem_pb';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  PerDiemClientService,
  getTripDistance,
  getPerDiemRowId,
  UserClientService,
} from '../../../helpers';
import { AddressPair } from '../PlaceAutocompleteAddressForm/Address';
import { ConfirmDelete } from '../ConfirmDelete';
import { Schema } from '../Form';
import { Loader } from '../../Loader/main';
import { Int32 } from '@kalos-core/kalos-rpc/compiled-protos/common_pb';

// Schema will be adjusted down the line to include as many addresses as it can
export const SCHEMA_GOOGLE_MAP_INPUT_FORM: Schema<AddressPair.AsObject> = [
  [
    {
      label: 'Origin',
      headline: true,
    },
  ],
  [
    {
      label: 'Address',
      type: 'text',
      name: 'FullAddressOrigin',
    },
  ],
  [
    {
      label: 'Street Address',
      name: 'StreetAddressOrigin',
      type: 'text',
    },
    {
      label: 'City',
      name: 'CityOrigin',
      type: 'text',
    },
    {
      label: 'State',
      name: 'StateOrigin',
      type: 'text',
    },
  ],
  [
    {
      label: 'Country',
      name: 'CountryOrigin',
      type: 'text',
    },
    {
      label: 'Zip Code',
      name: 'ZipCodeOrigin',
      type: 'text',
    },
  ],
  [
    {
      label: 'Destination',
      headline: true,
    },
  ],
  [
    {
      label: 'Address',
      type: 'text',
      name: 'FullAddressDestination',
    },
  ],
  [
    {
      label: 'Street Address',
      name: 'StreetAddressDestination',
      type: 'text',
    },
    {
      label: 'City',
      name: 'CityDestination',
      type: 'text',
    },
    {
      label: 'State',
      name: 'StateDestination',
      type: 'text',
    },
  ],
  [
    {
      label: 'Country',
      name: 'CountryDestination',
      type: 'text',
    },
    {
      label: 'Zip Code',
      name: 'ZipCodeDestination',
      type: 'text',
    },
  ],
];

interface Props {
  perDiemRowId: number;
  loggedUserId: number;
  onSaveTrip?: (savedTrip?: Trip) => any;
  onDeleteTrip?: () => any;
  onDeleteAllTrips?: () => any;
}

interface State {
  pendingTrip: Trip | null;
  pendingTripToDelete: Trip | null;
  pendingDeleteAllTrips: boolean;
  trips: TripList;
  totalTripMiles: number;
  loadingTrips: boolean;
}

export class TripSummary extends React.PureComponent<Props, State> {
  nameIdPair: { name: string; id: number }[] = [];
  dateIdPair: { date: string; row_id: number }[] = [];
  constructor(props: Props) {
    super(props);
    this.state = {
      pendingTrip: null,
      trips: new TripList(),
      totalTripMiles: 0,
      pendingTripToDelete: null,
      pendingDeleteAllTrips: false,
      loadingTrips: false,
    };
    this.updateTotalMiles();
  }

  componentDidMount() {
    this.getTrips();
  }
  getTripDistance = async (origin: string, destination: string) => {
    try {
      await getTripDistance(origin, destination);
    } catch (error: any) {
      console.error(
        'An error occurred while calculating the trip distance: ',
        error,
      );
      alert(
        'An error occurred while calculating the trip distance. Please try again, or contact your administrator if this error persists.',
      );
    }
  };

  getTrips = async () => {
    let trip = new Trip();
    this.setState({ loadingTrips: true });
    const trips = await PerDiemClientService.BatchGetTrips(trip);
    this.updateTotalMiles();
    this.setState({ trips: trips });
    await this.getUserNamesFromIds();
    await this.getRowDatesFromPerDiemIds();
    this.setState({ loadingTrips: false });
  };

  getRowStartDateById = (rowId: number) => {
    if (this.dateIdPair.length == 0) {
      // Return - it's a bit early but it will be called at a later time when the state is set
      return '';
    }

    for (let obj of this.dateIdPair) {
      if (obj.row_id == rowId) {
        return obj.date;
      }
    }

    console.error('Failed to find a date for row ID: ', rowId);
  };

  getRowDatesFromPerDiemIds = async () => {
    let res: { date: string; row_id: number }[] = [];

    this.state.trips.getResultsList().forEach(async (trip: Trip) => {
      let pd = new PerDiem();
      pd.setId(trip.getPerDiemRowId());
      const pdr = await PerDiemClientService.Get(pd);
      const obj = { date: pdr.dateStarted, row_id: trip.getPerDiemRowId() };
      if (!res.includes(obj)) res.push(obj);
    });

    this.dateIdPair = res;

    return res;
  };

  getUserNamesFromIds = async () => {
    let res: { name: string; id: number }[] = [];

    this.state.trips.getResultsList().forEach(async (trip: Trip) => {
      let user = await UserClientService.loadUserById(trip.getUserId());
      let obj: { name: string; id: number } = {
        name: `${user.firstname} ${user.lastname}`,
        id: trip.getUserId(),
      };
      if (!res.includes(obj)) res.push(obj);
    });
    this.nameIdPair = res;

    return res;
  };

  getNameById = (userId: number) => {
    if (this.nameIdPair.length == 0) {
      // Return - it's a bit early but it will be called at a later time when the state is set
      return '';
    }

    for (const obj of this.nameIdPair) {
      if (obj.id == userId) {
        return obj.name;
      }
    }

    console.error('Failed to find a name for user ID: ', userId);
  };

  getTotalTripDistance = async () => {
    let i32 = new Int32();
    let val = await getPerDiemRowId();
    if (val) {
      i32.setValue(val);
    } else {
      console.error(
        'Failed to get total trip distance - getPerDiemRowId() failed',
      );

      return 0;
    }
    return (await PerDiemClientService.GetTotalRowTripDistance(i32)).getValue();
  };
  updateTotalMiles = async () => {
    this.setState({
      totalTripMiles: await this.getTotalTripDistance(),
    });
  };
  deleteTrip = async (trip: Trip) => {
    try {
      await PerDiemClientService.DeleteTrip(trip);
      if (this.props.onDeleteTrip) this.props.onDeleteTrip();
    } catch (err: any) {
      console.error('An error occurred while deleting a trip: ', err);
      alert(
        'The trip was not able to be deleted. Please try again, or if this keeps happening please contact your administrator.',
      );
      this.setState({ pendingTripToDelete: null });
      return Error(err);
    }
    this.setState({ pendingTripToDelete: null });
    this.getTrips();
    this.getUserNamesFromIds();
    this.getRowDatesFromPerDiemIds();
  };
  deleteAllTrips = async () => {
    try {
      let trip = new Trip();
      trip.setPerDiemRowId(this.props.perDiemRowId);
      trip.setUserId(this.props.loggedUserId);
      await PerDiemClientService.BatchDeleteTrips(trip);
      if (this.props.onDeleteAllTrips) this.props.onDeleteAllTrips();
    } catch (err: any) {
      console.error(
        'An error occurred while deleting the trips for this week: ',
        err,
      );
      alert(
        'The trips were not able to be deleted. Please try again, or if this keeps happening please contact your administrator.',
      );
      this.setState({ pendingDeleteAllTrips: false });
      return;
    }
    this.setState({ pendingDeleteAllTrips: false });
    this.getTrips();
    this.getUserNamesFromIds();
    this.getRowDatesFromPerDiemIds();
  };
  setStateToNew = (to: any) => {
    this.setState(to);
  };
  render() {
    return (
      <>
        <SectionBar
          title="Total Miles This Week"
          footer={
            this.state.totalTripMiles != undefined &&
            this.state.totalTripMiles != 0.0
              ? this.state.totalTripMiles?.toFixed(1) + ' miles'
              : 'None'
          }
          small
        />
        <>
          {this.state.loadingTrips && <Loader />}
          <InfoTable
            columns={[
              { name: 'Origin' },
              { name: 'Destination' },
              { name: 'Name' },
              { name: 'Week Of' },
              {
                name: 'Miles',
                actions: [
                  {
                    label: 'Delete All Trips',
                    compact: true,
                    variant: 'outlined',
                    size: 'xsmall',
                    onClick: () => {
                      this.setStateToNew({ pendingDeleteAllTrips: true });
                    },
                    burgeronly: 1,
                  },
                ],
              },
            ]}
            data={this.state
              .trips!.getResultsList()
              .map((currentTrip: Trip) => {
                return [
                  { value: currentTrip.getOriginAddress() },
                  { value: currentTrip.getDestinationAddress() },
                  { value: this.getNameById(currentTrip.getUserId()) }, // Need to use UserClientService on it
                  {
                    value: this.getRowStartDateById(
                      currentTrip.getPerDiemRowId(),
                    )?.split(' ')[0],
                  },
                  {
                    value: currentTrip.getDistanceInMiles().toFixed(1),
                    actions: [
                      <IconButton
                        key={currentTrip.getId() + 'edit'}
                        size="small"
                        onClick={() =>
                          this.setStateToNew({
                            pendingTripToDelete: currentTrip,
                          })
                        }
                      >
                        <DeleteIcon />
                      </IconButton>,
                    ],
                  },
                ];
              })}
            compact
          />
        </>
        {this.state.pendingTripToDelete && (
          <ConfirmDelete
            open={this.state.pendingTripToDelete != null}
            onClose={() => this.setStateToNew({ pendingTripToDelete: null })}
            kind="" // Purposely left blank for clarity purposes in the box
            name="this trip"
            onConfirm={() => this.deleteTrip(this.state.pendingTripToDelete!)}
          />
        )}
        {this.state.pendingDeleteAllTrips && (
          <ConfirmDelete
            open={this.state.pendingDeleteAllTrips}
            onClose={() => this.setStateToNew({ pendingDeleteAllTrips: false })}
            kind="" // Purposely left blank for clarity purposes in the box
            name="all of the trips in this week (this action cannot be undone)"
            onConfirm={() => this.deleteAllTrips()}
          />
        )}
      </>
    );
  }
}
