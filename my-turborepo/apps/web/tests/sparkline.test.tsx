import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Sparkline } from "@/components/charts/Sparkline";

describe("Sparkline", () => {
  it("renders placeholder for empty dataset", () => {
    render(<Sparkline points={[]} />);
    const placeholder = screen.getByRole("img", { name: "NAV sparkline" });
    expect(placeholder).toHaveAttribute("data-empty", "true");
  });

  it("renders svg path for NAV movement", () => {
    const points = [
      { date: "2025-11-20", nav: 10 },
      { date: "2025-11-21", nav: 12 },
      { date: "2025-11-22", nav: 9 }
    ];

    render(<Sparkline points={points} width={100} height={50} />);

    const svg = screen.getByRole("img", { name: "NAV sparkline" }) as SVGSVGElement;
    const paths = svg.querySelectorAll("path");
    expect(paths.length).toBe(2);
    expect(paths[0].getAttribute("d")).toMatch(/^M 0.00 \d+\.\d{2}/);
  });
});
