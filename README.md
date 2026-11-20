# hi·lo

Kartaška igra "više ili niže" s lancem multipliera, napravljena za učenje Reacta i Next.js-a.
Igra se **lažnim novcem** (balans 5000) — nema pravih uloga, registracije ni isplata.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · čisti CSS · Vitest

---

## Pokretanje

```bash
npm install
npm run dev
```

Igra je na [http://localhost:3000](http://localhost:3000).

## Testovi

| Naredba | Što radi |
|---|---|
| `npm test` | pokreće testove i **ostaje upaljen** — ponovno ih pokrene pri svakom spremanju datoteke (izlaz: `q`) |
| `npx vitest run` | pokrene testove **jednom** i završi (za provjeru prije commita) |
| `npx vitest run --reporter=verbose` | ispiše svaki test posebno (✓ / ×) |
| `npx vitest run -t "sretna boja"` | pokrene samo testove čije ime sadrži zadani tekst |

Kad test padne, Vitest pokaže **što je očekivao** (`Expected`), **što je dobio** (`Received`) i **točan redak**.

## Provjere prije commita

```bash
npx tsc --noEmit                # TypeScript — greške u tipovima
npx eslint app components lib   # ESLint — loše prakse i nekorišteni kod
npx vitest run                  # testovi
npm run build                   # produkcijski build (isto što radi Netlify)
```

Sve četiri moraju proći bez grešaka.

---

## Pravila igre

1. Postavi ulog i klikni **Igraj**.
2. Pogađaj je li sljedeća karta **viša ili ista** ili **niža ili ista** od trenutne.
3. Svaki pogodak množi ukupni multiplier. Promašaj gubi cijeli ulog.
4. **Cash out** isplaćuje ulog × multiplier (umanjeno za house edge od 1 %). Moguć je nakon barem jednog pogotka.

**Redoslijed karata:** 2 je najniža, A najviša.

**Rubne karte:** na **2** bi "niža ili ista" bila jedina mogućnost osim iste, a "viša ili ista" uvijek točna (100 %). Zato na 2 vrijedi strogo **"Viša"** (12/13), a na **A** strogo **"Niža"** (12/13). Druga opcija je **"Ista"** (1/13).

**Sretna boja 🍀:** na početku svake runde nasumično se izvuče boja. Pogodak na kartu te boje daje **×1.5** na taj potez.

**Streak 🔥:** 3, 5 i 10 pogodaka u nizu daju oznaku i vizualne efekte (warm / hot / legend). Streak je **samo kozmetički** — ne mijenja isplatu.

---

## Matematika

Sva logika je u [`lib/hilo.ts`](lib/hilo.ts) — čiste funkcije bez Reacta, pa se lako testiraju.

| Funkcija | Formula | Značenje |
|---|---|---|
| `winChance` | viša: `(14 − rank) / 13`, niža: `rank / 13`, stroga: `12 / 13` | šansa za pogodak ("beskonačni špil") |
| `guessMultiplier` | `1 / (winChance × LUCKY_FAKTOR)` | osnovni multiplier — prikazuje se na gumbu |
| `winMultiplier` | osnovni, ili osnovni × 1.5 na sretnu boju | stvarni multiplier pogotka |
| `cashoutAmount` | `bet × multiplier × 0.99`, zaokruženo na cente | isplata |

### RTP je fiksan: 99 %

- `LUCKY_FAKTOR = 1 + (1.5 − 1) × ¼ = 1.125` — prosječna vrijednost bonusa sretne boje.
- Osnovni multiplier je umanjen za taj faktor, pa je **očekivana vrijednost svakog poteza točno 1**:
  `šansa × (¾ × osnovni + ¼ × osnovni × 1.5) = 1`
- Lanac fer poteza ostaje fer, a house edge (1 %) naplaćuje se **jednom, pri isplati**.
- Zato je RTP **99 % bez obzira kada igrač stane** — što regulativa i traži.

Uvjet: boja karte mora biti **neovisna** o vrijednosti. `drawCard` zato izvlači rank i boju s dva odvojena poziva generatora.

### Što smo odbacili i zašto

- **House edge na svakom pogotku** (`0.99 / šansa`) — množio se duž lanca (0,99ⁿ), pa je stvarni RTP padao s duljinom lanca.
- **RTP ljestvica po streaku** (97 → 98 → 99 %) — RTP je ovisio o ponašanju igrača. Zabranjeno: RTP mora biti jedan, objavljen i isti za svaku strategiju.
- **Bonus na multiplier nakon N pogodaka** — igrač bira kada staje, pa bi pametan igrač uvijek išao do bonusa i imao RTP > 100 %.

### Generator slučajnih brojeva

`cryptoRandom()` koristi `crypto.getRandomValues` umjesto `Math.random` — kriptografski kvalitetan, ugrađen u browser i Node. Dijeli se s `2 ** 32` (broj mogućih vrijednosti), ne s `2 ** 32 − 1`, da rezultat nikad ne bude točno 1.

> Napomena: igra se izvršava u browseru, pa igrač kroz DevTools može promijeniti stanje. Za pravi novac logika mora biti na serveru.

---

## Struktura

```
app/
  layout.tsx          root layout (obavezan u App Routeru)
  page.tsx            Server Component — samo renderira igru
  globals.css         boje (tokeni u :root), animacije
components/
  HiLoGame.tsx        klijentska komponenta: state (useReducer) i prikaz
lib/
  hilo.ts             logika igre: karte, šanse, multiplieri, isplata
  hilo.test.ts        testovi (Vitest)
```

---

## Što sam naučio (React i općenito)

- **`useReducer`** za stanje igre — sve promjene na jednom mjestu, svaka akcija (`start`, `guess`, `cashout`, `reset`) je jedan `case`.
- **Derived state** — ako se vrijednost može izračunati iz postojećeg statea (streak, razina, isplata), ne sprema se u state. Reactov ekvivalent Vue `computed`-a je obična varijabla u komponenti.
- **Single source of truth** — formula za isplatu postoji samo u `cashoutAmount`, granice streaka samo u `tierStreak`. Inače se gumb i stvarna isplata razilaze.
- **Odvajanje podataka od prikaza** — rank je broj 1–13, natpis dolazi iz `RANK_LABELS`. Promjena "A najviša" bila je samo promjena redoslijeda natpisa.
- **Čiste funkcije** — isti ulaz, isti izlaz, ništa izvan funkcije se ne mijenja. Globalna varijabla koju funkcija mijenja (stari `RTP = 0.98`) bila je izvor buga.
- **`key` trik za animacije** — promjena `key`-a ponovno montira element, pa CSS animacija krene ispočetka.
- **Hydration** — prva karta je nasumična, pa se igra renderira tek na klijentu (`useSyncExternalStore`), inače bi server i browser izvukli različite karte. `setState` unutar `useEffect` za to nije dobra praksa.
- **`{x && <El />}`** — siguran za tekst i `null`, ali za broj `0` React ispiše "0". Za brojeve: `{x > 0 && ...}`.
- **Prioritet operatora** — `&&` ima prednost pred `||`. Kod miješanja uvijek zagrade: `(a && b) || (c && d)`.
- **Decimalni brojevi** — `10 * 1.3 * 0.99` je `12.869999…`, pa `Math.floor` "pojede" cent. Za novac: `Math.round(x * 100) / 100`. U testovima `toBeCloseTo`.
- **`as const`** — kaže TypeScriptu da je `"higher"` baš ta vrijednost (tip `Guess`), a ne bilo kakav `string`.
- **Testovi** — za svaki bug prvo test koji ga uhvati (i padne), pa popravak (i test prolazi).

---

## Deploy

Netlify, povezan s GitHub repozitorijem — svaki `git push` na `main` automatski objavljuje novu verziju.

| Postavka | Vrijednost |
|---|---|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node verzija | 22 (`NODE_VERSION`) |

---

## Što još fali

**Sljedeće:**
- [ ] Prikaz sretne boje igraču (oznaka "🍀 Sretna boja: ♥ ×1.5") i isticanje sretnih pogodaka u povijesti
- [ ] Spremanje balansa (`localStorage`) — sada se resetira na osvježavanje
- [ ] Provjera i dorada za mobitel
- [ ] Tipkovnica: ↑ / ↓ za pogađanje, razmak za cash out
- [ ] Statistika i osobni rekord (najduži lanac, najveći dobitak)
- [ ] Zvukovi
- [ ] Test simulacijom: RTP ≈ 99 % za igrača koji staje nakon 1, 3 i 5 pogodaka

**Samo za igru s pravim novcem (namjerno izvan opsega):**
- [ ] Logika na serveru
- [ ] Provably fair (server seed, client seed, nonce)
- [ ] Licenca, RNG certifikacija, KYC, odgovorno kockanje
