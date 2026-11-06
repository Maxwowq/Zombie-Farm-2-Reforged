import { translate } from "./translate";

/** Pixi renders Text through 2D canvases before uploading it as a WebGL texture.
 * Measure and draw the SAME translated string so textures don't clip the result.
 * This also covers offscreen canvases created in the page's main JS realm. */
export function installCanvasTranslation(): void {
  const prototypes: object[] = [];
  if (typeof CanvasRenderingContext2D !== "undefined") prototypes.push(CanvasRenderingContext2D.prototype);
  if (typeof OffscreenCanvasRenderingContext2D !== "undefined") prototypes.push(OffscreenCanvasRenderingContext2D.prototype);
  for (const prototype of prototypes) {
    for (const name of ["measureText", "fillText", "strokeText"]) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (!descriptor || typeof descriptor.value !== "function") continue;
      const original = descriptor.value;
      Object.defineProperty(prototype, name, {
        ...descriptor,
        value: function (this: unknown, text: unknown, ...args: unknown[]) {
          return Reflect.apply(original, this, [typeof text === "string" ? translate(text) : text, ...args]);
        },
      });
    }
  }
}
