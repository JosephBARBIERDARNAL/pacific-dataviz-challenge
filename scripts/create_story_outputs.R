args <- commandArgs(FALSE)
file_arg <- sub("^--file=", "", args[grep("^--file=", args)])
script_dir <- if (length(file_arg)) {
  dirname(normalizePath(file_arg))
} else {
  "scripts"
}
source(file.path(script_dir, "story_explore_helpers.R"))

stories_root <- file.path("outputs", "stories")
dir.create(stories_root, showWarnings = FALSE, recursive = TRUE)

fetch_stat_series <- function(flow_id, version, key) {
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

period_summary <- function(dat, years, value_col = "value", name = "value") {
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

country_period_change <- function(
  dat,
  early_years,
  recent_years,
  value_col = "value",
  early_name = "early",
  recent_name = "recent"
) {
  early <- period_summary(dat, early_years, value_col, early_name)
  recent <- period_summary(dat, recent_years, value_col, recent_name)
  out <- merge(early, recent, by = c("country_code", "country"), all = FALSE)
  out$change <- out[[recent_name]] - out[[early_name]]
  out$pct_change <- ifelse(
    abs(out[[early_name]]) > 1e-9,
    100 * out$change / abs(out[[early_name]]),
    NA_real_
  )
  out
}

country_sum <- function(dat, years, value_col = "value", name = "total") {
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

latest_period <- function(dat, years, value_col = "value", name = "recent") {
  period_summary(dat, years, value_col, name)
}

prep_bar <- function(dat, value_col, decreasing = TRUE, n = NULL) {
  dat <- dat[is.finite(dat[[value_col]]), ]
  dat <- dat[order(dat[[value_col]], decreasing = decreasing), ]
  if (!is.null(n)) {
    dat <- utils::head(dat, n)
  }
  dat$country <- factor(dat$country, levels = rev(dat$country))
  dat
}

story_header <- function(title, subtitle, rank) {
  c(
    paste0("# Story ", rank, ": ", title),
    "",
    paste0("**Core point:** ", subtitle),
    "",
    paste0("Generated: ", format(Sys.time(), "%Y-%m-%d %H:%M %Z")),
    ""
  )
}

story_sources <- function(items) {
  rows <- data.frame(
    Dataset = names(items),
    Source = unname(items),
    stringsAsFactors = FALSE
  )
  c(
    "## Official Datasets Used",
    "",
    write_md_table(c("Dataset", "Source"), rows),
    ""
  )
}

write_story <- function(story_dir, lines) {
  dir.create(story_dir, showWarnings = FALSE, recursive = TRUE)
  writeLines(lines, file.path(story_dir, "story.md"))
}

make_story_1 <- function() {
  story_dir <- file.path(stories_root, "story_01_rising_seas_human_exposure")
  dir.create(story_dir, showWarnings = FALSE, recursive = TRUE)

  sea <- fetch_climate_indicator("SEA_LVL")
  sea$value_mm <- sea$value * 1000
  affected <- fetch_stat_series("DF_SDG_11", "3.0", "A.VC_DSR_AFFCT.........")
  losses <- fetch_stat_series("DF_SDG_11", "3.0", "A.VC_DSR_AALT...._T.....")
  pop_growth <- fetch_stat_series(
    "DF_NMDI_POP",
    "1.0",
    "A..NMDI0002._T._T._T.."
  )

  sea_change <- country_period_change(
    sea,
    1993:1997,
    2019:2023,
    "value_mm",
    "sea_1993_1997_mm",
    "sea_2019_2023_mm"
  )
  affected_sum <- country_sum(
    affected,
    2005:2023,
    "value",
    "affected_2005_2023"
  )
  loss_sum <- country_sum(losses, 2007:2020, "value", "loss_usd_2007_2020")
  pop_recent <- latest_period(
    pop_growth,
    2020:2025,
    "value",
    "pop_growth_2020_2025"
  )

  exposure <- merge(
    sea_change,
    affected_sum,
    by = c("country_code", "country"),
    all.x = TRUE
  )
  exposure <- merge(
    exposure,
    loss_sum,
    by = c("country_code", "country"),
    all.x = TRUE
  )
  exposure <- merge(
    exposure,
    pop_recent,
    by = c("country_code", "country"),
    all.x = TRUE
  )
  exposure$affected_2005_2023[is.na(exposure$affected_2005_2023)] <- 0
  exposure$loss_usd_2007_2020[is.na(exposure$loss_usd_2007_2020)] <- 0
  exposure <- exposure[order(-exposure$change), ]
  utils::write.csv(
    exposure,
    file.path(story_dir, "country_exposure_metrics.csv"),
    row.names = FALSE
  )

  reg_sea <- regional_series(sea, "value_mm")
  sea_rise_top <- prep_bar(exposure, "change", TRUE, 12)
  affected_top <- prep_bar(exposure, "affected_2005_2023", TRUE, 12)
  scatter_data <- exposure[
    is.finite(exposure$change) & exposure$affected_2005_2023 > 0,
  ]
  scatter_data$label <- ifelse(
    scatter_data$change >=
      stats::quantile(scatter_data$change, 0.75, na.rm = TRUE) |
      scatter_data$affected_2005_2023 >=
        stats::quantile(scatter_data$affected_2005_2023, 0.75, na.rm = TRUE),
    scatter_data$country,
    ""
  )
  pop_plot <- prep_bar(exposure, "pop_growth_2020_2025", TRUE, 12)

  p1 <- ggplot2::ggplot(reg_sea, ggplot2::aes(year, value)) +
    ggplot2::geom_hline(yintercept = 0, color = "grey70", linewidth = 0.4) +
    ggplot2::geom_line(color = "#187A8C", linewidth = 0.9) +
    ggplot2::labs(
      title = "Sea-level anomaly is now visibly above the early satellite baseline",
      subtitle = "Regional mean across available Pacific geographies",
      x = NULL,
      y = "Sea-level anomaly (mm)"
    ) +
    theme_story()

  p2 <- ggplot2::ggplot(sea_rise_top, ggplot2::aes(country, change)) +
    ggplot2::geom_col(fill = "#D65F2A") +
    ggplot2::coord_flip() +
    ggplot2::labs(
      title = "Where the sea-level anomaly rose the most",
      subtitle = "Mean 2019-2023 minus mean 1993-1997",
      x = NULL,
      y = "Rise (mm)"
    ) +
    theme_story()

  p3 <- ggplot2::ggplot(
    affected_top,
    ggplot2::aes(country, affected_2005_2023)
  ) +
    ggplot2::geom_col(fill = "#5A7F40") +
    ggplot2::coord_flip() +
    ggplot2::scale_y_continuous(labels = scales::comma) +
    ggplot2::labs(
      title = "Disaster exposure is concentrated in a few countries",
      subtitle = "Cumulative directly affected persons, 2005-2023",
      x = NULL,
      y = "People directly affected"
    ) +
    theme_story()

  p4 <- ggplot2::ggplot(
    scatter_data,
    ggplot2::aes(change, affected_2005_2023)
  ) +
    ggplot2::geom_point(
      ggplot2::aes(size = pmax(loss_usd_2007_2020, 1)),
      color = "#187A8C",
      alpha = 0.75
    ) +
    ggplot2::geom_text(
      ggplot2::aes(label = label),
      hjust = -0.05,
      size = 3,
      check_overlap = TRUE
    ) +
    ggplot2::scale_y_log10(labels = scales::comma) +
    ggplot2::scale_size_continuous(range = c(2, 9), guide = "none") +
    ggplot2::labs(
      title = "Rising seas and disaster exposure overlap unevenly",
      subtitle = "Point size reflects reported direct disaster economic loss",
      x = "Sea-level anomaly rise, 1993-1997 to 2019-2023 (mm)",
      y = "Cumulative people directly affected, log scale"
    ) +
    theme_story()

  p5 <- ggplot2::ggplot(pop_plot, ggplot2::aes(country, pop_growth_2020_2025)) +
    ggplot2::geom_col(fill = "#7B6AA8") +
    ggplot2::coord_flip() +
    ggplot2::labs(
      title = "Population growth can amplify exposure",
      subtitle = "Mean annual population growth rate, 2020-2025",
      x = NULL,
      y = "Population growth (%)"
    ) +
    theme_story()

  charts <- data.frame(
    title = c(
      "Regional Sea-Level Anomaly",
      "Largest Sea-Level Rises",
      "Cumulative Disaster-Affected Persons",
      "Sea-Level Rise vs Disaster Exposure",
      "Recent Population Growth"
    ),
    path = c(
      save_chart(p1, story_dir, "story_01", "regional_sea_level"),
      save_chart(p2, story_dir, "story_01", "sea_level_rise_ranking"),
      save_chart(p3, story_dir, "story_01", "disaster_affected_ranking"),
      save_chart(p4, story_dir, "story_01", "sea_level_vs_disaster_exposure"),
      save_chart(p5, story_dir, "story_01", "population_growth")
    ),
    stringsAsFactors = FALSE
  )

  top_sea <- exposure[which.max(exposure$change), ]
  top_affected <- exposure[which.max(exposure$affected_2005_2023), ]
  top_loss <- exposure[which.max(exposure$loss_usd_2007_2020), ]
  regional_early <- mean(
    reg_sea$value[reg_sea$year %in% 1993:1997],
    na.rm = TRUE
  )
  regional_recent <- mean(
    reg_sea$value[reg_sea$year %in% 2019:2023],
    na.rm = TRUE
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
        fmt_num(top_sea$change),
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

  lines <- c(
    story_header(
      "Rising Seas Are Becoming A Human Exposure Story",
      "The strongest narrative is not sea level alone; it is the overlap between rising sea-level anomalies, disaster exposure, economic loss, and population pressure.",
      1
    ),
    "## Why This Story",
    "",
    "- It has a single clear climate signal: sea-level anomaly rises over the satellite period.",
    "- It translates that physical signal into human stakes using disaster-affected persons and economic loss.",
    "- It can be visualized with simple, legible charts: a line, ranked bars, and a country scatter.",
    "- It keeps causality honest: the disaster data does not prove sea level caused the losses, but it shows where climate exposure and social vulnerability can be brought into the same frame.",
    "",
    story_sources(c(
      "Sea level anomalies" = "Pacific Data Hub .Stat, DF_CLIMATE_CHANGE / SEA_LVL",
      "Number of directly affected persons attributed to disasters" = "Pacific Data Hub .Stat, DF_SDG_11 / VC_DSR_AFFCT",
      "Direct disaster economic loss" = "Pacific Data Hub .Stat, DF_SDG_11 / VC_DSR_AALT",
      "Population growth" = "Pacific Data Hub .Stat, DF_NMDI_POP / NMDI0002"
    )),
    "## Core Evidence",
    "",
    write_md_table(c("Finding", "Evidence"), evidence),
    "",
    chart_section(charts),
    "## Suggested Dataviz Direction",
    "",
    "- Lead with the sea-level anomaly line to establish the climate signal.",
    "- Move to ranked country bars to show that the rise is not evenly distributed.",
    "- End with the scatter or side-by-side country panels to connect physical exposure with people affected and losses.",
    "- A strong title direction: `The sea-level story is becoming a people story`.",
    "",
    "## Caveats",
    "",
    "- Sea level values are anomalies, not absolute local sea height.",
    "- Disaster affected persons and losses are reported disaster indicators; they should not be treated as exclusively sea-level-driven.",
    "- Economic loss coverage is sparse compared with sea-level coverage, so it is best used as an annotation or point-size layer.",
    ""
  )
  write_story(story_dir, lines)
  story_dir
}

make_story_2 <- function() {
  story_dir <- file.path(stories_root, "story_02_food_security_climate_stress")
  dir.create(story_dir, showWarnings = FALSE, recursive = TRUE)

  crop <- fetch_climate_indicator("CROP_YIELD")
  livestock <- fetch_climate_indicator("LVST_YIELD")
  rainfall <- fetch_climate_indicator("RAIN_ANOM")
  temp <- fetch_climate_indicator("ST_ANOM")

  crop_change <- country_period_change(
    crop,
    1961:1970,
    2015:2024,
    "value",
    "crop_1961_1970",
    "crop_2015_2024"
  )
  livestock_change <- country_period_change(
    livestock,
    1961:1970,
    2015:2024,
    "value",
    "livestock_1961_1970",
    "livestock_2015_2024"
  )
  rain_change <- country_period_change(
    rainfall,
    1979:1999,
    2015:2025,
    "value",
    "rain_1979_1999",
    "rain_2015_2025"
  )
  temp_change <- country_period_change(
    temp,
    1850:1900,
    2015:2025,
    "value",
    "temp_1850_1900",
    "temp_2015_2025"
  )

  food <- merge(
    crop_change,
    livestock_change,
    by = c("country_code", "country"),
    all = TRUE,
    suffixes = c("_crop", "_livestock")
  )
  names(food)[names(food) == "change_crop"] <- "crop_change"
  names(food)[names(food) == "pct_change_crop"] <- "crop_pct_change"
  names(food)[names(food) == "change_livestock"] <- "livestock_change"
  names(food)[names(food) == "pct_change_livestock"] <- "livestock_pct_change"
  food <- merge(
    food,
    rain_change[, c("country_code", "country", "change")],
    by = c("country_code", "country"),
    all.x = TRUE
  )
  names(food)[names(food) == "change"] <- "rain_shift"
  food <- merge(
    food,
    temp_change[, c("country_code", "country", "change")],
    by = c("country_code", "country"),
    all.x = TRUE
  )
  names(food)[names(food) == "change"] <- "temp_shift"
  food <- food[order(food$crop_pct_change), ]
  utils::write.csv(
    food,
    file.path(story_dir, "country_food_climate_metrics.csv"),
    row.names = FALSE
  )

  crop_plot <- prep_bar(food, "crop_pct_change", FALSE)
  livestock_plot <- prep_bar(food, "livestock_pct_change", FALSE)
  rain_plot <- food[!is.na(food$rain_shift), ]
  rain_plot <- rain_plot[order(rain_plot$rain_shift), ]
  rain_plot$country <- factor(rain_plot$country, levels = rain_plot$country)
  scatter_data <- food[
    is.finite(food$crop_pct_change) &
      is.finite(food$rain_shift) &
      is.finite(food$temp_shift),
  ]
  scatter_data$label <- ifelse(
    abs(scatter_data$crop_pct_change) >=
      stats::quantile(abs(scatter_data$crop_pct_change), 0.75, na.rm = TRUE) |
      abs(scatter_data$rain_shift) >=
        stats::quantile(abs(scatter_data$rain_shift), 0.75, na.rm = TRUE),
    scatter_data$country,
    ""
  )

  p1 <- ggplot2::ggplot(
    crop_plot,
    ggplot2::aes(country, crop_pct_change, fill = crop_pct_change > 0)
  ) +
    ggplot2::geom_col() +
    ggplot2::coord_flip() +
    ggplot2::scale_fill_manual(
      values = c("#C65A35", "#5A7F40"),
      guide = "none"
    ) +
    ggplot2::labs(
      title = "Crop yield change is highly uneven",
      subtitle = "Mean 2015-2024 yield vs mean 1961-1970 yield",
      x = NULL,
      y = "Change (%)"
    ) +
    theme_story()

  p2 <- ggplot2::ggplot(
    livestock_plot,
    ggplot2::aes(country, livestock_pct_change, fill = livestock_pct_change > 0)
  ) +
    ggplot2::geom_col() +
    ggplot2::coord_flip() +
    ggplot2::scale_fill_manual(
      values = c("#C65A35", "#5A7F40"),
      guide = "none"
    ) +
    ggplot2::labs(
      title = "Livestock yield shows another food-system stress pattern",
      subtitle = "Mean 2015-2024 yield vs mean 1961-1970 yield",
      x = NULL,
      y = "Change (%)"
    ) +
    theme_story()

  p3 <- ggplot2::ggplot(
    rain_plot,
    ggplot2::aes(country, rain_shift, fill = rain_shift > 0)
  ) +
    ggplot2::geom_col() +
    ggplot2::coord_flip() +
    ggplot2::scale_fill_manual(
      values = c("#2F6B9A", "#C65A35"),
      guide = "none"
    ) +
    ggplot2::labs(
      title = "Recent rainfall shifted in opposite directions",
      subtitle = "Mean 2015-2025 rainfall anomaly minus mean 1979-1999 anomaly",
      x = NULL,
      y = "Change (mm)"
    ) +
    theme_story()

  p4 <- ggplot2::ggplot(
    scatter_data,
    ggplot2::aes(rain_shift, crop_pct_change)
  ) +
    ggplot2::geom_hline(yintercept = 0, color = "grey70", linewidth = 0.4) +
    ggplot2::geom_vline(xintercept = 0, color = "grey70", linewidth = 0.4) +
    ggplot2::geom_point(
      ggplot2::aes(color = temp_shift),
      size = 3,
      alpha = 0.85
    ) +
    ggplot2::geom_text(
      ggplot2::aes(label = label),
      hjust = -0.05,
      size = 3,
      check_overlap = TRUE
    ) +
    ggplot2::scale_color_gradient(low = "#2F6B9A", high = "#C65A35") +
    ggplot2::labs(
      title = "Food story is about climate stress, not one simple driver",
      subtitle = "Crop yield change against recent rainfall shift; color shows surface-temperature shift",
      x = "Rainfall shift (mm)",
      y = "Crop yield change (%)",
      color = "Temp shift (C)"
    ) +
    theme_story()

  charts <- data.frame(
    title = c(
      "Crop Yield Change",
      "Livestock Yield Change",
      "Rainfall Shift",
      "Crop Yield vs Rainfall Shift"
    ),
    path = c(
      save_chart(p1, story_dir, "story_02", "crop_yield_change"),
      save_chart(p2, story_dir, "story_02", "livestock_yield_change"),
      save_chart(p3, story_dir, "story_02", "rainfall_shift"),
      save_chart(p4, story_dir, "story_02", "crop_vs_rainfall")
    ),
    stringsAsFactors = FALSE
  )

  crop_drop <- food[which.min(food$crop_pct_change), ]
  livestock_drop <- food[which.min(food$livestock_pct_change), ]
  rain_dry <- food[which.min(food$rain_shift), ]
  rain_wet <- food[which.max(food$rain_shift), ]

  evidence <- data.frame(
    Finding = c(
      "Largest crop-yield decline",
      "Largest livestock-yield decline",
      "Strongest recent drying",
      "Strongest recent wetting"
    ),
    Evidence = c(
      paste0(
        crop_drop$country,
        " changed by ",
        fmt_num(crop_drop$crop_pct_change),
        "% from the 1961-1970 baseline to 2015-2024."
      ),
      paste0(
        livestock_drop$country,
        " changed by ",
        fmt_num(livestock_drop$livestock_pct_change),
        "% from the 1961-1970 baseline to 2015-2024."
      ),
      paste0(
        rain_dry$country,
        " shifted by ",
        fmt_num(rain_dry$rain_shift),
        " mm from 1979-1999 to 2015-2025."
      ),
      paste0(
        rain_wet$country,
        " shifted by +",
        fmt_num(rain_wet$rain_shift),
        " mm from 1979-1999 to 2015-2025."
      )
    ),
    stringsAsFactors = FALSE
  )

  lines <- c(
    story_header(
      "Food Systems Are Meeting A Less Predictable Climate",
      "The most defensible food story is about uneven agricultural stress under warming and divergent rainfall, not a single universal crop-climate relationship.",
      2
    ),
    "## Why This Story",
    "",
    "- It uses food-system datasets that were not in the first top-5 deep dive: crop yield and livestock yield.",
    "- It connects those outcomes to two direct climate signals: rainfall anomalies and surface-temperature anomalies.",
    "- It has visual contrast: some countries show steep crop or livestock declines, while rainfall shifts split the region into wetter and drier recent periods.",
    "- It is story-friendly because the point is nuanced: climate stress is regional, but food outcomes are local and uneven.",
    "",
    story_sources(c(
      "Crop yield" = "Pacific Data Hub .Stat, DF_CLIMATE_CHANGE / CROP_YIELD",
      "Livestock yield" = "Pacific Data Hub .Stat, DF_CLIMATE_CHANGE / LVST_YIELD",
      "Rainfall anomalies" = "Pacific Data Hub .Stat, DF_CLIMATE_CHANGE / RAIN_ANOM",
      "Mean surface temperature anomalies" = "Pacific Data Hub .Stat, DF_CLIMATE_CHANGE / ST_ANOM"
    )),
    "## Core Evidence",
    "",
    write_md_table(c("Finding", "Evidence"), evidence),
    "",
    chart_section(charts),
    "## Suggested Dataviz Direction",
    "",
    "- Lead with crop and livestock yield change rankings to establish food-system stakes.",
    "- Use rainfall divergence as the climate-context pivot: the region is not moving in one hydrological direction.",
    "- Use the scatter as a cautionary/analytical panel: climate stress exists, but country outcomes need context.",
    "- A strong title direction: `A warmer Pacific is not feeding every island the same way`.",
    "",
    "## Caveats",
    "",
    "- These are broad national yield indicators; they do not identify crop mix, farming systems, imports, or local adaptation.",
    "- The charts show association and story context, not causal attribution.",
    "- For a final visualization, choose 4-6 countries rather than plotting every country in every panel.",
    ""
  )
  write_story(story_dir, lines)
  story_dir
}

make_story_3 <- function() {
  story_dir <- file.path(stories_root, "story_03_emissions_transition_gap")
  dir.create(story_dir, showWarnings = FALSE, recursive = TRUE)

  ghg <- fetch_climate_indicator("GHG_EMI_CAPITA")
  renewable <- fetch_stat_series(
    "DF_SDG",
    "3.0",
    "A.EG_FEC_RNEW.._T._T._T._T._T._T._Z._T"
  )
  power <- fetch_climate_indicator("POWER_GEN")
  taxes <- fetch_climate_indicator("ENV_TAXES")

  ghg_recent <- latest_period(ghg, 2020:2024, "value", "ghg_2020_2024")
  renewable_change <- country_period_change(
    renewable,
    2000:2004,
    2019:2023,
    "value",
    "renewable_2000_2004",
    "renewable_2019_2023"
  )
  power_change <- country_period_change(
    power,
    2000:2004,
    2019:2023,
    "value",
    "power_2000_2004",
    "power_2019_2023"
  )
  tax_recent <- latest_period(taxes, 2016:2021, "value", "env_tax_2016_2021")

  transition <- merge(
    ghg_recent,
    renewable_change,
    by = c("country_code", "country"),
    all = TRUE
  )
  transition <- merge(
    transition,
    power_change,
    by = c("country_code", "country"),
    all = TRUE,
    suffixes = c("", "_power")
  )
  names(transition)[names(transition) == "change"] <- "renewable_change"
  names(transition)[names(transition) == "pct_change"] <- "renewable_pct_change"
  names(transition)[names(transition) == "change_power"] <- "power_change"
  names(transition)[
    names(transition) == "pct_change_power"
  ] <- "power_pct_change"
  transition <- merge(
    transition,
    tax_recent,
    by = c("country_code", "country"),
    all = TRUE
  )
  transition <- transition[order(-transition$ghg_2020_2024), ]
  utils::write.csv(
    transition,
    file.path(story_dir, "country_transition_metrics.csv"),
    row.names = FALSE
  )

  ghg_plot <- prep_bar(
    transition[
      transition$ghg_2020_2024 > 0 & is.finite(transition$ghg_2020_2024),
    ],
    "ghg_2020_2024",
    TRUE
  )
  renewable_recent <- transition[is.finite(transition$renewable_2019_2023), ]
  renewable_recent <- renewable_recent[
    order(renewable_recent$renewable_2019_2023),
  ]
  renewable_recent$country <- factor(
    renewable_recent$country,
    levels = renewable_recent$country
  )
  renewable_shift <- transition[is.finite(transition$renewable_change), ]
  renewable_shift <- renewable_shift[order(renewable_shift$renewable_change), ]
  renewable_shift$country <- factor(
    renewable_shift$country,
    levels = renewable_shift$country
  )
  power_plot <- prep_bar(transition, "power_change", TRUE, 12)
  tax_plot <- prep_bar(transition, "env_tax_2016_2021", TRUE)
  scatter_data <- transition[
    is.finite(transition$ghg_2020_2024) &
      transition$ghg_2020_2024 > 0 &
      is.finite(transition$renewable_2019_2023),
  ]
  scatter_data$power_size <- ifelse(
    is.finite(scatter_data$power_2019_2023),
    pmax(scatter_data$power_2019_2023, 1),
    1
  )
  scatter_data$label <- ifelse(
    scatter_data$ghg_2020_2024 >=
      stats::quantile(scatter_data$ghg_2020_2024, 0.75, na.rm = TRUE) |
      scatter_data$renewable_2019_2023 >=
        stats::quantile(scatter_data$renewable_2019_2023, 0.75, na.rm = TRUE),
    scatter_data$country,
    ""
  )

  p1 <- ggplot2::ggplot(ghg_plot, ggplot2::aes(country, ghg_2020_2024)) +
    ggplot2::geom_col(fill = "#D65F2A") +
    ggplot2::coord_flip() +
    ggplot2::scale_y_log10() +
    ggplot2::labs(
      title = "Per-capita emissions are dominated by a few outliers",
      subtitle = "Mean greenhouse gas emissions per capita, 2020-2024",
      x = NULL,
      y = "Tons per person, log scale"
    ) +
    theme_story()

  p2 <- ggplot2::ggplot(
    renewable_recent,
    ggplot2::aes(country, renewable_2019_2023)
  ) +
    ggplot2::geom_col(fill = "#5A7F40") +
    ggplot2::coord_flip() +
    ggplot2::labs(
      title = "Renewable final energy share varies widely",
      subtitle = "Mean renewable energy share, 2019-2023",
      x = NULL,
      y = "Renewable share (%)"
    ) +
    theme_story()

  p3 <- ggplot2::ggplot(
    renewable_shift,
    ggplot2::aes(country, renewable_change, fill = renewable_change > 0)
  ) +
    ggplot2::geom_col() +
    ggplot2::coord_flip() +
    ggplot2::scale_fill_manual(
      values = c("#C65A35", "#5A7F40"),
      guide = "none"
    ) +
    ggplot2::labs(
      title = "Renewable share is not uniformly rising",
      subtitle = "Mean 2019-2023 minus mean 2000-2004",
      x = NULL,
      y = "Change in renewable share (percentage points)"
    ) +
    theme_story()

  p4 <- ggplot2::ggplot(
    scatter_data,
    ggplot2::aes(ghg_2020_2024, renewable_2019_2023)
  ) +
    ggplot2::geom_point(
      ggplot2::aes(size = power_size),
      color = "#187A8C",
      alpha = 0.75
    ) +
    ggplot2::geom_text(
      ggplot2::aes(label = label),
      hjust = -0.05,
      size = 3,
      check_overlap = TRUE
    ) +
    ggplot2::scale_x_log10() +
    ggplot2::scale_size_continuous(range = c(2, 8), guide = "none") +
    ggplot2::labs(
      title = "High emissions and renewable share do not move together cleanly",
      subtitle = "Point size reflects recent power generation",
      x = "GHG emissions per capita, 2020-2024 (log scale)",
      y = "Renewable final energy share, 2019-2023 (%)"
    ) +
    theme_story()

  p5 <- ggplot2::ggplot(power_plot, ggplot2::aes(country, power_change)) +
    ggplot2::geom_col(fill = "#7B6AA8") +
    ggplot2::coord_flip() +
    ggplot2::labs(
      title = "Power generation demand is rising in several places",
      subtitle = "Mean 2019-2023 minus mean 2000-2004",
      x = NULL,
      y = "Power generation change (GWh)"
    ) +
    theme_story()

  p6 <- ggplot2::ggplot(tax_plot, ggplot2::aes(country, env_tax_2016_2021)) +
    ggplot2::geom_col(fill = "#8A6B3F") +
    ggplot2::coord_flip() +
    ggplot2::labs(
      title = "Environmental tax data is visible but sparse",
      subtitle = "Mean environmental taxes, 2016-2021",
      x = NULL,
      y = "Environmental taxes (%)"
    ) +
    theme_story()

  charts <- data.frame(
    title = c(
      "Recent GHG Per Capita",
      "Recent Renewable Energy Share",
      "Renewable Share Change",
      "GHG vs Renewable Share",
      "Power Generation Change",
      "Environmental Tax Coverage"
    ),
    path = c(
      save_chart(p1, story_dir, "story_03", "ghg_recent"),
      save_chart(p2, story_dir, "story_03", "renewable_recent"),
      save_chart(p3, story_dir, "story_03", "renewable_change"),
      save_chart(p4, story_dir, "story_03", "ghg_vs_renewable"),
      save_chart(p5, story_dir, "story_03", "power_generation_change"),
      save_chart(p6, story_dir, "story_03", "environmental_taxes")
    ),
    stringsAsFactors = FALSE
  )

  high_ghg <- transition[which.max(transition$ghg_2020_2024), ]
  high_renew <- transition[which.max(transition$renewable_2019_2023), ]
  biggest_renew_drop <- transition[which.min(transition$renewable_change), ]
  biggest_power_growth <- transition[which.max(transition$power_change), ]
  tax_count <- sum(is.finite(transition$env_tax_2016_2021))

  evidence <- data.frame(
    Finding = c(
      "Highest recent per-capita emissions",
      "Highest recent renewable energy share",
      "Largest renewable-share decline",
      "Largest power generation growth",
      "Environmental tax coverage"
    ),
    Evidence = c(
      paste0(
        high_ghg$country,
        " averages ",
        fmt_num(high_ghg$ghg_2020_2024),
        " tons per person in 2020-2024."
      ),
      paste0(
        high_renew$country,
        " averages ",
        fmt_num(high_renew$renewable_2019_2023),
        "% renewable final energy share in 2019-2023."
      ),
      paste0(
        biggest_renew_drop$country,
        " changed by ",
        fmt_num(biggest_renew_drop$renewable_change),
        " percentage points from 2000-2004 to 2019-2023."
      ),
      paste0(
        biggest_power_growth$country,
        " added about ",
        fmt_num(biggest_power_growth$power_change),
        " GWh from 2000-2004 to 2019-2023."
      ),
      paste0(
        "Only ",
        tax_count,
        " geographies have recent environmental tax values in this official extract."
      )
    ),
    stringsAsFactors = FALSE
  )

  lines <- c(
    story_header(
      "The Climate Transition Gap Is Uneven And Under-Measured",
      "The energy-response story is less about one regional trend and more about gaps: emissions outliers, uneven renewable shares, growing power generation, and sparse policy-tax data.",
      3
    ),
    "## Why This Story",
    "",
    "- It brings together the official mitigation-side datasets: emissions, renewable energy, power generation, and environmental taxes.",
    "- It gives a strong contrast to the exposure and food stories: this is about responsibility and response.",
    "- It has a clear editorial point: the transition is not moving uniformly, and some policy data is too sparse to carry the story alone.",
    "- It has enough chart variety for a dashboard-style or scrollytelling section.",
    "",
    story_sources(c(
      "Greenhouse gas emissions per capita" = "Pacific Data Hub .Stat, DF_CLIMATE_CHANGE / GHG_EMI_CAPITA",
      "Renewable energy share in total final energy consumption" = "Pacific Data Hub .Stat, DF_SDG / EG_FEC_RNEW",
      "Power generation" = "Pacific Data Hub .Stat, DF_CLIMATE_CHANGE / POWER_GEN",
      "Environmental taxes" = "Pacific Data Hub .Stat, DF_CLIMATE_CHANGE / ENV_TAXES"
    )),
    "## Core Evidence",
    "",
    write_md_table(c("Finding", "Evidence"), evidence),
    "",
    chart_section(charts),
    "## Suggested Dataviz Direction",
    "",
    "- Lead with the emissions ranking to create the responsibility contrast.",
    "- Follow with renewable share and renewable change to show that energy transition is uneven.",
    "- Use power generation growth as the pressure variable: demand keeps moving even when renewable share does not.",
    "- Treat environmental taxes as a final caveat panel: policy response is difficult to compare because coverage is thin.",
    "- A strong title direction: `The Pacific transition story is a gap story`.",
    "",
    "## Caveats",
    "",
    "- GHG per capita can be volatile for small populations and should not be read as total emissions.",
    "- Renewable final energy share is not the same thing as renewable electricity generation.",
    "- Environmental tax coverage is limited, so it should not be the main evidence for the story.",
    ""
  )
  write_story(story_dir, lines)
  story_dir
}

story_dirs <- c(make_story_1(), make_story_2(), make_story_3())

overview <- c(
  "# Top 3 Story Recommendations",
  "",
  paste0("Generated: ", format(Sys.time(), "%Y-%m-%d %H:%M %Z")),
  "",
  "These are the three strongest multi-dataset story directions after expanding beyond the initial top-five dataset scan.",
  "",
  "| Rank | Story | Why It Made The Top 3 | Story File |",
  "|---:|---|---|---|",
  paste0(
    "| 1 | Rising seas are becoming a human exposure story | Clearest single climate signal plus human/economic stakes. | [story.md](",
    basename(story_dirs[1]),
    "/story.md) |"
  ),
  paste0(
    "| 2 | Food systems are meeting a less predictable climate | Strong use of crop/livestock datasets with climate context and nuanced storytelling. | [story.md](",
    basename(story_dirs[2]),
    "/story.md) |"
  ),
  paste0(
    "| 3 | The climate transition gap is uneven and under-measured | Best mitigation-side story, combining emissions, renewable energy, power generation, and policy data. | [story.md](",
    basename(story_dirs[3]),
    "/story.md) |"
  ),
  "",
  "The strongest final candidate is Story 1 if the goal is a direct climate-impact narrative. Story 2 is best if the goal is a more nuanced human-systems story. Story 3 is best if the final piece should focus on responsibility, policy, and energy transition.",
  ""
)
writeLines(overview, file.path(stories_root, "README.md"))

message("Wrote story outputs:")
for (dir in story_dirs) {
  message("  ", file.path(dir, "story.md"))
}
message("  ", file.path(stories_root, "README.md"))
