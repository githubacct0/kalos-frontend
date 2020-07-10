import React from 'react';
import ReactDOM from 'react-dom';
import { ServiceCallEdit } from './main';
import { UserClient } from '@kalos-core/kalos-rpc/User';
import { ENDPOINT } from '../../constants';

const u = new UserClient(ENDPOINT);

u.GetToken('test', 'test').then(() => {
  ReactDOM.render(
    <ServiceCallEdit
      serviceCallId={86246}
      userID={2573}
      propertyId={6552}
      loggedUserId={101253}
    />,
    document.getElementById('root'),
  );
});
