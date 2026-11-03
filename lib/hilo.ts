// Logika
export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export const RANK_LABELS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

//House edge: 1% (isplata = 0.97 / vjerojatnost)
const RTP = 0.99;

export type Suit = (typeof SUITS)[number];
export type Card = { rank: number; suit: Suit }; // rank: 1 (A) .. 13 (K)
export type Guess = "higher" | "lower";

// "Beskonačni špil": svaka karta je neovisna, pa su vjerojatnosti uvijek točne.
export function drawCard(): Card {
  return {
    rank: Math.floor(Math.random() * 13) + 1,
    suit: SUITS[Math.floor(Math.random() * 4)],
  };
}

// "Viša ili ista" / "Niža ili ista"

export function isStrict(rank: number, guess: Guess): boolean{
  return (guess==='higher' || guess==="lower" && rank===1) || (guess==='lower' || guess==="higher" && rank===13) //ako je rank = A ili rank = K
}

export function winChance(rank: number, guess: Guess): number {
  return guess === "higher" ? (14 - rank) / 13 : rank / 13;
}

export function guessMultiplier(rank: number, guess: Guess): number {
  return RTP / winChance(rank, guess);
}

export function isCorrect(current: Card, next: Card, guess: Guess): boolean {
  if(isStrict(current.rank, guess)){
  return guess === "higher" ? next.rank >= current.rank : next.rank < current.rank;
  }
  else return guess==='higher' ? next.rank >= current.rank : next.rank <= current.rank;
}

export function isRed(card: Card): boolean {
  return card.suit === "♥" || card.suit === "♦";
}
