import * as d3 from "d3";

const formatSigned = d3.format("+,.0f");

export function formatSignedValue(value: number): string {
  return value === 0 ? "0" : formatSigned(value);
}

export function formatCompact(value: number): string {
  return d3.format(".3~s")(value).replace("G", "bn").replace("M", "m");
}

export function formatCurrency(value: number): string {
  return `$${formatCompact(value)}`;
}

export function reportedNumber(value: number): string {
  return value > 0 ? formatCompact(value) : "Not reported";
}

export function reportedCurrency(value: number): string {
  return value > 0 ? formatCurrency(value) : "Not reported";
}
