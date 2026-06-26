import * as d3 from "d3";
import { COLORS, LINE_CHART, prefersReducedMotion } from "../constants";
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
  const width = Math.max(
    LINE_CHART.minWidth,
    container.clientWidth || LINE_CHART.minWidth,
  );
  const mobile = width < LINE_CHART.mobileBreakpoint;
  const height = options.countStrip
    ? mobile
      ? LINE_CHART.height.countStrip.mobile
      : LINE_CHART.height.countStrip.desktop
    : options.prominent
      ? mobile
        ? LINE_CHART.height.prominent.mobile
        : LINE_CHART.height.prominent.desktop
      : mobile
        ? LINE_CHART.height.default.mobile
        : LINE_CHART.height.default.desktop;
  const margin: Margin = {
    top: LINE_CHART.margin.top,
    right: mobile
      ? LINE_CHART.margin.right.mobile
      : options.countStrip
        ? LINE_CHART.margin.right.countStrip
        : LINE_CHART.margin.right.default,
    bottom: options.countStrip
      ? LINE_CHART.margin.bottom.countStrip
      : LINE_CHART.margin.bottom.default,
    left: mobile
      ? LINE_CHART.margin.left.mobile
      : LINE_CHART.margin.left.desktop,
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
  const yPadding = Math.max(
    LINE_CHART.yPadding.min,
    (yExtent[1] - yExtent[0]) * LINE_CHART.yPadding.ratio,
  );
  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year) as [number, number])
    .range([margin.left, width - margin.right]);
  const y = d3
    .scaleLinear()
    .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
    .range([plotBottom, margin.top]);

  const dark = options.theme === "dark";
  const textColor = dark ? COLORS.white : COLORS.navy;
  const subtle = dark
    ? LINE_CHART.theme.subtle.dark
    : LINE_CHART.theme.subtle.light;
  const gridColor = dark
    ? LINE_CHART.theme.grid.dark
    : LINE_CHART.theme.grid.light;
  const zeroColor = dark
    ? LINE_CHART.theme.zero.dark
    : LINE_CHART.theme.zero.light;

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

  const yTicks = y.ticks(
    mobile ? LINE_CHART.ticks.mobile : LINE_CHART.ticks.desktop,
  );
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
    .attr("stroke-width", LINE_CHART.axis.zeroStrokeWidth);

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", margin.left)
    .attr("y", LINE_CHART.axis.labelY)
    .attr("fill", subtle)
    .attr("font-size", LINE_CHART.axis.labelFontSize)
    .text("ANOMALY (MM)");

  const xAxis = d3
    .axisBottom(x)
    .ticks(mobile ? LINE_CHART.ticks.mobile : LINE_CHART.ticks.xDesktop)
    .tickFormat(d3.format("d"))
    .tickSize(0)
    .tickPadding(LINE_CHART.axis.xTickPadding);
  const yAxis = d3
    .axisLeft(y)
    .tickValues(yTicks)
    .tickFormat((d) => formatSignedValue(d.valueOf()))
    .tickSize(0)
    .tickPadding(LINE_CHART.axis.yTickPadding);

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

    const labelDatum =
      data[Math.floor(data.length * LINE_CHART.rangeLabel.positionRatio)];
    svg
      .append("text")
      .attr("class", "range-label")
      .attr("x", x(labelDatum.year))
      .attr(
        "y",
        Math.max(
          margin.top + LINE_CHART.rangeLabel.minOffset,
          y(labelDatum.high!) - LINE_CHART.rangeLabel.yOffset,
        ),
      )
      .attr("fill", options.color)
      .attr("font-size", LINE_CHART.rangeLabel.fontSize)
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
      .attr("stroke-opacity", LINE_CHART.line.shadowOpacity)
      .attr("stroke-width", LINE_CHART.line.shadowWidth)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);
  }

  const linePath = svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", options.color)
    .attr(
      "stroke-width",
      options.prominent
        ? LINE_CHART.line.strokeWidth.prominent
        : LINE_CHART.line.strokeWidth.default,
    )
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line);

  if (!prefersReducedMotion.matches) {
    linePath
      .attr("opacity", 0)
      .transition()
      .duration(LINE_CHART.line.fadeDurationMs)
      .attr("opacity", 1);
  }

  const lastValid = valid.at(-1);
  if (lastValid) {
    const labelX = mobile
      ? x(lastValid.year) + LINE_CHART.directLabel.mobileXOffset
      : x(lastValid.year) + LINE_CHART.directLabel.desktopXOffset;
    const labelAnchor = mobile ? "end" : "start";
    svg
      .append("text")
      .attr("class", "direct-label")
      .attr("x", labelX)
      .attr(
        "y",
        Math.max(
          margin.top + LINE_CHART.directLabel.minOffset,
          y(lastValid.value as number) - LINE_CHART.directLabel.yOffset,
        ),
      )
      .attr("text-anchor", labelAnchor)
      .attr("fill", dark ? options.color : textColor)
      .attr("font-size", LINE_CHART.directLabel.fontSize)
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
        options.color,
        mobile,
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
  color: string,
  mobile: boolean,
): { bars: CoverageBars; stripBottom: number } {
  const stripTop = plotBottom + LINE_CHART.countStrip.topOffset;
  const stripBottom = height - LINE_CHART.countStrip.bottomOffset;
  const maxCount = d3.max(data, (d) => d.count ?? 0) ?? 0;
  const countScale = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([stripBottom, stripTop]);
  const barWidth = Math.max(
    LINE_CHART.countStrip.minBarWidth,
    (width - margin.left - margin.right) / data.length -
      LINE_CHART.countStrip.barGap,
  );

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
    .attr("fill-opacity", (d) =>
      d.count ? LINE_CHART.countStrip.barFillOpacity : 0,
    )
    .attr("stroke", COLORS.navy)
    .attr("stroke-opacity", (d) =>
      d.count ? LINE_CHART.countStrip.barStrokeOpacity : 0,
    )
    .attr("stroke-width", LINE_CHART.countStrip.barStrokeWidth);

  const lastCountDatum = data
    .slice()
    .reverse()
    .find((d) => (d.count ?? 0) > 0);
  if (lastCountDatum) {
    const count = lastCountDatum.count ?? 0;
    svg
      .append("text")
      .attr("class", "count-label")
      .attr(
        "x",
        mobile
          ? x(lastCountDatum.year) + LINE_CHART.directLabel.mobileXOffset
          : x(lastCountDatum.year) + LINE_CHART.directLabel.desktopXOffset,
      )
      .attr(
        "y",
        mobile
          ? stripTop - LINE_CHART.countStrip.labelYOffset.mobile
          : Math.max(
              stripTop + LINE_CHART.countStrip.labelMinOffset,
              countScale(count) - LINE_CHART.countStrip.labelYOffset.desktop,
            ),
      )
      .attr("text-anchor", mobile ? "end" : "start")
      .attr("fill", color)
      .attr("font-size", LINE_CHART.countStrip.labelFontSize)
      .attr("font-weight", 700)
      .text("COUNTRIES CONTRIBUTING TO MEAN");
  }

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
    .attr("stroke-opacity", LINE_CHART.interaction.focusStrokeOpacity)
    .attr("stroke-dasharray", LINE_CHART.interaction.focusStrokeDasharray);
  focus
    .append("circle")
    .attr("r", LINE_CHART.interaction.focusCircleRadius)
    .attr("fill", color)
    .attr("stroke", textColor)
    .attr("stroke-width", LINE_CHART.interaction.focusStrokeWidth);

  function show(index: number): void {
    activeIndex = Math.max(0, Math.min(data.length - 1, index));
    const datum = data[activeIndex];
    const xPosition = x(datum.year);
    const yPosition = Number.isFinite(datum.value)
      ? y(datum.value as number)
      : margin.top + LINE_CHART.interaction.fallbackYFromTop;
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
      .style(
        "left",
        `${Math.max(
          LINE_CHART.interaction.tooltipXPadding,
          Math.min(width - LINE_CHART.interaction.tooltipXPadding, xPosition),
        )}px`,
      )
      .style(
        "top",
        `${Math.max(LINE_CHART.interaction.tooltipMinTop, yPosition)}px`,
      )
      .html(
        lines
          .map((line, lineIndex) =>
            lineIndex === 0
              ? `<strong>${line}</strong>`
              : `<span>${line}</span>`,
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
