import React from 'react';
import { TripSummary } from './index';
import { AddressPair } from '../PlaceAutocompleteAddressForm/Address';
import { Schema } from '../Form';
import { ExampleTitle } from '../helpers';
import { PerDiemRow } from '@kalos-core/kalos-rpc/PerDiem';

export default () => (
  <>
    <ExampleTitle>Normal</ExampleTitle>

    <TripSummary perDiemRowId={260} loggedUserId={7051}></TripSummary>
  </>
);
