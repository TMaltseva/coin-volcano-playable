import { CONFIG } from "../../config.js";
import { DOMUtils } from "../../utils/dom.js";

export class SlotUI {
  constructor() {
    this.screen = null;
  }

  createSlotMachineUI() {
    const screen = DOMUtils.createElement("div", {
      className: "slot-machine-screen",
    });

    screen.append(
      DOMUtils.createElement("canvas", {
        id: "sparkles-canvas-slot",
        className: "sparkles-canvas",
      }),
      this.createLeftPanel(),
      this.createSlotMachineCenter(),
      this.createRightPanel()
    );

    document.body.appendChild(screen);
    this.screen = screen;

    this.createSlotGrid();
    return screen;
  }

  createLeftPanel() {
    return DOMUtils.createElement("div", {
      className: "left-panel",
      children: [
        DOMUtils.createImage({
          src: "logo/logo.png",
          alt: "Logo",
          className: "logo-volcanoes",
        }),
        ...CONFIG.JACKPOTS.map(({ type, amount }) =>
          this.createJackpotElement(type, `${amount.toLocaleString()} €`)
        ),
      ],
    });
  }

  createJackpotElement(type, amount) {
    return DOMUtils.createElement("div", {
      className: `jackpot-${type}`,
      children: [
        DOMUtils.createImage({
          src: `ui/billet/${type}.png`,
          alt: type.charAt(0).toUpperCase() + type.slice(1),
        }),
        DOMUtils.createTextElement("span", amount, "jackpot-amount"),
      ],
    });
  }

  createSlotMachineCenter() {
    return DOMUtils.createElement("div", {
      className: "slot-machine-center",
      children: [
        DOMUtils.createElement("div", {
          className: "field-container",
          children: [
            this.createVolcanoesContainer(),
            DOMUtils.createImage({
              src: "ui/field/field.png",
              alt: "Slot Frame",
              className: "slot-frame",
            }),
            DOMUtils.createElement("div", { className: "slot-grid" }),
          ],
        }),
      ],
    });
  }

  createVolcanoesContainer() {
    const container = DOMUtils.createElement("div", {
      className: "volcanoes-container",
    });

    const volcanoes = [
      {
        src: "ui/volcanoes/volcano-green.png",
        alt: "LIFE",
        className: "volcano-image volcano-left",
      },
      {
        src: "ui/volcanoes/volcano-blue.png",
        alt: "GROW",
        className: "volcano-image volcano-center",
      },
      {
        src: "ui/volcanoes/volcano-red.png",
        alt: "MULTI",
        className: "volcano-image volcano-right",
      },
    ];

    container.append(
      ...volcanoes.map((volcanoConfig) =>
        DOMUtils.createElement("div", {
          className: "volcano-wrapper",
          children: [DOMUtils.createImage(volcanoConfig)],
        })
      )
    );

    return container;
  }

  createRightPanel() {
    return DOMUtils.createElement("div", {
      className: "right-panel",
      children: [
        this.createBillboardElement("balance", "100 €", "balance-amount"),
        DOMUtils.createElement("button", {
          className: "withdraw-button",
          children: [DOMUtils.createTextElement("span", "Withdraw")],
        }),
        this.createBillboardElement("free-spins", "5", "free-spins-count"),
        DOMUtils.createElement("button", {
          className: "refresh-button",
          children: [
            DOMUtils.createImage({
              src: "ui/buttons/refresh-button.png",
              alt: "Spin",
              className: "refresh-button-icon",
            }),
          ],
        }),
      ],
    });
  }

  createBillboardElement(type, value, amountClassName) {
    return DOMUtils.createElement("div", {
      className: `${type}-billboard`,
      children: [
        DOMUtils.createImage({
          src: `ui/billet/${type}.png`,
          alt: type === "balance" ? "Balance" : "Free Spins",
        }),
        DOMUtils.createTextElement("span", value, amountClassName),
      ],
    });
  }

  createSlotGrid() {
    const slotGrid = this.screen.querySelector(".slot-grid");
    if (!slotGrid) return;

    for (let col = 0; col < CONFIG.SLOT_MACHINE.COLUMNS; col++) {
      const cells = Array.from({ length: CONFIG.SLOT_MACHINE.ROWS }, (_, row) =>
        DOMUtils.createElement("div", {
          className: "slot-cell",
          attributes: { "data-row": row },
        })
      );
      const column = DOMUtils.createElement("div", {
        className: "slot-column",
        attributes: { "data-column": col },
        children: cells,
      });

      slotGrid.appendChild(column);
    }
  }

  getScreen() {
    return this.screen;
  }
}

