import { gsap } from "gsap";
import { CONFIG } from "../../config.js";

export class ZigzagOutline {
  constructor(resources) {
    this.resources = resources;
    this.zigzagOutline = null;
  }

  create(winningRow, screen) {
    const slotGrid = screen.querySelector(".slot-grid");
    if (!slotGrid) return;

    const winningCells = this.getWinningCells(winningRow, screen);
    if (winningCells.length === 0) return;

    const bounds = this.calculateZigzagBounds(winningCells, slotGrid);
    if (!bounds) return;

    const svg = this.createZigzagSVG(bounds, winningRow);
    const defs = this.createZigzagDefs(winningRow);
    const pathData = this.generateZigzagPath(bounds);
    const paths = this.createZigzagPaths(pathData, winningRow);

    svg.append(defs, paths.secondary, paths.primary);
    slotGrid.appendChild(svg);

    this.zigzagOutline = svg;
    this.animateZigzagOutline(svg, paths.primary, paths.secondary);
  }

  getWinningCells(winningRow, screen) {
    return Array.from(
      screen.querySelectorAll(`.slot-cell[data-row="${winningRow}"]`)
    );
  }

  calculateZigzagBounds(winningCells, slotGrid) {
    if (!winningCells || winningCells.length === 0) {
      return null;
    }

    const sortedCells = Array.from(winningCells).sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.left - rectB.left;
    });

    const firstCell = sortedCells[0];
    const lastCell = sortedCells[sortedCells.length - 1];

    const slotGridRect = slotGrid.getBoundingClientRect();
    const firstRect = firstCell.getBoundingClientRect();
    const lastRect = lastCell.getBoundingClientRect();

    const firstPosX = firstRect.left - slotGridRect.left;
    const firstPosY = firstRect.top - slotGridRect.top;
    const lastPosX = lastRect.left - slotGridRect.left;
    const lastPosY = lastRect.top - slotGridRect.top;

    const cellHeight = firstRect.height;
    const verticalPadding =
      cellHeight * CONFIG.ZIGZAG_OUTLINE.VERTICAL_PADDING_MULTIPLIER;

    const top = firstPosY - verticalPadding;
    const bottom = lastPosY + lastRect.height + verticalPadding;
    const height = bottom - top;

    const horizontalPaddingRight = 10;
    const horizontalPaddingLeft = 25;
    const left = firstPosX - horizontalPaddingLeft;
    const right = lastPosX + lastRect.width + horizontalPaddingRight;
    const width = right - left;

    if (width <= 0 || height <= 0) {
      return null;
    }

    return { left, top, width, height };
  }

  createZigzagSVG(bounds, winningRow) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "lightning-outline");
    svg.style.position = "absolute";
    svg.style.left = `${bounds.left}px`;
    svg.style.top = `${bounds.top}px`;
    svg.style.width = `${bounds.width}px`;
    svg.style.height = `${bounds.height}px`;
    svg.style.pointerEvents = "none";
    svg.style.zIndex = CONFIG.ZIGZAG_OUTLINE.Z_INDEX;
    svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
    return svg;
  }

  createZigzagDefs(winningRow) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const gradient = this.createZigzagGradient(winningRow);
    const filter = this.createZigzagFilter(winningRow);
    defs.append(gradient, filter);
    return defs;
  }

  createZigzagGradient(winningRow) {
    const gradient = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "linearGradient"
    );
    gradient.setAttribute("id", `lightningGradient-${winningRow}`);
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "100%");

    const stops = CONFIG.ZIGZAG_OUTLINE.GRADIENT.STOPS.map((offset, index) => {
      const stop = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      stop.setAttribute("offset", offset);
      stop.setAttribute(
        "stop-color",
        CONFIG.ZIGZAG_OUTLINE.GRADIENT.COLORS[index]
      );
      stop.setAttribute("stop-opacity", "1");
      return stop;
    });
    gradient.append(...stops);

    return gradient;
  }

  createZigzagFilter(winningRow) {
    const filter = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "filter"
    );
    filter.setAttribute("id", `lightningGlow-${winningRow}`);

    const feGaussianBlur = this.createZigzagBlurFilter();
    const feMerge = this.createZigzagMergeFilter();

    filter.append(feGaussianBlur, feMerge);

    return filter;
  }

  createZigzagBlurFilter() {
    const feGaussianBlur = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feGaussianBlur"
    );
    feGaussianBlur.setAttribute(
      "stdDeviation",
      CONFIG.ZIGZAG_OUTLINE.BLUR_STD_DEVIATION
    );
    feGaussianBlur.setAttribute("result", "coloredBlur");
    return feGaussianBlur;
  }

  createZigzagMergeFilter() {
    const feMerge = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMerge"
    );
    const feMergeNode1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    feMergeNode1.setAttribute("in", "coloredBlur");
    const feMergeNode2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "feMergeNode"
    );
    feMergeNode2.setAttribute("in", "SourceGraphic");

    feMerge.append(feMergeNode1, feMergeNode2);
    return feMerge;
  }

  generateZigzagPath(bounds) {
    const zigzagSize = Math.min(
      CONFIG.ZIGZAG_OUTLINE.ZIGZAG_SIZE_MAX,
      bounds.width / CONFIG.ZIGZAG_OUTLINE.ZIGZAG_SIZE_DIVISOR
    );
    const padding = CONFIG.ZIGZAG_OUTLINE.PADDING;
    const cornerRadius = Math.min(
      CONFIG.ZIGZAG_OUTLINE.CORNER_RADIUS_MAX,
      Math.min(bounds.width, bounds.height) /
        CONFIG.ZIGZAG_OUTLINE.CORNER_RADIUS_DIVISOR
    );

    let pathData = `M ${padding + cornerRadius} ${padding}`;

    pathData += this.generateTopZigzag(
      bounds.width,
      padding,
      cornerRadius,
      zigzagSize
    );
    pathData += this.generateRightCorner(
      bounds.width,
      bounds.height,
      padding,
      cornerRadius
    );
    pathData += this.generateBottomZigzag(
      bounds.width,
      bounds.height,
      padding,
      cornerRadius,
      zigzagSize
    );
    pathData += this.generateLeftCorner(bounds.height, padding, cornerRadius);
    pathData += ` Z`;

    return pathData;
  }

  generateTopZigzag(width, padding, cornerRadius, zigzagSize) {
    let pathData = "";
    let x = padding + cornerRadius;

    while (x < width - padding - cornerRadius) {
      const segmentLength = Math.min(
        zigzagSize * CONFIG.ZIGZAG_OUTLINE.SEGMENT_MULTIPLIER,
        width - padding - cornerRadius - x
      );
      const nextX = x + segmentLength;
      const midX = x + segmentLength / 2;
      const randomOffset =
        (Math.random() - 0.5) *
        zigzagSize *
        CONFIG.ZIGZAG_OUTLINE.RANDOM_OFFSET_MULTIPLIER;
      pathData += ` Q ${midX} ${padding + randomOffset} ${nextX} ${padding}`;
      x = nextX;
    }

    pathData += ` L ${width - padding - cornerRadius} ${padding}`;
    return pathData;
  }

  generateRightCorner(width, height, padding, cornerRadius) {
    return ` Q ${width - padding} ${padding} ${width - padding} ${
      padding + cornerRadius
    } L ${width - padding} ${height - padding - cornerRadius}`;
  }

  generateBottomZigzag(width, height, padding, cornerRadius, zigzagSize) {
    let pathData = "";
    let x = width - padding - cornerRadius;

    while (x > padding + cornerRadius) {
      const segmentLength = Math.min(
        zigzagSize * CONFIG.ZIGZAG_OUTLINE.SEGMENT_MULTIPLIER,
        x - padding - cornerRadius
      );
      const prevX = x - segmentLength;
      const midX = x - segmentLength / 2;
      const randomOffset =
        (Math.random() - 0.5) *
        zigzagSize *
        CONFIG.ZIGZAG_OUTLINE.RANDOM_OFFSET_MULTIPLIER;
      pathData += ` Q ${midX} ${height - padding + randomOffset} ${prevX} ${
        height - padding
      }`;
      x = prevX;
    }

    pathData += ` L ${padding + cornerRadius} ${height - padding}`;
    return pathData;
  }

  generateLeftCorner(height, padding, cornerRadius) {
    return ` Q ${padding} ${height - padding} ${padding} ${
      height - padding - cornerRadius
    } L ${padding} ${padding + cornerRadius} Q ${padding} ${padding} ${
      padding + cornerRadius
    } ${padding}`;
  }

  createZigzagPaths(pathData, winningRow) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", `url(#lightningGradient-${winningRow})`);
    path.setAttribute("stroke-width", CONFIG.ZIGZAG_OUTLINE.STROKE_WIDTH);
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("filter", `url(#lightningGlow-${winningRow})`);

    const path2 = path.cloneNode(true);
    path2.setAttribute(
      "stroke-width",
      CONFIG.ZIGZAG_OUTLINE.STROKE_WIDTH_SECONDARY
    );
    path2.setAttribute("opacity", CONFIG.ZIGZAG_OUTLINE.SECONDARY_OPACITY);

    return { primary: path, secondary: path2 };
  }

  animateZigzagOutline(svg, path, path2) {
    this.resources.requestAnimationFrame(() => {
      const pathLength = path.getTotalLength();
      if (pathLength > 0) {
        path.setAttribute("stroke-dasharray", pathLength);
        path.setAttribute("stroke-dashoffset", pathLength);
        path2.setAttribute("stroke-dasharray", pathLength);
        path2.setAttribute("stroke-dashoffset", pathLength);

        gsap.from(svg, {
          opacity: 0,
          scale: CONFIG.ZIGZAG_OUTLINE.ANIMATION.FADE_IN_SCALE,
          duration: CONFIG.ZIGZAG_OUTLINE.ANIMATION.FADE_IN_DURATION,
          ease: CONFIG.ZIGZAG_OUTLINE.ANIMATION.FADE_IN_EASE,
        });

        gsap.to(path, {
          strokeDashoffset: 0,
          duration: CONFIG.ZIGZAG_OUTLINE.ANIMATION.DRAW_DURATION,
          ease: CONFIG.ZIGZAG_OUTLINE.ANIMATION.DRAW_EASE,
          delay: CONFIG.ZIGZAG_OUTLINE.ANIMATION.DRAW_DELAY,
        });

        gsap.to(path2, {
          strokeDashoffset: 0,
          duration: CONFIG.ZIGZAG_OUTLINE.ANIMATION.DRAW_DURATION,
          ease: CONFIG.ZIGZAG_OUTLINE.ANIMATION.DRAW_EASE,
          delay: CONFIG.ZIGZAG_OUTLINE.ANIMATION.DRAW_DELAY_SECONDARY,
          onComplete: () => {
            gsap.to([path, path2], {
              opacity: CONFIG.ZIGZAG_OUTLINE.ANIMATION.PULSE_OPACITY,
              duration: CONFIG.ZIGZAG_OUTLINE.ANIMATION.PULSE_OPACITY_DURATION,
              yoyo: true,
              repeat: -1,
              ease: CONFIG.ZIGZAG_OUTLINE.ANIMATION.PULSE_EASE,
            });

            gsap.to(path, {
              strokeWidth: CONFIG.ZIGZAG_OUTLINE.ANIMATION.PULSE_STROKE_WIDTH,
              duration:
                CONFIG.ZIGZAG_OUTLINE.ANIMATION.PULSE_STROKE_WIDTH_DURATION,
              yoyo: true,
              repeat: -1,
              ease: CONFIG.ZIGZAG_OUTLINE.ANIMATION.PULSE_EASE,
            });
          },
        });
      }
    });
  }

  destroy() {
    if (this.zigzagOutline) {
      if (this.zigzagOutline.parentNode) {
        this.zigzagOutline.remove();
      }
      this.zigzagOutline = null;
    }
  }
}
