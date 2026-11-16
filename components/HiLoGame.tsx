"use client";

import { useSyncExternalStore, useReducer, useState } from "react";
import {
  Card,
  Guess,
  RANK_LABELS,
  drawCard,
  cashoutAmount,
  guessMultiplier,
  isCorrect,
  isRed,
  winChance,
} from "@/lib/hilo";

const START_BALANCE = 5000;

type Status = "idle" | "playing" | "lost" | "cashed";

type State = {
  balance: number;
  bet: number;
  status: Status;
  current: Card;
  history: { card: Card; guess?: Guess; won?: boolean }[];
  multiplier: number;
  lastPayout: number;
};

type Action =
  | { type: "start"; bet: number }
  | { type: "guess"; guess: Guess }
  | { type: "cashout" }
  | { type: "reset" };

function initialState(): State {
  const card = drawCard();
  return {
    balance: START_BALANCE,
    bet: 0,
    status: "idle",
    current: card,
    history: [{ card }],
    multiplier: 1,
    lastPayout: 0,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start": {
      if (state.status === "playing") return state;
      if (action.bet <= 0 || action.bet > state.balance) return state;
      return {
        ...state,
        balance: state.balance - action.bet,
        bet: action.bet,
        status: "playing",
        history: [{ card: state.current }],
        multiplier: 1,
        lastPayout: 0,
      };
    }
    case "guess": {
      if (state.status !== "playing") return state;
      const next = drawCard();
      const won = isCorrect(state.current, next, action.guess);
      const history = [...state.history, { card: next, guess: action.guess, won }];
      if (!won) {
        return { ...state, current: next, history, status: "lost", multiplier: 0 };
      }
      return {
        ...state,
        current: next,
        history,
        multiplier: state.multiplier * guessMultiplier(state.current.rank, action.guess),
      };
    }
    case "cashout": {
      if (state.status !== "playing" || state.multiplier <= 1) return state;
      const payout = cashoutAmount(state.bet, state.multiplier);
      return { ...state, balance: state.balance + payout, status: "cashed", lastPayout: payout };
    }
    case "reset":
      return initialState();
  }
}

// Prva karta je nasumična, pa igru renderiramo tek na klijentu —
// inače bi server i browser izvukli različite karte (hydration mismatch).
export default function HiLoGame() {
  const isClient = useSyncExternalStore(() => () => {}, () => true, () => false)
  return isClient ? <Game /> : null;
}


function tierStreak(streak: number): "warm" | "hot" | "legend" | null {
  if (streak >= 10) return "legend";
  if (streak >= 5) return "hot";
  if (streak >= 3) return "warm";
  return null;
}


function Game() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [betInput, setBetInput] = useState("10");

  const playing = state.status === "playing";
  const rank = state.current.rank;
  const bet = Number(betInput);
  const betValid = Number.isFinite(bet) && bet > 0 && bet <= state.balance;
  const correctGuesses = state.history.filter((h) => h.won).length;
  const tier = playing ? tierStreak(correctGuesses):null;
  const potentialPayout = state.multiplier > 1 ? cashoutAmount(state.bet, state.multiplier): state.bet


  return (
    <main className="game">
      <header className="topbar">
        <h1>hi·lo</h1>
        <div className="balance">
          <span>balans</span>
          <strong key={state.balance} className="bump">
            {state.balance.toFixed(2)}
          </strong>
        </div>
      </header>

      <section className="table">
        <CardView card={state.current} big />

        <div className="guesses">
          <GuessButton
            label={rank === 13 ? "Ista (A)" : rank === 1 ? "Viša" : "Viša ili ista"}
            arrow="▲"
            chance={winChance(rank, "higher")}
            multiplier={guessMultiplier(rank, "higher")}
            disabled={!playing}
            onClick={() => dispatch({ type: "guess", guess: "higher" })}
          />
          <GuessButton
            label={rank === 1 ? "Ista (2)" : rank === 13 ? "Niža" : "Niža ili ista"}
            arrow="▼"
            chance={winChance(rank, "lower")}
            multiplier={guessMultiplier(rank, "lower")}
            disabled={!playing}
            onClick={() => dispatch({ type: "guess", guess: "lower" })}
          />
        </div>
      </section>

      {tier && (
      <div className={`streak ${tier}`}>🔥 {correctGuesses} u nizu</div>
      )}

      <section className="stats">
        <Stat label="multiplier" value={`${state.multiplier.toFixed(2)}×`} />
        <Stat label="točnih" value={String(correctGuesses)} />
        <Stat label="isplata" value={playing ? potentialPayout.toFixed(2) : "—"} />
      </section>

      <StatusLine state={state} />

      <section className="controls">
        {playing ? (
          <>

            <button
              className="primary"
              disabled={state.multiplier <= 1}
              onClick={() => dispatch({ type: "cashout" })}
            >
              Cash out {potentialPayout.toFixed(2)}
            </button>
          </>
        ) : (
          <>
            <label className="bet">
              <span>ulog</span>
              <input
                type="number"
                min={1}
                step={1}
                value={betInput}
                onChange={(e) => setBetInput(e.target.value)}
              />
            </label>
            <button
              className="primary"
              disabled={!betValid}
              onClick={() => dispatch({ type: "start", bet })}
            >
              Igraj
            </button>
            {state.balance < 1 && (
              <button className="secondary" onClick={() => dispatch({ type: "reset" })}>
                Reset balansa
              </button>
            )}
          </>
        )}
      </section>

      <section className="history">
        {state.history.map((h, i) => (
          <div key={i} className={`chip ${h.won === false ? "lost" : ""} ${h.won ? "won" : ""}`}>
            {h.guess && <span className="chip-guess">{h.guess === "higher" ? "▲" : "▼"}</span>}
            <CardView card={h.card} />
          </div>
        ))}
      </section>
    </main>
  );
}

function CardView({ card, big = false }: { card: Card; big?: boolean }) {
  return (
    <div className={`card ${big ? "big" : ""} ${isRed(card) ? "red" : ""}`}>
      <span>{RANK_LABELS[card.rank - 1]}</span>
      <span>{card.suit}</span>
    </div>
  );
}

function GuessButton(props: {
  label: string;
  arrow: string;
  chance: number;
  multiplier: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button className="guess" disabled={props.disabled} onClick={props.onClick}>
      <span className="arrow">{props.arrow}</span>
      <span>{props.label}</span>
      <small>
        {(props.chance * 100).toFixed(1)}% · {props.multiplier.toFixed(2)}×
      </small>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusLine({ state }: { state: State }) {
  const text = {
    idle: "Postavi ulog i pogađaj je li sljedeća karta viša ili niža.",
    playing: "Pogađaj dalje ili pokupi dobitak.",
    lost: `Promašaj — izgubio si ${state.bet.toFixed(2)}.`,
    cashed: `Isplaćeno ${state.lastPayout.toFixed(2)}!`,
  }[state.status];
  return <p className={`status ${state.status}`}>{text}</p>;
}
