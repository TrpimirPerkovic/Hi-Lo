import {describe, it, expect} from "vitest";
import { cashoutAmount, rtpForStreak, tierStreak, winChance } from "./hilo";

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

describe("rtpForStreak", () => {
    it("ljestvica: <5 je 97 %, 5–9 je 98 %, 10+ je 99 %", () => {
        expect(rtpForStreak(0)).toBe(0.97);
        expect(rtpForStreak(4)).toBe(0.97);
        expect(rtpForStreak(5)).toBe(0.98);
        expect(rtpForStreak(9)).toBe(0.98);
        expect(rtpForStreak(10)).toBe(0.99);
        expect(rtpForStreak(50)).toBe(0.99);
    });

    it("nikad ne prelazi 99 % (igra ne smije gubiti novac)", () => {
        for (let streak = 0; streak <= 100; streak++) {
            expect(rtpForStreak(streak)).toBeLessThanOrEqual(0.99);
        }
    });
})

describe("cashoutAmount", () => {
    it("isplata ovisi o streaku", () => {
        expect(cashoutAmount(10, 2, 0)).toBe(19.40);
        expect(cashoutAmount(10, 2, 5)).toBe(19.60);
        expect(cashoutAmount(10, 2, 10)).toBe(19.80);
    });
})
