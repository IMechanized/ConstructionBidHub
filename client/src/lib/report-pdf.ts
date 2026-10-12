import html2pdf from "html2pdf.js";

const colorProperties = [
  "color", "background-color", "border-top-color", "border-right-color",
  "border-bottom-color", "border-left-color", "outline-color",
  "text-decoration-color",
] as const;

/**
 * html2canvas 1.x cannot parse OKLCH or color-mix. Let the browser resolve
 * those colors to sRGB in the disposable export copy, not in our design tokens.
 */
export function prepareReportClone(clone: Document) {
  const context = clone.createElement("canvas").getContext("2d", {
    willReadFrequently: true,
  });
  if (!context || !clone.defaultView) {
    throw new Error("The browser could not prepare report colors for PDF export.");
  }
  const cache = new Map<string, string>();
  const toRgb = (color: string) => {
    const cached = cache.get(color);
    if (cached) return cached;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const pixel = context.getImageData(0, 0, 1, 1).data;
    const result = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
    cache.set(color, result);
    return result;
  };

  // Snapshot first: changing inherited styles while reading descendants would
  // otherwise change their computed values mid-conversion.
  const snapshots = Array.from(clone.querySelectorAll<HTMLElement>("*"))
    .filter(element => element.style)
    .map(element => {
      const computed = clone.defaultView!.getComputedStyle(element);
      return {
        element,
        colors: colorProperties.map(property => [
          property, toRgb(computed.getPropertyValue(property)),
        ] as const),
      };
    });
  for (const { element, colors } of snapshots) {
    for (const [property, color] of colors) {
      element.style.setProperty(property, color, "important");
    }
    // Reports are flat; suppress inherited shell shadows/gradients that the
    // legacy canvas renderer could also try to parse.
    element.style.setProperty("box-shadow", "none", "important");
    element.style.setProperty("background-image", "none", "important");
  }
}

export async function exportReportPdf(element: HTMLElement, filename: string) {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const wasLight = root.classList.contains("light");
  const wasExport = element.classList.contains("report-pdf-export");
  try {
    root.classList.remove("dark");
    root.classList.add("light");
    element.classList.add("report-pdf-export");
    await document.fonts?.ready;

    // Include the palette ancestor in the source clone, before html2pdf measures
    // row positions for page breaks (not just before html2canvas renders it).
    const source = document.createElement("div");
    source.className = "report-page";
    source.style.width = "7.5in";
    source.style.minHeight = "0";
    source.append(element.cloneNode(true));

    const worker = html2pdf().set({
      margin: 0.5,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        windowWidth: 1024,
        onclone: prepareReportClone,
      },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [
          ".report-table-section", "tr", ".report-stat-card",
          ".report-stat-tile", ".report-summary",
        ],
      },
    }).from(source).toContainer();

    // html2pdf clones only the sheet, so restore its scoped palette ancestor.
    const container = await worker.get("container");
    container.classList.add("report-page");
    container.style.minHeight = "0";
    await worker.save();
  } finally {
    root.classList.toggle("dark", wasDark);
    root.classList.toggle("light", wasLight);
    element.classList.toggle("report-pdf-export", wasExport);
  }
}
