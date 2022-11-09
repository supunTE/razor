import {
  AppErrorCode,
  AppErrorLog,
  AppIdNumberType,
  AppPlayerId,
  AppPlayerLog,
  AppPlayerLogId,
  AppPlayerProfiles,
  AppPlayerState,
  AppRace,
  AppRaceId,
  AppTournament,
  AppTournamentId,
  AppTournamentState,
} from '@razor/models';
import {
  generateUid,
  generateAvatarLink,
  giveZeroPadding,
  calculateTimeoutTimer,
} from '@razor/util';
import {
  clearPlayerPayload,
  endCountdownPayload,
  endRacePayload,
  joinPlayerPayload,
  sendTypeLogPlayload,
  setReadyTournamentPayload,
  startCountdownPayload,
} from './payloadTypes';
import { Dispatch, RootState } from './store';

const loadRacingText = async (): Promise<string> => {
  const url = 'http://www.metaphorpsum.com/paragraphs/1/8';

  return fetch(url)
    .then(response => response.text())
    .then(data => {
      return data;
    });
};

//TODO: Add logger methods for warns and errors
export const joinPlayer = async (
  dispatch: Dispatch,
  payload: joinPlayerPayload,
  state: RootState,
): Promise<void> => {
  const { id, playerName }: { id: string; playerName: string } = payload;
  let tournamentId: string;
  if (id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!state.game.tournamentsModel[id as any]) {
      dispatch.game.sendErrorLog({
        message: `Tournament with id ${id} does not exist`,
        code: AppErrorCode.TournamentNotExists,
        relatedId: '',
      });
      return;
    }
    tournamentId = id;
  } else {
    tournamentId = await generateUid(AppIdNumberType.Tournament);
  }

  const formattedTournamentId: AppTournamentId = `T:${tournamentId}`;
  const formattedPlayerId: AppPlayerId = `P:${await generateUid(
    AppIdNumberType.Player,
  )}`;

  if (!id) {
    //Creating new tournament
    dispatch.game.addTournamentReducer({
      tournamentId: formattedTournamentId,
      tournament: {
        state: AppTournamentState.Lobby,
        raceIds: [],
        playerIds: [],
      },
    });
  }
  //Joining tournament
  dispatch.game.addPlayerReducer({
    tournamentId: formattedTournamentId,
    playerId: formattedPlayerId,
    player: {
      name: playerName,
      avatarLink: await generateAvatarLink(playerName),
      state: AppPlayerState.Idle,
      tournamentId: formattedTournamentId,
    },
  });
};

export const clearPlayer = async (
  dispatch: Dispatch,
  payload: clearPlayerPayload,
  state: RootState,
): Promise<void> => {
  const { playerId }: { playerId: AppPlayerId } = payload;
  const tournamentId = state.game.playersModel[playerId].tournamentId;
  dispatch.game.removePlayerReducer({
    tournamentId,
    playerId,
  });
};

export const setReadyTournament = async (
  dispatch: Dispatch,
  payload: setReadyTournamentPayload,
  state: RootState,
): Promise<void> => {
  const { tournamentId }: { tournamentId: AppTournamentId } = payload;
  const tournament: AppTournament = {
    state: AppTournamentState.Ready,
    raceIds: [...state.game.tournamentsModel[tournamentId].raceIds],
    playerIds: [...state.game.tournamentsModel[tournamentId].playerIds],
  };
  dispatch.game.updateTournamentReducer({
    tournamentId,
    tournament,
  });
};

export const startCountdown = async (
  dispatch: Dispatch,
  payload: startCountdownPayload,
  state: RootState,
): Promise<void> => {
  const {
    tournamentId,
    playerId,
  }: { tournamentId: AppTournamentId; playerId: AppPlayerId } = payload;

  if (!state.game.tournamentsModel[tournamentId]) {
    dispatch.game.sendErrorLog({
      message: `Tournament with id ${tournamentId} does not exist`,
      code: AppErrorCode.TournamentNotExists,
      relatedId: `Started by ${playerId}`,
    });
    return;
  }

  const numberOfRacesBefore =
    state.game.tournamentsModel[tournamentId] &&
    state.game.tournamentsModel[tournamentId].raceIds.length;
  const raceIndex = numberOfRacesBefore
    ? giveZeroPadding(numberOfRacesBefore + 1, 3)
    : '000';
  const raceId: AppRaceId = `${tournamentId}-R:${raceIndex}`;
  const players: AppPlayerProfiles = {};

  for (const id of state.game.tournamentsModel[tournamentId].playerIds) {
    const player = state.game.playersModel[id];
    players[id] = {
      name: player.name,
      avatarLink: player.avatarLink,
    };
  }

  const raceText = await loadRacingText();
  const timeoutDuration = await calculateTimeoutTimer(raceText);

  const race: AppRace = {
    text: raceText,
    timeoutDuration: timeoutDuration,
    startedTimestamp: new Date().getTime(),
    players: players,
    isOnGoing: true,
    raceStartedBy: playerId,
  };

  const tournament: AppTournament = {
    ...state.game.tournamentsModel[tournamentId],
    state: AppTournamentState.Countdown,
    raceIds: [...state.game.tournamentsModel[tournamentId].raceIds, raceId],
  };

  dispatch.game.updateTournamentReducer({
    tournamentId,
    tournament,
  });

  dispatch.game.updateRaceReducer({
    raceId,
    race,
  });
};

export const endCoundown = async (
  dispatch: Dispatch,
  payload: endCountdownPayload,
  state: RootState,
): Promise<void> => {
  const { tournamentId }: { tournamentId: AppTournamentId } = payload;
  const tournament: AppTournament = {
    ...state.game.tournamentsModel[tournamentId],
    state: AppTournamentState.Race,
    raceIds: [...state.game.tournamentsModel[tournamentId].raceIds],
  };
  dispatch.game.updateTournamentReducer({
    tournamentId,
    tournament,
  });
};

export const endRace = async (
  dispatch: Dispatch,
  payload: endRacePayload,
  state: RootState,
): Promise<void> => {
  const { tournamentId }: { tournamentId: AppTournamentId } = payload;
  const tournament: AppTournament = {
    ...state.game.tournamentsModel[tournamentId],
    state: AppTournamentState.Leaderboard,
  };

  dispatch.game.updateTournamentReducer({
    tournamentId,
    tournament,
  });

  //TODO: dipatch leaderboard data
};

export const sendTypeLog = async (
  dispatch: Dispatch,
  payload: sendTypeLogPlayload,
  state: RootState,
): Promise<void> => {
  const {
    raceId,
    playerId,
    playerLog,
  }: { raceId: AppRaceId; playerId: AppPlayerId; playerLog: AppPlayerLog } =
    payload;

  const playerLogId: AppPlayerLogId = `${raceId}-${playerId}`;

  dispatch.game.updatePlayerLogReducer({
    playerLogId,
    playerLog,
  });
};

export const sendErrorLog = async (
  dispatch: Dispatch,
  payload: AppErrorLog,
): Promise<void> => {
  const errorTimestamp: number = new Date().getTime();
  const errorLog = payload;
  dispatch.game.logErrorReducer({
    errorLog,
    errorTimestamp,
  });
};
