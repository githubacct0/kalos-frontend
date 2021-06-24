import React, { FC, useState, useCallback, useEffect } from 'react';
import { Quotable } from '@kalos-core/kalos-rpc/Event';
import { SectionBar } from '../SectionBar';
import { Modal } from '../Modal';
import { InfoTable, Data, Columns } from '../InfoTable';
import { Field, Value } from '../Field';
import { Form, Schema } from '../Form';
import { Filter } from './filter';
import { makeFakeRows, usd, EventClientService } from '../../../helpers';
import { QuotableRead } from '@kalos-core/kalos-rpc/compiled-protos/event_pb';

export type SelectedQuote = {
  quotePart: Quotable;
  billable: boolean;
  quantity: number;
};
interface Props {
  serviceCallId: number;
  onAdd?: () => void;
  onAddQuotes?: (quotes: SelectedQuote[]) => void;
}

const COLUMNS: Columns = [
  { name: 'Selected' },
  { name: 'Billable' },
  { name: 'Part/Labor' },
  { name: 'Quantity' },
  { name: 'Price' },
];

const COLUMNS_QUOTABLE: Columns = [
  { name: 'Description' },
  { name: 'Quantity' },
  { name: 'Price' },
  { name: 'Amount' },
];

const SCHEMA_NEW_QUOTABLE: Schema<Quotable> = [
  [
    {
      name: 'getDescription',
      label: 'Item/Labor Name',
    },
    {
      name: 'getIsLmpc',
      type: 'checkbox',
      label: 'LMPC',
    },
  ],
  [
    {
      name: 'getQuotedPrice',
      type: 'number',
      label: 'Price',
      startAdornment: '$',
    },
    {
      name: 'getQuantity',
      type: 'number',
      label: 'QTY',
    },
  ],
];

export const QuoteSelector: FC<Props> = ({
  serviceCallId,
  onAdd,
  onAddQuotes,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [newQuotable, setNewQuotable] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('');
  const [quotable, setQuotable] = useState<Quotable[]>([]);
  const [quoteParts, setQuoteParts] = useState<Quotable[]>([]);
  const [pendingQuotable, setPendingQuotable] = useState<Quotable[]>([]);
  const [pendingNewQuotable, setPendingNewQuotable] = useState<Quotable[]>([]);
  const [selectedQuoteLineIds, setSelectedQuoteLineIds] = useState<number[]>(
    [],
  );
  const [billable, setBillable] = useState<{
    [key: number]: {
      billable: boolean;
      quantity: number;
    };
  }>({});
  const load = useCallback(async () => {
    setLoading(true);
    const req = new QuotableRead();
    req.setPageNumber(0);
    req.setIsFlatrate(true);
    const [quoteParts, quotable] = await Promise.all([
      EventClientService.loadQuoteParts(req),
      EventClientService.loadQuotable(serviceCallId),
    ]);
    setQuoteParts(quoteParts);
    setQuotable(quotable);
    setLoaded(true);
    setLoading(false);
  }, [setLoaded, setLoading, serviceCallId, setQuoteParts, setQuotable]);
  useEffect(() => {
    if (!loaded) {
      load();
    }
  }, [loaded, load]);
  const handleToggleOpen = useCallback(() => setOpen(!open), [open, setOpen]);
  const handleToggleQuoteLineSelect = useCallback(
    (id: number) => (value: Value) => {
      setSelectedQuoteLineIds(
        value
          ? [...selectedQuoteLineIds, id]
          : selectedQuoteLineIds.filter(_id => _id !== id),
      );
      if (value) {
        setBillable({
          ...billable,
          [id]: {
            billable: true,
            quantity: 1,
          },
        });
      }
    },
    [selectedQuoteLineIds, billable],
  );
  const handleToggleBillable = useCallback(
    (id: number) => (value: Value) => {
      setBillable({
        ...billable,
        [id]: {
          billable: !!value,
          quantity: billable[id].quantity || 1,
        },
      });
    },
    [billable],
  );
  const handleToggleBillableQuantity = useCallback(
    (id: number) => (value: Value) => {
      setBillable({
        ...billable,
        [id]: {
          billable: billable[id].billable,
          quantity: +value,
        },
      });
    },
    [billable],
  );
  const handleAddQuotes = useCallback(() => {
    let tempPending = [];
    for (let i = 0; i < quoteParts.length; i++) {
      if (billable[quoteParts[i].getQuoteLineId()]) {
        tempPending.push(quoteParts[i]);
      }
    }
    setPendingQuotable(tempPending);
    /*
    setPendingQuotable([
      ...Object.keys(billable).map(id => ({
        quoteParts.find(q => q.quoteLineId === +id)!,
        quantity: billable[+id].quantity,
      })),
    ]);
    */
    if (onAddQuotes) {
      onAddQuotes([
        ...Object.keys(billable).map(id => ({
          quotePart: quoteParts.find(q => q.getQuoteLineId() === +id)!,
          billable: billable[+id].billable,
          quantity: billable[+id].quantity,
        })),
        ...pendingNewQuotable.map(quotePart => ({
          quotePart,
          billable: true,
          quantity: quotePart.getQuantity(),
        })),
      ]);
    }
    setOpen(false);
  }, [billable, quoteParts, onAddQuotes, pendingNewQuotable]);
  const handleToggleNewQuotable = useCallback(
    () => setNewQuotable(!newQuotable),
    [newQuotable],
  );
  const handleSaveNewQuotable = useCallback(
    (data: Quotable) => {
      const quantity = data.getQuantity();
      const quotePart = new Quotable();
      Object.assign(quotePart, {
        ...data,
        quantity,
        isActive: true, // TODO rest default props?
      });
      const newPendingNewQuotable = [...pendingNewQuotable, quotePart];
      setPendingNewQuotable(newPendingNewQuotable);
      if (onAddQuotes) {
        onAddQuotes([
          ...Object.keys(billable).map(id => ({
            quotePart: quoteParts.find(q => q.getQuoteLineId() === +id)!,
            billable: billable[+id].billable,
            quantity: billable[+id].quantity,
          })),
          ...newPendingNewQuotable.map(quotePart => ({
            quotePart,
            billable: true,
            quantity: quotePart.getQuantity(),
          })),
        ]);
      }
      setNewQuotable(false);
      setOpen(false);
    },
    [pendingNewQuotable, onAddQuotes, billable, quoteParts],
  );
  // console.log({ quotable, quoteParts });
  const data: Data = loading
    ? makeFakeRows(6, 20)
    : quoteParts
        .filter(quote =>
          filter
            ? quote
                .getDescription()
                .toLocaleLowerCase()
                .includes(filter.toLocaleLowerCase())
            : true,
        )
        .map(quote => [
          {
            value: (
              <Field
                name="selected"
                type="checkbox"
                style={{ marginBottom: 0 }}
                value={selectedQuoteLineIds.includes(quote.getQuoteLineId())}
                onChange={handleToggleQuoteLineSelect(quote.getQuoteLineId())}
              />
            ),
          },
          {
            value: selectedQuoteLineIds.includes(quote.getQuoteLineId()) ? (
              <Field
                name="selectedBillable"
                type="checkbox"
                style={{ marginBottom: 0 }}
                value={billable[quote.getQuoteLineId()].billable}
                onChange={handleToggleBillable(quote.getQuoteLineId())}
              />
            ) : (
              ''
            ),
          },
          { value: quote.getDescription() },
          {
            value: selectedQuoteLineIds.includes(quote.getQuoteLineId()) ? (
              <Field
                name="selected"
                type="number"
                style={{ marginBottom: 0 }}
                value={billable[quote.getQuoteLineId()].quantity}
                onChange={handleToggleBillableQuantity(quote.getQuoteLineId())}
              />
            ) : (
              ''
            ),
          },
          {
            value: usd(
              selectedQuoteLineIds.includes(quote.getQuoteLineId())
                ? billable[quote.getQuoteLineId()].quantity *
                    quote.getQuotedPrice()
                : quote.getQuotedPrice(),
            ),
          },
        ]);
  const dataQuotable: Data = loading
    ? makeFakeRows(4, 5)
    : [
        ...pendingQuotable.map(quote => [
          { value: <strong>{quote.getDescription()}</strong> },
          { value: <strong>{quote.getQuantity()}</strong> },
          { value: <strong>{usd(quote.getQuotedPrice())}</strong> },
          {
            value: (
              <strong>
                {usd(quote.getQuantity() * quote.getQuotedPrice())}
              </strong>
            ),
          },
        ]),
        ...pendingNewQuotable.map(quote => [
          { value: <strong>{quote.getDescription()}</strong> },
          { value: <strong>{quote.getQuantity()}</strong> },
          { value: <strong>{usd(quote.getQuotedPrice())}</strong> },
          {
            value: (
              <strong>
                {usd(quote.getQuantity() * quote.getQuotedPrice())}
              </strong>
            ),
          },
        ]),
        ...quotable.map(quote => [
          { value: quote.getDescription() },
          { value: quote.getQuantity() },
          { value: usd(quote.getQuotedPrice()) },
          { value: usd(quote.getQuantity() * quote.getQuotedPrice()) },
        ]),
      ];
  return (
    <div>
      <SectionBar
        title="Supplies / Services"
        actions={
          onAdd
            ? [
                {
                  label: 'Add',
                  onClick: handleToggleOpen,
                  disabled: loading,
                },
              ]
            : undefined
        }
        fixedActions
      />
      <InfoTable
        columns={COLUMNS_QUOTABLE}
        data={dataQuotable}
        loading={loading}
      />
      {open && (
        <Modal open onClose={handleToggleOpen} fullScreen>
          <SectionBar
            title="Select Item(s)"
            actions={[
              {
                label: 'New Part/Labor',
                variant: 'outlined',
                onClick: handleToggleNewQuotable,
              },
              ...(onAddQuotes
                ? [{ label: 'Add Selected', onClick: handleAddQuotes }]
                : []),
              { label: 'Close', onClick: handleToggleOpen },
            ]}
            fixedActions
          />
          <Filter onSearch={setFilter} />
          <InfoTable
            columns={COLUMNS}
            data={data}
            hoverable
            loading={loading}
          />
        </Modal>
      )}
      {newQuotable && (
        <Modal open onClose={handleToggleNewQuotable}>
          <Form<Quotable>
            title="Adding the following Part of Labor to Current Job Invoice"
            schema={SCHEMA_NEW_QUOTABLE}
            onClose={handleToggleNewQuotable}
            onSave={handleSaveNewQuotable}
            data={new Quotable()}
          />
        </Modal>
      )}
    </div>
  );
};
