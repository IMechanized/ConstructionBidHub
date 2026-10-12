import { afterEach, describe, expect, it, vi } from "vitest";
import { exportReportPdf } from "./report-pdf";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  options: undefined as any,
  factory: vi.fn(),
}));
vi.mock("html2pdf.js", () => ({ default: mocks.factory }));

afterEach(() => {
  document.documentElement.className = "";
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

function setup() {
  const element = document.createElement("div");
  element.className = "report-document";
  document.body.append(element);
  const container = document.createElement("div");
  const worker = {
    set: vi.fn(options => { mocks.options = options; return worker; }),
    from: vi.fn(() => worker),
    toContainer: vi.fn(() => worker),
    get: vi.fn(async () => container),
    save: mocks.save,
  };
  mocks.factory.mockReturnValue(worker);
  return { element, container, worker };
}

describe("report PDF export", () => {
  it.each(["dark", "light", ""])("restores the original %s theme after saving", async theme => {
    const { element, container } = setup();
    document.documentElement.className = theme;
    mocks.save.mockImplementationOnce(async () => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(element.classList.contains("report-pdf-export")).toBe(true);
    });
    await exportReportPdf(element, "example.pdf");
    expect(document.documentElement.className.trim()).toBe(theme);
    expect(element.className).toBe("report-document");
    expect(container.classList.contains("report-page")).toBe(true);
    expect(mocks.options.filename).toBe("example.pdf");
    expect(mocks.options.html2canvas.onclone).toBeTypeOf("function");
    expect(mocks.options.pagebreak.avoid).toContain("tr");
    expect(mocks.options.pagebreak.avoid).toContain(".report-table-section");
  });

  it("restores theme and sizing when saving fails", async () => {
    const { element } = setup();
    document.documentElement.className = "dark";
    mocks.save.mockRejectedValueOnce(new Error("Export unavailable"));
    await expect(exportReportPdf(element, "example.pdf")).rejects.toThrow("Export unavailable");
    expect(document.documentElement.className).toBe("dark");
    expect(element.className).toBe("report-document");
  });

  it("preserves existing light and export classes", async () => {
    const { element } = setup();
    document.documentElement.className = "dark light";
    element.classList.add("report-pdf-export");
    mocks.save.mockResolvedValueOnce(undefined);
    await exportReportPdf(element, "example.pdf");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(element.classList.contains("report-pdf-export")).toBe(true);
  });
});
