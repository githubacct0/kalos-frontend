// This is a component for comparing differences much like the diff view in VSCode. However, instead of a
// view comparing code to keep / change, it's used to merge elements together by giving the user a choice
// of which table fields to keep and which to get rid of, resulting in a full object.

// For example, a Transaction could be provided that was incomplete - the user would be given multiple choices,
// and these choices will be given back as an array of any type once the user clicked all of the changes to accept.
// There will also be editing control available as a prop, so that the user can edit the fields in the table.

import React, { FC, useCallback, useState } from 'react';
import { Columns, InfoTable, Data, Row } from '../InfoTable';

interface Props {
  columnHeaders: Columns;
  rows: {
    choices: string[];
    onSelect?: (selected: string) => void;
  }[];
}

export const MergeTable: FC<Props> = ({ columnHeaders, rows }) => {
  const [selectedChoiceIndices, setSelectedChoiceIndices] = useState<number[]>(
    rows.map(() => 0), // Actually proud of how this one works not gonna lie
  );
  const handleSetSelectedChoiceIndices = useCallback(
    (selectedChoiceIndex: number, rowIndex: number) => {
      let sci = selectedChoiceIndices;
      sci[rowIndex] = selectedChoiceIndex;
      setSelectedChoiceIndices(sci);
    },
    [setSelectedChoiceIndices, selectedChoiceIndices],
  );
  let makeData = useCallback(() => {
    let rowChoices: { value: string; onClick: () => void }[][] = [];

    rows.forEach((row, rowIndex) => {
      // outside array due to map

      rowChoices.push(
        row.choices.map((choice, choiceIndex) => {
          return {
            value: choice,
            onClick: () => alert(rowIndex + ' ' + choiceIndex),
          };
        }),
      );
    });
    return rowChoices as Data;
  }, [rows]);
  return (
    <>
      <InfoTable columns={columnHeaders} data={makeData()} />
    </>
  );
};
