import {
  AppErrorLog,
  AppErrorTimestamp,
  AppPlayer,
  AppPlayerId,
  AppPlayerLog,
  AppRace,
  AppRaceId,
  AppTournament,
  AppTournamentId,
} from '@razor/models';

//reducerPlayload
export type addTournamentReducerPayload = {
  tournamentId: AppTournamentId;
  tournament: AppTournament;
};
export type addRaceReducerPayload = {
  tournamentId: AppTournamentId;
  raceId: AppRaceId;
  race: AppRace;
};
export type addPlayerReducerPayload = {
  tournamentId: AppTournamentId;
  playerId: AppPlayerId;
  player: AppPlayer;
};
export type removePlayerReducerPayload = {
  tournamentId: AppTournamentId;
  playerId: AppPlayerId;
};
export type updateTournamentReducerPayload = {
  tournamentId: AppTournamentId;
  tournament: AppTournament;
};
export type logErrorReducerPayload = {
  errorLog: AppErrorLog;
  errorTimestamp: AppErrorTimestamp;
};

//effectsPayloads
export type joinPlayerPayload = {
  id: string;
  playerName: string;
};
export type clearPlayerPayload = {
  playerId: AppPlayerId;
};
export type setReadyTournamentPayload = {
  tournamentId: AppTournamentId;
};
export type startCountdownPayload = {
  tournamentId: AppTournamentId;
  playerId: AppPlayerId;
};
export type endCountdownPayload = {
  tournamentId: AppTournamentId;
};
export type endRacePayload = {
  tournamentId: AppTournamentId;
};
export type sendTypeLogPlayload = {
  raceId: AppRaceId;
  playerId: AppPlayerId;
  typeLog: AppPlayerLog;
};
