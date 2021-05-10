export namespace AddressPair {
  export type AsObject = {
    FullAddressOrigin: string;
    StreetAddressOrigin: string;
    CityOrigin: string;
    StateOrigin: string;
    ZipCodeOrigin: string;
    CountryOrigin: string;

    FullAddressDestination: string;
    StreetAddressDestination: string;
    CityDestination: string;
    StateDestination: string;
    ZipCodeDestination: string;
    CountryDestination: string;

    Notes: string;
    Date: string;
    HomeTravel: boolean;
    PerDiemId: number;
  };

  export interface AddressInterface {
    FullAddressOrigin: string;
    StreetAddressOrigin: string;
    CityOrigin: string;
    StateOrigin: string;
    ZipCodeOrigin: string;
    CountryOrigin: string;

    FullAddressDestination: string;
    StreetAddressDestination: string;
    CityDestination: string;
    StateDestination: string;
    ZipCodeDestination: string;
    CountryDestination: string;

    Notes: string;
    Date: string;
    HomeTravel: boolean;
    PerDiemId: number;
  }

  export class AddressPair implements AddressInterface {
    FullAddressOrigin: string = '';
    StreetAddressOrigin: string = '';
    CityOrigin: string = '';
    StateOrigin: string = '';
    ZipCodeOrigin: string = '';
    CountryOrigin: string = '';

    FullAddressDestination: string = '';
    StreetAddressDestination: string = '';
    CityDestination: string = '';
    StateDestination: string = '';
    ZipCodeDestination: string = '';
    CountryDestination: string = '';
    HomeTravel: boolean = false;
    Notes: string = '';
    Date: string = '';
    PerDiemId: number = 0;
  }
}
