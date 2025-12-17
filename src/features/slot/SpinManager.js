import { gsap } from "gsap";
import { CONFIG } from "../../config.js";
import { DOMUtils } from "../../utils/dom.js";
import { CalculationUtils } from "../../utils/calculation.js";
import { AnimationUtils } from "../../utils/animation.js";
import { playSound, playSoundSequentially } from "../../utils/audio.js";
import sound1Url from "/sounds/sound_1.mp3";
import sound7Url from "/sounds/sound_7.mp3";

export class SpinManager {
  constructor(resources, symbolManager, winDetector, screen) {
    this.resources = resources;
    this.symbolManager = symbolManager;
    this.winDetector = winDetector;
    this.screen = screen;
    this.isSpinning = false;
    this.currentGrid = null;
  }

  async spin(freeSpins, balance, onSpinComplete, onWinDetected) {
    if (!this.canSpin(freeSpins)) return;

    const spinData = this.prepareSpin(freeSpins);
    if (!spinData) return;

    const allCoins = await this.animateAllColumns(spinData);

    if (!spinData.isLastSpin) {
      await this.processCoinsAfterSpin(allCoins);
    }

    await this.finalizeSpin(spinData, balance, onSpinComplete, onWinDetected);
  }

  canSpin(freeSpins) {
    return !this.isSpinning && freeSpins > 0;
  }

  prepareSpin(freeSpins) {
    playSoundSequentially(sound1Url, 1).catch((e) => {
      if (import.meta.env.DEV) {
        console.error("Error playing spin sound sequence:", e);
      }
    });

    this.isSpinning = true;

    const columns = this.screen.querySelectorAll(".slot-column");
    const isLastSpin = freeSpins === 1;
    const previousGrid = this.currentGrid;
    const finalGrid = this.symbolManager.generateGridResult(isLastSpin);

    return {
      columns,
      isLastSpin,
      previousGrid,
      finalGrid,
      freeSpins: freeSpins - 1,
    };
  }

  async animateAllColumns(spinData) {
    const allCoins = [];

    for (let col = 0; col < spinData.columns.length; col++) {
      const column = spinData.columns[col];
      const originalCells = Array.from(column.querySelectorAll(".slot-cell"));

      this.prepareColumnForSpin(column);

      const reelStrip = this.createReelStrip(
        column,
        col,
        spinData.previousGrid,
        spinData.finalGrid
      );

      column.appendChild(reelStrip);

      await this.waitForColumnDelay(col);

      const columnData = this.calculateColumnData(column, reelStrip, col);
      const coins = await this.animateColumn(
        column,
        reelStrip,
        originalCells,
        columnData,
        col,
        spinData.finalGrid
      );

      allCoins.push(...coins);
    }

    await this.waitForSymbolAnimations();

    return allCoins;
  }

  prepareColumnForSpin(column) {
    column.replaceChildren();
    column.style.position = "relative";
    column.style.overflow = "hidden";
    column.style.height = "100%";
  }

  createReelStrip(column, colIndex, previousGrid, finalGrid) {
    const reelStrip = DOMUtils.createElement("div", {
      style: {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        willChange: "transform",
        display: "flex",
        flexDirection: "column",
      },
    });

    const columnHeight =
      column.offsetHeight || CONFIG.SLOT_MACHINE.COLUMN_HEIGHT_FALLBACK;
    const cellHeightPx = columnHeight / CONFIG.SLOT_MACHINE.ROWS;
    const spinCycles = CONFIG.SLOT_MACHINE.SPIN_CYCLES;
    const totalSymbols =
      spinCycles * CONFIG.SLOT_MACHINE.ROWS + CONFIG.SLOT_MACHINE.ROWS;
    const startGrid = previousGrid || this.currentGrid || finalGrid;

    const symbolCells = [];

    for (let i = 0; i < totalSymbols; i++) {
      const symbolType = this.getSymbolTypeForPosition(
        i,
        colIndex,
        spinCycles,
        startGrid,
        finalGrid
      );

      const symbol = this.symbolManager.createSymbol(symbolType);
      const symbolCell = DOMUtils.createElement("div", {
        className: "slot-cell",
        style: {
          height: `${cellHeightPx}px`,
          flexShrink: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        children: [symbol],
      });

      symbolCells.push(symbolCell);
    }

    reelStrip.append(...symbolCells);
    return reelStrip;
  }

  getSymbolTypeForPosition(i, colIndex, spinCycles, startGrid, finalGrid) {
    if (i >= spinCycles * CONFIG.SLOT_MACHINE.ROWS) {
      const finalRow = i - spinCycles * CONFIG.SLOT_MACHINE.ROWS;
      return finalGrid[colIndex][finalRow];
    } else if (i < CONFIG.SLOT_MACHINE.ROWS && startGrid) {
      return startGrid[colIndex][i % CONFIG.SLOT_MACHINE.ROWS];
    } else {
      const tempColumn = this.symbolManager.generateColumnResult();
      return tempColumn[i % CONFIG.SLOT_MACHINE.ROWS];
    }
  }

  waitForColumnDelay(colIndex) {
    const spinDelay = colIndex * CONFIG.SLOT_MACHINE.COLUMN_START_DELAY;
    return new Promise((resolve) => {
      this.resources.setTimeout(resolve, spinDelay);
    });
  }

  calculateColumnData(column, reelStrip, colIndex) {
    const columnHeight =
      column.offsetHeight || CONFIG.SLOT_MACHINE.COLUMN_HEIGHT_FALLBACK;
    const cellHeightPx = columnHeight / CONFIG.SLOT_MACHINE.ROWS;
    const spinCycles = CONFIG.SLOT_MACHINE.SPIN_CYCLES;
    const totalSymbols =
      spinCycles * CONFIG.SLOT_MACHINE.ROWS + CONFIG.SLOT_MACHINE.ROWS;
    const totalHeight = cellHeightPx * totalSymbols;
    const finalPositionPx = -(totalHeight - columnHeight);
    const spinDuration =
      CONFIG.SLOT_MACHINE.SPIN_DURATION +
      colIndex * CONFIG.SLOT_MACHINE.COLUMN_DURATION_INCREMENT;

    return {
      columnHeight,
      cellHeightPx,
      totalSymbols,
      finalPositionPx,
      spinDuration,
    };
  }

  async animateColumn(
    column,
    reelStrip,
    originalCells,
    columnData,
    colIndex,
    finalGrid
  ) {
    const allCoins = [];
    const self = this;

    const preFinalPosition =
      columnData.finalPositionPx - columnData.columnHeight;

    const timeline = gsap.timeline({
      onStart: () => {
        const blurPx = CalculationUtils.calculateBlur();
        reelStrip.style.filter = `blur(${blurPx}px)`;
      },
      onUpdate: function () {
        const progress = this.progress();
        self.updateBlurEffect(reelStrip, progress);
      },
      onComplete: () => {
        this.finalizeColumnAnimation(
          column,
          reelStrip,
          originalCells,
          colIndex,
          finalGrid,
          allCoins
        );
      },
    });

    timeline.to(reelStrip, {
      y: preFinalPosition,
      duration: columnData.spinDuration * 0.8,
      ease: "none",
    });

    timeline.to(reelStrip, {
      y: columnData.finalPositionPx,
      duration: columnData.spinDuration * 0.2,
      ease: "power2.out",
    });

    this.resources.registerAnimation(timeline);

    await new Promise((resolve) => {
      this.resources.setTimeout(
        resolve,
        columnData.spinDuration * 1000 + CONFIG.SLOT_MACHINE.STOP_DELAY
      );
    });

    return allCoins;
  }

  updateBlurEffect(reelStrip, progress) {
    if (progress > CONFIG.SLOT_MACHINE.BLUR_FADE_START) {
      const fadeOutProgress =
        (progress - CONFIG.SLOT_MACHINE.BLUR_FADE_START) /
        CONFIG.SLOT_MACHINE.BLUR_FADE_RANGE;
      const blurMultiplier = 1 - fadeOutProgress;
      const blurPx = CalculationUtils.calculateBlur() * blurMultiplier;
      reelStrip.style.filter = `blur(${blurPx}px)`;
    }
  }

  finalizeColumnAnimation(
    column,
    reelStrip,
    originalCells,
    colIndex,
    finalGrid,
    allCoins
  ) {
    reelStrip.style.filter = "none";

    column.replaceChildren();
    column.style.overflow = "visible";
    column.style.display = "flex";
    column.style.flexDirection = "column";
    column.style.gap = CONFIG.SLOT_MACHINE.SYMBOL_GAP;

    originalCells.forEach((cell, rowIndex) => {
      const newCell = cell.cloneNode(false);
      newCell.replaceChildren();
      newCell.setAttribute("data-row", rowIndex);
      const symbolValue = finalGrid[colIndex][rowIndex];
      const finalSymbol = this.symbolManager.createSymbol(symbolValue);
      newCell.append(finalSymbol);
      column.appendChild(newCell);

      if (this.symbolManager.isCoinValue(symbolValue)) {
        allCoins.push(finalSymbol);
      }

      const anim = AnimationUtils.createScaleBounceAnimation(finalSymbol, {
        scale: 0,
        duration: CONFIG.SLOT_MACHINE.SYMBOL_SCALE_DURATION,
        delay: rowIndex * CONFIG.SLOT_MACHINE.SYMBOL_DELAY_MULTIPLIER,
      });
      this.resources.registerAnimation(anim);
    });
  }

  async processCoinsAfterSpin(allCoins) {
    await this.waitForSymbolAnimations();

    allCoins.forEach((coinContainer, index) => {
      if (
        coinContainer &&
        coinContainer.parentNode &&
        document.body.contains(coinContainer) &&
        coinContainer.querySelector(".coin-text")
      ) {
        this.animateCoinWithValue(coinContainer, index);
      }
    });
  }

  waitForSymbolAnimations() {
    const lastSymbolDelay =
      (CONFIG.SLOT_MACHINE.ROWS - 1) *
      CONFIG.SLOT_MACHINE.SYMBOL_DELAY_MULTIPLIER;
    const additionalDelay = CONFIG.SLOT_MACHINE.SYMBOL_SCALE_DURATION;
    const waitForAllSymbols =
      (lastSymbolDelay + additionalDelay) * 1000 +
      CONFIG.SLOT_MACHINE.ADDITIONAL_WAIT_DELAY;

    return new Promise((resolve) => {
      this.resources.setTimeout(resolve, waitForAllSymbols);
    });
  }

  animateCoinWithValue(coinContainer, index) {
    if (
      !coinContainer ||
      !coinContainer.parentNode ||
      !document.body.contains(coinContainer)
    ) {
      return;
    }

    coinContainer.classList.add("coin-with-value");
    const fireContainer = this.createCoinFire(coinContainer);

    const isElementValid = () => {
      return (
        coinContainer &&
        coinContainer.parentNode &&
        document.body.contains(coinContainer)
      );
    };

    const timeline = gsap.timeline({
      delay: index * CONFIG.SLOT_MACHINE.COIN_ANIMATION.DELAY_MULTIPLIER,
      paused: true,
      onStart: () => {
        if (!isElementValid()) {
          timeline.kill();
          return;
        }
        playSound(sound7Url, true);
        this.createCoinSparks(coinContainer);
      },
    });

    const startAnimation = () => {
      if (isElementValid()) {
        timeline.play();
      }
    };

    const audio = playSound(sound7Url, false);
    if (audio) {
      if (audio.readyState >= 2) {
        this.resources.setTimeout(
          startAnimation,
          index * CONFIG.SLOT_MACHINE.COIN_ANIMATION.DELAY_MULTIPLIER * 1000
        );
      } else {
        audio.addEventListener(
          "canplaythrough",
          () => {
            this.resources.setTimeout(
              startAnimation,
              index * CONFIG.SLOT_MACHINE.COIN_ANIMATION.DELAY_MULTIPLIER * 1000
            );
          },
          { once: true }
        );
      }
    } else {
      this.resources.setTimeout(
        startAnimation,
        index * CONFIG.SLOT_MACHINE.COIN_ANIMATION.DELAY_MULTIPLIER * 1000
      );
    }

    timeline.to(
      fireContainer,
      {
        opacity: 1,
        duration: CONFIG.SLOT_MACHINE.COIN_ANIMATION.FIRE_OPACITY_DURATION,
        ease: "power2.out",
      },
      0
    );

    timeline.to(coinContainer, {
      scale: CONFIG.SLOT_MACHINE.COIN_ANIMATION.SCALE_UP_VALUE,
      duration: CONFIG.SLOT_MACHINE.COIN_ANIMATION.SCALE_UP_DURATION,
      ease: CONFIG.SLOT_MACHINE.COIN_ANIMATION.EASE_BACK_OUT,
      onStart: () => {
        if (!isElementValid()) {
          timeline.kill();
        }
      },
      onUpdate: function () {
        if (!isElementValid()) {
          this.kill();
        }
      },
    });

    timeline.to(coinContainer, {
      scale: 1,
      duration: CONFIG.SLOT_MACHINE.COIN_ANIMATION.SCALE_DOWN_DURATION,
      ease: CONFIG.SLOT_MACHINE.COIN_ANIMATION.EASE_BACK_IN,
      onStart: () => {
        if (!isElementValid()) {
          timeline.kill();
        }
      },
      onUpdate: function () {
        if (!isElementValid()) {
          this.kill();
        }
      },
      onComplete: () => {
        if (isElementValid()) {
          coinContainer.classList.remove("coin-with-value");
        }
      },
    });

    timeline.to(
      fireContainer,
      {
        opacity: 0,
        duration: CONFIG.SLOT_MACHINE.COIN_ANIMATION.FIRE_FADE_DURATION,
        ease: "power2.out",
        onComplete: () => {
          if (fireContainer.parentNode) {
            fireContainer.parentNode.removeChild(fireContainer);
          }
        },
      },
      `-=${CONFIG.SLOT_MACHINE.COIN_ANIMATION.FIRE_FADE_DURATION}`
    );
  }

  createCoinFire(coinContainer) {
    const fireContainer = DOMUtils.createElement("div", {
      className: "coin-fire",
      style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "200%",
        height: "200%",
        pointerEvents: "none",
        opacity: 0,
      },
    });
    coinContainer.appendChild(fireContainer);
    return fireContainer;
  }

  async finalizeSpin(spinData, balance, onSpinComplete, onWinDetected) {
    const coinsSum = this.symbolManager.calculateCoinsSum(spinData.finalGrid);
    const newBalance = balance + coinsSum;
    this.currentGrid = spinData.finalGrid;

    if (spinData.isLastSpin) {
      await this.waitForSymbolAnimations();
    }

    const winResult = this.winDetector.checkWin(spinData.finalGrid);
    if (winResult && onWinDetected) {
      await onWinDetected(winResult);
    }

    this.isSpinning = false;
    if (onSpinComplete) {
      onSpinComplete(newBalance, spinData.freeSpins);
    }
  }

  getIsSpinning() {
    return this.isSpinning;
  }

  getCurrentGrid() {
    return this.currentGrid;
  }

  setCurrentGrid(grid) {
    this.currentGrid = grid;
  }
}
