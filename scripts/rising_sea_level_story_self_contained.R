# Self-contained exploration script for:
# "Rising seas are becoming a human exposure story"
#
# Outputs:
# - outputs/rising_sea_level_story/country_exposure_metrics.csv
# - outputs/rising_sea_level_story/story.md
# - outputs/rising_sea_level_story/charts/*.png

library(tidyverse)

options(timeout = 240)

out_dir <- file.path("outputs", "rising_sea_level_story")
chart_dir <- file.path(out_dir, "charts")
dir.create(chart_dir, showWarnings = FALSE, recursive = TRUE)

api_base <- "https://stats-nsi-stable.pacificdata.org/rest/data"

country_lookup <- c(
  AS = "American Samoa",
  CK = "Cook Islands",
  FJ = "Fiji",
  FM = "Micronesia",
  GU = "Guam",
  KI = "Kiribati",
  MH = "Marshall Islands",
  MP = "Northern Mariana Islands",
  NC = "New Caledonia",
  NR = "Nauru",
  NU = "Niue",
  PF = "French Polynesia",
  PG = "Papua New Guinea",
  PN = "Pitcairn",
  PW = "Palau",
  SB = "Solomon Islands",
  TK = "Tokelau",
  TO = "Tonga",
  TV = "Tuvalu",
  VU = "Vanuatu",
  WF = "Wallis and Futuna",
  WS = "Samoa",
  WSM = "Samoa"
)

clean_number <- function(x) {
  suppressWarnings(as.numeric(gsub("[^0-9eE+\\.-]", "", as.character(x))))
}

geo_label <- function(code) {
  code <- as.character(code)
  out <- country_lookup[code]
  ifelse(is.na(out), code, unname(out))
}

fmt_num <- function(x, digits = 2) {
  if (length(x) == 0 || !is.finite(x)) {
    return("NA")
  }
  ax <- abs(x)
  if (ax >= 1000000) {
    return(format(round(x, 0), big.mark = ",", scientific = FALSE))
  }
  if (ax >= 1000) {
    return(format(round(x, 0), big.mark = ",", scientific = FALSE))
  }
  if (ax >= 100) {
    return(format(round(x, 1), big.mark = ",", scientific = FALSE))
  }
  format(round(x, digits), trim = TRUE, scientific = FALSE)
}

theme_story <- function() {
  theme_minimal(base_size = 12) +
    theme(
      plot.title = element_text(face = "bold"),
      plot.subtitle = element_text(color = "grey30"),
      panel.grid.minor = element_blank()
    )
}

download_stat_csv <- function(flow_id, version, key) {
  url <- paste0(
    api_base,
    "/SPC,",
    flow_id,
    ",",
    version,
    "/",
    utils::URLencode(key, reserved = TRUE),
    "/all?dimensionAtObservation=AllDimensions&detail=full&format=csvfile"
  )

  tmp <- tempfile(fileext = ".csv")
  on.exit(unlink(tmp), add = TRUE)
  utils::download.file(url, tmp, quiet = TRUE, mode = "wb")

  raw <- utils::read.csv(tmp, stringsAsFactors = FALSE, check.names = FALSE)
  raw$value <- clean_number(raw$OBS_VALUE)
  raw$year <- suppressWarnings(as.integer(substr(
    as.character(raw$TIME_PERIOD),
    1,
    4
  )))
  raw$country_code <- as.character(raw$GEO_PICT)
  raw$country <- geo_label(raw$country_code)
  raw <- raw[is.finite(raw$value) & is.finite(raw$year), ]

  dat <- stats::aggregate(
    value ~ country_code + country + year,
    raw,
    mean,
    na.rm = TRUE
  )
  dat <- dat[order(dat$country, dat$year), ]
  attr(dat, "api_url") <- url
  attr(dat, "unit") <- paste(
    unique(raw$UNIT_MEASURE[!is.na(raw$UNIT_MEASURE)]),
    collapse = "; "
  )
  dat
}

period_mean <- function(dat, years, value_col = "value", name = "period_mean") {
  x <- dat[dat$year %in% years & is.finite(dat[[value_col]]), ]
  out <- stats::aggregate(
    x[[value_col]],
    by = list(country_code = x$country_code, country = x$country),
    FUN = mean,
    na.rm = TRUE
  )
  names(out)[3] <- name
  out
}

period_sum <- function(dat, years, value_col = "value", name = "period_sum") {
  x <- dat[dat$year %in% years & is.finite(dat[[value_col]]), ]
  out <- stats::aggregate(
    x[[value_col]],
    by = list(country_code = x$country_code, country = x$country),
    FUN = sum,
    na.rm = TRUE
  )
  names(out)[3] <- name
  out
}

regional_series <- function(dat, value_col = "value") {
  out <- stats::aggregate(
    dat[[value_col]],
    by = list(year = dat$year),
    FUN = mean,
    na.rm = TRUE
  )
  names(out)[2] <- "value"
  out
}

prep_bar <- function(dat, value_col, decreasing = TRUE, n = 12) {
  dat <- dat[is.finite(dat[[value_col]]), ]
  dat <- dat[order(dat[[value_col]], decreasing = decreasing), ]
  dat <- utils::head(dat, n)
  dat$country <- factor(dat$country, levels = rev(dat$country))
  dat
}

save_chart <- function(plot, filename, width = 8, height = 4.8) {
  path <- file.path(chart_dir, filename)
  ggsave(path, plot, width = width, height = height, dpi = 160)
  file.path("charts", filename)
}

write_md_table <- function(headers, rows) {
  escape_md <- function(x) gsub("\\|", "/", as.character(x))
  lines <- c(
    paste0("| ", paste(escape_md(headers), collapse = " | "), " |"),
    paste0("|", paste(rep("---", length(headers)), collapse = "|"), "|")
  )
  for (i in seq_len(nrow(rows))) {
    lines <- c(
      lines,
      paste0("| ", paste(escape_md(rows[i, ]), collapse = " | "), " |")
    )
  }
  lines
}

message("Fetching official Pacific Data Hub datasets...")

sea_level <- download_stat_csv(
  flow_id = "DF_CLIMATE_CHANGE",
  version = "1.0",
  key = "A.SEA_LVL."
)
sea_level$value_mm <- sea_level$value * 1000

affected <- download_stat_csv(
  flow_id = "DF_SDG_11",
  version = "3.0",
  key = "A.VC_DSR_AFFCT........."
)

economic_loss <- download_stat_csv(
  flow_id = "DF_SDG_11",
  version = "3.0",
  key = "A.VC_DSR_AALT...._T....."
)

population_growth <- download_stat_csv(
  flow_id = "DF_NMDI_POP",
  version = "1.0",
  key = "A..NMDI0002._T._T._T.."
)

message("Combining country-level evidence...")

sea_early <- period_mean(sea_level, 1993:1997, "value_mm", "sea_1993_1997_mm")
sea_recent <- period_mean(sea_level, 2019:2023, "value_mm", "sea_2019_2023_mm")
sea_change <- merge(
  sea_early,
  sea_recent,
  by = c("country_code", "country"),
  all = FALSE
)
sea_change$sea_rise_mm <- sea_change$sea_2019_2023_mm -
  sea_change$sea_1993_1997_mm

affected_sum <- period_sum(affected, 2005:2023, "value", "affected_2005_2023")
loss_sum <- period_sum(economic_loss, 2007:2020, "value", "loss_usd_2007_2020")
pop_recent <- period_mean(
  population_growth,
  2020:2025,
  "value",
  "pop_growth_2020_2025"
)

country_metrics <- merge(
  sea_change,
  affected_sum,
  by = c("country_code", "country"),
  all.x = TRUE
)
country_metrics <- merge(
  country_metrics,
  loss_sum,
  by = c("country_code", "country"),
  all.x = TRUE
)
country_metrics <- merge(
  country_metrics,
  pop_recent,
  by = c("country_code", "country"),
  all.x = TRUE
)
country_metrics$affected_2005_2023[is.na(
  country_metrics$affected_2005_2023
)] <- 0
country_metrics$loss_usd_2007_2020[is.na(
  country_metrics$loss_usd_2007_2020
)] <- 0
country_metrics <- country_metrics[order(-country_metrics$sea_rise_mm), ]

utils::write.csv(
  country_metrics,
  file.path(out_dir, "country_exposure_metrics.csv"),
  row.names = FALSE
)

message("Making charts...")

regional_sea <- regional_series(sea_level, "value_mm")

regional_early <- mean(
  regional_sea$value[regional_sea$year %in% 1993:1997],
  na.rm = TRUE
)
regional_recent <- mean(
  regional_sea$value[regional_sea$year %in% 2019:2023],
  na.rm = TRUE
)

top_sea <- country_metrics[which.max(country_metrics$sea_rise_mm), ]
top_affected <- country_metrics[which.max(country_metrics$affected_2005_2023), ]
top_loss <- country_metrics[which.max(country_metrics$loss_usd_2007_2020), ]

p_regional <- ggplot(regional_sea, aes(year, value)) +
  geom_hline(yintercept = 0, color = "grey70", linewidth = 0.4) +
  geom_line(color = "#187A8C", linewidth = 0.9) +
  labs(
    title = "Sea-level anomaly is now visibly above the early satellite baseline",
    subtitle = "Regional mean across available Pacific geographies",
    x = NULL,
    y = "Sea-level anomaly (mm)"
  ) +
  theme_story()

sea_rise_top <- prep_bar(country_metrics, "sea_rise_mm", TRUE, 12)
p_sea_rise <- ggplot(
  sea_rise_top,
  aes(country, sea_rise_mm)
) +
  geom_col(fill = "#D65F2A") +
  coord_flip() +
  labs(
    title = "Where the sea-level anomaly rose the most",
    subtitle = "Mean 2019-2023 minus mean 1993-1997",
    x = NULL,
    y = "Rise (mm)"
  ) +
  theme_story()

affected_top <- prep_bar(country_metrics, "affected_2005_2023", TRUE, 12)
p_affected <- ggplot(
  affected_top,
  aes(country, affected_2005_2023)
) +
  geom_col(fill = "#5A7F40") +
  coord_flip() +
  scale_y_continuous(labels = scales::comma) +
  labs(
    title = "Disaster exposure is concentrated in a few countries",
    subtitle = "Cumulative directly affected persons, 2005-2023",
    x = NULL,
    y = "People directly affected"
  ) +
  theme_story()

scatter_data <- country_metrics[
  is.finite(country_metrics$sea_rise_mm) &
    country_metrics$affected_2005_2023 > 0,
]
scatter_data$label <- ifelse(
  scatter_data$sea_rise_mm >=
    stats::quantile(scatter_data$sea_rise_mm, 0.75, na.rm = TRUE) |
    scatter_data$affected_2005_2023 >=
      stats::quantile(scatter_data$affected_2005_2023, 0.75, na.rm = TRUE),
  as.character(scatter_data$country),
  ""
)
scatter_data$loss_size <- pmax(scatter_data$loss_usd_2007_2020, 1)

p_scatter <- ggplot(
  scatter_data,
  aes(sea_rise_mm, affected_2005_2023)
) +
  geom_point(
    aes(size = loss_size),
    color = "#187A8C",
    alpha = 0.75
  ) +
  geom_text(
    aes(label = label),
    hjust = -0.05,
    size = 3,
    check_overlap = TRUE
  ) +
  scale_y_log10(labels = scales::comma) +
  scale_size_continuous(range = c(2, 9), guide = "none") +
  labs(
    title = "Rising seas and disaster exposure overlap unevenly",
    subtitle = "Point size reflects reported direct disaster economic loss",
    x = "Sea-level anomaly rise, 1993-1997 to 2019-2023 (mm)",
    y = "Cumulative people directly affected, log scale"
  ) +
  theme_story()

pop_top <- prep_bar(country_metrics, "pop_growth_2020_2025", TRUE, 12)
p_population <- ggplot(
  pop_top,
  aes(country, pop_growth_2020_2025)
) +
  geom_col(fill = "#7B6AA8") +
  coord_flip() +
  labs(
    title = "Population growth can amplify exposure",
    subtitle = "Mean annual population growth rate, 2020-2025",
    x = NULL,
    y = "Population growth (%)"
  ) +
  theme_story()

chart_rows <- data.frame(
  title = c(
    "Regional Sea-Level Anomaly",
    "Largest Sea-Level Rises",
    "Cumulative Disaster-Affected Persons",
    "Sea-Level Rise vs Disaster Exposure",
    "Recent Population Growth"
  ),
  path = c(
    save_chart(p_regional, "regional_sea_level.png"),
    save_chart(p_sea_rise, "sea_level_rise_ranking.png"),
    save_chart(p_affected, "disaster_affected_ranking.png"),
    save_chart(p_scatter, "sea_level_vs_disaster_exposure.png"),
    save_chart(p_population, "population_growth.png")
  ),
  stringsAsFactors = FALSE
)

evidence <- data.frame(
  Finding = c(
    "Regional sea-level anomaly rose substantially",
    "Largest country-level sea-level rise",
    "Largest cumulative human exposure",
    "Largest reported economic loss"
  ),
  Evidence = c(
    paste0(
      fmt_num(regional_early),
      " mm in 1993-1997 to ",
      fmt_num(regional_recent),
      " mm in 2019-2023, a rise of ",
      fmt_num(regional_recent - regional_early),
      " mm."
    ),
    paste0(
      top_sea$country,
      " rose ",
      fmt_num(top_sea$sea_rise_mm),
      " mm between the early and recent periods."
    ),
    paste0(
      top_affected$country,
      " has ",
      fmt_num(top_affected$affected_2005_2023, 0),
      " directly affected persons reported across 2005-2023."
    ),
    paste0(
      top_loss$country,
      " reports about USD ",
      fmt_num(top_loss$loss_usd_2007_2020, 0),
      " in direct disaster economic losses across 2007-2020."
    )
  ),
  stringsAsFactors = FALSE
)

source_rows <- data.frame(
  Dataset = c(
    "Sea level anomalies",
    "Number of directly affected persons attributed to disasters",
    "Direct disaster economic loss",
    "Population growth"
  ),
  Source = c(
    attr(sea_level, "api_url"),
    attr(affected, "api_url"),
    attr(economic_loss, "api_url"),
    attr(population_growth, "api_url")
  ),
  stringsAsFactors = FALSE
)

chart_lines <- c("## Quick Charts", "")
for (i in seq_len(nrow(chart_rows))) {
  chart_lines <- c(
    chart_lines,
    paste0("### ", chart_rows$title[i]),
    "",
    paste0("![", chart_rows$title[i], "](", chart_rows$path[i], ")"),
    ""
  )
}

story_lines <- c(
  "# Rising Seas Are Becoming A Human Exposure Story",
  "",
  "**Core point:** The strongest narrative is not sea level alone; it is the overlap between rising sea-level anomalies, disaster exposure, economic loss, and population pressure.",
  "",
  paste0("Generated: ", format(Sys.time(), "%Y-%m-%d %H:%M %Z")),
  "",
  "## Why This Story Works",
  "",
  "- It starts with a direct climate signal: sea-level anomaly rises over the satellite period.",
  "- It translates that signal into human stakes using disaster-affected persons and direct economic loss.",
  "- It keeps causality honest: disaster indicators do not prove sea level caused the losses, but they identify where climate exposure and social vulnerability can be shown together.",
  "- It has a simple visual arc: regional sea-level line, country sea-level ranking, human exposure ranking, then a combined exposure scatter.",
  "",
  "## Official Data Sources",
  "",
  write_md_table(c("Dataset", "API URL"), source_rows),
  "",
  "## Core Evidence",
  "",
  write_md_table(c("Finding", "Evidence"), evidence),
  "",
  chart_lines,
  "## Suggested Dataviz Structure",
  "",
  "1. Open with the regional sea-level anomaly line.",
  "2. Show which countries have the largest early-to-recent sea-level anomaly rise.",
  "3. Introduce disaster-affected persons to shift from physical climate signal to human stakes.",
  "4. Use the combined scatter to show that exposure is uneven and multi-dimensional.",
  "5. Use population growth as a final context layer for future exposure.",
  "",
  "## Caveats",
  "",
  "- Sea-level values are anomalies, not absolute local sea height.",
  "- Disaster affected persons and losses are reported disaster indicators; they should not be treated as exclusively sea-level-driven.",
  "- Economic loss coverage is sparse compared with sea-level coverage, so it works best as an annotation or point-size layer.",
  "",
  "## Files Written",
  "",
  "- `country_exposure_metrics.csv`",
  "- `story.md`",
  "- `charts/*.png`",
  ""
)

writeLines(story_lines, file.path(out_dir, "story.md"))

message("Done.")
message("Wrote: ", file.path(out_dir, "story.md"))
message("Wrote: ", file.path(out_dir, "country_exposure_metrics.csv"))
message("Wrote charts to: ", chart_dir)
