export type VehicleRow = {
  id: number;
  typ: string;
  marke: string;
  modell: string;
  baujahr: number | null;
  km_stand: number | null;
  preis: number | null;
};

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
