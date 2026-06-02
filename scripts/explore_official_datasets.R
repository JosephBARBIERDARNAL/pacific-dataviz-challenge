options(timeout = 240)

out_dir <- "outputs"
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

official_datasets <- data.frame(
  name = c(
    "Environmental taxes",
    "Environmental taxes - disaggregated",
    "Population growth",
    "Greenhouse gas emissions per capita",
    "Crop yield",
    "Crop yield - disaggregated",
    "Livestock yield",
    "Livestock yield - disaggregated",
    "Mean sea surface temperature anomalies",
    "Mean surface temperature anomalies",
    "Rainfall anomalies",
    "Climate altering land cover index",
    "Sea level anomalies",
    "Tourist arrivals",
    "Tourist arrivals - disaggregated",
    "Red List Index",
    "Number of directly affected persons attributed to disasters",
    "Direct disaster economic loss",
    "Tuberculosis incidence per 100,000 population",
    "Renewable energy share in the total final energy consumption",
    "Proportion of population using safely managed drinking water services",
    "Power generation",
    "Power generation - disaggregated",
    "Coastline",
    "Meteorological monitoring network",
    "Meteorological monitoring network - disaggregated",
    "Fisheries management measures in place and multilateral and bilateral fisheries management arrangements"
  ),
  flow_id = c(
    "DF_CLIMATE_CHANGE",
    "DF_ENV_TAXES",
    "DF_NMDI_POP",
    "DF_CLIMATE_CHANGE",
    "DF_CLIMATE_CHANGE",
    "DF_AGRICULTURAL_PRODUCTION",
    "DF_CLIMATE_CHANGE",
    "DF_AGRICULTURAL_PRODUCTION",
    "DF_CLIMATE_CHANGE",
    "DF_CLIMATE_CHANGE",
    "DF_CLIMATE_CHANGE",
    "DF_CLIMATE_CHANGE",
    "DF_CLIMATE_CHANGE",
    "DF_CLIMATE_CHANGE",
    "DF_TOURISM_ARRIVALS",
    "DF_SDG_15",
    "DF_SDG_11",
    "DF_SDG_11",
    "DF_SDG_03",
    "DF_SDG",
    "DF_SDG_06",
    "DF_CLIMATE_CHANGE",
    "DF_POWER_GEN",
    NA,
    "DF_CLIMATE_CHANGE",
    "DF_METEO_MONITOR_NET",
    "DF_CLIMATE_CHANGE"
  ),
  version = c(
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "1.0",
    "3.0",
    "3.0",
    "3.0",
    "3.0",
    "3.0",
    "3.0",
    "1.0",
    "1.0",
    NA,
    "1.0",
    "1.0",
    "1.0"
  ),
  key = c(
    "A.ENV_TAXES.",
    "A..",
    "A..NMDI0002._T._T._T..",
    "A.GHG_EMI_CAPITA.",
    "A.CROP_YIELD.",
    "A...",
    "A.LVST_YIELD.",
    "A...",
    "A.SST_ANOM.",
    "A.ST_ANOM.",
    "A.RAIN_ANOM.",
    "A.ALT_LAND_COVER.",
    "A.SEA_LVL.",
    "A.TRSM_ARR.",
    "A..",
    "A.ER_RSK_LST.........",
    "A.VC_DSR_AFFCT.........",
    "A.VC_DSR_AALT...._T.....",
    "A.SH_TBS_INCD.........",
    "A.EG_FEC_RNEW.._T._T._T._T._T._T._Z._T",
    "A.SH_H2O_SAFE...._T.....",
    "A.POWER_GEN.",
    "A...",
    NA,
    "A.METEO_MONITOR_NET.",
    "A..",
    "A.FISH_MNGT_MULT_BILAT_ARGMT."
  ),
  source_url = c(
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.ENV_TAXES.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_ENV_TAXES&df[ag]=SPC&df[vs]=1.0&av=true&dq=A..&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?tm=population%20growth&pg=0&snb=11&df[ds]=ds%3ASPC2&df[id]=DF_NMDI_POP&df[ag]=SPC&df[vs]=1.0&dq=A..NMDI0002._T._T._T..&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.GHG_EMI_CAPITA.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.CROP_YIELD.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_AGRICULTURAL_PRODUCTION&df[ag]=SPC&df[vs]=1.0&av=true&dq=A...&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.LVST_YIELD.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_AGRICULTURAL_PRODUCTION&df[ag]=SPC&df[vs]=1.0&av=true&dq=A...&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.SST_ANOM.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.ST_ANOM.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.RAIN_ANOM.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.ALT_LAND_COVER.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.SEA_LVL.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.TRSM_ARR.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_TOURISM_ARRIVALS&df[ag]=SPC&df[vs]=1.0&av=true&dq=A..&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_15&df[ag]=SPC&df[vs]=3.0&dq=A.ER_RSK_LST.........&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_11&df[ag]=SPC&df[vs]=3.0&dq=A.VC_DSR_AFFCT.........&pd=,&to[TIME_PERIOD]=false&lb=bt",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_11&df[ag]=SPC&df[vs]=3.0&dq=A.VC_DSR_AALT...._T.....&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_03&df[ag]=SPC&df[vs]=3.0&dq=A.SH_TBS_INCD.........&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?fs[0]=Development%20indicators,0%7CSustainable%20Development%20Goals%23SDG%23&pg=0&fc=Development%20indicators&bp=true&snb=18&df[ds]=ds%3ASPC2&df[id]=DF_SDG&df[ag]=SPC&df[vs]=3.0&dq=A.EG_FEC_RNEW.._T._T._T._T._T._T._Z._T&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=ds%3ASPC2&df[id]=DF_SDG_06&df[ag]=SPC&df[vs]=3.0&dq=A.SH_H2O_SAFE...._T.....&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.POWER_GEN.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_POWER_GEN&df[ag]=SPC&df[vs]=1.0&av=true&dq=A...&pd=,&to[TIME_PERIOD]=false",
    "https://pacificdata.org/data/dataset/landsat-coastlines",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.METEO_MONITOR_NET.&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_METEO_MONITOR_NET&df[ag]=SPC&df[vs]=1.0&av=true&dq=A..&pd=,&to[TIME_PERIOD]=false",
    "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.FISH_MNGT_MULT_BILAT_ARGMT.&pd=,&to[TIME_PERIOD]=false"
  ),
  climate_fit = c(
    11,
    10,
    14,
    16,
    15,
    14,
    14,
    13,
    20,
    20,
    19,
    17,
    20,
    13,
    12,
    15,
    18,
    18,
    9,
    15,
    13,
    15,
    14,
    12,
    10,
    9,
    11
  ),
  story_clarity = c(
    6,
    5,
    7,
    8,
    7,
    6,
    6,
    5,
    8,
    8,
    8,
    6,
    8,
    8,
    6,
    7,
    8,
    8,
    5,
    7,
    6,
    7,
    6,
    5,
    5,
    4,
    5
  ),
  stringsAsFactors = FALSE
)

country_lookup <- c(
  AS = "American Samoa",
  AU = "Australia",
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
  NZ = "New Zealand",
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
  WSM = "Samoa",
  WS = "Samoa",
  PAC = "Pacific",
  PACP = "Pacific"
)

metadata_cols <- c(
  "DATAFLOW",
  "TIME_PERIOD",
  "OBS_VALUE",
  "OBS_STATUS",
  "UNIT_MEASURE",
  "ERROR_TYPE",
  "ERROR_VAL",
  "REPORTING_TYPE",
  "OBS_COMMENT",
  "NATURE",
  "DATA_SOURCE",
  "UNIT_MULT",
  "DECIMALS"
)

api_base <- "https://stats-nsi-stable.pacificdata.org/rest/data"

api_url <- function(flow_id, version, key) {
  encoded_key <- utils::URLencode(key, reserved = TRUE)
  paste0(
    api_base,
    "/SPC,",
    flow_id,
    ",",
    version,
    "/",
    encoded_key,
    "/all?dimensionAtObservation=AllDimensions&detail=full&format=csvfile"
  )
}

clean_number <- function(x) {
  suppressWarnings(as.numeric(gsub("[^0-9eE+\\.-]", "", as.character(x))))
}

fmt_num <- function(x) {
  if (!is.finite(x)) {
    return("NA")
  }
  ax <- abs(x)
  if (ax >= 1000000) {
    return(format(round(x, 0), big.mark = ",", scientific = FALSE))
  }
  if (ax >= 1000) {
    return(format(round(x, 0), big.mark = ",", scientific = FALSE))
  }
  if (ax >= 10) {
    return(format(round(x, 1), trim = TRUE, scientific = FALSE))
  }
  format(round(x, 3), trim = TRUE, scientific = FALSE)
}

geo_label <- function(code) {
  code <- as.character(code)
  if (length(code) == 0 || is.na(code) || code == "") {
    return("Unknown geography")
  }
  if (!is.na(country_lookup[code])) {
    return(unname(country_lookup[code]))
  }
  code
}

first_non_na <- function(x) {
  x <- x[!is.na(x) & x != ""]
  if (!length(x)) {
    return(NA_character_)
  }
  as.character(x[1])
}

collapse_non_empty <- function(x, sep = "; ") {
  x <- unique(x[!is.na(x) & nzchar(x)])
  if (!length(x)) {
    return("")
  }
  paste(x, collapse = sep)
}

safe_quantile <- function(x, p) {
  x <- x[is.finite(x)]
  if (!length(x)) {
    return(0)
  }
  as.numeric(stats::quantile(x, p, na.rm = TRUE, names = FALSE, type = 7))
}

story_angle <- function(name) {
  n <- tolower(name)
  if (grepl("sea level", n)) {
    return(
      "Direct climate signal: show which Pacific island states are seeing the clearest sea-level rise."
    )
  }
  if (grepl("surface temperature", n) && grepl("sea", n)) {
    return(
      "Ocean warming story: compare warming seas around island economies and ecosystems."
    )
  }
  if (grepl("surface temperature", n)) {
    return(
      "Warming land story: show persistent temperature anomaly increases across the region."
    )
  }
  if (grepl("rainfall", n)) {
    return(
      "Climate variability story: highlight wetter/drier swings and countries with the strongest rainfall anomalies."
    )
  }
  if (grepl("disaster", n) && grepl("affected", n)) {
    return(
      "Human-impact story: connect climate hazards to people directly affected by disasters."
    )
  }
  if (grepl("disaster economic", n)) {
    return(
      "Economic-risk story: show the uneven financial cost of disaster exposure."
    )
  }
  if (grepl("tourist", n)) {
    return(
      "Economic vulnerability story: show shocks and recoveries in a climate-exposed sector."
    )
  }
  if (grepl("crop", n)) {
    return(
      "Food-security story: compare agricultural yield changes under climate pressure."
    )
  }
  if (grepl("livestock", n)) {
    return(
      "Food-system story: test whether livestock yield patterns are stable, volatile, or diverging."
    )
  }
  if (grepl("greenhouse", n)) {
    return(
      "Responsibility-vulnerability story: compare emissions per person with climate-exposure datasets."
    )
  }
  if (grepl("renewable", n)) {
    return(
      "Transition story: show which countries are moving toward renewable final energy consumption."
    )
  }
  if (grepl("power generation", n)) {
    return(
      "Energy-transition story: compare power generation changes and pair with renewable share."
    )
  }
  if (grepl("environmental taxes", n)) {
    return(
      "Policy-response story: test whether environmental taxation is visible and growing."
    )
  }
  if (grepl("population growth", n)) {
    return(
      "Exposure multiplier story: combine population growth with sea level, water, and disaster indicators."
    )
  }
  if (grepl("red list", n)) {
    return(
      "Biodiversity-pressure story: show whether ecosystem risk is worsening or improving."
    )
  }
  if (grepl("land cover", n)) {
    return(
      "Land-use pressure story: compare climate-altering land-cover change across countries."
    )
  }
  if (grepl("drinking water", n)) {
    return(
      "Adaptation and welfare story: compare safely managed water access against climate stress."
    )
  }
  if (grepl("tuberculosis", n)) {
    return(
      "Health-vulnerability context: use carefully as a companion rather than a direct climate trend."
    )
  }
  if (grepl("coastline", n)) {
    return(
      "Map context layer: show physical exposure, erosion, and island geography rather than a time trend."
    )
  }
  if (grepl("meteorological", n)) {
    return(
      "Data-capacity story: show gaps or growth in climate monitoring infrastructure."
    )
  }
  if (grepl("fisheries", n)) {
    return(
      "Governance story: connect fisheries management arrangements to climate-stressed marine resources."
    )
  }
  "Exploratory climate-related story; inspect strongest trend and country contrast."
}

companion_datasets <- function(name) {
  n <- tolower(name)
  if (grepl("sea level", n)) {
    return("Coastline; population growth; disaster affected persons")
  }
  if (grepl("surface temperature|rainfall", n)) {
    return("Crop yield; livestock yield; disaster affected persons")
  }
  if (grepl("disaster", n) && grepl("economic", n)) {
    return("Population growth; sea level anomalies; disaster affected persons")
  }
  if (grepl("disaster", n)) {
    return(
      "Population growth; sea level anomalies; direct disaster economic loss"
    )
  }
  if (grepl("tourist", n)) {
    return(
      "Disaster affected persons; rainfall anomalies; surface temperature anomalies"
    )
  }
  if (grepl("crop|livestock", n)) {
    return(
      "Rainfall anomalies; surface temperature anomalies; population growth"
    )
  }
  if (grepl("greenhouse", n)) {
    return("Sea level anomalies; disaster economic loss; population growth")
  }
  if (grepl("renewable|power generation", n)) {
    return("Greenhouse gas emissions per capita; environmental taxes")
  }
  if (grepl("environmental taxes", n)) {
    return("Greenhouse gas emissions per capita; renewable energy share")
  }
  if (grepl("population growth", n)) {
    return("Sea level anomalies; drinking water; disaster affected persons")
  }
  if (grepl("red list|land cover|fisheries", n)) {
    return("Sea surface temperature anomalies; rainfall anomalies")
  }
  if (grepl("drinking water|tuberculosis", n)) {
    return("Population growth; disaster affected persons; rainfall anomalies")
  }
  if (grepl("coastline", n)) {
    return("Sea level anomalies; population growth; disaster economic loss")
  }
  if (grepl("meteorological", n)) {
    return("Rainfall anomalies; temperature anomalies")
  }
  ""
}

manual_caveat <- function(name) {
  n <- tolower(name)
  caveats <- character()
  if (grepl("tourist", n)) {
    caveats <- c(caveats, "COVID-era shock may dominate the visual pattern.")
  }
  if (grepl("disaggregated", n)) {
    caveats <- c(
      caveats,
      "Filter to a small number of dimensions before storytelling."
    )
  }
  if (grepl("tuberculosis", n)) {
    caveats <- c(
      caveats,
      "Indirect climate relevance; use as vulnerability context."
    )
  }
  if (grepl("coastline", n)) {
    caveats <- c(
      caveats,
      "Not a time-series dataset in .Stat; use as a geographic context layer."
    )
  }
  if (grepl("meteorological", n)) {
    caveats <- c(caveats, "More about monitoring capacity than climate impact.")
  }
  if (grepl("fisheries", n)) {
    caveats <- c(
      caveats,
      "Governance metric; narrative needs marine-climate context."
    )
  }
  collapse_non_empty(caveats)
}

dimension_columns <- function(dat) {
  setdiff(names(dat), metadata_cols)
}

find_geo_col <- function(dat) {
  cols <- names(dat)
  candidates <- cols[grepl("GEO|REF_AREA|LOCATION", cols, ignore.case = TRUE)]
  if (length(candidates)) {
    return(candidates[1])
  }
  NA_character_
}

series_label <- function(series_id, series_cols) {
  if (!length(series_cols) || is.na(series_id) || !nzchar(series_id)) {
    return("overall")
  }
  values <- strsplit(series_id, " \\|\\|\\| ", fixed = FALSE)[[1]]
  values <- values[seq_len(min(length(values), length(series_cols)))]
  parts <- character()
  for (i in seq_along(values)) {
    val <- values[i]
    col <- series_cols[i]
    if (is.na(val) || val == "" || val %in% c("_T", "_Z", "A")) {
      next
    }
    if (grepl("GEO|REF_AREA|LOCATION", col, ignore.case = TRUE)) {
      parts <- c(parts, geo_label(val))
    } else {
      parts <- c(parts, val)
    }
  }
  if (!length(parts)) {
    return("overall")
  }
  paste(utils::head(parts, 4), collapse = ", ")
}

calc_series_metrics <- function(dat, values, years, dim_cols) {
  if (!length(dim_cols)) {
    series_id <- rep("overall", length(values))
    series_cols <- character()
  } else {
    use <- dat[, dim_cols, drop = FALSE]
    use[] <- lapply(use, function(x) ifelse(is.na(x), "", as.character(x)))
    series_id <- do.call(paste, c(use, sep = " ||| "))
    series_cols <- dim_cols
  }

  scale_value <- stats::IQR(values, na.rm = TRUE)
  if (!is.finite(scale_value) || scale_value <= 0) {
    scale_value <- stats::median(abs(values), na.rm = TRUE)
  }
  if (!is.finite(scale_value) || scale_value <= 0) {
    scale_value <- 1
  }

  ids <- unique(series_id[is.finite(values) & is.finite(years)])
  metrics <- vector("list", length(ids))
  j <- 0

  for (id in ids) {
    idx <- which(series_id == id & is.finite(values) & is.finite(years))
    if (length(idx) < 3) {
      next
    }
    tmp <- stats::aggregate(
      values[idx],
      by = list(year = years[idx]),
      FUN = mean,
      na.rm = TRUE
    )
    names(tmp)[2] <- "value"
    tmp <- tmp[order(tmp$year), ]
    tmp <- tmp[is.finite(tmp$value) & is.finite(tmp$year), ]
    if (nrow(tmp) < 3) {
      next
    }
    span <- max(tmp$year) - min(tmp$year)
    if (!is.finite(span) || span <= 0) {
      next
    }
    first_val <- tmp$value[1]
    last_val <- tmp$value[nrow(tmp)]
    change <- last_val - first_val
    pct_change <- if (is.finite(first_val) && abs(first_val) > 1e-9) {
      100 * change / abs(first_val)
    } else {
      NA_real_
    }
    yoy <- if (nrow(tmp) >= 2) {
      max(abs(diff(tmp$value)), na.rm = TRUE)
    } else {
      NA_real_
    }
    fit <- try(stats::lm(value ~ year, data = tmp), silent = TRUE)
    slope <- if (!inherits(fit, "try-error")) {
      unname(stats::coef(fit)[2])
    } else {
      NA_real_
    }
    r2 <- if (!inherits(fit, "try-error")) {
      suppressWarnings(summary(fit)$r.squared)
    } else {
      NA_real_
    }

    j <- j + 1
    metrics[[j]] <- data.frame(
      series_id = id,
      series_label = series_label(id, series_cols),
      year_start = min(tmp$year),
      year_end = max(tmp$year),
      n_years = nrow(tmp),
      span = span,
      first_value = first_val,
      last_value = last_val,
      change = change,
      pct_change = pct_change,
      norm_change = abs(change) / scale_value,
      max_yoy = yoy,
      norm_yoy = abs(yoy) / scale_value,
      slope = slope,
      r2 = r2,
      stringsAsFactors = FALSE
    )
  }

  if (!j) {
    return(data.frame())
  }
  do.call(rbind, metrics[seq_len(j)])
}

calc_contrast <- function(dat, values, years, geo_col) {
  empty <- list(
    score = 0,
    detail = "",
    max_range = NA_real_,
    year = NA_integer_
  )
  if (is.na(geo_col) || !geo_col %in% names(dat)) {
    return(empty)
  }
  geos <- as.character(dat[[geo_col]])
  ok <- is.finite(values) & is.finite(years) & !is.na(geos) & nzchar(geos)
  if (!any(ok)) {
    return(empty)
  }
  tmp <- data.frame(
    year = years[ok],
    geo = geos[ok],
    value = values[ok],
    stringsAsFactors = FALSE
  )
  tmp <- stats::aggregate(value ~ year + geo, tmp, median, na.rm = TRUE)

  scale_value <- stats::IQR(tmp$value, na.rm = TRUE)
  if (!is.finite(scale_value) || scale_value <= 0) {
    scale_value <- stats::median(abs(tmp$value), na.rm = TRUE)
  }
  if (!is.finite(scale_value) || scale_value <= 0) {
    scale_value <- 1
  }

  years_available <- sort(unique(tmp$year))
  best <- NULL
  for (yr in years_available) {
    yr_dat <- tmp[tmp$year == yr & is.finite(tmp$value), ]
    if (length(unique(yr_dat$geo)) < 3) {
      next
    }
    yr_range <- max(yr_dat$value) - min(yr_dat$value)
    if (!is.finite(yr_range)) {
      next
    }
    if (is.null(best) || yr_range > best$range) {
      best <- list(year = yr, range = yr_range, data = yr_dat)
    }
  }
  if (is.null(best)) {
    return(empty)
  }
  yr_dat <- best$data
  low <- yr_dat[which.min(yr_dat$value), ]
  high <- yr_dat[which.max(yr_dat$value), ]
  detail <- paste0(
    "Largest country spread in ",
    best$year,
    ": ",
    geo_label(high$geo),
    " ",
    fmt_num(high$value),
    " vs ",
    geo_label(low$geo),
    " ",
    fmt_num(low$value)
  )
  list(
    score = min(10, 10 * min(1, abs(best$range) / (2 * scale_value))),
    detail = detail,
    max_range = best$range,
    year = best$year
  )
}

download_csv <- function(row) {
  if (is.na(row$flow_id) || is.na(row$key)) {
    return(NULL)
  }
  url <- api_url(row$flow_id, row$version, row$key)
  tmp <- tempfile(fileext = ".csv")
  on.exit(unlink(tmp), add = TRUE)
  status <- try(
    utils::download.file(url, tmp, quiet = TRUE, mode = "wb"),
    silent = TRUE
  )
  if (inherits(status, "try-error")) {
    stop(as.character(status))
  }
  dat <- utils::read.csv(
    tmp,
    stringsAsFactors = FALSE,
    check.names = FALSE,
    na.strings = c("", "NA")
  )
  attr(dat, "api_url") <- url
  dat
}

profile_dataset <- function(row) {
  if (is.na(row$flow_id)) {
    return(data.frame(
      name = row$name,
      status = "catalogue_only",
      rows = NA_integer_,
      observations = NA_integer_,
      countries = NA_integer_,
      year_start = NA_integer_,
      year_end = NA_integer_,
      year_span = NA_integer_,
      dimensions = NA_integer_,
      unit = "",
      missing_pct = NA_real_,
      trend_score = 0,
      shock_score = 0,
      contrast_score = 0,
      coverage_score = 0,
      quality_score = 0,
      relevance_score = min(100, row$climate_fit + row$story_clarity),
      strongest_pattern = "Use as a map/context layer with sea level, population, or disaster data.",
      story_angle = story_angle(row$name),
      suggested_companions = companion_datasets(row$name),
      caveats = manual_caveat(row$name),
      source_url = row$source_url,
      api_url = "",
      stringsAsFactors = FALSE
    ))
  }

  dat <- download_csv(row)
  if (
    !nrow(dat) || !"OBS_VALUE" %in% names(dat) || !"TIME_PERIOD" %in% names(dat)
  ) {
    stop("No usable OBS_VALUE/TIME_PERIOD columns returned")
  }

  values <- clean_number(dat$OBS_VALUE)
  years <- suppressWarnings(as.integer(substr(
    as.character(dat$TIME_PERIOD),
    1,
    4
  )))
  ok_values <- is.finite(values)
  ok_years <- is.finite(years)
  geo_col <- find_geo_col(dat)
  dim_cols <- dimension_columns(dat)
  series_cols <- setdiff(dim_cols, "FREQ")

  units <- if ("UNIT_MEASURE" %in% names(dat)) {
    collapse_non_empty(utils::head(unique(dat$UNIT_MEASURE), 5))
  } else {
    ""
  }
  geos <- if (!is.na(geo_col)) {
    unique(dat[[geo_col]][
      !is.na(dat[[geo_col]]) & nzchar(as.character(dat[[geo_col]]))
    ])
  } else {
    character()
  }
  years_ok <- years[ok_years]

  series_metrics <- calc_series_metrics(dat, values, years, series_cols)
  trend_signal <- safe_quantile(series_metrics$norm_change, 0.95)
  shock_signal <- safe_quantile(series_metrics$norm_yoy, 0.95)
  trend_score <- 25 * min(1, trend_signal / 2)
  shock_score <- 12 * min(1, shock_signal / 2)
  contrast <- calc_contrast(dat, values, years, geo_col)

  best_pattern <- ""
  if (nrow(series_metrics)) {
    eligible <- series_metrics[is.finite(series_metrics$norm_change), ]
    eligible <- eligible[order(-eligible$norm_change), ]
    if (nrow(eligible)) {
      top <- eligible[1, ]
      unit_suffix <- if (nzchar(units)) paste0(" ", units) else ""
      best_pattern <- paste0(
        top$series_label,
        ": ",
        top$year_start,
        " ",
        fmt_num(top$first_value),
        " -> ",
        top$year_end,
        " ",
        fmt_num(top$last_value),
        unit_suffix,
        " (change ",
        fmt_num(top$change),
        ")"
      )
    }
  }
  if (!nzchar(best_pattern)) {
    best_pattern <- contrast$detail
  }
  if (nzchar(contrast$detail) && contrast$score > trend_score) {
    best_pattern <- contrast$detail
  }

  n_geos <- length(geos)
  span <- if (length(years_ok)) {
    max(years_ok, na.rm = TRUE) - min(years_ok, na.rm = TRUE)
  } else {
    NA_integer_
  }
  coverage_score <- min(
    15,
    (min(n_geos, 20) / 20) * 7 + (min(span, 40) / 40) * 8
  )
  missing_pct <- mean(!ok_values)
  quality_score <- 12 * (1 - min(1, missing_pct))
  complexity_penalty <- if (length(dim_cols) > 8) {
    3
  } else if (length(dim_cols) > 5) {
    1
  } else {
    0
  }
  relevance_score <- row$climate_fit +
    row$story_clarity +
    trend_score +
    shock_score +
    contrast$score +
    coverage_score +
    quality_score -
    complexity_penalty
  relevance_score <- min(100, max(0, relevance_score))

  caveats <- c(
    manual_caveat(row$name),
    if (n_geos < 5) "Limited country coverage." else "",
    if (is.finite(span) && span < 10) "Short time span." else "",
    if (missing_pct > 0.2) "Many missing/non-numeric observations." else ""
  )

  data.frame(
    name = row$name,
    status = "ok",
    rows = nrow(dat),
    observations = sum(ok_values),
    countries = n_geos,
    year_start = if (length(years_ok)) {
      min(years_ok, na.rm = TRUE)
    } else {
      NA_integer_
    },
    year_end = if (length(years_ok)) {
      max(years_ok, na.rm = TRUE)
    } else {
      NA_integer_
    },
    year_span = span,
    dimensions = length(dim_cols),
    unit = units,
    missing_pct = missing_pct,
    trend_score = round(trend_score, 1),
    shock_score = round(shock_score, 1),
    contrast_score = round(contrast$score, 1),
    coverage_score = round(coverage_score, 1),
    quality_score = round(quality_score, 1),
    relevance_score = round(relevance_score, 1),
    strongest_pattern = best_pattern,
    story_angle = story_angle(row$name),
    suggested_companions = companion_datasets(row$name),
    caveats = collapse_non_empty(caveats),
    source_url = row$source_url,
    api_url = attr(dat, "api_url"),
    stringsAsFactors = FALSE
  )
}

profiles <- vector("list", nrow(official_datasets))

for (i in seq_len(nrow(official_datasets))) {
  row <- official_datasets[i, ]
  message(sprintf("[%02d/%02d] %s", i, nrow(official_datasets), row$name))
  prof <- try(profile_dataset(row), silent = TRUE)
  if (inherits(prof, "try-error")) {
    profiles[[i]] <- data.frame(
      name = row$name,
      status = "error",
      rows = NA_integer_,
      observations = NA_integer_,
      countries = NA_integer_,
      year_start = NA_integer_,
      year_end = NA_integer_,
      year_span = NA_integer_,
      dimensions = NA_integer_,
      unit = "",
      missing_pct = NA_real_,
      trend_score = 0,
      shock_score = 0,
      contrast_score = 0,
      coverage_score = 0,
      quality_score = 0,
      relevance_score = row$climate_fit + row$story_clarity - 10,
      strongest_pattern = "",
      story_angle = story_angle(row$name),
      suggested_companions = companion_datasets(row$name),
      caveats = paste(
        "Fetch/profile error:",
        gsub("[\r\n]+", " ", as.character(prof))
      ),
      source_url = row$source_url,
      api_url = if (!is.na(row$flow_id)) {
        api_url(row$flow_id, row$version, row$key)
      } else {
        ""
      },
      stringsAsFactors = FALSE
    )
  } else {
    profiles[[i]] <- prof
  }
}

ranked <- do.call(rbind, profiles)
ranked <- ranked[order(-ranked$relevance_score, ranked$name), ]
ranked$rank <- seq_len(nrow(ranked))
ranked <- ranked[, c("rank", setdiff(names(ranked), "rank"))]

write.csv(
  ranked,
  file.path(out_dir, "dataset_relevance_ranked.csv"),
  row.names = FALSE,
  na = ""
)

top_n <- min(12, nrow(ranked))
lines <- c(
  "# Most Relevant Official Datasets for Story Exploration",
  "",
  paste0("Generated: ", format(Sys.time(), "%Y-%m-%d %H:%M %Z")),
  "",
  "Source of official dataset list: https://pacificdatavizchallenge.org/",
  "",
  "Ranking emphasizes trend strength, cross-country contrast, climate relevance, visual clarity, coverage, and data quality. It is an exploration ranking, not a final editorial decision.",
  "",
  sprintf("## Top %d", top_n),
  "",
  "| Rank | Dataset | Score | Coverage | Strongest pattern found | Story angle | Caveats |",
  "|---:|---|---:|---|---|---|---|"
)

for (i in seq_len(top_n)) {
  row <- ranked[i, ]
  coverage <- paste0(
    ifelse(is.na(row$countries), "NA", row$countries),
    " geos, ",
    ifelse(is.na(row$year_start), "NA", row$year_start),
    "-",
    ifelse(is.na(row$year_end), "NA", row$year_end)
  )
  cells <- c(
    row$rank,
    row$name,
    row$relevance_score,
    coverage,
    row$strongest_pattern,
    row$story_angle,
    ifelse(nzchar(row$caveats), row$caveats, "")
  )
  cells <- gsub("\\|", "/", cells)
  lines <- c(lines, paste0("| ", paste(cells, collapse = " | "), " |"))
}

lines <- c(
  lines,
  "",
  "## Full Ranking",
  "",
  "| Rank | Dataset | Score | Status | Rows | Countries | Years | Companion datasets |",
  "|---:|---|---:|---|---:|---:|---|---|"
)

for (i in seq_len(nrow(ranked))) {
  row <- ranked[i, ]
  years <- paste0(
    ifelse(is.na(row$year_start), "NA", row$year_start),
    "-",
    ifelse(is.na(row$year_end), "NA", row$year_end)
  )
  cells <- c(
    row$rank,
    row$name,
    row$relevance_score,
    row$status,
    ifelse(is.na(row$rows), "", row$rows),
    ifelse(is.na(row$countries), "", row$countries),
    years,
    row$suggested_companions
  )
  cells <- gsub("\\|", "/", cells)
  lines <- c(lines, paste0("| ", paste(cells, collapse = " | "), " |"))
}

writeLines(lines, file.path(out_dir, "dataset_relevance_shortlist.md"))

message("Wrote:")
message("  ", file.path(out_dir, "dataset_relevance_ranked.csv"))
message("  ", file.path(out_dir, "dataset_relevance_shortlist.md"))
