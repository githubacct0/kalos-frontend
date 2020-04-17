import React, { FC, useState, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import {
  ServicesRenderedClient,
  ServicesRendered,
} from '@kalos-core/kalos-rpc/ServicesRendered';
import { SectionBar } from '../../ComponentsLibrary/SectionBar';
import { ConfirmDelete } from '../../ComponentsLibrary/ConfirmDelete';
import { InfoTable, Data, Columns } from '../../ComponentsLibrary/InfoTable';
import { PlainForm, Schema } from '../../ComponentsLibrary/PlainForm';
import { Form } from '../../ComponentsLibrary/Form';
import { Modal } from '../../ComponentsLibrary/Modal';
import {
  makeFakeRows,
  timestamp,
  formatDateTime,
  formatDateTimeDay,
  getRPCFields,
} from '../../../helpers';
import {
  ENDPOINT,
  SERVICE_STATUSES,
  SIGNATURE_PAYMENT_TYPE_LIST,
  PAYMENT_COLLECTED_LIST,
  PAYMENT_NOT_COLLECTED_LIST,
  OPTION_BLANK,
} from '../../../constants';
import { UserType, ServicesRenderedType } from './ServiceCallDetails';

const ServicesRenderedClientService = new ServicesRenderedClient(ENDPOINT);

const {
  NO_STATUS,
  ENROUTE,
  ON_CALL,
  ADMIN,
  PAYMENT,
  SIGNATURE,
  COMPLETED,
  INCOMPLETE,
  SIGNED_AS,
} = SERVICE_STATUSES;

type PaymentType = {
  signature: string;
  authorizedSignorName: string;
  authorizedSignorRole: string;
  signorNotes: string;
  amountCollected: number;
  date: string;
  paymentType: string;
};

type SignatureType = {
  signature: string;
  authorizedSignorName: string;
  authorizedSignorRole: string;
  signorNotes: string;
};

type PaymentPartType = {
  paymentCollected: number;
  paymentType: string;
  amountCollected: number;
  dateProcessed: string;
};

interface Props {
  serviceCallId: number;
  loggedUser: UserType;
  servicesRendered: ServicesRenderedType[];
  loadServicesRendered: () => void;
  loading: boolean;
}

const COLUMNS_SERVICES_RENDERED: Columns = [
  { name: 'Date/Time' },
  { name: 'Technician' },
  { name: 'Services Rendered' },
  { name: 'Technician Notes' },
];

const COLUMNS_SERVICES_RENDERED_HISTORY: Columns = [
  { name: 'Date/Time' },
  { name: 'Technician' },
  { name: 'Status' },
];

const SCHEMA_SIGNATURE: Schema<SignatureType> = [
  [
    {
      label: 'Signature',
      name: 'signature',
      type: 'signature',
    },
  ],
  [
    {
      label: 'Authorized Signor Name',
      name: 'authorizedSignorName',
    },
    {
      label: 'Authorized Signor Role',
      name: 'authorizedSignorRole',
    },
    {
      label: 'Signor Notes',
      name: 'signorNotes',
      multiline: true,
    },
  ],
];

const SCHEMA_PAYMENT: Schema<PaymentType> = [
  ...SCHEMA_SIGNATURE,
  [
    {
      label: 'Payment Type',
      name: 'paymentType',
      options: [OPTION_BLANK, ...SIGNATURE_PAYMENT_TYPE_LIST],
    },
    {
      label: 'Amount Collected',
      name: 'amountCollected',
      type: 'number',
      startAdornment: '$',
    },
    {
      label: 'Date Processed',
      name: 'date',
      type: 'date',
    },
  ],
];

const SCHEMA_ON_CALL: Schema<ServicesRenderedType> = [
  [
    {
      label: 'Services Rendered',
      name: 'serviceRendered',
      multiline: true,
    },
    {
      label: 'Technician Notes',
      name: 'techNotes',
      multiline: true,
      helperText: 'For internal use',
    },
  ],
];

const PAYMENT_INITIAL: PaymentType = {
  signature: '',
  authorizedSignorName: '',
  authorizedSignorRole: '',
  signorNotes: '',
  date: timestamp(true),
  paymentType: OPTION_BLANK,
  amountCollected: 0,
};

const SIGNATURE_INITIAL: SignatureType = {
  signature: '',
  authorizedSignorName: '',
  authorizedSignorRole: '',
  signorNotes: '',
};

const PAYMENT_PART_INITIAL: PaymentPartType = {
  amountCollected: 0,
  dateProcessed: timestamp(true),
  paymentCollected: 0,
  paymentType: OPTION_BLANK,
};

const useStyles = makeStyles(theme => ({
  onCallForm: {
    marginTop: theme.spacing(),
  },
  editing: {
    width: 900,
    maxWidth: '100vw',
  },
}));

export const Services: FC<Props> = ({
  serviceCallId,
  loggedUser,
  servicesRendered,
  loadServicesRendered,
  loading,
}) => {
  const classes = useStyles();
  const { isAdmin } = loggedUser;
  const [paymentFormKey, setPaymentFormKey] = useState<number>(0);
  const [serviceRenderedForm, setServicesRenderedForm] = useState<
    ServicesRenderedType
  >(new ServicesRendered().toObject());
  const [paymentForm, setPaymentForm] = useState<PaymentType>(PAYMENT_INITIAL);
  const [signatureForm, setSignatureForm] = useState<SignatureType>(
    SIGNATURE_INITIAL,
  );
  const [paymentFormPart, setPaymentFormPart] = useState<PaymentPartType>(
    PAYMENT_PART_INITIAL,
  );
  const [deleting, setDeleting] = useState<ServicesRenderedType>();
  const [editing, setEditing] = useState<ServicesRenderedType>();
  const [saving, setSaving] = useState<boolean>(false);
  const handleDeleting = useCallback(
    (deleting?: ServicesRenderedType) => () => setDeleting(deleting),
    [setDeleting],
  );
  const handleDelete = useCallback(async () => {
    if (deleting) {
      setDeleting(undefined);
      const req = new ServicesRendered();
      req.setId(deleting.id);
      await ServicesRenderedClientService.Delete(req);
      loadServicesRendered();
    }
  }, [deleting, loadServicesRendered]);
  const handleChangeStatus = useCallback(
    (status: string) => async () => {
      const req = new ServicesRendered();
      req.setEventId(serviceCallId);
      const isSignature = status === SIGNED_AS;
      const statusToSave = `${status}${
        isSignature
          ? ` ${
              signatureForm.authorizedSignorRole ||
              paymentForm.authorizedSignorRole
            }`
          : ''
      }`;
      req.setStatus(statusToSave);
      req.setName(
        isSignature
          ? `${
              signatureForm.authorizedSignorName ||
              paymentForm.authorizedSignorName
            }`
          : `${loggedUser.firstname} ${loggedUser.lastname}`,
      );
      req.setDatetime(timestamp());
      const fieldMaskList = ['EventId', 'Status', 'Name', 'Datetime'];
      SCHEMA_ON_CALL.forEach(row =>
        row.forEach(({ name }) => {
          const { upperCaseProp, methodName } = getRPCFields(name!);
          // @ts-ignore
          req[methodName](serviceRenderedForm[name]);
          fieldMaskList.push(upperCaseProp);
        }),
      );
      req.setFieldMaskList(fieldMaskList);
      await ServicesRenderedClientService.Create(req);
      loadServicesRendered();
      setServicesRenderedForm(new ServicesRendered().toObject());
      setPaymentFormPart(PAYMENT_PART_INITIAL);
      setPaymentForm(PAYMENT_INITIAL);
      setSignatureForm(SIGNATURE_INITIAL);
    },
    [
      loggedUser,
      loadServicesRendered,
      serviceRenderedForm,
      setSignatureForm,
      setServicesRenderedForm,
      setPaymentFormPart,
      setPaymentForm,
      setSignatureForm,
      signatureForm,
      paymentForm,
    ],
  );
  const handleChangeServiceRendered = useCallback(
    async (data: ServicesRenderedType) => {
      if (editing) {
        setSaving(true);
        const req = new ServicesRendered();
        req.setId(editing.id);
        const fieldMaskList: string[] = [];
        SCHEMA_ON_CALL.forEach(row =>
          row.forEach(({ name }) => {
            const { upperCaseProp, methodName } = getRPCFields(name!);
            // @ts-ignore
            req[methodName](data[name]);
            fieldMaskList.push(upperCaseProp);
          }),
        );
        req.setFieldMaskList(fieldMaskList);
        await ServicesRenderedClientService.Update(req);
        await loadServicesRendered();
        setSaving(false);
        setEditing(undefined);
      }
    },
    [editing, SCHEMA_ON_CALL, setSaving, setEditing, loadServicesRendered],
  );
  const handleSetEditing = useCallback(
    (editing?: ServicesRenderedType) => () => setEditing(editing),
    [setEditing],
  );
  const handlePaymentFormChange = useCallback(
    (data: PaymentPartType) => {
      const hasPaymentCollectedChanged =
        data.paymentCollected !== paymentFormPart.paymentCollected;
      setPaymentFormPart({
        ...data,
        ...(hasPaymentCollectedChanged
          ? {
              paymentType: OPTION_BLANK,
            }
          : {}),
      });
      if (hasPaymentCollectedChanged) {
        setPaymentFormKey(paymentFormKey + 1);
      }
    },
    [setPaymentFormPart, paymentFormPart, paymentFormKey, setPaymentFormKey],
  );
  const data: Data = loading
    ? makeFakeRows(4, 3)
    : servicesRendered.map(props => {
        const { datetime, name, status } = props;
        return [
          { value: formatDateTime(datetime) },
          { value: name },
          {
            value: (
              <span
                style={{
                  ...([COMPLETED, INCOMPLETE].includes(status)
                    ? {
                        color: status === COMPLETED ? 'green' : 'red',
                      }
                    : {}),
                }}
              >
                {status}
              </span>
            ),
            actions: [
              ...([COMPLETED, INCOMPLETE].includes(status)
                ? [
                    <IconButton
                      key={1}
                      onClick={handleSetEditing(props)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>,
                  ]
                : []),
              <IconButton key={0} onClick={handleDeleting(props)} size="small">
                <DeleteIcon />
              </IconButton>,
            ],
          },
        ];
      });
  let lastStatus = servicesRendered[0] ? servicesRendered[0].status : '';
  if (lastStatus.startsWith(SIGNED_AS)) {
    lastStatus = SIGNED_AS;
  }
  const servicesRenderedData: Data = servicesRendered
    .filter(({ status }) => [COMPLETED, INCOMPLETE].includes(status))
    .map(({ datetime, name, serviceRendered, techNotes }) => [
      { value: formatDateTimeDay(datetime) },
      { value: name },
      { value: serviceRendered },
      { value: techNotes },
    ]);
  const SCHEMA_PAYMENT_PART: Schema<PaymentPartType> = [
    [
      {
        label: 'Payment Collected',
        name: 'paymentCollected',
        type: 'checkbox',
      },
      {
        label: 'Payment Type',
        name: 'paymentType',
        options: [
          OPTION_BLANK,
          ...(paymentFormPart.paymentCollected
            ? PAYMENT_COLLECTED_LIST
            : PAYMENT_NOT_COLLECTED_LIST),
        ],
      },
      {
        label: 'Amount Collected',
        name: 'amountCollected',
        type: 'number',
        startAdornment: '$',
      },
      {
        label: 'Date Processed',
        name: 'dateProcessed',
        type: 'date',
      },
    ],
  ];
  return (
    <>
      {[COMPLETED, INCOMPLETE, ENROUTE, ADMIN].includes(lastStatus) &&
        servicesRenderedData.length > 0 && (
          <InfoTable
            columns={COLUMNS_SERVICES_RENDERED}
            data={servicesRenderedData}
            loading={saving}
          />
        )}
      <SectionBar
        title="Services Rendered History"
        actions={
          loading
            ? []
            : [
                ...([
                  NO_STATUS,
                  ENROUTE,
                  ON_CALL,
                  COMPLETED,
                  INCOMPLETE,
                  PAYMENT,
                  SIGNATURE,
                  ADMIN,
                  SIGNED_AS,
                ].includes(lastStatus)
                  ? [
                      {
                        label: ENROUTE,
                        onClick: handleChangeStatus(ENROUTE),
                        disabled: [ENROUTE, ON_CALL, ADMIN].includes(
                          lastStatus,
                        ),
                      },
                    ]
                  : []),
                ...([ENROUTE, ON_CALL].includes(lastStatus)
                  ? [
                      {
                        label: ON_CALL,
                        onClick: handleChangeStatus(ON_CALL),
                        disabled: [ON_CALL].includes(lastStatus),
                      },
                    ]
                  : []),
                ...([
                  NO_STATUS,
                  COMPLETED,
                  INCOMPLETE,
                  PAYMENT,
                  SIGNATURE,
                  ADMIN,
                  SIGNED_AS,
                ].includes(lastStatus) && isAdmin
                  ? [
                      {
                        label: ADMIN,
                        onClick: handleChangeStatus(ADMIN),
                      },
                    ]
                  : []),
                ...([ON_CALL, ADMIN].includes(lastStatus)
                  ? [
                      {
                        label: COMPLETED,
                        onClick: handleChangeStatus(COMPLETED),
                        status: 'success' as const,
                      },
                      {
                        label: INCOMPLETE,
                        onClick: handleChangeStatus(INCOMPLETE),
                        status: 'failure' as const,
                      },
                    ]
                  : []),
                ...([
                  NO_STATUS,
                  ENROUTE,
                  COMPLETED,
                  INCOMPLETE,
                  SIGNED_AS,
                ].includes(lastStatus)
                  ? [
                      {
                        label: PAYMENT,
                        onClick: handleChangeStatus(PAYMENT),
                      },
                      {
                        label: SIGNATURE,
                        onClick: handleChangeStatus(SIGNATURE),
                      },
                    ]
                  : []),
                ...([PAYMENT, SIGNATURE].includes(lastStatus)
                  ? [
                      {
                        label: 'SAVE',
                        onClick: handleChangeStatus(SIGNED_AS),
                      },
                    ]
                  : []),
              ]
        }
      />
      {[PAYMENT].includes(lastStatus) && (
        <PlainForm
          schema={SCHEMA_PAYMENT}
          data={paymentForm}
          onChange={setPaymentForm}
        />
      )}
      {[SIGNATURE].includes(lastStatus) && (
        <PlainForm
          schema={SCHEMA_SIGNATURE}
          data={signatureForm}
          onChange={setSignatureForm}
        />
      )}
      {[ON_CALL, ADMIN].includes(lastStatus) && (
        <>
          <PlainForm
            schema={SCHEMA_ON_CALL}
            data={serviceRenderedForm}
            onChange={setServicesRenderedForm}
            compact
            className={classes.onCallForm}
          />
          <PlainForm
            key={paymentFormKey}
            schema={SCHEMA_PAYMENT_PART}
            data={paymentFormPart}
            onChange={handlePaymentFormChange}
            compact
          />
        </>
      )}
      <InfoTable
        columns={COLUMNS_SERVICES_RENDERED_HISTORY}
        data={data}
        loading={loading}
      />
      {deleting && (
        <ConfirmDelete
          open
          onClose={handleDeleting()}
          kind="Service Rendered Item"
          name={`Technician: ${deleting.name}, Status: ${deleting.status}`}
          onConfirm={handleDelete}
        />
      )}
      {editing && (
        <Modal open onClose={handleSetEditing()}>
          <div className={classes.editing}>
            <Form<ServicesRenderedType>
              title="Services Rendered Edit"
              schema={SCHEMA_ON_CALL}
              data={editing}
              onClose={handleSetEditing()}
              onSave={handleChangeServiceRendered}
              disabled={saving}
            >
              <PlainForm
                key={paymentFormKey}
                schema={SCHEMA_PAYMENT_PART}
                data={paymentFormPart}
                onChange={handlePaymentFormChange}
                compact
                fullWidth
              />
            </Form>
          </div>
        </Modal>
      )}
    </>
  );
};

//Are you sure you want to delete this services rendered item?
