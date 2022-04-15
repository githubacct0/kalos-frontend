/* 

  Description: a dumb test module

  Design Specification / Document: None Specified
  
*/

import React, { useReducer, useEffect, useCallback, FC } from 'react';
import { PageWrapper } from '../PageWrapper/main';
import { reducer, ACTIONS } from './reducer';
import { Devlog } from '@kalos-core/kalos-rpc/Devlog';
import { DevlogClientService } from '../../helpers';
import { format } from 'date-fns';
import { testSlackCommand } from '../../helpers';

// add any prop types here
interface props {
  loggedUserId: number;
}

export const DumbTestModule: FC<props> = ({ loggedUserId }) => {
  const [state, dispatch] = useReducer(reducer, {
    isLoaded: false,
    error: undefined, // use error for boolean checks
  });
  (async () => await testSlackCommand())();
  const load = useCallback(() => {
    // RPCs that are in here should be stubbed in the tests at least 9 times out of 10.
    // This ensures that the fake data gets "loaded" instantly and the tests can progress quickly and without RPC errors
    // For some examples, check out /test/modules/Teams or /test/modules/Payroll

    dispatch({ type: ACTIONS.SET_LOADED, data: true });
  }, []);

  const cleanup = useCallback(() => {
    // TODO clean up your function calls here (called once the component is unmounted, prevents "Can't perform a React state update on an unmounted component" errors)
    // This is important for long-term performance of our components
  }, []);

  const handleError = useCallback(
    async (errorToSet: string) => {
      // This will send out an error devlog automatically when called
      // The idea is that this will be used for any errors which we should be able to look up for debugging

      try {
        let errorLog = new Devlog();
        errorLog.setUserId(loggedUserId);
        errorLog.setTimestamp(format(new Date(), 'yyyy-MM-dd hh:mm:ss'));
        errorLog.setIsError(1);
        errorLog.setDescription(
          `An error occurred in DumbTestModule: ${errorToSet}`,
        );
        await DevlogClientService.Create(errorLog);
        dispatch({ type: ACTIONS.SET_ERROR, data: errorToSet });
      } catch (err) {
        console.error(`An error occurred while saving a devlog: ${err}`);
      }
    },
    [loggedUserId],
  );

  useEffect(() => {
    if (!state.isLoaded) load();

    return () => {
      cleanup();
    };
  }, [load, cleanup, state.isLoaded]);

  return (
    <PageWrapper userID={loggedUserId} withHeader>
      <h1>DumbTestModule works!</h1>
      <h2>About this boilerplate</h2>
      <ul>
        <li>
          Frontend unit tests were created for this module automatically in{' '}
          <code>/test/modules/DumbTestModule</code>
        </li>
        <li>
          There is a loader test ready to be implemented in the test file - it
          will show up as pending in Mocha until it is implemented
        </li>
        <li>
          You can see the templates for <code>yarn make</code> inside{' '}
          <code>/templates</code>
        </li>
        <li>
          Error-handling code was automatically generated as well - please use
          this whenever an issue occurs (so we can look back on them when an
          issue arises)
        </li>
      </ul>
      <h2>
        Some resources to get you started with unit testing in Mocha with
        Enzyme:{' '}
      </h2>
      <ul>
        <li>
          <a href="https://www.robinwieruch.de/react-testing-mocha-chai-enzyme-sinon">
            This article
          </a>{' '}
          is extremely long, but it <strong>MOSTLY</strong> shows you how to do
          what we aim to do
        </li>
        <li>
          There is a readme in <code>/test</code> that goes into how to get
          started from a technical standpoint in our current setup
        </li>
        <li>
          <code>/modules/ComponentsLibrary/Test</code> is the component that was
          unit-tested on call during our meeting, and{' '}
          <code>/test/modules/ComponentsLibrary/Test</code> is where its
          corresponding tests are located
        </li>
      </ul>
    </PageWrapper>
  );
};
