export {};

/* eslint-disable react/jsx-key */
// ! Disabled key errors in ESLint because they incorrectly label the elements within certain expectations as needing keys when they don't and will not work with keys

const COMPONENTS_LIBRARY_PATH_FROM_TEST =
  require('../../../test-constants/constants').COMPONENTS_LIBRARY_PATH_FROM_TEST;
const SETUP_PATH_FROM_TEST =
  require('../../../test-constants/constants').SETUP_PATH_FROM_TEST;

const DeletedServiceCallsReport =
  require(`${COMPONENTS_LIBRARY_PATH_FROM_TEST}/DeletedServiceCallsReport`).DeletedServiceCallsReport;
const React = require('react');
const shallow = require('enzyme').shallow;

require(`${SETUP_PATH_FROM_TEST}/grpc-endpoint.js`); // ? Required to run tests with RPCs in Mocha (because Mocha runs in a Node environment)
require(`${SETUP_PATH_FROM_TEST}/enzyme-setup.js`); // ? Required to run tests with Enzyme for React
const expectImport =
  require(`${SETUP_PATH_FROM_TEST}/chai-setup.js`).expectImport;

describe('ComponentsLibrary', () => {
  describe('DeletedServiceCallsReport', () => {
    describe('<DeletedServiceCallsReport loggedUserId={101253} dateStart="2018-05-25" dateEnd="2018-05-25" onClose={() => console.log("CLOSE")} />', () => {
      it('renders with a "Deleted Service Calls Report" title', () => {
        const wrapper = shallow(
          <DeletedServiceCallsReport
            loggedUserId={101253}
            dateStart="2018-05-25"
            dateEnd="2018-05-25"
            onClose={() => console.log('CLOSE')}
          />,
        );

        expectImport(
          wrapper.find({ title: 'Deleted Service Calls Report' }),
        ).to.have.lengthOf(1);
      });
    });
  });
});