data_dir <- file.path("data")
dir.create(data_dir, showWarnings = FALSE, recursive = TRUE)

endpoint <- "https://stats-nsi-stable.pacificdata.org/rest/data"

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
    endpoint,
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
  out <- stats::aggregate(value ~ country_code + country + year, out, mean)
  names(out)[4] <- value_name
  out[order(out$country, out$year), ]
}

fetch_historical_sea_level <- function() {
  stations <- data.frame(
    station_id = c(
      539,
      540,
      528,
      1370,
      1925,
      513,
      1217,
      1838,
      1254,
      1303,
      1607,
      1608,
      1609,
      1610,
      1860,
      1739,
      1804,
      1452,
      1839,
      1373,
      1861,
      1841,
      1327,
      1805,
      2356,
      1397,
      2242,
      1843
    ),
    country_code = c(
      "AS",
      "GU",
      "FM",
      "FM",
      "FM",
      "MH",
      "MH",
      "MH",
      "PG",
      "PG",
      "PG",
      "PG",
      "PG",
      "PG",
      "PG",
      "KI",
      "KI",
      "TV",
      "TV",
      "SB",
      "SB",
      "VU",
      "FJ",
      "FJ",
      "FJ",
      "PF",
      "PF",
      "CK"
    )
  )
  stations$country <- unname(countries[stations$country_code])

  archive <- tempfile(fileext = ".zip")
  directory <- tempfile()
  dir.create(directory)
  on.exit(unlink(c(archive, directory), recursive = TRUE), add = TRUE)

  utils::download.file(
    "https://psmsl.org/data/obtaining/rlr.annual.data/rlr_annual.zip",
    archive,
    quiet = TRUE,
    mode = "wb"
  )
  utils::unzip(archive, exdir = directory)

  records <- lapply(seq_len(nrow(stations)), function(i) {
    path <- file.path(
      directory,
      "rlr_annual",
      "data",
      paste0(stations$station_id[i], ".rlrdata")
    )
    x <- utils::read.table(
      path,
      sep = ";",
      fill = TRUE,
      stringsAsFactors = FALSE
    )
    x <- x[x$V2 != -99999, c("V1", "V2")]
    names(x) <- c("year", "sea_level_mm")
    baseline <- x$sea_level_mm[x$year %in% 1993:2000]
    if (length(baseline) < 2) {
      return(NULL)
    }
    x$sea_level_anomaly_mm <- x$sea_level_mm - mean(baseline)
    x$station_id <- stations$station_id[i]
    x$country_code <- stations$country_code[i]
    x$country <- stations$country[i]
    x[, c(
      "station_id",
      "country_code",
      "country",
      "year",
      "sea_level_anomaly_mm"
    )]
  })

  records <- do.call(rbind, records)
  level <- stats::aggregate(
    sea_level_anomaly_mm ~ country_code + country + year,
    records,
    mean
  )
  count <- stats::aggregate(
    station_id ~ country_code + country + year,
    records,
    function(x) length(unique(x))
  )
  names(count)[4] <- "station_count"
  out <- merge(level, count, by = c("country_code", "country", "year"))
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

sea_level_historical <- fetch_historical_sea_level()

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
  sea_level_historical,
  file.path(data_dir, "sea_level_historical.csv"),
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
summary$sea_level_rise_mm <- summary$sea_level_2019_2023_mm -
  summary$sea_level_1993_1997_mm
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
