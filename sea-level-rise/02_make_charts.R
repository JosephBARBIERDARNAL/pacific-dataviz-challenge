args <- commandArgs(FALSE)
file_arg <- sub("^--file=", "", args[grep("^--file=", args)])
root <- if (length(file_arg)) dirname(normalizePath(file_arg)) else getwd()
data_dir <- file.path(root, "data")
chart_dir <- file.path(root, "charts")
dir.create(chart_dir, showWarnings = FALSE, recursive = TRUE)

sea <- utils::read.csv(file.path(data_dir, "sea_level.csv"))
summary <- utils::read.csv(file.path(data_dir, "country_summary.csv"))

theme_simple <- ggplot2::theme_minimal(base_size = 12) +
  ggplot2::theme(
    plot.title = ggplot2::element_text(face = "bold"),
    panel.grid.minor = ggplot2::element_blank()
  )

save <- function(plot, name) {
  ggplot2::ggsave(
    file.path(chart_dir, name),
    plot,
    width = 8,
    height = 5,
    dpi = 160
  )
}

regional <- stats::aggregate(sea_level_mm ~ year, sea, mean)

p1 <- ggplot2::ggplot(regional, ggplot2::aes(year, sea_level_mm)) +
  ggplot2::geom_hline(yintercept = 0, color = "grey70") +
  ggplot2::geom_line(color = "#187A8C", linewidth = 0.9) +
  ggplot2::labs(
    title = "Regional sea-level anomaly",
    x = NULL,
    y = "Anomaly (mm)"
  ) +
  theme_simple

rise <- summary[order(summary$sea_level_rise_mm, decreasing = TRUE), ]
rise <- utils::head(rise, 12)
rise$country <- factor(rise$country, levels = rev(rise$country))

p2 <- ggplot2::ggplot(rise, ggplot2::aes(country, sea_level_rise_mm)) +
  ggplot2::geom_col(fill = "#D65F2A") +
  ggplot2::coord_flip() +
  ggplot2::labs(
    title = "Largest sea-level anomaly rises",
    subtitle = "2019-2023 average minus 1993-1997 average",
    x = NULL,
    y = "Rise (mm)"
  ) +
  theme_simple

affected <- summary[
  order(summary$affected_people_2005_2023, decreasing = TRUE),
]
affected <- utils::head(affected, 12)
affected$country <- factor(affected$country, levels = rev(affected$country))

p3 <- ggplot2::ggplot(
  affected,
  ggplot2::aes(country, affected_people_2005_2023)
) +
  ggplot2::geom_col(fill = "#5A7F40") +
  ggplot2::coord_flip() +
  ggplot2::scale_y_continuous(labels = scales::comma) +
  ggplot2::labs(
    title = "People directly affected by disasters",
    subtitle = "Cumulative reported total, 2005-2023",
    x = NULL,
    y = "People"
  ) +
  theme_simple

scatter <- summary[summary$affected_people_2005_2023 > 0, ]
scatter$loss_size <- pmax(scatter$loss_usd_2007_2020, 1)

p4 <- ggplot2::ggplot(
  scatter,
  ggplot2::aes(sea_level_rise_mm, affected_people_2005_2023)
) +
  ggplot2::geom_point(
    ggplot2::aes(size = loss_size),
    color = "#187A8C",
    alpha = 0.7
  ) +
  ggplot2::scale_y_log10(labels = scales::comma) +
  ggplot2::scale_size_continuous(range = c(2, 9), guide = "none") +
  ggplot2::labs(
    title = "Sea-level rise and disaster exposure",
    subtitle = "Point size represents reported disaster losses",
    x = "Sea-level anomaly rise (mm)",
    y = "People affected, log scale"
  ) +
  theme_simple

growth <- summary[is.finite(summary$population_growth_2020_2025_pct), ]
growth <- growth[
  order(growth$population_growth_2020_2025_pct, decreasing = TRUE),
]
growth <- utils::head(growth, 12)
growth$country <- factor(growth$country, levels = rev(growth$country))

p5 <- ggplot2::ggplot(
  growth,
  ggplot2::aes(country, population_growth_2020_2025_pct)
) +
  ggplot2::geom_col(fill = "#7B6AA8") +
  ggplot2::coord_flip() +
  ggplot2::labs(
    title = "Recent population growth",
    subtitle = "Average annual growth, 2020-2025",
    x = NULL,
    y = "Growth (%)"
  ) +
  theme_simple

save(p1, "01_regional_sea_level.png")
save(p2, "02_sea_level_rise_by_country.png")
save(p3, "03_disaster_affected_people.png")
save(p4, "04_sea_level_and_disaster_exposure.png")
save(p5, "05_population_growth.png")
