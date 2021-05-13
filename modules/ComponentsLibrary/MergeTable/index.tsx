// This is a component for comparing differences much like the diff view in VSCode. However, instead of a
// view comparing code to keep / change, it's used to merge elements together by giving the user a choice
// of which table fields to keep and which to get rid of, resulting in a full object.

// For example, a Transaction could be provided that was incomplete - the user would be given multiple choices,
// and these choices will be given back as an array of any type once the user clicked all of the changes to accept.
// There will also be editing control available as a prop, so that the user can edit the fields in the table.

import { IconButton, Typography } from '@material-ui/core';
import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Columns, Data, InfoTable } from '../InfoTable';
import { SectionBar } from '../SectionBar';
import EditIcon from '@material-ui/icons/Edit';
import { Tooltip } from '../Tooltip';
import { PlainForm, Schema } from '../PlainForm';
import { Modal } from '../Modal';

export interface SelectedChoice {
  value: string;
  fieldName: string;
  fieldIndex: number | undefined;
}

interface Props {
  columnHeaders: Columns;
  rows: {
    choices: string[];
    rowIndex: number;
    rowName: string; // What is the label to display to the side?
    onSelect?: (selected: string) => void;
  }[];
  onSubmit: (results: SelectedChoice[]) => void; // Index of the results is the index of the relevant row
  onCancel: () => void;
  properNames?: {}; // Just objects with key-value pairs that can be used to correct row names where applicable
}

type Field = {
  fieldData: string;
};

export const MergeTable: FC<Props> = ({
  columnHeaders,
  rows,
  onSubmit,
  onCancel,
  properNames,
}) => {
  let updatedFieldData = ''; // Used when updating field info, not put into a state operation to avoid re-rendering unnecessarily
  // Index of the array is the index of the relevant row
  const [selectedChoices, setSelectedChoices] = useState<SelectedChoice[]>(
    rows.map(() => {
      return { value: '', fieldName: '', fieldIndex: undefined };
    }), // Actually proud of how this one works not gonna lie
  );
  const [data, setData] = useState<Data>();
  const [selectAllPromptOpen, setSelectAllPromptOpen] =
    useState<boolean>(false);
  const [fieldToEdit, setFieldToEdit] =
    useState<
      | {
          rowIndex: number;
          choice: string;
        }
      | undefined
    >(undefined);

  let field: Field = {
    fieldData: fieldToEdit != undefined ? fieldToEdit?.choice : '',
  };

  const handleSetSelectedChoiceIndices = useCallback(
    (selectedChoice: SelectedChoice, rowIndex: number) => {
      let sci = selectedChoices;
      sci[rowIndex] = selectedChoice;
      setSelectedChoices(sci);
    },
    [setSelectedChoices, selectedChoices],
  );
  let handleSetFieldToEdit = useCallback(
    (fieldToEdit: { rowIndex: number; choice: string } | undefined) => {
      setFieldToEdit(fieldToEdit);
    },
    [setFieldToEdit],
  );
  let handleSetData = useCallback(() => {
    let rowChoices: { value: ReactNode; onClick: () => void }[][] = [];

    rows.forEach((row, rowIndex) => {
      rowChoices.push([
        {
          // @ts-ignore
          value: (
            <Typography>
              {
                //@ts-ignore
                properNames[row.rowName]
                  ? //@ts-ignore
                    properNames[row.rowName]
                  : row.rowName
              }
            </Typography>
          ),
          onClick: () => {},
        },
        ...row.choices.map(choice => {
          return {
            value: (
              <>
                <Button
                  style={{ textTransform: 'none' }}
                  label={choice}
                  onClick={() => {
                    handleSetSelectedChoiceIndices(
                      {
                        value: choice,
                        fieldName: rows[rowIndex].rowName,
                        fieldIndex: rows[rowIndex].rowIndex,
                      },
                      rowIndex,
                    );
                    handleSetData();
                  }}
                  disabled={
                    selectedChoices[rowIndex].value !== '' &&
                    selectedChoices[rowIndex].value !== choice
                  }
                />
              </>
            ),
            actions: (
              <Tooltip content="Edit field">
                <IconButton
                  size="small"
                  onClick={() =>
                    handleSetFieldToEdit({ rowIndex: rowIndex, choice: choice })
                  }
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            ),
            onClick: () => {
              handleSetSelectedChoiceIndices(
                {
                  value: choice,
                  fieldName: rows[rowIndex].rowName,
                  fieldIndex: rows[rowIndex].rowIndex,
                },
                rowIndex,
              );
              handleSetData();
            },
          };
        }),
      ]);
    });
    setData(rowChoices as Data);
  }, [rows, setData, properNames]);

  let handleMerge = useCallback(
    (submission: SelectedChoice[]) => {
      if (
        selectedChoices.filter(choice => choice.value != '').length <
        rows.length
      ) {
        setSelectAllPromptOpen(true);
        return;
      }

      console.log(submission);

      onSubmit(
        submission.sort((a, b) => (a.fieldIndex! < b.fieldIndex! ? -1 : 1)),
      );
    },
    [onSubmit, selectedChoices, setSelectAllPromptOpen],
  );

  const handleSetSelectAllPromptOpen = useCallback(
    (setOpen: boolean) => setSelectAllPromptOpen(setOpen),
    [setSelectAllPromptOpen],
  );

  const handleUpdateChoice = useCallback(
    (
      fieldToEdit: {
        rowIndex: number;
        choice: string;
      },
      updatedChoice: string,
    ) => {
      let rowsNew = rows;
      rowsNew[fieldToEdit.rowIndex] = {
        ...rows[fieldToEdit.rowIndex],
        choices: rows[fieldToEdit.rowIndex].choices.map(choiceIn => {
          if (choiceIn == fieldToEdit.choice) {
            return updatedChoice;
          }
          return choiceIn;
        }),
      };
      rows = rowsNew;

      let newChoices = selectedChoices.map(choiceIn => {
        if (
          choiceIn.value == fieldToEdit.choice &&
          rows[fieldToEdit.rowIndex].rowName == choiceIn.fieldName
        ) {
          let choiceToReturn = choiceIn;
          choiceToReturn.value = updatedChoice;
          return choiceToReturn;
        }
        return choiceIn;
      });

      setSelectedChoices(newChoices);

      handleSetFieldToEdit(undefined);
      handleSetData();
      console.log(rows);
    },
    [rows, handleSetFieldToEdit, handleSetData, setSelectedChoices],
  );

  useEffect(() => {
    handleSetData();
  }, [handleSetData]);

  const SCHEMA: Schema<Field> = [
    [
      {
        label: 'Field',
        name: 'fieldData',
        type: 'text',
      },
    ],
  ];

  return (
    <>
      {fieldToEdit && (
        <Modal
          open={fieldToEdit != undefined}
          onClose={() => handleSetFieldToEdit(undefined)}
        >
          <SectionBar
            actions={[
              {
                label: 'OK',
                onClick: () =>
                  handleUpdateChoice(fieldToEdit, updatedFieldData),
              },
              {
                label: 'Cancel',
                onClick: () => handleSetFieldToEdit(undefined),
              },
            ]}
          />
          <PlainForm
            key={rows.toString()}
            schema={SCHEMA}
            data={field}
            onChange={data => (updatedFieldData = data.fieldData)}
          />
        </Modal>
      )}
      {selectAllPromptOpen && (
        <Alert
          open={selectAllPromptOpen}
          onClose={() => handleSetSelectAllPromptOpen(false)}
          title="Notice"
        >
          <Typography>
            Please select a choice for all of the fields to merge
          </Typography>
        </Alert>
      )}
      <SectionBar
        actions={[
          { label: 'Merge', onClick: () => handleMerge(selectedChoices) },
          { label: 'Cancel', onClick: () => onCancel() },
        ]}
        title="Resolve Conflicts to Merge"
        fixedActions
      />
      <InfoTable
        key={selectedChoices.toString()}
        columns={columnHeaders}
        data={data}
      />
    </>
  );
};
