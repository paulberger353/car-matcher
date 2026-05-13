# Audit Report — Car-Matcher
_Analysiert: 2026-05-13 · Methode: Statische Code-Analyse (kein lokaler Build möglich)_

---

## 1. KRITISCH — Warum der Build fehlschlägt

### 1.1 Version-Inkompatibilität: `@opennextjs/cloudflare` vs. `next@16.2.6`
**Wahrscheinlichste Ursache des Build-Fehlers.**

`package.json` enthält:
```json
"@opennextjs/cloudflare": "^1.19.8",
"next": "16.2.6"
```

Next.js 16 ist eine sehr neue Major-Version. `@opennextjs/cloudflare` supportet typischerweise nur die jeweils aktuelle stabile Next.js-Version. Wenn `@opennextjs/cloudflare@1.19.8` noch keine Next.js 16 Unterstützung enthält, bricht `opennextjs-cloudflare build` beim internen Aufruf von `next build` oder beim Bundle-Schritt ab.

**Empfehlung:** Im GitHub Actions Log nach Fehlern wie `"Unsupported Next.js version"` oder `"Cannot find module"` suchen. Falls bestätigt: `@opennextjs/cloudflare` auf die neueste Version updaten (`npm install @opennextjs/cloudflare@latest`).

---

### 1.2 `cloudflare-env.d.ts` — Stale `GEMINI_API_KEY` Deklaration
**Zweithäufigste Ursache: Build-Tool-Validierung schlägt fehl.**

```typescript
// cloudflare-env.d.ts
interface CloudflareEnv {
  DB: D1Database;
  GEMINI_API_KEY: string;  // ← nicht in wrangler.toml, nirgends verwendet
  AI: Ai;
}
```

`wrangler.toml` kennt kein `GEMINI_API_KEY` (weder in `[vars]` noch als secret-Binding). `@opennextjs/cloudflare` validiert die deklarierten Bindings gegen `wrangler.toml`. Der Key existiert nur noch als Überbleibsel aus der Gemini-Phase — er wurde durch Workers AI ersetzt, aber nie aus der Interface-Deklaration entfernt.

**Fix:** `GEMINI_API_KEY: string;` aus `cloudflare-env.d.ts` entfernen.

---

### 1.3 `lib/matching.ts` — INSERT auf nicht-migrierte Spalte `gesehen`
**Kein Build-Fehler, aber kritischer Runtime-Fehler bei DB-Reset.**

```typescript
// lib/matching.ts:46
await db.prepare(
  `INSERT INTO matches (angebot_id, gesuch_id, score, gesehen) VALUES (?, ?, ?, 0)`
)
```

Die Spalten `gesehen`, `status` und `status_at` wurden manuell über die D1-Konsole hinzugefügt. In keiner Migration-Datei sind sie dokumentiert:

```sql
-- migrations/0001_init.sql (Ist-Stand)
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  angebot_id INTEGER REFERENCES vehicles(id),
  gesuch_id INTEGER REFERENCES vehicles(id),
  score INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  -- gesehen, status, status_at fehlen komplett!
);
```

Konsequenz: Wenn die D1-Datenbank jemals neu erstellt wird (z. B. in einer neuen Cloudflare-Umgebung oder nach einem Datenbank-Reset), funktionieren alle Match-Features nicht mehr. Es gibt keine Migrations-Datei die die aktuelle DB-Struktur beschreibt.

**Fix:** Eine neue Migration `0003_matches_status.sql` erstellen:
```sql
ALTER TABLE matches ADD COLUMN gesehen INTEGER DEFAULT 0;
ALTER TABLE matches ADD COLUMN status TEXT DEFAULT 'offen';
ALTER TABLE matches ADD COLUMN status_at DATETIME;
```

---

### 1.4 `JWT_SECRET` nicht in `wrangler.toml` — Unsicheres Fallback in Production
```typescript
// lib/auth.ts
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secret-key-change-in-production"
);
```

In Cloudflare Workers ist `process.env.JWT_SECRET` **nicht verfügbar** — Worker-Umgebungsvariablen müssen als `[vars]` in `wrangler.toml` oder als Worker-Secret (`wrangler secret put`) konfiguriert werden. Das Ergebnis: Die App läuft in Production mit dem hardcodierten String als JWT-Key. Jeder der den Source Code sieht kann gültige Tokens forgen.

**Fix:** `wrangler secret put JWT_SECRET` ausführen, dann `JWT_SECRET` aus `wrangler.toml` entfernen (Secrets sind implizit verfügbar über `env.JWT_SECRET`, aber in `lib/auth.ts` wird `process.env` verwendet, nicht `env`). Das Muster in `lib/auth.ts` muss auf `getCloudflareContext` umgestellt werden, oder der Secret muss als `[vars]`-Eintrag hinzugefügt werden (weniger sicher, da dann in der Config sichtbar).

---

## 2. ARCHITEKTUR — Schwachstellen in Datenvalidierung und Performance

### 2.1 `app/page.tsx` ist totes Code — Redirect in `next.config.ts`
`next.config.ts` redirectet `/` → `/login`, aber `app/page.tsx` ist eine vollwertige Public-Vehicles-Seite (über 220 Zeilen). Diese Seite ist nie erreichbar:

```typescript
// next.config.ts
async redirects() {
  return [{ source: '/', destination: '/login', permanent: false }];
}
```

Next.js baut die Seite trotzdem, aber sie wird nie ausgeliefert. Die Frage ist: soll die öffentliche Fahrzeugliste existieren oder nicht? Wenn nein, kann `app/page.tsx` gelöscht werden. Wenn ja, muss der Redirect entfernt oder angepasst werden.

### 2.2 `lib/matching.ts` — Marke wird beim Matching komplett ignoriert
```sql
SELECT * FROM vehicles WHERE typ = ? AND LOWER(modell) = LOWER(?) AND id != ?
```

Ein „Ferrari 488 Pista" (Angebot) kann mit einem „Lamborghini 488" (Gesuch) gematcht werden, weil nur auf `modell = '488'` gefiltert wird. Die `marke` fließt weder in die Query noch in `calculateScore()` ein. Für Supercar-Broker ist das ein funktionales Problem, da Modellnamen bei verschiedenen Marken gleich sein können (z.B. Jahreszahlen als Modellname, oder kurze Bezeichnungen).

### 2.3 `km_stand || null` und `preis || null` — Numerischer Falsy-Bug
```typescript
// app/api/vehicles/route.ts:96
.bind(typ, marke, modell,
  baujahr || null,
  km_stand || null,  // Falls km_stand === 0 → wird null!
  preis || null,     // Falls preis === 0 → wird null!
  ...
)
```

Der `||`-Operator behandelt `0` als falsy. Bei Kilometern ist `0` zwar unwahrscheinlich, aber `preis = 0` könnte für intern vermittelte Fahrzeuge vorkommen. Korrekter wäre: `km_stand ?? null` (Nullish Coalescing).

### 2.4 Race Condition in `app/page.tsx` — Keine Abbruch-Logik bei Requests
```typescript
useEffect(() => {
  setLoading(true);
  const timer = setTimeout(fetchVehicles, 300);
  return () => clearTimeout(timer);
}, [activeTab, searchTerm]);
```

Der Timer wird korrekt abgebrochen, aber laufende `fetch`-Requests nicht. Wenn der Nutzer schnell zwischen Tabs wechselt, können ältere Responses neuere überschreiben. Da die Seite ohnehin durch den Redirect nicht erreichbar ist, ist das ein latentes Problem, falls der Redirect je entfernt wird.

### 2.5 `app/dashboard/layout.tsx` — Auth-Check über `/api/vehicles` ist fragil
Der Auth-Check im Dashboard-Layout wird über `fetch("/api/vehicles?limit=1")` durchgeführt. Das hat zwei Probleme:
1. Es macht einen echten DB-Query nur um den Auth-Status zu prüfen
2. Wenn die Vehicles-Tabelle leer ist, gibt die API trotzdem `200 OK` zurück (korrekt), aber wenn die API einen anderen Fehler wirft (DB-Timeout), wird der Nutzer zur Login-Seite umgeleitet, obwohl er eingeloggt ist

Besser wäre ein dedizierter `/api/auth/me` Endpunkt der nur den Token prüft.

---

## 3. CLOUDFLARE / EDGE — Inkompatibilitäten

### 3.1 `bcryptjs` — CPU-Time-Limit in Cloudflare Workers
`bcryptjs` ist eine Pure-JS bcrypt-Implementierung. Ein `bcrypt.compare()` mit Rounds=10 benötigt typischerweise 100-300ms CPU-Zeit. Cloudflare Workers hat standardmäßig ein CPU-Limit von **10ms** (erweiterbar auf 30ms im Free Plan, bis 30 Sekunden mit Paid Plan für dauer-Requests).

Wenn der Login-Request das CPU-Limit erreicht, wird er mit einem `1101: Worker exceeded resource limits` Fehler abgebrochen — der Nutzer sieht einen Login-Fehler ohne klare Ursache. Auf dem Paid Plan (Workers Unbound) ist dies weniger kritisch, sollte aber dokumentiert werden.

### 3.2 Keine `export const runtime` Deklarationen
Keine der Route-Handler-Dateien deklariert explizit `export const runtime = "edge"` oder `export const runtime = "nodejs"`. Bei `@opennextjs/cloudflare` laufen alle Routes standardmäßig im Workers Runtime, aber explizite Deklarationen würden zukünftige Inkompatibilitäten sofort sichtbar machen wenn Next.js seine Defaults ändert.

### 3.3 `wrangler.toml` — Kein `[vars]` für `JWT_SECRET`
(Siehe auch Kritisch 1.4) — `JWT_SECRET` fehlt komplett in `wrangler.toml`. In Cloudflare Workers ist `process.env` nur für lokale Entwicklung mit Wrangler verfügbar. Im deployed Worker ist es `undefined`.

### 3.4 `observability.logs` — Potentielle Kosten
```toml
[observability.logs]
enabled = true
invocation_logs = true
```
Observability Logs in Cloudflare Workers sind kostenpflichtig über das Workers-Paid-Tier. Bei hohem Traffic können unerwartet Kosten entstehen. Kein funktionales Problem, aber ein operationales Risiko.

---

## 4. TYPE-SAFETY — Dateien mit fehlender Typisierung

| Datei | Problem | Schwere |
|-------|---------|---------|
| `lib/matching.ts` | `db: any`, `newVehicle: any`, `vehicle1: any`, `vehicle2: any` — komplette Funktion ist untypisiert | Hoch |
| `lib/db.ts` | `env: any` — Funktion unused, sollte gelöscht werden | Mittel |
| `app/dashboard/page.tsx` | `recent: any[]` in `Stats` type — kein konkreter Vehicle-Typ | Mittel |
| `app/api/public/vehicles/route.ts` | `result.results` implizit `Record<string, unknown>[]` — keine typisierte D1-Query | Niedrig |
| `app/dashboard/layout.tsx` | `// eslint-disable` würde bei `router`-Dependency-Warning nötig sein | Niedrig |

### 4.1 Detailliert: `lib/matching.ts`
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runMatching(db: any, newVehicle: any) {
```
Sollte ersetzt werden durch:
```typescript
import type { D1Database } from "@cloudflare/workers-types";

type VehicleRow = {
  id: number; typ: string; marke: string; modell: string;
  baujahr: number | null; km_stand: number | null; preis: number | null;
};

export async function runMatching(db: D1Database, newVehicle: VehicleRow) {
```

### 4.2 `cloudflare-env.d.ts` — Stale Property
```typescript
interface CloudflareEnv {
  DB: D1Database;
  GEMINI_API_KEY: string;  // ← löschen
  AI: Ai;
}
```

---

## Zusammenfassung — Priorität

| Priorität | Problem | Fix nötig vor Deploy? |
|-----------|---------|----------------------|
| P0 | `@opennextjs/cloudflare` / Next.js 16 Inkompatibilität | Ja |
| P0 | `GEMINI_API_KEY` in `cloudflare-env.d.ts` (potentielle Build-Validation) | Ja |
| P1 | `JWT_SECRET` Fallback auf Hardcoded-Key in Production | Ja |
| P1 | `matches`-Tabelle Schema-Drift (keine Migration für `gesehen`/`status`) | Ja (neue Migration anlegen) |
| P2 | `lib/matching.ts` ignoriert `marke` beim Matching | Nach Klärung der Business-Logik |
| P2 | `app/page.tsx` ist totes Code hinter Redirect | Entscheidung treffen |
| P3 | `bcryptjs` CPU-Time-Risk | Monitoring |
| P3 | `any`-Typen in `lib/matching.ts` und `lib/db.ts` | Nächstes Refactoring |

---

_Keine funktionalen Code-Änderungen in diesem Bericht. Alle Fixes stehen als separate Aufgabe bereit._
