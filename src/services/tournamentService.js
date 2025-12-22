import api from "./api";

export const getTournaments = () => {
  return api.get("/tournaments");
};

export const joinTournament = (id) => {
  return api.post("/tournaments/join", { tournament_id: id });
};

export const createTournament = (data) => {
  return api.post("/tournaments", data);
};

