import {describe, it, expect} from "vitest";
import { winChance } from "./hilo";

describe("winChance", () =>{
    it("7 -> viša ili ista je 7/13", () => {
        expect(winChance(7, "higher")).toBeCloseTo(7/13);
    });
})
