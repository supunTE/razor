import {
  AppPlayerId,
  AppPlayerLogId,
  AppRaceId,
  AppTournamentId,
} from '@razor/models';

export enum ExtractIdType {
  tournament = 'tournament',
  player = 'player',
  race = 'race',
  playerLog = 'playerLog',
}

type IdType = AppTournamentId | AppPlayerId | AppRaceId | AppPlayerLogId;

type TypeMap = {
  tournament: AppTournamentId;
  player: AppPlayerId;
  race: AppRaceId;
  playerLog: AppPlayerLogId;
};

/** Extract an id from a compound id
 *
 * @param inputId - Compound id to extract from.
 * @param inputIdType - Type of id to input id.
 * @param outputIdType - Type of id to extract.
 * @returns - Extracted id.
 */
export const extractId = <T extends ExtractIdType>(
  inputId: IdType,
  inputIdType: ExtractIdType,
  outputIdType: T,
): TypeMap[T] => {
  if (inputIdType === outputIdType) {
    return inputId as TypeMap[T];
  }

  // Check the validity of the input id.
  const validInput = checkValidityOfId(inputIdType, inputId);
  // If invalid
  if (!validInput) {
    throw new Error('Invalid input value');
  }

  // Split id into parts by '-'.
  const splitedId = inputId.split('-');
  // Switching by output id type.
  switch (outputIdType) {
    // Output id type is "tournament".
    case ExtractIdType.tournament:
      // Extract the first part of the id if the input id type is "race" or "playerLog".
      if (inputIdType === ExtractIdType.race) {
        return splitedId[0] as TypeMap[T];
      } else if (inputIdType === ExtractIdType.playerLog) {
        return splitedId[0] as TypeMap[T];
      } else {
        throw new Error('Invalid type');
      }
    // Output id type is "player".
    case ExtractIdType.player:
      // Extract the second part of the id if the input id type is "playerLog".
      if (inputIdType === ExtractIdType.playerLog) {
        return splitedId[2] as TypeMap[T];
      } else {
        throw new Error('Invalid type');
      }
    // Output id type is "race"
    case ExtractIdType.race:
      // Extract the first two parts of the id if the input id type is "playerLog".
      if (inputIdType === ExtractIdType.playerLog) {
        return `${splitedId[0]}-${splitedId[1]}` as TypeMap[T];
      } else {
        throw new Error('Invalid type');
      }
    default:
      throw new Error('Invalid type');
  }
};

/** Checking validity of an id
 *
 * @param type - Type of id to check.
 * @param id - Id to check.
 */
export const checkValidityOfId = (
  type: ExtractIdType,
  id: IdType,
): RegExpMatchArray | null => {
  switch (type) {
    case ExtractIdType.tournament:
      return id.match(/^T:[a-zA-Z0-9]{8}$/);
    case ExtractIdType.player:
      return id.match(/^P:[a-zA-Z0-9]{8}$/);
    case ExtractIdType.race:
      return id.match(/^T:[a-zA-Z0-9]{8}-R:[a-zA-Z0-9]{3}$/);
    case ExtractIdType.playerLog:
      return id.match(/^T:[a-zA-Z0-9]{8}-R:[a-zA-Z0-9]{3}-P:[a-zA-Z0-9]{8}$/);
  }
};
