/* global d3 */

const COLORS = {
  navy: "#1a2b4b",
  satellite: "#65d2d9",
  historical: "rgb(196, 150, 105)",
  white: "#ffffff",
};

const DATA_PATHS = {
  satellite: "data/sea_level.csv",
  historical: "data/sea_level_historical.csv",
  summary: "data/country_summary.csv",
};

const state = {
  selectedView: "global",
  countries: [],
  satelliteByCountry: new Map(),
  historicalByCountry: new Map(),
  summaryByCountry: new Map(),
  regionalSatellite: [],
  regionalHistorical: [],
  resizeObserver: null,
  chartWidths: new WeakMap(),
};

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

const formatSigned = d3.format("+,.0f");
const formatPercent = d3.format("+.1f");

function parseSatellite(row) {
  return {
    code: row.country_code,
    country: row.country,
    year: +row.year,
    value: +row.sea_level_mm,
  };
}

function parseHistorical(row) {
  return {
    code: row.country_code,
    country: row.country,
    year: +row.year,
    value: +row.sea_level_anomaly_mm,
    stationCount: +row.station_count,
  };
}

function parseSummary(row) {
  return {
    code: row.country_code,
    country: row.country,
    earlyMean: +row.sea_level_1993_1997_mm,
    recentMean: +row.sea_level_2019_2023_mm,
    rise: +row.sea_level_rise_mm,
    affected: +row.affected_people_2005_2023,
    losses: +row.loss_usd_2007_2020,
    populationGrowth: +row.population_growth_2020_2025_pct,
  };
}

async function init() {
  if (typeof d3 === "undefined") {
    showLoadError("The chart library could not be loaded. Check the network connection and reload.");
    return;
  }

  try {
    const [satellite, historical, summaries] = await Promise.all([
      d3.csv(DATA_PATHS.satellite, parseSatellite),
      d3.csv(DATA_PATHS.historical, parseHistorical),
      d3.csv(DATA_PATHS.summary, parseSummary),
    ]);

    prepareData(satellite, historical, summaries);
    buildNavigation();
    bindEvents();
    setInitialView();
  } catch (error) {
    console.error(error);
    showLoadError(
      "The data files could not be loaded. Serve this directory over HTTP instead of opening the file directly.",
    );
  }
}

function prepareData(satellite, historical, summaries) {
  state.satelliteByCountry = d3.group(satellite, (d) => d.code);
  state.historicalByCountry = d3.group(historical, (d) => d.code);
  state.summaryByCountry = new Map(summaries.map((d) => [d.code, d]));
  state.countries = summaries
    .map(({ code, country }) => ({ code, country }))
    .sort((a, b) => d3.ascending(a.country, b.country));

  const satelliteYears = d3.sort(new Set(satellite.map((d) => d.year)));
  state.regionalSatellite = satelliteYears.map((year) => {
    const values = satellite.filter((d) => d.year === year).map((d) => d.value);
    return {
      year,
      value: d3.mean(values),
      low: d3.min(values),
      high: d3.max(values),
      count: values.length,
    };
  });

  const historicalYears = d3.range(
    d3.min(historical, (d) => d.year),
    d3.max(historical, (d) => d.year) + 1,
  );
  const historicalByYear = d3.group(historical, (d) => d.year);
  state.regionalHistorical = historicalYears.map((year) => {
    const records = historicalByYear.get(year) || [];
    return {
      year,
      value: records.length ? d3.mean(records, (d) => d.value) : null,
      count: new Set(records.map((d) => d.code)).size,
      stationCount: d3.sum(records, (d) => d.stationCount),
    };
  });
}

function buildNavigation() {
  const views = [{ code: "global", country: "Global" }, ...state.countries];
  const tabs = d3
    .select("#country-tabs")
    .selectAll("button")
    .data(views)
    .join("button")
    .attr("class", "country-tab")
    .attr("type", "button")
    .attr("role", "tab")
    .attr("id", (d) => `tab-${d.code}`)
    .attr("aria-controls", "view-panel")
    .attr("aria-selected", "false")
    .attr("tabindex", "-1")
    .text((d) => d.country)
    .on("click", (_, d) => selectView(d.code))
    .on("keydown", handleTabKeydown);

  tabs.filter((d) => d.code === "global").attr("tabindex", "0");

  d3.select("#country-select")
    .selectAll("option")
    .data(views)
    .join("option")
    .attr("value", (d) => d.code)
    .text((d) => d.country);
}

function bindEvents() {
  d3.select("#country-select").on("change", function onSelectChange() {
    selectView(this.value);
  });

  d3.select("[data-view-link]").on("click", (event) => {
    event.preventDefault();
    selectView("global");
  });

  window.addEventListener("popstate", () => {
    const view = getViewFromUrl();
    state.selectedView = isValidView(view) ? view : "global";
    render();
  });
}

function handleTabKeydown(event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

  event.preventDefault();
  const tabs = [...document.querySelectorAll(".country-tab")];
  const currentIndex = tabs.indexOf(event.currentTarget);
  let nextIndex = currentIndex;

  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = tabs.length - 1;

  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}

function setInitialView() {
  const requestedView = getViewFromUrl();
  state.selectedView = isValidView(requestedView) ? requestedView : "global";

  if (requestedView !== state.selectedView) {
    updateUrl(state.selectedView, true);
  }

  render();
}

function getViewFromUrl() {
  const value = new URL(window.location.href).searchParams.get("view");
  if (!value) return "global";
  return value.toLowerCase() === "global" ? "global" : value.toUpperCase();
}

function isValidView(view) {
  return view === "global" || state.summaryByCountry.has(view);
}

function selectView(view) {
  if (!isValidView(view) || state.selectedView === view) return;

  state.selectedView = view;
  updateUrl(view);

  const panel = document.querySelector("#view-panel");
  if (!prefersReducedMotion.matches) {
    panel.classList.add("is-changing");
    window.setTimeout(() => {
      render();
      panel.classList.remove("is-changing");
    }, 90);
  } else {
    render();
  }
}

function updateUrl(view, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.set("view", view);
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({ view }, "", url);
}

function render() {
  const isGlobal = state.selectedView === "global";
  const summary = isGlobal ? null : state.summaryByCountry.get(state.selectedView);
  const satellite = isGlobal
    ? state.regionalSatellite
    : state.satelliteByCountry.get(state.selectedView);
  const historical = isGlobal
    ? state.regionalHistorical
    : denseHistorical(state.historicalByCountry.get(state.selectedView));

  syncNavigation();
  renderHeading(summary);
  renderMetrics(summary, satellite, historical);
  renderSatellite(summary, satellite);
  renderHistorical(summary, historical);
  renderContext(summary);
}

function syncNavigation() {
  d3.selectAll(".country-tab")
    .attr("aria-selected", (d) => String(d.code === state.selectedView))
    .attr("tabindex", (d) => (d.code === state.selectedView ? "0" : "-1"));

  d3.select("#country-select").property("value", state.selectedView);
  d3.select("#view-panel").attr(
    "aria-labelledby",
    `tab-${state.selectedView}`,
  );

  const activeTab = document.querySelector(
    `#tab-${CSS.escape(state.selectedView)}`,
  );
  activeTab?.scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "nearest",
    inline: "center",
  });
}

function renderHeading(summary) {
  const isGlobal = !summary;

  d3.select("#view-kicker").text(
    isGlobal ? "Regional overview · 21 places" : `Country view · ${summary.code}`,
  );
  d3.select("#view-title").text(
    isGlobal ? "A shared direction, with local variation" : summary.country,
  );
  d3.select("#view-summary").text(
    isGlobal
      ? "The regional mean rises over the satellite era, but the range shows that annual conditions differ substantially from place to place."
      : `${summary.country} is compared with the same 1993–2023 satellite window used for every place in this story.`,
  );
}

function renderMetrics(summary, satellite, historical) {
  const validHistorical = historical?.filter((d) => d.value != null) || [];
  const latest = satellite.at(-1);
  const metrics = summary
    ? [
        {
          label: "1993–2023 change",
          value: `${formatSignedValue(summary.rise)} mm`,
          detail: "2019–2023 mean minus 1993–1997 mean",
        },
        {
          label: "Regional rank",
          value: rankLabel(summary),
          detail: `among ${state.countries.length} places by period change`,
        },
        {
          label: "Latest anomaly",
          value: `${formatSignedValue(latest.value)} mm`,
          detail: `${latest.year} satellite-era value`,
        },
        {
          label: "Tide-gauge record",
          value: validHistorical.length ? String(validHistorical[0].year) : "None",
          detail: validHistorical.length
            ? `first available year; gaps may follow`
            : "no qualifying series in this dataset",
        },
      ]
    : [
        {
          label: "Average 1993–2023 change",
          value: `${formatSignedValue(d3.mean(state.summaryByCountry.values(), (d) => d.rise))} mm`,
          detail: "mean of 21 country-level period changes",
        },
        {
          label: "Places compared",
          value: String(state.countries.length),
          detail: "complete satellite series from 1993–2023",
        },
        {
          label: "Latest regional anomaly",
          value: `${formatSignedValue(latest.value)} mm`,
          detail: `${latest.year} equal-country mean`,
        },
        {
          label: "Historical coverage",
          value: String(state.historicalByCountry.size),
          detail: "countries with qualifying tide-gauge data",
        },
      ];

  d3.select("#metrics")
    .selectAll(".metric")
    .data(metrics)
    .join("div")
    .attr("class", "metric")
    .html(
      (d) => `
        <span class="metric-label">${d.label}</span>
        <span class="metric-value">${d.value}</span>
        <span class="metric-detail">${d.detail}</span>
      `,
    );
}

function rankLabel(summary) {
  const betterCount = [...state.summaryByCountry.values()].filter(
    (d) => d.rise > summary.rise,
  ).length;
  const tied = [...state.summaryByCountry.values()].filter(
    (d) => d.rise === summary.rise,
  ).length;
  const rank = betterCount + 1;
  return tied > 1 ? `Joint #${rank}` : `#${rank}`;
}

function renderSatellite(summary, data) {
  const isGlobal = !summary;

  d3.select("#satellite-title").text(
    isGlobal
      ? "Regional mean and inter-country range"
      : `${summary.country} annual anomaly`,
  );
  d3.select("#satellite-note").text(
    isGlobal
      ? "The line is the equal-country mean. The shaded band spans the lowest to highest country value each year."
      : "Same years and millimeter unit as every country view; values are not smoothed.",
  );
  d3.select("#satellite-caption").text(
    isGlobal
      ? "The comparable record starts in 1993 because that is the first year available for all 21 places. It is not joined to the tide-gauge aggregate below."
      : "The headline change compares five-year averages at the beginning and end of the series, while the chart retains every annual observation.",
  );

  renderLineChart("#satellite-chart", data, {
    theme: "dark",
    color: COLORS.satellite,
    title: isGlobal
      ? "Pacific regional satellite-era sea-level anomaly, 1993 to 2023"
      : `${summary.country} satellite-era sea-level anomaly, 1993 to 2023`,
    description: isGlobal
      ? "A line shows the annual equal-country mean and a band shows the range across 21 countries."
      : `A line shows annual sea-level anomaly for ${summary.country}.`,
    range: isGlobal,
    directLabel: isGlobal ? "Regional mean" : summary.country,
    tooltip: (d) =>
      isGlobal
        ? [
            `${d.year}`,
            `Regional mean: ${formatSignedValue(d.value)} mm`,
            `Country range: ${formatSignedValue(d.low)} to ${formatSignedValue(d.high)} mm`,
          ]
        : [`${d.year}`, `Anomaly: ${formatSignedValue(d.value)} mm`],
  });
}

function renderHistorical(summary, data) {
  const isGlobal = !summary;
  const validData = data?.filter((d) => d.value != null) || [];
  const hasHistorical = isGlobal || validData.length > 0;

  d3.select("#historical-card").property("hidden", !hasHistorical);
  d3.select("#historical-empty").property("hidden", hasHistorical);

  if (!hasHistorical) {
    d3.select("#historical-empty-title").text(
      `${summary.country} has no qualifying tide-gauge series in these data.`,
    );
    d3.select("#historical-intro").text(
      "Historical coverage is selective. Some country views therefore retain only the complete satellite-era panel.",
    );
    d3.select("#historical-chart").selectAll("*").remove();
    return;
  }

  const firstYear = validData[0].year;
  const lastYear = validData.at(-1).year;

  d3.select("#historical-intro").text(
    isGlobal
      ? "The regional historical mean reaches back further than the satellite record, but the countries contributing to it change from year to year."
      : `${summary.country} has a tide-gauge record from ${firstYear} to ${lastYear}, with missing years left as visible gaps.`,
  );
  d3.select("#historical-title").text(
    isGlobal
      ? "Regional tide-gauge mean and changing coverage"
      : `${summary.country} tide-gauge anomaly`,
  );
  d3.select("#historical-note").text(
    isGlobal
      ? "The strip below the line reports how many country series contribute in each year."
      : "Relative to the contributing station records’ 1993–2000 mean; no interpolation across missing years.",
  );
  d3.select("#historical-caption").text(
    isGlobal
      ? "A mean based on one country in 1947 is not directly equivalent to a mean based on 12 countries later. The contributor strip makes that changing composition visible."
      : "This tide-gauge line is separate from the satellite-era line above. Their baselines and spatial coverage differ, so they should not be spliced into one continuous series.",
  );

  renderLineChart("#historical-chart", data, {
    theme: "light",
    color: COLORS.historical,
    title: isGlobal
      ? "Pacific regional historical tide-gauge anomaly with country contributor counts"
      : `${summary.country} historical tide-gauge anomaly`,
    description: isGlobal
      ? "A line shows the annual equal-country tide-gauge mean. A strip shows contributor counts, which vary through time."
      : `A line shows available annual tide-gauge anomalies for ${summary.country}; missing years create gaps.`,
    countStrip: isGlobal,
    directLabel: isGlobal ? "Historical mean" : summary.country,
    tooltip: (d) => {
      if (isGlobal) {
        return [
          `${d.year}`,
          d.value == null
            ? "Regional mean: no observation"
            : `Regional mean: ${formatSignedValue(d.value)} mm`,
          `Countries contributing: ${d.count}`,
        ];
      }
      return [
        `${d.year}`,
        d.value == null
          ? "No tide-gauge observation"
          : `Anomaly: ${formatSignedValue(d.value)} mm`,
        d.value == null ? "" : `Stations contributing: ${d.stationCount}`,
      ].filter(Boolean);
    },
  });
}

function renderContext(summary) {
  const allSummaries = [...state.summaryByCountry.values()];
  const values = summary
    ? [
        {
          label: "People directly affected",
          value: reportedNumber(summary.affected),
          period: "cumulative reported total, 2005–2023",
        },
        {
          label: "Reported disaster losses",
          value: reportedCurrency(summary.losses),
          period: "cumulative reported total, 2007–2020",
        },
        {
          label: "Average population growth",
          value: `${formatPercent(summary.populationGrowth)}%`,
          period: "annual average, 2020–2025",
        },
      ]
    : [
        {
          label: "People directly affected",
          value: formatCompact(d3.sum(allSummaries, (d) => d.affected)),
          period: "sum of reported country totals, 2005–2023",
        },
        {
          label: "Reported disaster losses",
          value: formatCurrency(d3.sum(allSummaries, (d) => d.losses)),
          period: "sum of reported country totals, 2007–2020",
        },
        {
          label: "Places with affected-person data",
          value: `${allSummaries.filter((d) => d.affected > 0).length} / ${allSummaries.length}`,
          period: "positive reported values in the source",
        },
      ];

  d3.select("#context-intro").text(
    summary
      ? `Available contextual indicators for ${summary.country}. These totals cover all reported disasters, not only coastal events.`
      : "Regional sums provide scale, but reporting coverage varies and the values include all recorded disasters, not only coastal events.",
  );

  d3.select("#context-metrics")
    .selectAll(".context-metric")
    .data(values)
    .join("div")
    .attr("class", "context-metric")
    .html(
      (d) => `
        <span class="context-label">${d.label}</span>
        <span class="context-value">${d.value}</span>
        <span class="context-period">${d.period}</span>
      `,
    );
}

function renderLineChart(selector, data, options) {
  const container = document.querySelector(selector);
  if (!container) return;

  if (state.resizeObserver) {
    state.resizeObserver.unobserve(container);
  }

  const draw = () => {
    const width = Math.max(300, container.clientWidth || 300);
    state.chartWidths.set(container, width);
    const mobile = width < 560;
    const height = options.countStrip ? (mobile ? 400 : 500) : mobile ? 340 : 440;
    const margin = {
      top: 28,
      right: mobile ? 18 : 116,
      bottom: options.countStrip ? 84 : 48,
      left: mobile ? 52 : 66,
    };
    const plotBottom = height - margin.bottom;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = plotBottom - margin.top;
    const valid = data.filter((d) => Number.isFinite(d.value));
    const yValues = valid.map((d) => d.value);

    if (options.range) {
      yValues.push(...data.flatMap((d) => [d.low, d.high]));
    }
    yValues.push(0);

    const yExtent = d3.extent(yValues);
    const yPadding = Math.max(20, (yExtent[1] - yExtent[0]) * 0.12);
    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.year))
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

    const svg = d3
      .select(container)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-labelledby", `${selector.slice(1)}-svg-title ${selector.slice(1)}-svg-desc`);

    svg
      .append("title")
      .attr("id", `${selector.slice(1)}-svg-title`)
      .text(options.title);
    svg
      .append("desc")
      .attr("id", `${selector.slice(1)}-svg-desc`)
      .text(`${options.description} Horizontal axis: year. Vertical axis: millimeters.`);

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
          .tickFormat(""),
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
      .attr("y", 13)
      .attr("fill", subtle)
      .attr("font-size", 11)
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
      .tickFormat((d) => formatSignedValue(d))
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
        .area()
        .defined((d) => Number.isFinite(d.low) && Number.isFinite(d.high))
        .x((d) => x(d.year))
        .y0((d) => y(d.low))
        .y1((d) => y(d.high));

      svg
        .append("path")
        .datum(data)
        .attr("d", area)
        .attr("fill", options.color)
        .attr("fill-opacity", 0.13);

      svg
        .append("text")
        .attr("class", "range-label")
        .attr("x", x(data[Math.floor(data.length * 0.18)].year))
        .attr("y", y(data[Math.floor(data.length * 0.18)].high) - 8)
        .attr("fill", options.color)
        .attr("font-size", mobile ? 10 : 11)
        .text("COUNTRY RANGE");
    }

    const line = d3
      .line()
      .defined((d) => Number.isFinite(d.value))
      .x((d) => x(d.year))
      .y((d) => y(d.value));

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
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);

    if (!prefersReducedMotion.matches) {
      linePath
        .attr("opacity", 0)
        .transition()
        .duration(220)
        .attr("opacity", 1);
    }

    const lastValid = valid.at(-1);
    if (lastValid) {
      const labelX = mobile ? x(lastValid.year) - 4 : x(lastValid.year) + 10;
      const labelAnchor = mobile ? "end" : "start";
      svg
        .append("text")
        .attr("class", "direct-label")
        .attr("x", labelX)
        .attr("y", y(lastValid.value) - 10)
        .attr("text-anchor", labelAnchor)
        .attr("fill", dark ? options.color : textColor)
        .attr("font-size", mobile ? 10 : 11)
        .attr("font-weight", 700)
        .text(options.directLabel.toUpperCase());
    }

    if (options.countStrip) {
      drawCountStrip(svg, data, x, width, height, margin, plotBottom, textColor, subtle);
    }

    addChartInteraction({
      container,
      svg,
      data,
      x,
      y,
      margin,
      plotBottom,
      width,
      color: options.color,
      tooltipContent: options.tooltip,
      textColor,
    });
  };

  draw();

  if ("ResizeObserver" in window) {
    if (!state.resizeObserver) {
    state.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
          const observedWidth = Math.round(entry.contentRect.width);
          const previousWidth = Math.round(
            state.chartWidths.get(entry.target) || 0,
          );
          if (observedWidth === previousWidth) continue;

          const chartSelector = `#${entry.target.id}`;
          const selectedSummary =
            state.selectedView === "global"
              ? null
              : state.summaryByCountry.get(state.selectedView);
          if (chartSelector === "#satellite-chart") {
            renderSatellite(
              selectedSummary,
              selectedSummary
                ? state.satelliteByCountry.get(state.selectedView)
                : state.regionalSatellite,
            );
          } else if (chartSelector === "#historical-chart") {
            const historical = selectedSummary
              ? denseHistorical(state.historicalByCountry.get(state.selectedView))
              : state.regionalHistorical;
            renderHistorical(selectedSummary, historical);
          }
        }
      });
    }
    state.resizeObserver.observe(container);
  }
}

function drawCountStrip(
  svg,
  data,
  x,
  width,
  height,
  margin,
  plotBottom,
  textColor,
  subtle,
) {
  const stripTop = plotBottom + 41;
  const stripBottom = height - 15;
  const countScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.count)])
    .range([stripBottom, stripTop]);
  const barWidth = Math.max(1, (width - margin.left - margin.right) / data.length - 0.5);

  svg
    .append("text")
    .attr("class", "count-label")
    .attr("x", margin.left)
    .attr("y", stripTop - 9)
    .attr("fill", subtle)
    .attr("font-size", 10)
    .text("COUNTRIES CONTRIBUTING");

  svg
    .append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => x(d.year) - barWidth / 2)
    .attr("y", (d) => countScale(d.count))
    .attr("width", barWidth)
    .attr("height", (d) => stripBottom - countScale(d.count))
    .attr("fill", COLORS.historical)
    .attr("fill-opacity", (d) => (d.count ? 0.8 : 0))
    .attr("stroke", COLORS.navy)
    .attr("stroke-opacity", (d) => (d.count ? 0.65 : 0))
    .attr("stroke-width", 0.5);

  svg
    .append("text")
    .attr("class", "count-label")
    .attr("x", width - margin.right + 7)
    .attr("y", countScale(d3.max(data, (d) => d.count)) + 4)
    .attr("fill", textColor)
    .attr("font-size", 10)
    .text(d3.max(data, (d) => d.count));
}

function addChartInteraction({
  container,
  svg,
  data,
  x,
  y,
  margin,
  plotBottom,
  width,
  color,
  tooltipContent,
  textColor,
}) {
  let activeIndex = data.length - 1;
  const bisect = d3.bisector((d) => d.year).center;
  const tooltip = d3
    .select(container)
    .append("div")
    .attr("class", "chart-tooltip")
    .attr("role", "status")
    .attr("aria-live", "polite")
    .style("display", "none");
  const focus = svg.append("g").style("display", "none").attr("aria-hidden", "true");

  focus
    .append("line")
    .attr("y1", margin.top)
    .attr("y2", plotBottom)
    .attr("stroke", textColor)
    .attr("stroke-opacity", 0.48)
    .attr("stroke-dasharray", "3 4");
  focus
    .append("circle")
    .attr("r", 5)
    .attr("fill", color)
    .attr("stroke", textColor)
    .attr("stroke-width", 1.5);

  function show(index) {
    activeIndex = Math.max(0, Math.min(data.length - 1, index));
    const datum = data[activeIndex];
    const xPosition = x(datum.year);
    const yPosition = Number.isFinite(datum.value) ? y(datum.value) : margin.top + 8;
    const lines = tooltipContent(datum);

    focus.style("display", null);
    focus.select("line").attr("x1", xPosition).attr("x2", xPosition);
    focus
      .select("circle")
      .attr("cx", xPosition)
      .attr("cy", yPosition)
      .style("display", Number.isFinite(datum.value) ? null : "none");

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

  function hide() {
    focus.style("display", "none");
    tooltip.style("display", "none");
  }

  const overlay = svg
    .append("rect")
    .attr("class", "chart-focus")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - (width - x.range()[1]))
    .attr("height", plotBottom - margin.top)
    .attr("fill", "transparent")
    .attr("tabindex", 0)
    .attr("role", "group")
    .attr("aria-label", "Interactive chart. Use left and right arrow keys to inspect years.")
    .on("pointerenter pointermove pointerdown", (event) => {
      const [pointerX] = d3.pointer(event, svg.node());
      show(bisect(data, x.invert(pointerX)));
    })
    .on("pointerleave", hide)
    .on("focus", () => show(activeIndex))
    .on("blur", hide)
    .on("keydown", (event) => {
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
        event.currentTarget.blur();
      }
    });
}

function denseHistorical(records) {
  if (!records?.length) return [];

  const byYear = new Map(records.map((d) => [d.year, d]));
  return d3.range(d3.min(records, (d) => d.year), d3.max(records, (d) => d.year) + 1).map(
    (year) =>
      byYear.get(year) || {
        code: records[0].code,
        country: records[0].country,
        year,
        value: null,
        stationCount: 0,
      },
  );
}

function reportedNumber(value) {
  return value > 0 ? formatCompact(value) : "Not reported";
}

function formatSignedValue(value) {
  return value === 0 ? "0" : formatSigned(value);
}

function reportedCurrency(value) {
  return value > 0 ? formatCurrency(value) : "Not reported";
}

function formatCompact(value) {
  return d3
    .format(".3~s")(value)
    .replace("G", "bn")
    .replace("M", "m");
}

function formatCurrency(value) {
  return `$${formatCompact(value)}`;
}

function showLoadError(message) {
  const error = document.querySelector("#load-error");
  error.hidden = false;
  error.textContent = message;
  document.querySelector("#view-panel").hidden = true;
}

init();
