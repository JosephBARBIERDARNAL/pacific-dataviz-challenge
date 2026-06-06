options(timeout = 240)

args <- commandArgs(FALSE)
file_arg <- sub("^--file=", "", args[grep("^--file=", args)])
root <- if (length(file_arg)) dirname(normalizePath(file_arg)) else getwd()
data_dir <- file.path(root, "data")
dir.create(data_dir, showWarnings = FALSE, recursive = TRUE)

api <- "https://stats-nsi-stable.pacificdata.org/rest/data"

countries <- c(
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

fetch <- function(flow, version, key) {
  url <- paste0(
    api,
    "/SPC,",
    flow,
    ",",
    version,
    "/",
    utils::URLencode(key, reserved = TRUE),
    "/all?dimensionAtObservation=AllDimensions&detail=full&format=csvfile"
  )
  path <- tempfile(fileext = ".csv")
  on.exit(unlink(path), add = TRUE)
  utils::download.file(url, path, quiet = TRUE, mode = "wb")
  utils::read.csv(path, stringsAsFactors = FALSE, check.names = FALSE)
}

clean <- function(x, value_name, multiplier = 1, unit = NULL) {
  if (!is.null(unit)) {
    x <- x[x$UNIT_MEASURE == unit, ]
  }
  value <- suppressWarnings(as.numeric(x$OBS_VALUE)) * multiplier
  year <- suppressWarnings(as.integer(substr(x$TIME_PERIOD, 1, 4)))
  code <- as.character(x$GEO_PICT)
  country <- unname(countries[code])
  country[is.na(country)] <- code[is.na(country)]
  out <- data.frame(
    country_code = code,
    country = country,
    year = year,
    value = value
  )
  out <- out[is.finite(out$year) & is.finite(out$value), ]
  out <- stats::aggregate(
    value ~ country_code + country + year,
    out,
    mean
  )
  names(out)[4] <- value_name
  out[order(out$country, out$year), ]
}

period_mean <- function(x, years, value, name) {
  x <- x[x$year %in% years, ]
  out <- stats::aggregate(
    x[[value]],
    by = list(country_code = x$country_code, country = x$country),
    mean
  )
  names(out)[3] <- name
  out
}

period_sum <- function(x, years, value, name) {
  x <- x[x$year %in% years, ]
  out <- stats::aggregate(
    x[[value]],
    by = list(country_code = x$country_code, country = x$country),
    sum
  )
  names(out)[3] <- name
  out
}

sea_level <- clean(
  fetch("DF_CLIMATE_CHANGE", "1.0", "A.SEA_LVL."),
  "sea_level_mm",
  1000
)

disaster_affected <- clean(
  fetch("DF_SDG_11", "3.0", "A.VC_DSR_AFFCT........."),
  "affected_people"
)

disaster_losses <- clean(
  fetch("DF_SDG_11", "3.0", "A.VC_DSR_AALT...._T....."),
  "loss_usd",
  unit = "USD"
)

population_growth <- clean(
  fetch("DF_NMDI_POP", "1.0", "A..NMDI0002._T._T._T.."),
  "population_growth_pct"
)

utils::write.csv(
  sea_level,
  file.path(data_dir, "sea_level.csv"),
  row.names = FALSE
)
utils::write.csv(
  disaster_affected,
  file.path(data_dir, "disaster_affected.csv"),
  row.names = FALSE
)
utils::write.csv(
  disaster_losses,
  file.path(data_dir, "disaster_losses.csv"),
  row.names = FALSE
)
utils::write.csv(
  population_growth,
  file.path(data_dir, "population_growth.csv"),
  row.names = FALSE
)

early <- period_mean(
  sea_level,
  1993:1997,
  "sea_level_mm",
  "sea_level_1993_1997_mm"
)
recent <- period_mean(
  sea_level,
  2019:2023,
  "sea_level_mm",
  "sea_level_2019_2023_mm"
)
affected <- period_sum(
  disaster_affected,
  2005:2023,
  "affected_people",
  "affected_people_2005_2023"
)
losses <- period_sum(
  disaster_losses,
  2007:2020,
  "loss_usd",
  "loss_usd_2007_2020"
)
growth <- period_mean(
  population_growth,
  2020:2025,
  "population_growth_pct",
  "population_growth_2020_2025_pct"
)

summary <- merge(early, recent, by = c("country_code", "country"))
summary$sea_level_rise_mm <-
  summary$sea_level_2019_2023_mm - summary$sea_level_1993_1997_mm
summary <- merge(
  summary,
  affected,
  by = c("country_code", "country"),
  all.x = TRUE
)
summary <- merge(
  summary,
  losses,
  by = c("country_code", "country"),
  all.x = TRUE
)
summary <- merge(
  summary,
  growth,
  by = c("country_code", "country"),
  all.x = TRUE
)
summary$affected_people_2005_2023[is.na(summary$affected_people_2005_2023)] <- 0
summary$loss_usd_2007_2020[is.na(summary$loss_usd_2007_2020)] <- 0
summary <- summary[order(-summary$sea_level_rise_mm), ]

utils::write.csv(
  summary,
  file.path(data_dir, "country_summary.csv"),
  row.names = FALSE
)
