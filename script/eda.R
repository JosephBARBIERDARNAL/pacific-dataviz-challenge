suppressPackageStartupMessages(library(tidyverse))

data_dir <- "data"
chart_dir <- "charts"
dir.create(chart_dir, showWarnings = FALSE, recursive = TRUE)

sea_historical <- read.csv(file.path(data_dir, "sea_level_historical.csv"))
summary <- read.csv(file.path(data_dir, "country_summary.csv"))

theme_simple <- theme_minimal(base_size = 12) +
  theme(
    plot.title = element_text(face = "bold"),
    panel.grid.minor = element_blank()
  )

save <- function(plot, name) {
  ggsave(file.path(chart_dir, name), plot, width = 8, height = 5, dpi = 220)
}

p1 <- ggplot(sea_historical, aes(year, sea_level_anomaly_mm)) +
  geom_hline(yintercept = 0, color = "grey70") +
  geom_line(color = "#187A8C", linewidth = 0.6) +
  facet_wrap(vars(country), scales = "free_x") +
  labs(
    title = "Historical relative sea-level anomaly",
    subtitle = "Country-level tide-gauge series, relative to 1993-2000",
    x = NULL,
    y = "Anomaly (mm)"
  ) +
  scale_x_continuous(breaks = scales::breaks_pretty(3)) +
  theme_simple +
  theme(strip.text = element_text(face = "bold"))

rise <- summary[order(summary$sea_level_rise_mm, decreasing = TRUE), ]
rise <- head(rise, 12)
rise$country <- factor(rise$country, levels = rev(rise$country))

p2 <- ggplot(rise, aes(country, sea_level_rise_mm)) +
  geom_col(fill = "#D65F2A") +
  coord_flip() +
  labs(
    title = "Largest sea-level anomaly rises",
    subtitle = "2019-2023 average minus 1993-1997 average",
    x = NULL,
    y = "Rise (mm)"
  ) +
  theme_simple

affected <- summary[
  order(summary$affected_people_2005_2023, decreasing = TRUE),
]
affected <- head(affected, 12)
affected$country <- factor(affected$country, levels = rev(affected$country))

p3 <- ggplot(
  affected,
  aes(country, affected_people_2005_2023)
) +
  geom_col(fill = "#5A7F40") +
  coord_flip() +
  scale_y_continuous(labels = scales::comma) +
  labs(
    title = "People directly affected by disasters",
    subtitle = "Cumulative reported total, 2005-2023",
    x = NULL,
    y = "People"
  ) +
  theme_simple

save(p1, "01_historical_sea_level_by_country.png")
save(p2, "02_sea_level_rise_by_country.png")
save(p3, "03_disaster_affected_people.png")
