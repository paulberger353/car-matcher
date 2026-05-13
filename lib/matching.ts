export type VehicleRow = {
  id: number;
  typ: string;
  marke: string;
  modell: string;
  baujahr: number | null;
  km_stand: number | null;
  preis: number | null;
};

export async function runMatching(db: D1Database, newVehicle: VehicleRow): Promise<void> {
  try {
    const partnerTyp = newVehicle.typ === "angebot" ? "gesuch" : "angebot";

    const partners = await db
      .prepare(
        `SELECT * FROM vehicles
         WHERE typ = ?
           AND LOWER(marke) = LOWER(?)
           AND LOWER(modell) = LOWER(?)
           AND id != ?`
      )
      .bind(partnerTyp, newVehicle.marke, newVehicle.modell, newVehicle.id)
      .all<VehicleRow>();

    if (!partners.results || partners.results.length === 0) {
      return;
    }

    for (const partner of partners.results) {
      const score = calculateScore(newVehicle, partner);

      if (score >= 50) {
        const angebotId = newVehicle.typ === "angebot" ? newVehicle.id : partner.id;
        const gesuchId = newVehicle.typ === "gesuch" ? newVehicle.id : partner.id;

        const existing = await db
          .prepare(
            `SELECT id FROM matches WHERE
               (angebot_id = ? AND gesuch_id = ?) OR
               (angebot_id = ? AND gesuch_id = ?)`
          )
          .bind(angebotId, gesuchId, gesuchId, angebotId)
          .first<{ id: number }>();

        if (!existing) {
          await db
            .prepare(
              `INSERT INTO matches (angebot_id, gesuch_id, score, gesehen) VALUES (?, ?, ?, 0)`
            )
            .bind(angebotId, gesuchId, score)
            .run();
        }
      }
    }
  } catch (error) {
    console.error("Matching error:", error);
  }
}

export function calculateScore(vehicle1: VehicleRow, vehicle2: VehicleRow): number {
  if (vehicle1.modell.toLowerCase() !== vehicle2.modell.toLowerCase()) {
    return 0;
  }

  let score = 50;

  if (vehicle1.preis && vehicle2.preis) {
    const maxPrice = Math.max(vehicle1.preis, vehicle2.preis);
    const priceDiff = Math.abs(vehicle1.preis - vehicle2.preis);
    if ((priceDiff / maxPrice) * 100 < 15) score += 25;
  }

  if (vehicle1.baujahr && vehicle2.baujahr) {
    if (Math.abs(vehicle1.baujahr - vehicle2.baujahr) <= 2) score += 15;
  }

  if (vehicle1.km_stand && vehicle2.km_stand) {
    const maxKm = Math.max(vehicle1.km_stand, vehicle2.km_stand);
    const kmDiff = Math.abs(vehicle1.km_stand - vehicle2.km_stand);
    if ((kmDiff / maxKm) * 100 <= 20) score += 10;
  }

  return score;
}
