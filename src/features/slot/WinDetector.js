import { CONFIG } from "../../config.js";

export class WinDetector {
  checkWin(grid) {
    for (let row = 0; row < CONFIG.SLOT_MACHINE.ROWS; row++) {
      const rowSymbols = grid.map((col) => col[row]);
      const firstSymbol = rowSymbols[0];

      if (firstSymbol === "joker" && rowSymbols.every((s) => s === "joker")) {
        return {
          type: "BIG_WIN",
          amount: CONFIG.SLOT_WINS.JOKER_4.amount,
          row: row,
          symbols: rowSymbols,
        };
      }

      if (
        firstSymbol !== "joker" &&
        firstSymbol !== "empty" &&
        firstSymbol !== "coin-empty" &&
        typeof firstSymbol === "number"
      ) {
        const count = rowSymbols.filter(
          (s) => s === firstSymbol && typeof s === "number"
        ).length;
        if (count >= 3) {
          const winKey = `COIN_${firstSymbol}_${count}`;
          const winConfig = CONFIG.SLOT_WINS[winKey];
          if (winConfig) {
            return {
              type: "NORMAL",
              amount: winConfig.amount,
              row: row,
              symbols: rowSymbols,
            };
          }
        }
      }
    }
    return null;
  }
}
