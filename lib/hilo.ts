
// Logika
export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export const RANK_LABELS = [ "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RTP = 0.99;

export type Suit = (typeof SUITS)[number];
export type Card = { rank: number; suit: Suit }; // rank: 1 (2) .. 13 (A)
export type Guess = "higher" | "lower";


// crypto random vrijednosti
export function cryptoRandom(){
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const cryptoNumber = buf[0] / (2**32)
  return cryptoNumber;
}


// "Beskonačni špil": svaka karta je neovisna, pa su vjerojatnosti uvijek točne.
export function drawCard(): Card {
  return {
    rank: Math.floor(cryptoRandom() * 13) + 1,
    suit: SUITS[Math.floor(cryptoRandom() * 4)],
  };
}

// "Viša ili ista" / "Niža ili ista"

export function isStrict(rank: number, guess: Guess): boolean{
  return (guess === "higher" && rank === 1) || (guess === 'lower' && rank === 13); //ako je rank = 2 ili rank = A
}

export function winChance(rank: number, guess: Guess): number {
  if (isStrict(rank, guess)) return 12/13;
  return guess === "higher" ? (14 - rank) / 13 : rank / 13;
}

export function guessMultiplier(rank: number, guess: Guess): number {
  return 1 / winChance(rank, guess);
}

export function isCorrect(current: Card, next: Card, guess: Guess): boolean {
  if(isStrict(current.rank, guess)){
  return guess === "higher" ? next.rank > current.rank : next.rank < current.rank;
  }
  else return guess==='higher' ? next.rank >= current.rank : next.rank <= current.rank;
}

export function cashoutAmount(bet: number, multiplier: number): number {
  return Math.round(bet * multiplier * RTP * 100) / 100;
}

export function isRed(card: Card): boolean {
  return card.suit === "♥" || card.suit === "♦";
}
