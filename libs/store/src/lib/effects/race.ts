// ### [Effects] Race operations ### //

import {
  AppPlayer,
  AppPlayerProfiles,
  AppPlayerState,
  AppRace,
  AppRaceId,
  AppTournament,
  AppTournamentId,
  AppTournamentState,
} from '@razor/models';
import {
  calculateTimeoutTimer,
  extractId,
  ExtractIdType,
  generateLeaderboard,
  giveZeroPadding,
} from '@razor/util';
import {
  EndCountdownPayload,
  EndRacePayload,
  StartCountdownPayload,
} from '../payloads';
import { playerNotFound, raceNotFound, tournamentNotFound } from '../raisers';
import { Dispatch, RootState } from '../store';

//TODO: should move this to server later
// const loadRacingText = async (): Promise<string> => {
//   const url = 'http://www.metaphorpsum.com/paragraphs/1/8';

//   return fetch(url)
//     .then(response => response.text())
//     .then(data => {
//       return data;
//     });
// };

/** Effect function for starting the countdown of the race.
 * Run the validation for the received payload.
 * If the player who pressed the start button and the relevant tournament are found, then the countdown will be started.
 * Tournament state will be changed to "Countdown".
 *
 * @todo: complete later
 */
export const startCountdown = (
  dispatch: Dispatch,
  payload: StartCountdownPayload,
  state: RootState,
): void => {
  const { tournamentId, playerId, raceText } = payload;

  if (!(tournamentId in state.game.tournamentsModel)) {
    tournamentNotFound(dispatch, tournamentId, `Started by: ${playerId}`);
    return;
  }
  if (!(playerId in state.game.playersModel)) {
    playerNotFound(
      dispatch,
      playerId,
      `While tournament starting: ${tournamentId}`,
    );
    return;
  }

  const numberOfRacesBefore =
    state.game.tournamentsModel[tournamentId].raceIds.length || 0;

  const raceIndex = giveZeroPadding(numberOfRacesBefore.toString(), 3);
  const raceId: AppRaceId = `${tournamentId}-R:${raceIndex}`;
  const players: AppPlayerProfiles = {};

  for (const id of state.game.tournamentsModel[tournamentId].playerIds) {
    if (!(id in state.game.playersModel)) {
      playerNotFound(
        dispatch,
        id,
        `While players are being added to: ${tournamentId}`,
      );
      return;
    } else {
      const player = state.game.playersModel[id];
      players[id] = {
        name: player.name,
        avatarLink: player.avatarLink,
      };

      // Updating player state in playersModel
      const playerData: AppPlayer = {
        ...player,
        state: AppPlayerState.Racing,
      };
      dispatch.game.updatePlayerReducer({
        playerId: id,
        player: playerData,
      });
    }
  }

  const timeoutDuration = calculateTimeoutTimer(raceText);

  const race: AppRace = {
    text: raceText,
    timeoutDuration: timeoutDuration,
    startedTimestamp: new Date().getTime(),
    players: players,
    isOnGoing: true,
    raceStartedBy: playerId,
  };

  dispatch.game.setTournamentState({
    tournamentId,
    tournamentState: AppTournamentState.Countdown,
  });

  dispatch.game.addRaceReducer({
    raceId,
    race,
  });
};

/** Effect function for ending countdown of the race.
 * Run the validation for the received payload.
 * If the tournament is found, then the countdown will be ended.
 * Tournament state will be updated to "Race".
 *
 * @param {Dispatch} dispatch - The dispatch function of the store.
 * @param {endCountdownPayload} payload - The payload of the action.
 * @param {RootState} state - The state of the store.
 *
 * ### Related reducers and effects
 * - updateTournamentReducer
 *
 * ### Related raisers
 * - tournamentNotFound
 */
export const endCoundown = (
  dispatch: Dispatch,
  payload: EndCountdownPayload,
  state: RootState,
): void => {
  const { tournamentId } = payload;

  // If the tournament is not found, call the raiser.
  if (!state.game.tournamentsModel[tournamentId]) {
    tournamentNotFound(dispatch, tournamentId, `While countdown ending`);
    return;
  }

  // Use setTournamentState instead
  // Updating tournament state to Race
  const tournament: AppTournament = {
    ...state.game.tournamentsModel[tournamentId],
    state: AppTournamentState.Race,
  };
  dispatch.game.updateTournamentReducer({
    tournamentId,
    tournament,
  });
};

/** Effect function for ending race of the tournament.
 * Run the validation for the received payload.
 * If the race is found, then the race will be ended.
 * Leaderboard will be generated.
 * Tournament state will be updated to "Leaderboard".
 *
 * @param {Dispatch} dispatch - The dispatch function of the store.
 * @param {endRacePayload} payload - The payload of the action.
 * @param {RootState} state - The state of the store.
 *
 * ### Related reducers and effects
 * - updateTournamentReducer
 * - updateRaceReducer
 * - addLeaderboardReducer
 * - updatePlayerReducer
 *
 * ### Related raisers
 * - raceNotFound
 */
export const endRace = (
  dispatch: Dispatch,
  payload: EndRacePayload,
  state: RootState,
): void => {
  const { raceId } = payload;

  // If the race is not found, call the raiser.
  if (!(raceId in state.game.racesModel)) {
    raceNotFound(dispatch, raceId, 'While race ending');
    return;
  }

  // Extract tournament id from race id.
  const tournamentId: AppTournamentId = extractId(
    raceId,
    ExtractIdType.race,
    ExtractIdType.tournament,
  ) as AppTournamentId;

  // TODO: use setTournamentState state instead
  // Set tournament state to Leaderboard.
  const tournament: AppTournament = {
    ...state.game.tournamentsModel[tournamentId],
    state: AppTournamentState.Leaderboard,
  };
  dispatch.game.updateTournamentReducer({
    tournamentId,
    tournament,
  });

  // Get recived race text length.
  const raceTextLength = state.game.racesModel[raceId].text.length;

  // Get leaderboard from player logs and add leaderboard.
  const leaderboard = generateLeaderboard(
    state.game.playerLogsModel,
    raceId,
    raceTextLength,
  );
  dispatch.game.addLeaderboardReducer({
    leaderboardId: raceId,
    leaderboard,
  });

  // End race.
  const race: AppRace = {
    ...state.game.racesModel[raceId],
    isOnGoing: false,
  };
  dispatch.game.updateRaceReducer({
    raceId,
    race,
  });

  // Set player state to "Idle" of all players in the tournament.
  for (const id of state.game.tournamentsModel[tournamentId].playerIds) {
    if (
      id in state.game.playersModel &&
      state.game.playersModel[id].state != AppPlayerState.Idle
    ) {
      const player: AppPlayer = {
        ...state.game.playersModel[id],
        state: AppPlayerState.Idle,
      };

      dispatch.game.updatePlayerReducer({
        playerId: id,
        player,
      });
    }
  }
};
