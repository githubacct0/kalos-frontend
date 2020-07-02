import React, { FC } from 'react';
import compact from 'lodash/compact';
import { PrintPage } from '../../PrintPage';
import { PrintParagraph } from '../../PrintParagraph';
import { PrintTable } from '../../PrintTable';
import { UserType, usd, formatDate, PropertyType } from '../../../../helpers';

interface Props {
  displayName: string;
  notes?: string;
  entries: { description: string; price: number }[];
  logJobNumber: string;
  property: PropertyType;
}

export const ProposalPrint: FC<Props> = ({
  displayName,
  notes,
  logJobNumber,
  entries,
  property,
}) => (
  <PrintPage
    headerProps={{
      withKalosAddress: true,
      withKalosContact: true,
      bigLogo: true,
    }}
    buttonProps={{ label: 'Print Preview' }}
    downloadPdfFilename="Proposal"
    downloadLabel="Download PDF Preview"
  >
    <PrintParagraph>
      Date: {formatDate(new Date().toISOString())}
      <br />
      Job Number: {logJobNumber}
    </PrintParagraph>
    <PrintParagraph tag="h2">
      {displayName}
      <br />
      {property.address}
      <br />
      {compact([property.city, property.state, property.zip]).join(', ')}
    </PrintParagraph>
    <PrintParagraph tag="h1" align="center">
      Proposed Services
    </PrintParagraph>
    {notes && (
      <PrintTable
        columns={['Notes']}
        data={notes
          .split('\n')
          .filter(n => !!n)
          .map(n => [n])}
      />
    )}
    <PrintTable
      columns={[
        { title: 'Description of Repair', align: 'left' },
        { title: 'Price', align: 'right' },
      ]}
      data={entries.map(({ description, price }) => [description, usd(price)])}
      nowraps={[false, true]}
    />
  </PrintPage>
);
