// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runMatching(db: any, newVehicle: any) {
  try {
    // Finde potenzielle Partner basierend auf Typ und Modell
    const partnerTyp = newVehicle.typ === "angebot" ? "gesuch" : "angebot";

    const partners = await db
      .prepare(
        `SELECT * FROM vehicles WHERE typ = ? AND LOWER(modell) = LOWER(?) AND id != ?`
      )
      .bind(partnerTyp, newVehicle.modell, newVehicle.id)
      .all<any>();

    if (!partners.results || partners.results.length === 0) {
      return;
    }

    for (const partner of partners.results) {
      const score = calculateScore(newVehicle, partner);

      if (score >= 50) {
        // Check for duplicate matches
        const existing = await db
          .prepare(
            `SELECT * FROM matches WHERE 
              (angebot_id = ? AND gesuch_id = ?) OR 
              (angebot_id = ? AND gesuch_id = ?)`
          )
          .bind(
            newVehicle.typ === "angebot" ? newVehicle.id : partner.id,
            newVehicle.typ === "gesuch" ? newVehicle.id : partner.id,
            partner.typ === "angebot" ? partner.id : newVehicle.id,
            partner.typ === "gesuch" ? partner.id : newVehicle.id
          )
          .first();

        if (!existing) {
          const angebotId =
            newVehicle.typ === "angebot" ? newVehicle.id : partner.id;
          const gesuchId =
            newVehicle.typ === "gesuch" ? newVehicle.id : partner.id;

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

function calculateScore(vehicle1: any, vehicle2: any): number {
  let score = 0;

  // Modell exakt gleich (case-insensitive) - Pflicht
  if (vehicle1.modell.toLowerCase() === vehicle2.modell.toLowerCase()) {
    score += 50;
  } else {
    // Wenn Modelle nicht gleich, kann kein Match sein
    return 0;
  }

  // Preis Differenz unter 15%
  if (vehicle1.preis && vehicle2.preis) {
    const maxPrice = Math.max(vehicle1.preis, vehicle2.preis);
    const priceDiff = Math.abs(vehicle1.preis - vehicle2.preis);
    const percentDiff = (priceDiff / maxPrice) * 100;

    if (percentDiff < 15) {
      score += 25;
    }
  }

  // Baujahr Differenz maximal 2 Jahre
  if (vehicle1.baujahr && vehicle2.baujahr) {
    const yearDiff = Math.abs(vehicle1.baujahr - vehicle2.baujahr);
    if (yearDiff <= 2) {
      score += 15;
    }
  }

  // Kilometerstand Differenz maximal 20%
  if (vehicle1.km_stand && vehicle2.km_stand) {
    const maxKm = Math.max(vehicle1.km_stand, vehicle2.km_stand);
    const kmDiff = Math.abs(vehicle1.km_stand - vehicle2.km_stand);
    const percentDiff = (kmDiff / maxKm) * 100;

    if (percentDiff <= 20) {
      score += 10;
    }
  }

  return score;
}
