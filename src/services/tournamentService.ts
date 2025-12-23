import api from "./api";

interface Tournament {
  id: number;
  name: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  image: string;
  entry_fee: number;
  spots_left: number;
  status: string;
  already_joined: boolean;
}

interface CreateTournamentData {
  name: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  image: string;
  entry_fee: number;
  spots_left: number;
}

export const getTournaments = () => {
  return api.get<Tournament[]>("/tournaments");
};

export const joinTournament = (tournament_id: number) => {
  return api.post("/tournaments/join", { tournament_id });
};

export const createTournament = (data: CreateTournamentData) => {
  return api.post<Tournament>("/tournaments", data);
};
