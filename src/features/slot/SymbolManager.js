import { CONFIG } from "../../config.js";
import { DOMUtils } from "../../utils/dom.js";
import { CalculationUtils } from "../../utils/calculation.js";

export class SymbolManager {
  createSymbol(value) {
    if (value === "joker") {
      const img = DOMUtils.createImage({
        src: "ui/joker/joker-static.png",
        className: "joker-static",
        alt: "Joker",
      });
      return DOMUtils.createElement("div", {
        className: "coin-container",
        children: [img],
      });
    } else if (value === "empty") {
      const container = DOMUtils.createElement("div", {
        className: "coin-container",
      });
      container.classList.add("empty-cell");
      return container;
    } else if (value === "coin-empty") {
      const coinImg = DOMUtils.createImage({
        src: "ui/coin/coin.png",
        className: "coin-base",
        alt: "Coin",
      });
      return DOMUtils.createElement("div", {
        className: "coin-container",
        children: [coinImg],
      });
    } else {
      const coinImg = DOMUtils.createImage({
        src: "ui/coin/coin.png",
        className: "coin-base",
        alt: "Coin",
      });

      const coinText = DOMUtils.createElement("div", {
        className: "coin-text",
        textContent: `${value} €`,
      });

      return DOMUtils.createElement("div", {
        className: "coin-container",
        children: [coinImg, coinText],
      });
    }
  }

  generateGridResult(isLastSpin = false) {
    const grid = Array(CONFIG.SLOT_MACHINE.COLUMNS)
      .fill(null)
      .map(() => Array(CONFIG.SLOT_MACHINE.ROWS).fill("empty"));

    if (isLastSpin) {
      const winningRow = 1;
      for (let col = 0; col < CONFIG.SLOT_MACHINE.COLUMNS; col++) {
        grid[col][winningRow] = "joker";
      }

      const positions = [];
      for (let col = 0; col < CONFIG.SLOT_MACHINE.COLUMNS; col++) {
        for (let row = 0; row < CONFIG.SLOT_MACHINE.ROWS; row++) {
          if (row !== winningRow) {
            positions.push({ col, row });
          }
        }
      }

      const shuffledPositions = positions.sort(() => Math.random() - 0.5);
      const coinsWithValue = CalculationUtils.randomRange(2, 3);
      const totalCoins = CalculationUtils.randomRange(5, 6);
      const emptyCoins = totalCoins - coinsWithValue;

      const coinValues = [2, 3, 5];
      let coinValueIndex = 0;

      for (let i = 0; i < coinsWithValue; i++) {
        const pos = shuffledPositions.pop();
        if (pos) {
          grid[pos.col][pos.row] =
            coinValues[coinValueIndex % coinValues.length];
          coinValueIndex++;
        }
      }

      for (let i = 0; i < emptyCoins; i++) {
        const pos = shuffledPositions.pop();
        if (pos) {
          grid[pos.col][pos.row] = "coin-empty";
        }
      }

      return grid;
    }

    const positions = [];
    for (let col = 0; col < CONFIG.SLOT_MACHINE.COLUMNS; col++) {
      for (let row = 0; row < CONFIG.SLOT_MACHINE.ROWS; row++) {
        positions.push({ col, row });
      }
    }

    const shuffledPositions = positions.sort(() => Math.random() - 0.5);

    const coinsWithValue = CalculationUtils.randomRange(2, 3);
    const totalCoins = CalculationUtils.randomRange(5, 6);
    const emptyCoins = totalCoins - coinsWithValue;
    const jokers = CalculationUtils.randomRange(1, 4);

    const coinValues = [2, 3, 5];
    let coinValueIndex = 0;

    for (let i = 0; i < coinsWithValue; i++) {
      const pos = shuffledPositions.pop();
      if (pos) {
        grid[pos.col][pos.row] = coinValues[coinValueIndex % coinValues.length];
        coinValueIndex++;
      }
    }

    for (let i = 0; i < emptyCoins; i++) {
      const pos = shuffledPositions.pop();
      if (pos) {
        grid[pos.col][pos.row] = "coin-empty";
      }
    }

    for (let i = 0; i < jokers; i++) {
      const pos = shuffledPositions.pop();
      if (pos) {
        grid[pos.col][pos.row] = "joker";
      }
    }

    return grid;
  }

  generateColumnResult() {
    const result = [];
    for (let i = 0; i < CONFIG.SLOT_MACHINE.ROWS; i++) {
      const rand = Math.random();
      if (rand < 0.15) {
        result.push("joker");
      } else if (rand < 0.35) {
        result.push(5);
      } else if (rand < 0.55) {
        result.push(3);
      } else if (rand < 0.7) {
        result.push(2);
      } else if (rand < 0.85) {
        result.push("coin-empty");
      } else {
        result.push("empty");
      }
    }
    return result;
  }

  calculateCoinsSum(grid) {
    let sum = 0;
    for (let col = 0; col < grid.length; col++) {
      for (let row = 0; row < grid[col].length; row++) {
        const value = grid[col][row];
        if (typeof value === "number") {
          sum += value;
        }
      }
    }
    return sum;
  }

  isCoinValue(symbolValue) {
    return (
      typeof symbolValue === "number" &&
      CONFIG.SLOT_MACHINE.COIN_VALUES.includes(symbolValue)
    );
  }
}

