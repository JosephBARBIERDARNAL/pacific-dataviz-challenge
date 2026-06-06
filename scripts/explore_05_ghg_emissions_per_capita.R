args <- commandArgs(FALSE)
file_arg <- sub("^--file=", "", args[grep("^--file=", args)])
script_dir <- if (length(file_arg)) dirname(normalizePath(file_arg)) else "scripts"
source(file.path(script_dir, "story_explore_helpers.R"))

run_ghg_exploration(
  output_prefix = "05_ghg_emissions_per_capita",
  source_url = "https://stats.pacificdata.org/vis?lc=en&df[ds]=SPC2&df[id]=DF_CLIMATE_CHANGE&df[ag]=SPC&df[vs]=1.0&av=true&dq=A.GHG_EMI_CAPITA.&pd=,&to[TIME_PERIOD]=false"
)
