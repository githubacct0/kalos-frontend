import React, { FC, useState, useCallback, useEffect, useMemo } from 'react';
import {
  ServiceItem,
  ServiceItemClient,
} from '@kalos-core/kalos-rpc/ServiceItem';
import {
  InvoiceClient,
  Invoice as InvoiceType,
} from '@kalos-core/kalos-rpc/Invoice';
import { EventType, ServicesRenderedType } from '../';
import { PlainForm, Schema } from '../../PlainForm';
import { Field } from '../../Field';
import { PAYMENT_TYPE_LIST, SERVICE_STATUSES } from '../../../../constants';
import { formatDateTimeDay, makeSafeFormObject } from '../../../../helpers';
import { ENDPOINT } from '../../../../constants';
import { Event } from '@kalos-core/kalos-rpc/Event';
import { ServicesRendered } from '@kalos-core/kalos-rpc/ServicesRendered';

const sic = new ServiceItemClient(ENDPOINT);
const { COMPLETED, INCOMPLETE } = SERVICE_STATUSES;

interface Props {
  disabled: boolean;
  serviceItem: Event;
  servicesRendered: ServicesRendered[];
  onInitSchema: (fields: string[]) => void;
  onChange: (serviceItem: Event) => void;
}

export const Invoice: FC<Props> = ({
  serviceItem,
  servicesRendered,
  onInitSchema,
  onChange,
}) => {
  /*
    useEffect(() => {
      (async () => {
        const req = new ServiceItem();
        req.setId(serviceItem.id);
        console.log(req);
        const entry = await sic.Get(req);
        console.log('fetched: ', entry)
      })();
    }, []);
  */

  const [initSchemaCalled, setInitSchemaCalled] = useState<boolean>(false);
  let grandTotal = 0;
  const transformData = useCallback((data: Event) => {
    /*
    const {
      totalamountrow1,
      totalamountrow2,
      totalamountrow3,
      totalamountrow4,
    } = data;
    */

    const totalamountrow1 = data.getTotalamountrow1();
    const totalamountrow2 = data.getTotalamountrow2();
    const totalamountrow3 = data.getTotalamountrow3();
    const totalamountrow4 = data.getTotalamountrow4();

    const total1 = +totalamountrow1;
    const total2 = +totalamountrow2;
    const total3 = +totalamountrow3;
    const total4 = +totalamountrow4;
    data.setTotalamountrow1(total1.toString());
    data.setTotalamountrow2(total2.toString());
    data.setTotalamountrow3(total3.toString());
    data.setTotalamountrow4(total4.toString());
    grandTotal = total1 + total2 + total3 + total4;
    return data;
  }, []);
  const [formKey, setFormKey] = useState<number>(0);
  const data = transformData(serviceItem);

  const handleChange = useCallback(
    (data: Event) =>
      onChange(transformData(makeSafeFormObject(data, new Event()))),
    [onChange, transformData],
  );

  const handleCopyFromServicesRendered = useCallback(() => {
    const servicesRenderedNotes: string = servicesRendered
      .filter(status => [COMPLETED, INCOMPLETE].includes(status.getStatus()))
      .map(service =>
        [
          formatDateTimeDay(service.getDatetime()),
          service.getName(),
          '-',
          service.getServiceRendered(),
        ].join(' '),
      )
      .join('\n');
    data.setNotes(servicesRenderedNotes);
    onChange(data);
    setFormKey(formKey + 1);
  }, [onChange, data, setFormKey, formKey, servicesRendered]);

  const SCHEMA: Schema<Event> = useMemo(
    () => [
      [
        {
          label: 'Services Performed (1)',
          name: 'getServicesperformedrow1',
        },
        {
          label: 'Total Amount (1)',
          name: 'getTotalamountrow1',
          type: 'number',
          startAdornment: '$',
        },
        {
          label: 'Services Performed (2)',
          name: 'getServicesperformedrow2',
        },
        {
          label: 'Total Amount (2)',
          name: 'getTotalamountrow2',
          type: 'number',
          startAdornment: '$',
        },
      ],
      [
        {
          label: 'Services Performed (3)',
          name: 'getServicesperformedrow3',
        },
        {
          label: 'Total Amount (3)',
          name: 'getTotalamountrow3',
          type: 'number',
          startAdornment: '$',
        },
        {
          label: 'Services Performed (4)',
          name: 'getServicesperformedrow4',
        },
        {
          label: 'Total Amount (4)',
          name: 'getTotalamountrow4',
          type: 'number',
          startAdornment: '$',
        },
      ],
      [
        {
          label: 'Material Used',
          name: 'getMaterialUsed',
          readOnly: true,
          multiline: true,
        },
        {
          label: 'Material Total',
          name: 'getMaterialTotal',
          readOnly: true,
          type: 'number',
          startAdornment: '$',
        },
        {
          content: (
            <Field
              label="Payment"
              name="getPayment"
              value={0}
              startAdornment="$"
            />
          ), // FIXME
        },
        {
          label: 'Discount',
          name: 'getDiscount',
          type: 'number',
          endAdornment: '%',
        },
      ],
      [
        /*
      {
        content: (
          <Field
            label="Grand Total"
            name={undefined}
            value={grandTotal}
          />
        ),
      },
      */
        {
          content: (
            <Field
              label="Payments"
              name="getPayments"
              value={0}
              startAdornment="$"
            />
          ), // FIXME
        },
        {
          content: (
            <Field
              label="Remaining due"
              name="getRemainingDue"
              value={(1 - +data.getDiscount() / 100) * grandTotal} // FIXME
              startAdornment="$"
            />
          ),
        },
        {
          label: 'Billing Date',
          name: 'getLogBillingDate',
          type: 'date',
        },
      ],
      [
        {
          label: 'Payment Type',
          name: 'getLogPaymentType',
          options: PAYMENT_TYPE_LIST,
        },
        {
          label: 'PO',
          name: 'getLogPo',
        },
        {
          label: 'Use Property-level Billing?',
          name: 'getPropertyBilling',
          type: 'checkbox',
        },
        {
          label: 'Invoice Notes',
          name: 'getNotes',
          multiline: true,
          actions: [
            {
              label: 'Copy from Services Rendered',
              variant: 'text',
              onClick: handleCopyFromServicesRendered,
            },
          ],
          actionsInLabel: true,
        },
      ],
    ],
    [data, grandTotal, handleCopyFromServicesRendered],
  );

  useEffect(() => {
    if (!initSchemaCalled) {
      setInitSchemaCalled(true);
      const fields = SCHEMA.map(item =>
        item.map(({ name }) => name).filter(name => name),
      ).reduce((aggr, item) => [...aggr, ...item], []);
      onInitSchema(fields as string[]);
    }
  }, [initSchemaCalled, setInitSchemaCalled, onInitSchema, SCHEMA]);

  return (
    <PlainForm
      key={formKey}
      schema={SCHEMA}
      data={data}
      onChange={handleChange}
    />
  );
};
