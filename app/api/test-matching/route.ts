import { NextRequest, NextResponse } from "next/server";
import { calculateScore, type VehicleRow } from "@/lib/matching";

type TestRequest = {
  vehicle1?: VehicleRow;
  vehicle2?: VehicleRow;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as TestRequest;

  if (!body.vehicle1 || !body.vehicle2) {
    return NextResponse.json(
      { error: "Provide vehicle1 and vehicle2 in request body" },
      { status: 400 }
    );
  }

  const { vehicle1, vehicle2 } = body;
  const score = calculateScore(vehicle1, vehicle2);

  const priceDiffPct =
    vehicle1.preis && vehicle2.preis
      ? Math.round(
          (Math.abs(vehicle1.preis - vehicle2.preis) /
            Math.max(vehicle1.preis, vehicle2.preis)) *
            100
        )
      : null;

  const yearDiff =
    vehicle1.baujahr && vehicle2.baujahr
      ? Math.abs(vehicle1.baujahr - vehicle2.baujahr)
      : null;

  const kmDiffPct =
    vehicle1.km_stand && vehicle2.km_stand
      ? Math.round(
          (Math.abs(vehicle1.km_stand - vehicle2.km_stand) /
            Math.max(vehicle1.km_stand, vehicle2.km_stand)) *
            100
        )
      : null;

  return NextResponse.json({
    score,
    wouldMatch: score >= 50,
    breakdown: {
      modell: {
        match: vehicle1.modell.toLowerCase() === vehicle2.modell.toLowerCase(),
        points: vehicle1.modell.toLowerCase() === vehicle2.modell.toLowerCase() ? 50 : 0,
      },
      marke: {
        match: vehicle1.marke.toLowerCase() === vehicle2.marke.toLowerCase(),
        note: "Make is matched first; model determines the base score",
      },
      preis: {
        diffPct: priceDiffPct,
        match: priceDiffPct !== null && priceDiffPct < 15,
        points: priceDiffPct !== null && priceDiffPct < 15 ? 25 : 0,
      },
      baujahr: {
        diffYears: yearDiff,
        match: yearDiff !== null && yearDiff <= 2,
        points: yearDiff !== null && yearDiff <= 2 ? 15 : 0,
      },
      km_stand: {
        diffPct: kmDiffPct,
        match: kmDiffPct !== null && kmDiffPct <= 20,
        points: kmDiffPct !== null && kmDiffPct <= 20 ? 10 : 0,
      },
    },
  });
}
