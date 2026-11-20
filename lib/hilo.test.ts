import {describe, it, expect} from "vitest";
import { cashoutAmount, tierStreak, winChance, LUCKY_BONUS, LUCKY_FAKTOR, guessMultiplier, winMultiplier, Guess } from "./hilo";



describe("winChance", () =>{
    it("7 -> viša ili ista je 7/13", () => {
        expect(winChance(7, "higher")).toBeCloseTo(7/13);
    });
})

describe("tierStreak", () => {
    it("granice razina: 3 warm, 5 hot, 10 legend", () => {
        expect(tierStreak(2)).toBe(null);
        expect(tierStreak(3)).toBe("warm");
        expect(tierStreak(4)).toBe("warm");
        expect(tierStreak(5)).toBe("hot");
        expect(tierStreak(9)).toBe("hot");
        expect(tierStreak(10)).toBe("legend");
    });
})



describe("sretna boja", () => {
    it("LUCKY_FAKTOR je 1.125", () => {
        expect(LUCKY_FAKTOR).toBeCloseTo(1.125) // približno 1.125, a ne striktno
    })
    it("svaki potez je fer: očekivana vrijednost = 1", () => {
        for(let rank = 1; rank<=13; rank++){
            //Izračun ev vrijednosti da je približno 1
            for(const guess of ['higher', 'lower'] as const){
                const base = guessMultiplier(rank, guess)
                const ev = winChance(rank, guess) * (0.75* base + 0.25 * base * LUCKY_BONUS) 
                expect(ev).toBeCloseTo(1); // provjera očekivane vrijednosti
            }
                        
        }
    })
    
    it("WinMultiplier: sretna boja daje x1.5, ostale osnovni multiplier", () => {
        // napraviti kartu ručno {rank: 5, suit "♥"}
        const base = guessMultiplier(5, 'higher')
        const sretnaKarta = {rank: 9, suit: "♥"} as const;
        const normalnaKarta = {rank: 9, suit: "♠"} as const;

        expect(winMultiplier(5, "higher", sretnaKarta, "♥" )).toBeCloseTo(base*LUCKY_BONUS);
    
        expect(winMultiplier(5, 'higher', normalnaKarta, '♥')).toBeCloseTo(base);
})
    describe("cashoutAmount", () => {
        it("Fiksni RTP od 99%", () => {
            // CashoutAmount(10,2) mora biti 19.8
            expect(cashoutAmount(10,2)).toBe(19.8)
        })
    })
})