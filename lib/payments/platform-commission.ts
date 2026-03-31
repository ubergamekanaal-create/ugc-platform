const DEFAULT_PLATFORM_COMMISSION_PERCENT = 10;

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

export function getPlatformCommissionPercent() {
  const rawValue =
    process.env.PLATFORM_COMMISSION_PERCENT ??
    process.env.NEXT_PUBLIC_PLATFORM_COMMISSION_PERCENT ??
    String(DEFAULT_PLATFORM_COMMISSION_PERCENT);
  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_PLATFORM_COMMISSION_PERCENT;
  }

  return Math.min(100, Math.max(0, roundToCents(parsedValue)));
}

export function calculatePayoutBreakdown(
  grossAmount: number,
  commissionPercent = getPlatformCommissionPercent(),
) {
  const normalizedGrossAmount = roundToCents(Math.max(0, grossAmount));
  const platformFeePercent = Math.min(100, Math.max(0, commissionPercent));
  const platformFeeAmount = roundToCents(
    (normalizedGrossAmount * platformFeePercent) / 100,
  );
  const creatorAmount = roundToCents(
    Math.max(normalizedGrossAmount - platformFeeAmount, 0),
  );

  return {
    grossAmount: normalizedGrossAmount,
    platformFeePercent,
    platformFeeAmount,
    creatorAmount,
  };
}
