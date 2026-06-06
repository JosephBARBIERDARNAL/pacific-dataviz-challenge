import * as d3 from "d3";
import { COLORS, prefersReducedMotion } from "../constants";
import type { ChartPoint } from "../types";
import { formatSignedValue } from "./format";

export interface LineChartOptions {
  theme: "dark" | "light";
  color: string;
  title: string;
  description: string;
  directLabel: string;
  tooltip: (d: ChartPoint) => string[];
  range?: boolean;
  countStrip?: boolean;
  prominent?: boolean;
}

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Imperative D3 line chart. Draws into `container` (clearing previous
 * content) and returns a cleanup function for React effects.
 */
export function drawLineChart(
  container: HTMLElement,
  data: ChartPoint[],
  options: LineChartOptions,
): () => void {
  const width = Math.max(300, container.clientWidth || 300);
  const mobile = width < 560;
  const height = options.countStrip
    ? mobile
      ? 480
      : 640
    : options.prominent
      ? mobile
        ? 460
        : 680
    : mobile
      ? 420
      : 560;
  const margin: Margin = {
    top: 36,
    right: mobile ? 22 : 128,
    bottom: options.countStrip ? 126 : 62,
    left: mobile ? 58 : 72,
  };
  const plotBottom = height - margin.bottom;
  const plotWidth = width - margin.left - margin.right;
  const valid = data.filter((d) => Number.isFinite(d.value));
  const yValues = valid.map((d) => d.value as number);

  if (options.range) {
    yValues.push(...data.flatMap((d) => [d.low ?? NaN, d.high ?? NaN]));
  }
  yValues.push(0);

  const yExtent = d3.extent(yValues.filter(Number.isFinite)) as [
    number,
    number,
  ];
  const yPadding = Math.max(20, (yExtent[1] - yExtent[0]) * 0.12);
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year) as [number, number])
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
    .nice(mobile ? 4 : 6)
    .range([plotBottom, margin.top]);

  const dark = options.theme === "dark";
  const textColor = dark ? COLORS.white : COLORS.navy;
  const subtle = dark ? "rgba(255,255,255,0.75)" : "rgba(26,43,75,0.70)";
  const gridColor = dark ? "rgba(255,255,255,0.16)" : "rgba(26,43,75,0.12)";
  const zeroColor = dark ? "rgba(255,255,255,0.48)" : "rgba(26,43,75,0.45)";

  d3.select(container).selectAll("*").remove();
  d3.select(container).attr("aria-busy", "false");

  const idBase = container.id || "chart";
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-labelledby", `${idBase}-svg-title ${idBase}-svg-desc`);

  svg.append("title").attr("id", `${idBase}-svg-title`).text(options.title);
  svg
    .append("desc")
    .attr("id", `${idBase}-svg-desc`)
    .text(
      `${options.description} Horizontal axis: year. Vertical axis: millimeters.`,
    );

  const yTicks = y.ticks(mobile ? 4 : 6);
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3
        .axisLeft(y.copy().range([plotBottom, margin.top]))
        .tickValues(yTicks)
        .tickSize(-plotWidth)
        .tickFormat(() => ""),
    )
    .call((g) => g.selectAll("line").attr("stroke", gridColor));

  svg
    .append("line")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", zeroColor)
    .attr("stroke-width", 1.4);

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", margin.left)
    .attr("y", 16)
    .attr("fill", subtle)
    .attr("font-size", 12)
    .text("ANOMALY (MM)");

  const xAxis = d3
    .axisBottom(x)
    .ticks(mobile ? 4 : 7)
    .tickFormat(d3.format("d"))
    .tickSize(0)
    .tickPadding(11);
  const yAxis = d3
    .axisLeft(y)
    .tickValues(yTicks)
    .tickFormat((d) => formatSignedValue(d.valueOf()))
    .tickSize(0)
    .tickPadding(10);

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${plotBottom})`)
    .call(xAxis)
    .call((g) => g.selectAll("text").attr("fill", subtle));
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .call((g) => g.selectAll("text").attr("fill", subtle));

  if (options.range) {
    const area = d3
      .area<ChartPoint>()
      .defined((d) => Number.isFinite(d.low) && Number.isFinite(d.high))
      .x((d) => x(d.year))
      .y0((d) => y(d.low!))
      .y1((d) => y(d.high!));

    svg
      .append("path")
      .datum(data)
      .attr("d", area)
      .attr("fill", options.color)
      .attr("fill-opacity", 0.13);

    const labelDatum = data[Math.floor(data.length * 0.18)];
    svg
      .append("text")
      .attr("class", "range-label")
      .attr("x", x(labelDatum.year))
      .attr("y", Math.max(margin.top + 14, y(labelDatum.high!) - 10))
      .attr("fill", options.color)
      .attr("font-size", 12)
      .text("COUNTRY RANGE");
  }

  const line = d3
    .line<ChartPoint>()
    .defined((d) => Number.isFinite(d.value))
    .x((d) => x(d.year))
    .y((d) => y(d.value as number));

  if (!dark) {
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", COLORS.navy)
      .attr("stroke-opacity", 0.65)
      .attr("stroke-width", 5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);
  }

  const linePath = svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", options.color)
    .attr("stroke-width", options.prominent ? 4 : 3)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line);

  if (!prefersReducedMotion.matches) {
    linePath.attr("opacity", 0).transition().duration(220).attr("opacity", 1);
  }

  const lastValid = valid.at(-1);
  if (lastValid) {
    const labelX = mobile ? x(lastValid.year) - 4 : x(lastValid.year) + 10;
    const labelAnchor = mobile ? "end" : "start";
    svg
      .append("text")
      .attr("class", "direct-label")
      .attr("x", labelX)
      .attr(
        "y",
        Math.max(margin.top + 14, y(lastValid.value as number) - 12),
      )
      .attr("text-anchor", labelAnchor)
      .attr("fill", dark ? options.color : textColor)
      .attr("font-size", 12)
      .attr("font-weight", 700)
      .text(options.directLabel.toUpperCase());
  }

  const countStrip = options.countStrip
    ? drawCountStrip(
        svg,
        data,
        x,
        width,
        height,
        margin,
        plotBottom,
        textColor,
        subtle,
      )
    : null;

  addChartInteraction({
    container,
    svg,
    data,
    x,
    y,
    margin,
    interactionBottom: countStrip?.stripBottom || plotBottom,
    coverageBars: countStrip?.bars || null,
    width,
    color: options.color,
    tooltipContent: options.tooltip,
    textColor,
  });

  return () => {
    svg.interrupt();
    d3.select(container).selectAll("*").remove();
  };
}

type ChartSvg = d3.Selection<SVGSVGElement, unknown, null, undefined>;
type CoverageBars = d3.Selection<
  SVGRectElement,
  ChartPoint,
  SVGGElement,
  unknown
>;

function drawCountStrip(
  svg: ChartSvg,
  data: ChartPoint[],
  x: d3.ScaleLinear<number, number>,
  width: number,
  height: number,
  margin: Margin,
  plotBottom: number,
  textColor: string,
  subtle: string,
): { bars: CoverageBars; stripBottom: number } {
  const stripTop = plotBottom + 50;
  const stripBottom = height - 20;
  const maxCount = d3.max(data, (d) => d.count ?? 0) ?? 0;
  const countScale = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([stripBottom, stripTop]);
  const barWidth = Math.max(
    1,
    (width - margin.left - margin.right) / data.length - 0.5,
  );

  svg
    .append("text")
    .attr("class", "count-label")
    .attr("x", margin.left)
    .attr("y", stripTop - 12)
    .attr("fill", subtle)
    .attr("font-size", 12)
    .text("COUNTRIES CONTRIBUTING");

  const bars = svg
    .append("g")
    .selectAll<SVGRectElement, ChartPoint>("rect")
    .data(data)
    .join("rect")
    .attr("class", "coverage-bar")
    .attr("x", (d) => x(d.year) - barWidth / 2)
    .attr("y", (d) => countScale(d.count ?? 0))
    .attr("width", barWidth)
    .attr("height", (d) => stripBottom - countScale(d.count ?? 0))
    .attr("fill", COLORS.historical)
    .attr("fill-opacity", (d) => (d.count ? 0.8 : 0))
    .attr("stroke", COLORS.navy)
    .attr("stroke-opacity", (d) => (d.count ? 0.65 : 0))
    .attr("stroke-width", 0.5);

  svg
    .append("text")
    .attr("class", "count-label")
    .attr("x", width - margin.right + 7)
    .attr("y", countScale(maxCount) + 4)
    .attr("fill", textColor)
    .attr("font-size", 12)
    .text(maxCount);

  return { bars, stripBottom };
}

interface InteractionParams {
  container: HTMLElement;
  svg: ChartSvg;
  data: ChartPoint[];
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  margin: Margin;
  interactionBottom: number;
  coverageBars: CoverageBars | null;
  width: number;
  color: string;
  tooltipContent: (d: ChartPoint) => string[];
  textColor: string;
}

function addChartInteraction({
  container,
  svg,
  data,
  x,
  y,
  margin,
  interactionBottom,
  coverageBars,
  width,
  color,
  tooltipContent,
  textColor,
}: InteractionParams): void {
  let activeIndex = data.length - 1;
  const bisect = d3.bisector<ChartPoint, number>((d) => d.year).center;
  const tooltip = d3
    .select(container)
    .append("div")
    .attr("class", "chart-tooltip")
    .attr("role", "status")
    .attr("aria-live", "polite")
    .style("display", "none");
  const focus = svg
    .append("g")
    .style("display", "none")
    .attr("aria-hidden", "true");

  focus
    .append("line")
    .attr("y1", margin.top)
    .attr("y2", interactionBottom)
    .attr("stroke", textColor)
    .attr("stroke-opacity", 0.48)
    .attr("stroke-dasharray", "3 4");
  focus
    .append("circle")
    .attr("r", 5)
    .attr("fill", color)
    .attr("stroke", textColor)
    .attr("stroke-width", 1.5);

  function show(index: number): void {
    activeIndex = Math.max(0, Math.min(data.length - 1, index));
    const datum = data[activeIndex];
    const xPosition = x(datum.year);
    const yPosition = Number.isFinite(datum.value)
      ? y(datum.value as number)
      : margin.top + 8;
    const lines = tooltipContent(datum);

    focus.style("display", null);
    focus.select("line").attr("x1", xPosition).attr("x2", xPosition);
    const circle = focus
      .select("circle")
      .attr("cx", xPosition)
      .attr("cy", yPosition);
    if (Number.isFinite(datum.value)) circle.style("display", null);
    else circle.style("display", "none");

    coverageBars?.classed(
      "is-active",
      (_, barIndex) => barIndex === activeIndex,
    );

    tooltip
      .style("display", "block")
      .style("left", `${Math.max(80, Math.min(width - 80, xPosition))}px`)
      .style("top", `${Math.max(62, yPosition)}px`)
      .html(
        lines
          .map((line, lineIndex) =>
            lineIndex === 0 ? `<strong>${line}</strong>` : `<span>${line}</span>`,
          )
          .join("<br>"),
      );

    overlay.attr(
      "aria-label",
      `${lines.join(". ")}. Use left and right arrow keys to inspect years.`,
    );
  }

  function hide(): void {
    focus.style("display", "none");
    tooltip.style("display", "none");
    coverageBars?.classed("is-active", false);
  }

  const overlay = svg
    .append("rect")
    .attr("class", "chart-focus")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - (width - x.range()[1]))
    .attr("height", interactionBottom - margin.top)
    .attr("fill", "transparent")
    .attr("tabindex", 0)
    .attr("role", "group")
    .attr(
      "aria-label",
      "Interactive chart. Use left and right arrow keys to inspect years.",
    )
    .on("pointerenter pointermove pointerdown", (event: PointerEvent) => {
      const [pointerX] = d3.pointer(event, svg.node());
      show(bisect(data, x.invert(pointerX)));
    })
    .on("pointerleave", hide)
    .on("focus", () => show(activeIndex))
    .on("blur", hide)
    .on("keydown", (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        show(activeIndex + 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        show(0);
      } else if (event.key === "End") {
        event.preventDefault();
        show(data.length - 1);
      } else if (event.key === "Escape") {
        hide();
        (event.currentTarget as SVGRectElement).blur();
      }
    });
}
