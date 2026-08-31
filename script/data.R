data_dir <- file.path("public", "data")
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

clean <- function(x, value_name, multiplier = 1) {
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
  station_coverage <- stats::aggregate(
    station_id ~ country_code + country + year,
    records,
    function(x) paste(sort(unique(x)), collapse = ",")
  )
  names(station_coverage)[4] <- "station_ids"
  list(
    level = out[order(out$country, out$year), ],
    station_coverage = station_coverage[order(station_coverage$year, station_coverage$country), ],
    candidate_station_ids = stations$station_id,
    retained_station_ids = sort(unique(records$station_id))
  )
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

sea_level <- clean(
  fetch("DF_CLIMATE_CHANGE", "1.0", "A.SEA_LVL."),
  "sea_level_mm",
  1000
)

historical_data <- fetch_historical_sea_level()
sea_level_historical <- historical_data$level
station_coverage <- historical_data$station_coverage

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
  station_coverage,
  file.path(data_dir, "historical_station_coverage.csv"),
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
summary <- merge(early, recent, by = c("country_code", "country"))
summary$sea_level_rise_mm <- summary$sea_level_2019_2023_mm -
  summary$sea_level_1993_1997_mm
summary <- summary[order(-summary$sea_level_rise_mm), ]

utils::write.csv(
  summary,
  file.path(data_dir, "country_summary.csv"),
  row.names = FALSE
)

generated_at <- format(Sys.time(), tz = "UTC", usetz = TRUE)
provenance <- paste0(
  "{\n",
  "  \"generated_at_utc\": \"", generated_at, "\",\n",
  "  \"pacific_data_hub\": \"https://stats-nsi-stable.pacificdata.org/rest/data/SPC,DF_CLIMATE_CHANGE,1.0/A.SEA_LVL./all?dimensionAtObservation=AllDimensions&detail=full&format=csvfile\",\n",
  "  \"psmsl_archive\": \"https://psmsl.org/data/obtaining/rlr.annual.data/rlr_annual.zip\",\n",
  "  \"candidate_station_count\": ", length(historical_data$candidate_station_ids), ",\n",
  "  \"candidate_station_ids\": [", paste(historical_data$candidate_station_ids, collapse = ", "), "],\n",
  "  \"retained_station_count\": ", length(historical_data$retained_station_ids), ",\n",
  "  \"retained_station_ids\": [", paste(historical_data$retained_station_ids, collapse = ", "), "]\n",
  "}\n"
)
writeLines(provenance, file.path(data_dir, "provenance.json"))
