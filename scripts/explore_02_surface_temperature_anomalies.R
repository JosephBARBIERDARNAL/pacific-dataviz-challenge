args <- commandArgs(FALSE)
file_arg <- sub("^--file=", "", args[grep("^--file=", args)])
script_dir <- if (length(file_arg)) dirname(normalizePath(file_arg)) else "scripts"
source(file.path(script_dir, "story_explore_helpers.R"))

run_temperature_exploration(
  dataset_name = "Mean surface temperature anomalies",
  indicator_code = "ST_ANOM",
  output_prefix = "02_surface_temperature_anomalies",
  subject_label = "surface temperature",
  source_url = "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.ST_ANOM.&pd=,&to[TIME_PERIOD]=false"
)
