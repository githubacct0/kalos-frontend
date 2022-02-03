/* 

  Description: The documentation for the Trello Slash command bot on our Slack. 

  Design Specification / Document: Slack app: https://api.slack.com/apps/A02SJF64ND7 (you will see "There's been a glitch" if you do not have the correct permissions to view the app)
  
*/

import React, { useReducer, useEffect, useCallback, FC } from 'react';
import { reducer, ACTIONS } from './reducer';
import { Devlog } from '@kalos-core/kalos-rpc/Devlog';
import { DevlogClientService } from '../../../helpers';
import { format } from 'date-fns';
import { SectionBar } from '../SectionBar';
import { Loader } from '../../Loader/main';
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';

type TempArguments = {
  name: string;
  description: string;
  isOptional: boolean;
  isQuoted: boolean;
  acceptedValues?: string[];
};

type TempCommand = {
  name: string;
  description: string;
  endpoint: string;
  arguments: TempArguments[];
};

const TEMP_COMMANDS: TempCommand[] = [
  {
    name: 'help',
    description:
      'Shows a list of all available commands for the bot. Command name is optional.',
    endpoint: 'https://dev-core.kalosflorida.com',
    arguments: [
      {
        name: 'Command Name',
        description: 'The name of the command which you need help with.',
        isOptional: true,
        isQuoted: true,
      },
    ],
  },
  {
    name: 'board',
    description:
      'Interacts with the Kalos Trello boards (Board name is not case sensitive).',
    endpoint: 'https://dev-core.kalosflorida.com',
    arguments: [
      {
        name: 'Request Type',
        description: 'How the board will be interacted with.',
        isOptional: false,
        isQuoted: false,
        acceptedValues: ['get', 'create', 'update', 'delete'],
      },
      {
        name: 'Board Name',
        description: 'The name of the board to interact with.',
        isOptional: false,
        isQuoted: true,
      },
    ],
  },
];

// add any prop types here
interface props {
  loggedUserId: number;
}

export const TrelloSlashCommandDocumentation: FC<props> = ({
  loggedUserId,
}) => {
  const [state, dispatch] = useReducer(reducer, {
    isLoaded: false,
    error: undefined,
    commands: undefined,
  });

  const loadCommands = useCallback(async () => {
    // TODO load commands here
    dispatch({ type: ACTIONS.SET_COMMANDS, data: TEMP_COMMANDS });
  }, []);

  const load = useCallback(async () => {
    await loadCommands();

    dispatch({ type: ACTIONS.SET_LOADED, data: true });
  }, [loadCommands]);

  const cleanup = useCallback(() => {}, []);

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
          `An error occurred in TrelloSlashCommandDocumentation: ${errorToSet}`,
        );
        await DevlogClientService.Create(errorLog);
        dispatch({ type: ACTIONS.SET_ERROR, data: errorToSet });
      } catch (err) {
        console.error(`An error occurred while saving a devlog: ${err}`);
      }
    },
    [loggedUserId],
  );

  const convertToTypedArgument = useCallback((argument: TempArguments) => {},
  []);

  useEffect(() => {
    if (!state.isLoaded) load();

    return () => {
      cleanup();
    };
  }, [load, cleanup, state.isLoaded]);

  /*
    ! Should be able to get all commands in a request to Core and that should return 
    ! a typed array of objects 
  */

  console.log(state.commands);
  return (
    <>
      {!state.isLoaded ? (
        <Loader />
      ) : (
        state.commands.map((command: TempCommand) => (
          <SectionBar key={`command-${command.name}`} title={command.name}>
            <Typography variant="body1">{command.description}</Typography>
            <Box sx={{ display: 'inline' }} component="div">
              <code
                style={{
                  backgroundColor: 'lightgrey',
                  borderRadius: '3px',
                }}
              >
                {`/${command.name}${command.arguments
                  .map((arg: TempArguments) => {
                    const valueToShow = arg.acceptedValues
                      ? arg.acceptedValues.join('|')
                      : arg.name;
                    console.log(`${arg.name}: ${valueToShow}`);
                    if (arg.isQuoted && arg.isOptional)
                      return ` <"${valueToShow}">`;
                    if (arg.isQuoted) return ` "${valueToShow}"`;
                    if (arg.isOptional) return ` <${valueToShow}>`;
                    return ` ${valueToShow}`;
                  })
                  .join('')}`}
              </code>
            </Box>
          </SectionBar>
        ))
      )}
    </>
  );
};
