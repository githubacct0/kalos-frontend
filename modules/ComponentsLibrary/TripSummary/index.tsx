import React from 'react';
import { Columns, InfoTable } from '../InfoTable';
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
  UserClientService,
  loadTripsByFilter,
  TripsFilter,
  TripsSort,
  LoadTripsByFilter,
  getRPCFields,
} from '../../../helpers';
import { AddressPair } from '../PlaceAutocompleteAddressForm/Address';
import { ConfirmDelete } from '../ConfirmDelete';
import { Form, Schema } from '../Form';
import { Loader } from '../../Loader/main';
import { Int32 } from '@kalos-core/kalos-rpc/compiled-protos/common_pb';
import { AdvancedSearch } from '../AdvancedSearch';
import { Search } from '../Search';

export const SCHEMA_TRIP_SEARCH: Schema<Trip.AsObject> = [
  [
    {
      label: 'ID',
      type: 'text',
      name: 'id',
    },
    {
      label: 'Origin',
      type: 'text',
      name: 'originAddress',
    },
    {
      label: 'Destination',
      type: 'text',
      name: 'destinationAddress',
    },
  ],
];

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
  perDiemRowIds: number[];
  loggedUserId: number;
  canDeleteTrips?: boolean;
  compact?: boolean;
  hoverable?: boolean;
  searchable?: boolean;
  displayTripDistance?: boolean;
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
  key: number;
  loading: boolean;
  search: Trip.AsObject;
  page: number;
}

export class TripSummary extends React.PureComponent<Props, State> {
  nameIdPair: { name: string; id: number }[] = [];
  dateIdPair: { date: string; row_id: number }[] = [];
  resultsPerPage: number = 25;
  constructor(props: Props) {
    super(props);
    this.state = {
      pendingTrip: null,
      trips: new TripList(),
      totalTripMiles: 0,
      pendingTripToDelete: null,
      pendingDeleteAllTrips: false,
      key: 0,
      loading: true,
      search: new Trip().toObject(),
      page: 0,
    };
    this.setTripState();
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
  refreshNamesAndDates = async () => {
    new Promise(async resolve => {
      await this.getUserNamesFromIds();
      await this.getRowDatesFromPerDiemIds();
      resolve(false);
    }).then((result: any) => {
      this.setState({ loading: result });
    });
  };

  loadTrips = async (tripFilter?: TripsFilter) => {
    let trips: Trip[] = [];
    const tripSort = {
      orderByField: 'user_id',
      orderBy: 'user_id',
      orderDir: 'ASC',
    };
    const page = this.state.page;

    const criteria: LoadTripsByFilter = {
      page,
      filter: tripFilter
        ? tripFilter
        : {
            userId:
              this.props.loggedUserId != 0
                ? this.props.loggedUserId
                : undefined,
            weekof: this.props.perDiemRowIds,
          },
      sort: tripSort as TripsSort,
    };
    return await new Promise<Trip[]>(async resolve => {
      let tripResultList: any = [];
      if (tripFilter) {
        tripResultList = (await loadTripsByFilter(criteria)).results.filter(
          trip => {
            let fail = true,
              userIDFailed = true;
            if (this.props.loggedUserId != 0) {
              if (trip.userId == this.props.loggedUserId) {
                userIDFailed = false;
              }
            }
            this.props.perDiemRowIds.forEach(id => {
              if (trip.perDiemRowId == id) {
                fail = false;
              }
            });
            if (userIDFailed && this.props.loggedUserId != 0) fail = true;
            return !fail;
          },
        );
      } else {
        tripResultList = (await loadTripsByFilter(criteria)).results.filter(
          trip => {
            let fail = false;
            let hadId = false;
            this.props.perDiemRowIds.forEach(id => {
              if (trip.perDiemRowId == id) {
                hadId = true;
              }
            });
            if (!hadId) {
              fail = true;
            }
            this.state.trips.getResultsList().forEach(t => {
              if (t.getId() == trip.id) {
                fail = true;
              }
            });
            return !fail;
          },
        );
      }

      let tripList: Trip[] = [];
      for await (const tripAsObj of tripResultList) {
        const req = new Trip();
        let originAddress: string = '',
          destinationAddress: string = '';
        for (const fieldName in tripAsObj) {
          let { methodName } = getRPCFields(fieldName);
          if (methodName == 'setDestinationAddress') {
            //@ts-ignore
            destinationAddress = tripAsObj[fieldName];
          }
          if (methodName == 'setOriginAddress') {
            //@ts-ignore
            originAddress = tripAsObj[fieldName];
          }

          //@ts-ignore
          req[methodName](tripAsObj[fieldName]);
        }

        req.setPerDiemRowId(tripAsObj.perDiemRowId);
        req.setUserId(tripAsObj.userId);
        req.setNotes(tripAsObj.notes);
        req.setDistanceInMiles(tripAsObj.distanceInMiles);
        req.setOriginAddress(originAddress);
        req.setDestinationAddress(destinationAddress);
        tripList.push(req);
      }
      trips.push(...tripList);
      resolve(trips);
    }).then(result => {
      return result;
    });
  };

  setTripState = async (tripFilter?: Trip.AsObject) => {
    await this.loadTrips(tripFilter).then(async result => {
      let list = new TripList();
      list.setResultsList(result);
      this.setState({ trips: list });
      await this.refreshNamesAndDates();
      await this.updateTotalMiles();
    });
  };

  getRowStartDateById = (rowId: number) => {
    if (this.dateIdPair.length == 0) return;
    for (let obj of this.dateIdPair) {
      if (obj.row_id == rowId) {
        return obj.date;
      }
    }

    return '-';
  };

  getRowDatesFromPerDiemIds = async () => {
    let res: { date: string; row_id: number }[] = [];

    await new Promise(async resolve => {
      for await (const trip of this.state.trips.getResultsList()) {
        try {
          let pd = new PerDiem();
          pd.setId(trip.getPerDiemRowId());
          const pdr = await PerDiemClientService.Get(pd);
          const obj = {
            date: pdr.dateStarted,
            row_id: trip.getPerDiemRowId(),
          };
          if (!res.includes(obj)) res.push(obj);
        } catch (err: any) {
          console.error(
            'Error in promise for get row dates from per diem IDs (Verify Per Diem exists): ',
            err,
          );
        }
      }
      resolve(res);
    }).then(() => {
      this.dateIdPair = res;
      this.setState({ key: this.state.key + 1 });
    });

    return res;
  };

  getUserNamesFromIds = async () => {
    let res: { name: string; id: number }[] = [];

    this.state.trips.getResultsList().forEach(async (trip: Trip, idx, arr) => {
      try {
        let user = await UserClientService.loadUserById(trip.getUserId());
        let obj: { name: string; id: number } = {
          name: `${user.firstname} ${user.lastname}`,
          id: trip.getUserId(),
        };
        if (!res.includes(obj)) res.push(obj);
        if (idx == arr.length - 1) {
          this.nameIdPair = res;
          return res;
        }
      } catch (err: any) {
        console.error('Failed to get user names from IDs: ', err);
      }
    });
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
  };

  getTotalTripDistance = async () => {
    let dist = 0;

    await new Promise(async resolve => {
      let total = 0;

      for await (const trip of this.state.trips.getResultsList()) {
        total += trip.getDistanceInMiles();
      }

      resolve(total);
    }).then(val => {
      dist = Number(val);
    });
    return dist;
  };
  updateTotalMiles = async () => {
    this.setState({
      totalTripMiles: await this.getTotalTripDistance(),
    });
  };
  deleteTrip = async (trip: Trip) => {
    try {
      await PerDiemClientService.DeleteTrip(trip);
      let trips = this.state.trips;
      let t = this.state.trips.getResultsList().indexOf(trip);
      trips.getResultsList().splice(t, 1);
      this.setState({ trips: trips });
      if (this.props.onDeleteTrip) this.props.onDeleteTrip();
    } catch (err: any) {
      console.error('An error occurred while deleting a trip: ', err);
      alert(
        'The trip was not able to be deleted. Please try again, or if this keeps happening please contact your administrator.',
      );
      this.setState({ pendingTripToDelete: null });
      return Error(err);
    }
    this.setTripState();
    this.refreshNamesAndDates();
    this.setState({ pendingTripToDelete: null });
  };
  deleteAllTrips = async () => {
    this.props.perDiemRowIds.forEach(async id => {
      try {
        let trip = new Trip();
        trip.setPerDiemRowId(id);
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
    });
    this.setTripState();
    this.refreshNamesAndDates();
    this.setState({ pendingDeleteAllTrips: false });
  };
  setStateToNew = (to: any) => {
    this.setState(to);
  };
  handleChangePage = (page: number) => {
    this.setState({ page: page });
  };
  getData = () => {
    return this.state.trips!.getResultsList().map((currentTrip: Trip) => {
      if (this.props.canDeleteTrips) {
        return [
          { value: currentTrip.getOriginAddress() },
          { value: currentTrip.getDestinationAddress() },
          {
            value: this.getNameById(currentTrip.getUserId()),
          }, // Need to use UserClientService on it
          {
            value: this.getRowStartDateById(
              currentTrip.getPerDiemRowId(),
            )?.split(' ')[0],
          },
          {
            value: currentTrip.getDistanceInMiles().toFixed(1),
          },
          {
            value: currentTrip.getNotes(),
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
      } else {
        return [
          { value: currentTrip.getOriginAddress() },
          { value: currentTrip.getDestinationAddress() },
          {
            value: this.getNameById(currentTrip.getUserId()),
          }, // Need to use UserClientService on it
          {
            value: this.getRowStartDateById(
              currentTrip.getPerDiemRowId(),
            )?.split(' ')[0],
          },
          {
            value: currentTrip.getDistanceInMiles().toFixed(1),
          },
          {
            value: currentTrip.getNotes(),
          },
        ];
      }
    });
  };
  getColumns = () => {
    return (this.props.canDeleteTrips
      ? [
          { name: 'Origin' },
          { name: 'Destination' },
          { name: 'Name' },
          { name: 'Week Of' },
          { name: 'Miles' },
          {
            name: 'Notes',
            actions: [
              {
                label: 'Delete All Trips',
                compact: this.props.compact ? true : false,
                variant: 'outlined',
                size: 'xsmall',
                onClick: () => {
                  this.setStateToNew({
                    pendingDeleteAllTrips: true,
                  });
                },
                burgeronly: 1,
              },
            ],
          },
        ]
      : [
          { name: 'Origin' },
          { name: 'Destination' },
          { name: 'Name' },
          { name: 'Week Of' },
          { name: 'Miles' },
          {
            name: 'Notes',
          },
        ]) as Columns;
  };
  render() {
    return (
      <>
        <SectionBar
          title="Trips"
          pagination={{
            count: this.state.trips.getResultsList().length,
            page: this.state.page,
            rowsPerPage: this.resultsPerPage,
            onChangePage: this.handleChangePage,
          }}
          footer={
            this.props.displayTripDistance
              ? this.state.totalTripMiles != undefined &&
                this.state.totalTripMiles != 0.0
                ? 'Total miles: ' +
                  this.state.totalTripMiles?.toFixed(1) +
                  ' miles'
                : 'Total miles: None'
              : null
          }
          small={this.props.compact ? true : false}
          key={this.state.trips.getResultsList().length}
        />
        <>
          {this.state.loading && <Loader />}
          {!this.props.searchable && (
            <>
              <>
                <InfoTable
                  key={
                    this.state.key +
                    String(this.dateIdPair) +
                    String(this.nameIdPair)
                  }
                  columns={this.getColumns()}
                  data={this.getData()}
                  compact={this.props.compact ? true : false}
                  hoverable={this.props.hoverable ? true : false}
                />
              </>
            </>
          )}
          {this.props.searchable && (
            <Form
              title="Search"
              submitLabel="Search"
              cancelLabel="Reset"
              schema={SCHEMA_TRIP_SEARCH}
              data={this.state.search}
              onClose={() => {
                this.setTripState();
              }}
              onSave={tripFilter => this.setTripState(tripFilter)}
            >
              <>
                <InfoTable
                  key={
                    this.state.key +
                    String(this.dateIdPair) +
                    String(this.nameIdPair)
                  }
                  columns={this.getColumns()}
                  data={this.getData()}
                  compact={this.props.compact ? true : false}
                  hoverable={this.props.hoverable ? true : false}
                />
              </>
            </Form>
          )}
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
