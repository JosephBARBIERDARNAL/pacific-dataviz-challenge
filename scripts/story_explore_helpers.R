options(timeout = 240)

if (!requireNamespace("ggplot2", quietly = TRUE)) {
  stop("The ggplot2 package is required for chart output.")
}

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

api_base <- "https://stats-nsi-stable.pacificdata.org/rest/data"

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

geo_label <- function(code) {
  code <- as.character(code)
  out <- country_lookup[code]
  ifelse(is.na(out), code, unname(out))
}

clean_number <- function(x) {
  suppressWarnings(as.numeric(gsub("[^0-9eE+\\.-]", "", as.character(x))))
}

escape_md <- function(x) {
  gsub("\\|", "/", as.character(x))
}

write_md_table <- function(headers, rows) {
  lines <- c(
    paste0("| ", paste(escape_md(headers), collapse = " | "), " |"),
    paste0("|", paste(rep("---", length(headers)), collapse = "|"), "|")
  )
  if (nrow(rows)) {
    for (i in seq_len(nrow(rows))) {
      lines <- c(
        lines,
        paste0("| ", paste(escape_md(rows[i, ]), collapse = " | "), " |")
      )
    }
  }
  lines
}

theme_story <- function() {
  ggplot2::theme_minimal(base_size = 12) +
    ggplot2::theme(
      plot.title = ggplot2::element_text(face = "bold"),
      plot.subtitle = ggplot2::element_text(color = "grey30"),
      panel.grid.minor = ggplot2::element_blank()
    )
}

save_chart <- function(
  plot,
  out_dir,
  output_prefix,
  chart_name,
  width = 8,
  height = 4.8
) {
  chart_dir <- file.path(out_dir, "charts")
  dir.create(chart_dir, showWarnings = FALSE, recursive = TRUE)
  filename <- paste0(output_prefix, "_", chart_name, ".png")
  path <- file.path(chart_dir, filename)
  ggplot2::ggsave(path, plot, width = width, height = height, dpi = 160)
  file.path("charts", filename)
}

chart_section <- function(entries) {
  lines <- c("## Quick Charts", "")
  for (i in seq_len(nrow(entries))) {
    lines <- c(
      lines,
      paste0("### ", entries$title[i]),
      "",
      paste0("![", entries$title[i], "](", entries$path[i], ")"),
      ""
    )
  }
  lines
}

fetch_climate_indicator <- function(indicator_code) {
  key <- paste0("A.", indicator_code, ".")
  url <- paste0(
    api_base,
    "/SPC,DF_CLIMATE_CHANGE,1.0/",
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

period_means <- function(dat, years, value_col = "value") {
  x <- dat[dat$year %in% years & is.finite(dat[[value_col]]), ]
  if (!nrow(x)) {
    return(data.frame(
      country_code = character(),
      country = character(),
      period_mean = numeric()
    ))
  }
  stats::aggregate(
    x[[value_col]],
    by = list(country_code = x$country_code, country = x$country),
    FUN = mean,
    na.rm = TRUE
  ) |>
    stats::setNames(c("country_code", "country", "period_mean"))
}

country_trends <- function(
  dat,
  value_col = "value",
  scale_slope = 10,
  slope_label = "per_decade"
) {
  countries <- sort(unique(dat$country))
  rows <- vector("list", length(countries))
  j <- 0
  for (country in countries) {
    x <- dat[
      dat$country == country &
        is.finite(dat[[value_col]]) &
        is.finite(dat$year),
    ]
    x <- x[order(x$year), ]
    if (nrow(x) < 3) {
      next
    }
    fit <- try(stats::lm(x[[value_col]] ~ x$year), silent = TRUE)
    slope <- if (inherits(fit, "try-error")) {
      NA_real_
    } else {
      unname(stats::coef(fit)[2]) * scale_slope
    }
    r2 <- if (inherits(fit, "try-error")) {
      NA_real_
    } else {
      suppressWarnings(summary(fit)$r.squared)
    }
    j <- j + 1
    rows[[j]] <- data.frame(
      country_code = x$country_code[1],
      country = country,
      first_year = min(x$year),
      first_value = x[[value_col]][which.min(x$year)],
      last_year = max(x$year),
      last_value = x[[value_col]][which.max(x$year)],
      total_change = x[[value_col]][which.max(x$year)] -
        x[[value_col]][which.min(x$year)],
      slope = slope,
      r2 = r2,
      n_years = nrow(x),
      stringsAsFactors = FALSE
    )
  }
  out <- do.call(rbind, rows[seq_len(j)])
  names(out)[names(out) == "slope"] <- slope_label
  out
}

regional_series <- function(dat, value_col = "value") {
  stats::aggregate(
    dat[[value_col]],
    by = list(year = dat$year),
    FUN = mean,
    na.rm = TRUE
  ) |>
    stats::setNames(c("year", "value"))
}

slope_for_period <- function(
  dat,
  years,
  value_col = "value",
  scale_slope = 10
) {
  x <- dat[dat$year %in% years & is.finite(dat[[value_col]]), ]
  if (nrow(x) < 3) {
    return(NA_real_)
  }
  fit <- try(stats::lm(x[[value_col]] ~ x$year), silent = TRUE)
  if (inherits(fit, "try-error")) {
    return(NA_real_)
  }
  unname(stats::coef(fit)[2]) * scale_slope
}

top_rows <- function(dat, order_col, n = 5, decreasing = TRUE) {
  dat <- dat[is.finite(dat[[order_col]]), ]
  dat <- dat[order(dat[[order_col]], decreasing = decreasing), ]
  utils::head(dat, n)
}

add_period_delta <- function(
  trends,
  early,
  recent,
  early_name = "baseline_mean",
  recent_name = "recent_mean"
) {
  early <- early[, c("country_code", "country", "period_mean")]
  recent <- recent[, c("country_code", "country", "period_mean")]
  names(early)[3] <- early_name
  names(recent)[3] <- recent_name
  out <- merge(trends, early, by = c("country_code", "country"), all.x = TRUE)
  out <- merge(out, recent, by = c("country_code", "country"), all.x = TRUE)
  out$period_delta <- out[[recent_name]] - out[[early_name]]
  out
}

record_years <- function(dat, value_col = "value", direction = "max") {
  countries <- sort(unique(dat$country))
  rows <- vector("list", length(countries))
  j <- 0
  for (country in countries) {
    x <- dat[dat$country == country & is.finite(dat[[value_col]]), ]
    if (!nrow(x)) {
      next
    }
    idx <- if (direction == "max") {
      which.max(x[[value_col]])
    } else {
      which.min(x[[value_col]])
    }
    j <- j + 1
    rows[[j]] <- data.frame(
      country_code = x$country_code[idx],
      country = x$country[idx],
      record_year = x$year[idx],
      record_value = x[[value_col]][idx],
      stringsAsFactors = FALSE
    )
  }
  do.call(rbind, rows[seq_len(j)])
}

story_file_header <- function(title, dat, source_url) {
  unit <- attr(dat, "unit")
  c(
    paste0("# ", title),
    "",
    paste0("Generated: ", format(Sys.time(), "%Y-%m-%d %H:%M %Z")),
    "",
    paste0("Rows explored: ", nrow(dat), " country-year observations"),
    paste0(
      "Coverage: ",
      length(unique(dat$country)),
      " geographies, ",
      min(dat$year),
      "-",
      max(dat$year)
    ),
    paste0("Unit: ", ifelse(nzchar(unit), unit, "not specified")),
    paste0("Source API: ", source_url),
    ""
  )
}

run_temperature_exploration <- function(
  dataset_name,
  indicator_code,
  output_prefix,
  subject_label,
  source_url
) {
  out_dir <- file.path("outputs", "exploration", "top5")
  dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)
  dat <- fetch_climate_indicator(indicator_code)

  early_years <- 1850:1900
  recent_years <- 2015:2025
  pre_accel_years <- 1850:1979
  accel_years <- 1980:2025

  trends <- country_trends(
    dat,
    scale_slope = 10,
    slope_label = "slope_c_per_decade"
  )
  trends <- add_period_delta(
    trends,
    period_means(dat, early_years),
    period_means(dat, recent_years),
    "mean_1850_1900",
    "mean_2015_2025"
  )
  trends <- trends[order(-trends$period_delta), ]
  utils::write.csv(
    trends,
    file.path(out_dir, paste0(output_prefix, "_country_trends.csv")),
    row.names = FALSE
  )

  reg <- regional_series(dat)
  regional_early <- mean(reg$value[reg$year %in% early_years], na.rm = TRUE)
  regional_recent <- mean(reg$value[reg$year %in% recent_years], na.rm = TRUE)
  pre_slope <- slope_for_period(reg, pre_accel_years, scale_slope = 10)
  post_slope <- slope_for_period(reg, accel_years, scale_slope = 10)
  records <- record_years(dat, direction = "max")
  recent_record_count <- sum(records$record_year >= 2015)

  top_warming <- top_rows(trends, "period_delta", 5, TRUE)
  top_recent <- top_rows(trends, "mean_2015_2025", 5, TRUE)
  top_slope <- top_rows(trends, "slope_c_per_decade", 5, TRUE)

  shift_plot_data <- top_rows(trends, "period_delta", 10, TRUE)
  shift_plot_data$country <- stats::reorder(
    shift_plot_data$country,
    shift_plot_data$period_delta
  )

  p_regional <- ggplot2::ggplot(reg, ggplot2::aes(year, value)) +
    ggplot2::geom_hline(yintercept = 0, color = "grey70", linewidth = 0.4) +
    ggplot2::geom_line(color = "#187A8C", linewidth = 0.9) +
    ggplot2::labs(
      title = paste0(dataset_name, ": regional mean"),
      subtitle = "Country average anomaly by year",
      x = NULL,
      y = "Anomaly (C)"
    ) +
    theme_story()

  p_shift <- ggplot2::ggplot(
    shift_plot_data,
    ggplot2::aes(country, period_delta)
  ) +
    ggplot2::geom_col(fill = "#D65F2A") +
    ggplot2::coord_flip() +
    ggplot2::labs(
      title = "Largest baseline-to-recent shifts",
      subtitle = "Mean 2015-2025 anomaly minus mean 1850-1900 anomaly",
      x = NULL,
      y = "Change (C)"
    ) +
    theme_story()

  charts <- data.frame(
    title = c(
      "Regional Anomaly Over Time",
      "Largest Baseline-To-Recent Shifts"
    ),
    path = c(
      save_chart(p_regional, out_dir, output_prefix, "regional_anomaly"),
      save_chart(p_shift, out_dir, output_prefix, "largest_recent_shift")
    ),
    stringsAsFactors = FALSE
  )

  candidate_rows <- data.frame(
    Story = c(
      "The baseline moved",
      "The recent record cluster",
      "Different places, same warming direction",
      "Acceleration after 1980"
    ),
    Evidence = c(
      paste0(
        "Regional ",
        subject_label,
        " anomaly rose from ",
        fmt_num(regional_early),
        "C in 1850-1900 to ",
        fmt_num(regional_recent),
        "C in 2015-2025, a shift of ",
        fmt_num(regional_recent - regional_early),
        "C."
      ),
      paste0(
        recent_record_count,
        " of ",
        nrow(records),
        " geographies have their highest observed anomaly in 2015 or later."
      ),
      paste0(
        sum(trends$period_delta > 0, na.rm = TRUE),
        " of ",
        nrow(trends),
        " geographies warmed between 1850-1900 and 2015-2025."
      ),
      paste0(
        "Regional trend changed from ",
        fmt_num(pre_slope, 3),
        "C/decade before 1980 to ",
        fmt_num(post_slope, 3),
        "C/decade from 1980 onward."
      )
    ),
    Chart = c(
      "Regional line with historical baseline and recent decade annotation",
      "Map or lollipop showing record year by country",
      "Ranked slope chart from 1850-1900 mean to 2015-2025 mean",
      "Two-slope line chart or small multiple by country"
    ),
    stringsAsFactors = FALSE
  )

  lines <- c(
    story_file_header(dataset_name, dat, source_url),
    "## Strongest Story Signals",
    "",
    write_md_table(c("Story", "Evidence", "Chart"), candidate_rows),
    "",
    chart_section(charts),
    "## Countries To Feature",
    "",
    "Largest shift from 1850-1900 to 2015-2025:",
    "",
    write_md_table(
      c("Country", "1850-1900 mean", "2015-2025 mean", "Change"),
      data.frame(
        Country = top_warming$country,
        Baseline = vapply(top_warming$mean_1850_1900, fmt_num, character(1)),
        Recent = vapply(top_warming$mean_2015_2025, fmt_num, character(1)),
        Change = vapply(top_warming$period_delta, fmt_num, character(1)),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "Highest recent anomaly:",
    "",
    write_md_table(
      c("Country", "2015-2025 mean", "Trend"),
      data.frame(
        Country = top_recent$country,
        Recent = vapply(top_recent$mean_2015_2025, fmt_num, character(1)),
        Trend = paste0(
          vapply(top_recent$slope_c_per_decade, fmt_num, character(1)),
          "C/decade"
        ),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "Fastest full-period trend:",
    "",
    write_md_table(
      c("Country", "Trend", "First value", "Latest value"),
      data.frame(
        Country = top_slope$country,
        Trend = paste0(
          vapply(top_slope$slope_c_per_decade, fmt_num, character(1)),
          "C/decade"
        ),
        First = paste0(
          top_slope$first_year,
          ": ",
          vapply(top_slope$first_value, fmt_num, character(1))
        ),
        Latest = paste0(
          top_slope$last_year,
          ": ",
          vapply(top_slope$last_value, fmt_num, character(1))
        ),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "## Dataviz Fit",
    "",
    "- Best as a clean time-series story: the shape is simple, long-running, and directly climate-linked.",
    "- Strong candidate for small multiples because most geographies move in the same direction but at different speeds.",
    "- Pair with crop yield, disaster affected persons, or sea level only after the warming narrative is visually clear.",
    ""
  )

  writeLines(lines, file.path(out_dir, paste0(output_prefix, "_findings.md")))
  message("Wrote ", file.path(out_dir, paste0(output_prefix, "_findings.md")))
}

run_rainfall_exploration <- function(output_prefix, source_url) {
  out_dir <- file.path("outputs", "exploration", "top5")
  dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)
  dat <- fetch_climate_indicator("RAIN_ANOM")

  baseline_years <- 1979:1999
  recent_years <- 2015:2025
  trends <- country_trends(
    dat,
    scale_slope = 10,
    slope_label = "slope_mm_per_decade"
  )
  trends <- add_period_delta(
    trends,
    period_means(dat, baseline_years),
    period_means(dat, recent_years),
    "mean_1979_1999",
    "mean_2015_2025"
  )

  volatility <- stats::aggregate(
    dat$value,
    by = list(country_code = dat$country_code, country = dat$country),
    FUN = stats::sd,
    na.rm = TRUE
  )
  names(volatility)[3] <- "sd_mm"
  trends <- merge(
    trends,
    volatility,
    by = c("country_code", "country"),
    all.x = TRUE
  )

  wet_records <- record_years(dat, direction = "max")
  dry_records <- record_years(dat, direction = "min")
  names(wet_records)[3:4] <- c("wettest_year", "wettest_value")
  names(dry_records)[3:4] <- c("driest_year", "driest_value")
  trends <- merge(
    trends,
    wet_records,
    by = c("country_code", "country"),
    all.x = TRUE
  )
  trends <- merge(
    trends,
    dry_records,
    by = c("country_code", "country"),
    all.x = TRUE
  )
  trends <- trends[order(-abs(trends$period_delta)), ]

  countries <- sort(unique(dat$country))
  swings <- vector("list", length(countries))
  j <- 0
  for (country in countries) {
    x <- dat[dat$country == country, ]
    x <- x[order(x$year), ]
    if (nrow(x) < 2) {
      next
    }
    diffs <- diff(x$value)
    idx <- which.max(abs(diffs))
    j <- j + 1
    swings[[j]] <- data.frame(
      country = country,
      from_year = x$year[idx],
      to_year = x$year[idx + 1],
      from_value = x$value[idx],
      to_value = x$value[idx + 1],
      swing = diffs[idx],
      abs_swing = abs(diffs[idx]),
      stringsAsFactors = FALSE
    )
  }
  swings <- do.call(rbind, swings[seq_len(j)])
  swings <- swings[order(-swings$abs_swing), ]
  utils::write.csv(
    trends,
    file.path(out_dir, paste0(output_prefix, "_country_patterns.csv")),
    row.names = FALSE
  )
  utils::write.csv(
    swings,
    file.path(
      out_dir,
      paste0(output_prefix, "_largest_year_to_year_swings.csv")
    ),
    row.names = FALSE
  )

  reg <- regional_series(dat)
  reg_wet <- reg[which.max(reg$value), ]
  reg_dry <- reg[which.min(reg$value), ]
  top_drying <- top_rows(trends, "period_delta", 5, FALSE)
  top_wetting <- top_rows(trends, "period_delta", 5, TRUE)
  top_volatility <- top_rows(trends, "sd_mm", 5, TRUE)
  top_swings <- utils::head(swings, 5)

  shift_plot_data <- trends[is.finite(trends$period_delta), ]
  shift_plot_data <- shift_plot_data[order(shift_plot_data$period_delta), ]
  shift_plot_data$country <- factor(
    shift_plot_data$country,
    levels = shift_plot_data$country
  )
  swing_plot_data <- utils::head(swings, 8)
  swing_plot_data$label <- paste0(
    swing_plot_data$country,
    " (",
    swing_plot_data$from_year,
    "-",
    swing_plot_data$to_year,
    ")"
  )
  swing_plot_data$label <- stats::reorder(
    swing_plot_data$label,
    abs(swing_plot_data$swing)
  )

  p_shift <- ggplot2::ggplot(
    shift_plot_data,
    ggplot2::aes(country, period_delta, fill = period_delta > 0)
  ) +
    ggplot2::geom_col() +
    ggplot2::coord_flip() +
    ggplot2::scale_fill_manual(
      values = c("#2F6B9A", "#C65A35"),
      guide = "none"
    ) +
    ggplot2::labs(
      title = "Recent rainfall shifts split the region",
      subtitle = "Mean 2015-2025 anomaly minus mean 1979-1999 anomaly",
      x = NULL,
      y = "Change (mm)"
    ) +
    theme_story()

  p_regional <- ggplot2::ggplot(reg, ggplot2::aes(year, value)) +
    ggplot2::geom_hline(yintercept = 0, color = "grey70", linewidth = 0.4) +
    ggplot2::geom_line(color = "#187A8C", linewidth = 0.9) +
    ggplot2::geom_point(data = reg_wet, color = "#C65A35", size = 2.4) +
    ggplot2::geom_point(data = reg_dry, color = "#2F6B9A", size = 2.4) +
    ggplot2::labs(
      title = "Regional rainfall anomaly",
      subtitle = "Highlighted points mark the wettest and driest regional years",
      x = NULL,
      y = "Anomaly (mm)"
    ) +
    theme_story()

  p_swings <- ggplot2::ggplot(
    swing_plot_data,
    ggplot2::aes(label, swing, fill = swing > 0)
  ) +
    ggplot2::geom_col() +
    ggplot2::coord_flip() +
    ggplot2::scale_fill_manual(
      values = c("#2F6B9A", "#C65A35"),
      guide = "none"
    ) +
    ggplot2::labs(
      title = "Largest one-year rainfall swings",
      subtitle = "Biggest country-level jump or drop between adjacent years",
      x = NULL,
      y = "One-year change (mm)"
    ) +
    theme_story()

  charts <- data.frame(
    title = c(
      "Recent Rainfall Shifts",
      "Regional Rainfall Anomaly",
      "Largest One-Year Swings"
    ),
    path = c(
      save_chart(p_shift, out_dir, output_prefix, "recent_shift"),
      save_chart(p_regional, out_dir, output_prefix, "regional_anomaly"),
      save_chart(p_swings, out_dir, output_prefix, "one_year_swings")
    ),
    stringsAsFactors = FALSE
  )

  candidate_rows <- data.frame(
    Story = c(
      "Rainfall is a volatility story",
      "Countries diverge between wetter and drier recent decades",
      "The sharpest changes are sudden",
      "Regional years can be annotated as wet/dry episodes"
    ),
    Evidence = c(
      paste0(
        top_volatility$country[1],
        " has the highest standard deviation at ",
        fmt_num(top_volatility$sd_mm[1]),
        " mm."
      ),
      paste0(
        "Largest recent drying: ",
        top_drying$country[1],
        " (",
        fmt_num(top_drying$period_delta[1]),
        " mm). Largest wetting: ",
        top_wetting$country[1],
        " (+",
        fmt_num(top_wetting$period_delta[1]),
        " mm)."
      ),
      paste0(
        top_swings$country[1],
        " shifted from ",
        fmt_num(top_swings$from_value[1]),
        " mm in ",
        top_swings$from_year[1],
        " to ",
        fmt_num(top_swings$to_value[1]),
        " mm in ",
        top_swings$to_year[1],
        "."
      ),
      paste0(
        "Regional mean was wettest in ",
        reg_wet$year,
        " (",
        fmt_num(reg_wet$value),
        " mm) and driest in ",
        reg_dry$year,
        " (",
        fmt_num(reg_dry$value),
        " mm)."
      )
    ),
    Chart = c(
      "Country volatility ranking or dot plot",
      "Diverging bar chart of recent shift from 1979-1999 to 2015-2025",
      "Before/after year-to-year lollipop for selected countries",
      "Regional anomaly line with highlighted wettest and driest years"
    ),
    stringsAsFactors = FALSE
  )

  lines <- c(
    story_file_header("Rainfall anomalies", dat, source_url),
    "## Strongest Story Signals",
    "",
    write_md_table(c("Story", "Evidence", "Chart"), candidate_rows),
    "",
    chart_section(charts),
    "## Countries To Feature",
    "",
    "Largest recent drying:",
    "",
    write_md_table(
      c("Country", "1979-1999 mean", "2015-2025 mean", "Change"),
      data.frame(
        Country = top_drying$country,
        Baseline = vapply(top_drying$mean_1979_1999, fmt_num, character(1)),
        Recent = vapply(top_drying$mean_2015_2025, fmt_num, character(1)),
        Change = vapply(top_drying$period_delta, fmt_num, character(1)),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "Largest recent wetting:",
    "",
    write_md_table(
      c("Country", "1979-1999 mean", "2015-2025 mean", "Change"),
      data.frame(
        Country = top_wetting$country,
        Baseline = vapply(top_wetting$mean_1979_1999, fmt_num, character(1)),
        Recent = vapply(top_wetting$mean_2015_2025, fmt_num, character(1)),
        Change = paste0(
          "+",
          vapply(top_wetting$period_delta, fmt_num, character(1))
        ),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "Largest one-year swings:",
    "",
    write_md_table(
      c("Country", "Years", "Values", "Swing"),
      data.frame(
        Country = top_swings$country,
        Years = paste0(top_swings$from_year, "-", top_swings$to_year),
        Values = paste0(
          vapply(top_swings$from_value, fmt_num, character(1)),
          " -> ",
          vapply(top_swings$to_value, fmt_num, character(1))
        ),
        Swing = vapply(top_swings$swing, fmt_num, character(1)),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "## Dataviz Fit",
    "",
    "- Best as a volatility and divergence story, not a simple upward-trend chart.",
    "- Strong chart candidates: diverging recent-shift bars, country small multiples, or an extreme-year calendar.",
    "- Pair with crop yield or disaster affected persons if a food-security or human-impact angle is needed.",
    ""
  )
  writeLines(lines, file.path(out_dir, paste0(output_prefix, "_findings.md")))
  message("Wrote ", file.path(out_dir, paste0(output_prefix, "_findings.md")))
}

run_sea_level_exploration <- function(output_prefix, source_url) {
  out_dir <- file.path("outputs", "exploration", "top5")
  dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)
  dat <- fetch_climate_indicator("SEA_LVL")
  dat$value_mm <- dat$value * 1000

  early_years <- 1993:1997
  recent_years <- 2019:2023
  trends <- country_trends(
    dat,
    value_col = "value_mm",
    scale_slope = 1,
    slope_label = "slope_mm_per_year"
  )
  trends <- add_period_delta(
    trends,
    period_means(dat, early_years, "value_mm"),
    period_means(dat, recent_years, "value_mm"),
    "mean_1993_1997_mm",
    "mean_2019_2023_mm"
  )
  trends <- trends[order(-trends$period_delta), ]
  utils::write.csv(
    trends,
    file.path(out_dir, paste0(output_prefix, "_country_trends.csv")),
    row.names = FALSE
  )

  reg <- regional_series(dat, "value_mm")
  regional_early <- mean(reg$value[reg$year %in% early_years], na.rm = TRUE)
  regional_recent <- mean(reg$value[reg$year %in% recent_years], na.rm = TRUE)
  top_rise <- top_rows(trends, "period_delta", 5, TRUE)
  top_slope <- top_rows(trends, "slope_mm_per_year", 5, TRUE)
  records <- record_years(dat, "value_mm", "max")
  recent_records <- sum(records$record_year >= 2018)

  rise_plot_data <- top_rows(trends, "period_delta", 10, TRUE)
  rise_plot_data$country <- stats::reorder(
    rise_plot_data$country,
    rise_plot_data$period_delta
  )

  p_regional <- ggplot2::ggplot(reg, ggplot2::aes(year, value)) +
    ggplot2::geom_hline(yintercept = 0, color = "grey70", linewidth = 0.4) +
    ggplot2::geom_line(color = "#187A8C", linewidth = 0.9) +
    ggplot2::labs(
      title = "Regional sea-level anomaly",
      subtitle = "Country average converted from meters to millimeters",
      x = NULL,
      y = "Anomaly (mm)"
    ) +
    theme_story()

  p_rise <- ggplot2::ggplot(
    rise_plot_data,
    ggplot2::aes(country, period_delta)
  ) +
    ggplot2::geom_col(fill = "#D65F2A") +
    ggplot2::coord_flip() +
    ggplot2::labs(
      title = "Largest sea-level anomaly rises",
      subtitle = "Mean 2019-2023 anomaly minus mean 1993-1997 anomaly",
      x = NULL,
      y = "Rise (mm)"
    ) +
    theme_story()

  charts <- data.frame(
    title = c("Regional Sea-Level Anomaly", "Largest Sea-Level Rises"),
    path = c(
      save_chart(p_regional, out_dir, output_prefix, "regional_anomaly"),
      save_chart(p_rise, out_dir, output_prefix, "largest_rises")
    ),
    stringsAsFactors = FALSE
  )

  candidate_rows <- data.frame(
    Story = c(
      "Small annual changes become visible over three decades",
      "Sea level rise is geographically uneven",
      "Several recent highs stand out",
      "A direct bridge to coastline and population stories"
    ),
    Evidence = c(
      paste0(
        "Regional mean shifted from ",
        fmt_num(regional_early),
        " mm in 1993-1997 to ",
        fmt_num(regional_recent),
        " mm in 2019-2023, a rise of ",
        fmt_num(regional_recent - regional_early),
        " mm."
      ),
      paste0(
        top_rise$country[1],
        " has the largest early-to-recent rise at ",
        fmt_num(top_rise$period_delta[1]),
        " mm."
      ),
      paste0(
        recent_records,
        " of ",
        nrow(records),
        " geographies have their highest sea-level anomaly in 2018 or later."
      ),
      "The dataset is strongest when paired with coastline, population growth, or disaster affected persons."
    ),
    Chart = c(
      "Annotated regional line from 1993 to 2023",
      "Ranked bar chart or slope chart by country",
      "Record-year map or timeline",
      "Small map plus time-series panels"
    ),
    stringsAsFactors = FALSE
  )

  lines <- c(
    story_file_header("Sea level anomalies", dat, source_url),
    "## Strongest Story Signals",
    "",
    write_md_table(c("Story", "Evidence", "Chart"), candidate_rows),
    "",
    chart_section(charts),
    "## Countries To Feature",
    "",
    "Largest rise from 1993-1997 to 2019-2023:",
    "",
    write_md_table(
      c("Country", "1993-1997 mean", "2019-2023 mean", "Rise"),
      data.frame(
        Country = top_rise$country,
        Baseline = paste0(
          vapply(top_rise$mean_1993_1997_mm, fmt_num, character(1)),
          " mm"
        ),
        Recent = paste0(
          vapply(top_rise$mean_2019_2023_mm, fmt_num, character(1)),
          " mm"
        ),
        Rise = paste0(
          vapply(top_rise$period_delta, fmt_num, character(1)),
          " mm"
        ),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "Fastest linear trend:",
    "",
    write_md_table(
      c("Country", "Trend", "Latest value"),
      data.frame(
        Country = top_slope$country,
        Trend = paste0(
          vapply(top_slope$slope_mm_per_year, fmt_num, character(1)),
          " mm/year"
        ),
        Latest = paste0(
          top_slope$last_year,
          ": ",
          vapply(top_slope$last_value, fmt_num, character(1)),
          " mm"
        ),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "## Dataviz Fit",
    "",
    "- Best as a direct climate-impact story because the unit can be converted into millimeters.",
    "- Use annotations carefully: values are anomalies, not absolute sea level height.",
    "- Pair with coastline as a map layer only after the time trend is clear.",
    ""
  )
  writeLines(lines, file.path(out_dir, paste0(output_prefix, "_findings.md")))
  message("Wrote ", file.path(out_dir, paste0(output_prefix, "_findings.md")))
}

run_ghg_exploration <- function(output_prefix, source_url) {
  out_dir <- file.path("outputs", "exploration", "top5")
  dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)
  dat <- fetch_climate_indicator("GHG_EMI_CAPITA")

  early_years <- 1970:1979
  recent_years <- 2020:2024
  since_2000_years <- 2000:2004
  trends <- country_trends(
    dat,
    scale_slope = 10,
    slope_label = "slope_ton_per_decade"
  )
  trends <- add_period_delta(
    trends,
    period_means(dat, early_years),
    period_means(dat, recent_years),
    "mean_1970_1979",
    "mean_2020_2024"
  )
  since_2000 <- period_means(dat, since_2000_years)
  names(since_2000)[3] <- "mean_2000_2004"
  trends <- merge(
    trends,
    since_2000,
    by = c("country_code", "country"),
    all.x = TRUE
  )
  trends$change_2000s_to_recent <- trends$mean_2020_2024 - trends$mean_2000_2004

  peaks <- record_years(dat, direction = "max")
  names(peaks)[3:4] <- c("peak_year", "peak_value")
  trends <- merge(
    trends,
    peaks,
    by = c("country_code", "country"),
    all.x = TRUE
  )
  trends$decline_from_peak <- trends$last_value - trends$peak_value
  trends <- trends[order(-trends$mean_2020_2024), ]
  utils::write.csv(
    trends,
    file.path(out_dir, paste0(output_prefix, "_country_patterns.csv")),
    row.names = FALSE
  )

  recent_rank <- top_rows(trends, "mean_2020_2024", 5, TRUE)
  low_recent <- top_rows(trends, "mean_2020_2024", 5, FALSE)
  biggest_declines <- top_rows(trends, "decline_from_peak", 5, FALSE)
  biggest_increases <- top_rows(trends, "period_delta", 5, TRUE)
  latest_spread <- max(trends$mean_2020_2024, na.rm = TRUE) /
    min(trends$mean_2020_2024[trends$mean_2020_2024 > 0], na.rm = TRUE)
  falling_since_2000 <- sum(trends$change_2000s_to_recent < 0, na.rm = TRUE)

  recent_plot_data <- trends[
    is.finite(trends$mean_2020_2024) & trends$mean_2020_2024 > 0,
  ]
  recent_plot_data <- recent_plot_data[order(recent_plot_data$mean_2020_2024), ]
  recent_plot_data$country <- factor(
    recent_plot_data$country,
    levels = recent_plot_data$country
  )
  decline_plot_data <- top_rows(trends, "decline_from_peak", 8, FALSE)
  decline_plot_data$country <- stats::reorder(
    decline_plot_data$country,
    decline_plot_data$decline_from_peak
  )

  p_recent <- ggplot2::ggplot(
    recent_plot_data,
    ggplot2::aes(country, mean_2020_2024)
  ) +
    ggplot2::geom_col(fill = "#D65F2A") +
    ggplot2::coord_flip() +
    ggplot2::scale_y_log10() +
    ggplot2::labs(
      title = "Recent emissions per person vary sharply",
      subtitle = "Mean 2020-2024 greenhouse gas emissions per capita",
      x = NULL,
      y = "Tons per person, log scale"
    ) +
    theme_story()

  p_decline <- ggplot2::ggplot(decline_plot_data) +
    ggplot2::geom_segment(
      ggplot2::aes(
        x = country,
        xend = country,
        y = peak_value,
        yend = last_value
      ),
      color = "grey55",
      linewidth = 1
    ) +
    ggplot2::geom_point(
      ggplot2::aes(country, peak_value),
      color = "#C65A35",
      size = 2.4
    ) +
    ggplot2::geom_point(
      ggplot2::aes(country, last_value),
      color = "#187A8C",
      size = 2.4
    ) +
    ggplot2::coord_flip() +
    ggplot2::labs(
      title = "Largest peak-to-latest emissions declines",
      subtitle = "Orange is country peak; teal is latest value",
      x = NULL,
      y = "Tons per person"
    ) +
    theme_story()

  charts <- data.frame(
    title = c("Recent Emissions Contrast", "Largest Peak-To-Latest Declines"),
    path = c(
      save_chart(p_recent, out_dir, output_prefix, "recent_emissions"),
      save_chart(p_decline, out_dir, output_prefix, "peak_to_latest_declines")
    ),
    stringsAsFactors = FALSE
  )

  candidate_rows <- data.frame(
    Story = c(
      "The Pacific is not one emissions story",
      "Responsibility and vulnerability can be contrasted",
      "Some countries peaked and fell",
      "Recent direction differs by country"
    ),
    Evidence = c(
      paste0(
        "Recent per-capita emissions range from ",
        low_recent$country[1],
        " at ",
        fmt_num(low_recent$mean_2020_2024[1]),
        " tons to ",
        recent_rank$country[1],
        " at ",
        fmt_num(recent_rank$mean_2020_2024[1]),
        " tons, a ratio of about ",
        fmt_num(latest_spread, 1),
        "x."
      ),
      "This dataset can sit beside sea level or disaster impact data to show emitter-vs-exposed contrasts.",
      paste0(
        biggest_declines$country[1],
        " fell from a peak of ",
        fmt_num(biggest_declines$peak_value[1]),
        " tons in ",
        biggest_declines$peak_year[1],
        " to ",
        fmt_num(biggest_declines$last_value[1]),
        " tons in ",
        biggest_declines$last_year[1],
        "."
      ),
      paste0(
        falling_since_2000,
        " of ",
        nrow(trends),
        " geographies have lower recent emissions than their 2000-2004 average."
      )
    ),
    Chart = c(
      "Recent ranking bar chart with log or broken-axis caution",
      "Two-panel chart: emissions rank beside sea-level/disaster indicator",
      "Peak-to-latest lollipop chart",
      "Small multiples grouped by rising vs falling emissions"
    ),
    stringsAsFactors = FALSE
  )

  lines <- c(
    story_file_header("Greenhouse gas emissions per capita", dat, source_url),
    "## Strongest Story Signals",
    "",
    write_md_table(c("Story", "Evidence", "Chart"), candidate_rows),
    "",
    chart_section(charts),
    "## Countries To Feature",
    "",
    "Highest recent per-capita emissions:",
    "",
    write_md_table(
      c("Country", "1970-1979 mean", "2020-2024 mean", "Change"),
      data.frame(
        Country = recent_rank$country,
        Baseline = vapply(recent_rank$mean_1970_1979, fmt_num, character(1)),
        Recent = vapply(recent_rank$mean_2020_2024, fmt_num, character(1)),
        Change = vapply(recent_rank$period_delta, fmt_num, character(1)),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "Lowest recent per-capita emissions:",
    "",
    write_md_table(
      c("Country", "2020-2024 mean", "Trend"),
      data.frame(
        Country = low_recent$country,
        Recent = vapply(low_recent$mean_2020_2024, fmt_num, character(1)),
        Trend = paste0(
          vapply(low_recent$slope_ton_per_decade, fmt_num, character(1)),
          " tons/decade"
        ),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "Largest peak-to-latest declines:",
    "",
    write_md_table(
      c("Country", "Peak", "Latest", "Decline"),
      data.frame(
        Country = biggest_declines$country,
        Peak = paste0(
          biggest_declines$peak_year,
          ": ",
          vapply(biggest_declines$peak_value, fmt_num, character(1))
        ),
        Latest = paste0(
          biggest_declines$last_year,
          ": ",
          vapply(biggest_declines$last_value, fmt_num, character(1))
        ),
        Decline = vapply(
          biggest_declines$decline_from_peak,
          fmt_num,
          character(1)
        ),
        stringsAsFactors = FALSE
      )
    ),
    "",
    "## Dataviz Fit",
    "",
    "- Best as a contrast dataset, not as the only climate story.",
    "- Pair with sea level anomalies or disaster affected persons to show responsibility versus exposure.",
    "- Per-capita values can be volatile for small populations; annotate peaks and avoid implying total emissions.",
    ""
  )
  writeLines(lines, file.path(out_dir, paste0(output_prefix, "_findings.md")))
  message("Wrote ", file.path(out_dir, paste0(output_prefix, "_findings.md")))
}
