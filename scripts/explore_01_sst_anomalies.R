args <- commandArgs(FALSE)
file_arg <- sub("^--file=", "", args[grep("^--file=", args)])
script_dir <- if (length(file_arg)) dirname(normalizePath(file_arg)) else "scripts"
source(file.path(script_dir, "story_explore_helpers.R"))

run_temperature_exploration(
  dataset_name = "Mean sea surface temperature anomalies",
  indicator_code = "SST_ANOM",
  output_prefix = "01_sst_anomalies",
  subject_label = "sea-surface temperature",
  source_url = "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.SST_ANOM.&pd=,&to[TIME_PERIOD]=false"
)
