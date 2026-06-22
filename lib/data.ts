import raw from "../data/demo.json";

export type DemoUser = { id: number; username: string; password: string };
export type Broker = {
  id: number; name: string; telefon: string | null; email: string | null;
  firma: string | null; notizen: string | null; created_at: string;
};
export type Vehicle = {
  id: number; typ: string; marke: string; modell: string;
  baujahr: number | null; km_stand: number | null; preis: number | null;
  farbe: string | null; broker_id: number | null; notizen: string | null;
  created_at: string;
};
export type Match = {
  id: number; angebot_id: number; gesuch_id: number; score: number;
  gesehen: number; status: string; status_at: string | null; created_at: string;
};

const data = raw as {
  users: DemoUser[];
  brokers: Broker[];
  vehicles: Vehicle[];
  matches: Match[];
};

export const { users, brokers, vehicles, matches } = data;

export function getBrokerName(id: number | null): string | null {
  if (id === null) return null;
  return brokers.find((b) => b.id === id)?.name ?? null;
}
