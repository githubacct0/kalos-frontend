import React from 'react';
import ReactDOM from 'react-dom';
import { SpiffLog } from './main';

ReactDOM.render(
  <SpiffLog loggedUserId={101253} withHeader />,
  document.getElementById('root'),
);
