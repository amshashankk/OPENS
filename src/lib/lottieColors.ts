export interface ColorEntry {
  path: string;
  label: string;
  value: [number, number, number, number]; // RGBA 0-1
}

function rgbaToHex(c: [number, number, number, number]): string {
  const r = Math.round(c[0] * 255).toString(16).padStart(2, "0");
  const g = Math.round(c[1] * 255).toString(16).padStart(2, "0");
  const b = Math.round(c[2] * 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
    1,
  ];
}

export { rgbaToHex, hexToRgba };

export function extractColors(json: unknown): ColorEntry[] {
  const colors: ColorEntry[] = [];
  const obj = json as Record<string, unknown>;
  const layers = obj.layers as Array<Record<string, unknown>> | undefined;
  if (!layers) return colors;

  function walkShapes(
    shapes: Array<Record<string, unknown>>,
    basePath: string,
    layerName: string
  ) {
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const ty = shape.ty as string;
      const nm = (shape.nm as string) || `Shape ${i}`;

      if (ty === "fl" || ty === "st") {
        // Fill or stroke — color at .c.k
        const c = shape.c as Record<string, unknown> | undefined;
        if (c && c.a === 0 && Array.isArray(c.k)) {
          const k = c.k as number[];
          if (k.length >= 3) {
            colors.push({
              path: `${basePath}[${i}].c.k`,
              label: `${layerName} > ${nm} (${ty === "fl" ? "Fill" : "Stroke"})`,
              value: [k[0], k[1], k[2], k[3] ?? 1],
            });
          }
        }
      } else if (ty === "gr") {
        // Group — recurse into .it
        const it = shape.it as Array<Record<string, unknown>> | undefined;
        if (it) {
          walkShapes(it, `${basePath}[${i}].it`, layerName);
        }
      }
    }
  }

  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li];
    const layerName = (layer.nm as string) || `Layer ${li}`;
    const layerType = layer.ty as number;

    // Shape layer
    if (layerType === 4) {
      const shapes = layer.shapes as Array<Record<string, unknown>> | undefined;
      if (shapes) {
        walkShapes(shapes, `layers[${li}].shapes`, layerName);
      }
    }

    // Solid layer — color in sc field
    if (layerType === 1 && typeof layer.sc === "string") {
      colors.push({
        path: `layers[${li}].sc`,
        label: `${layerName} (Solid)`,
        value: hexToRgba(layer.sc as string),
      });
    }
  }

  return colors;
}

export function applyColorChange(
  json: unknown,
  path: string,
  newColor: [number, number, number, number]
): unknown {
  const clone = structuredClone(json);

  // Navigate to the path and set the value
  // Path format: "layers[0].shapes[1].it[2].c.k" or "layers[0].sc"
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current: unknown = clone;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[key];
    }
  }

  const lastKey = parts[parts.length - 1];
  if (current && typeof current === "object") {
    if (lastKey === "sc") {
      // Solid color is a hex string
      (current as Record<string, unknown>)[lastKey] = rgbaToHex(newColor);
    } else {
      // Normal color array
      (current as Record<string, unknown>)[lastKey] = newColor;
    }
  }

  return clone;
}
