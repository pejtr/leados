export type ABVariant = "A" | "B";

export interface VariantMetrics {
  variant: ABVariant;
  pageViews: number;
  ctaClicks: number;
  formSubmits: number;
  conversions: number;
  conversionRate: number;
  ctr: number;
}

type MutableVariantMetrics = Omit<VariantMetrics, "conversionRate" | "ctr">;

const counters: Record<ABVariant, MutableVariantMetrics> = {
  A: { variant: "A", pageViews: 0, ctaClicks: 0, formSubmits: 0, conversions: 0 },
  B: { variant: "B", pageViews: 0, ctaClicks: 0, formSubmits: 0, conversions: 0 },
};

export function recordABTestEvent(variant: ABVariant, event: string, metadata?: Record<string, unknown>) {
  if (metadata?.ab_experiment_exposed !== true) return;

  const metrics = counters[variant];

  if (event === "page_view" && metadata.path === "/") metrics.pageViews += 1;
  if ((event === "hero_cta_click" || event === "cta_click") && metadata.path === "/") metrics.ctaClicks += 1;
  if (event === "form_submit") {
    metrics.formSubmits += 1;
    metrics.conversions += 1;
  }
}

function withRates(metrics: MutableVariantMetrics): VariantMetrics {
  return {
    ...metrics,
    conversionRate: metrics.pageViews > 0 ? (metrics.conversions / metrics.pageViews) * 100 : 0,
    ctr: metrics.pageViews > 0 ? (metrics.ctaClicks / metrics.pageViews) * 100 : 0,
  };
}

export async function getABTestMetrics(): Promise<VariantMetrics[]> {
  return [withRates(counters.A), withRates(counters.B)];
}

export async function getWinningVariant(): Promise<ABVariant | null> {
  const metrics = await getABTestMetrics();
  if (metrics.every(metric => metric.pageViews === 0)) return null;

  return metrics.reduce((best, current) =>
    current.conversionRate > best.conversionRate ? current : best
  ).variant;
}

export async function getABTestSummary() {
  const metrics = await getABTestMetrics();
  const totalPageViews = metrics.reduce((sum, metric) => sum + metric.pageViews, 0);
  const totalConversions = metrics.reduce((sum, metric) => sum + metric.conversions, 0);
  const overallConversionRate = totalPageViews > 0
    ? ((totalConversions / totalPageViews) * 100).toFixed(2)
    : "0.00";

  return {
    totalPageViews,
    totalConversions,
    overallConversionRate,
    winningVariant: await getWinningVariant(),
    metrics,
    dataSource: "process-memory" as const,
  };
}
