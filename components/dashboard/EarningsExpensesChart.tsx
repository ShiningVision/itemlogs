// components/dashboard/EarningsExpensesChart.tsx
import { getTranslations } from 'next-intl/server';
import { getSoldTotals } from '@/app/lib/services/items';

// Hand-rolled SVG rather than a charting library — this is genuinely just
// two bars, and the app already leans toward small flat-color SVGs
// elsewhere (see the contact-channel icons) rather than pulling in a
// dependency for something this simple.
function formatMoney(amount: number, symbol: string) {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function EarningsExpensesChart({ currencySymbol }: { currencySymbol: string }) {
  const t = await getTranslations('dashboard');
  const { totalCost, totalSell, soldCount } = await getSoldTotals();

  if (soldCount === 0) {
    return (
      <div className="dashboard-card dashboard-chart-card">
        <h2 className="dashboard-card-title">{t('chartEarningsExpensesTitle')}</h2>
        <p className="dashboard-chart-empty">{t('chartEarningsExpensesEmpty')}</p>
      </div>
    );
  }

  const profit = totalSell - totalCost;
  const max = Math.max(totalSell, totalCost, 1);
  const sellPct = Math.max(2, Math.round((totalSell / max) * 100));
  const costPct = Math.max(2, Math.round((totalCost / max) * 100));

  return (
    <div className="dashboard-card dashboard-chart-card">
      <h2 className="dashboard-card-title">{t('chartEarningsExpensesTitle')}</h2>

      <div className={`dashboard-chart-headline${profit >= 0 ? ' dashboard-chart-headline--positive' : ' dashboard-chart-headline--negative'}`}>
        {formatMoney(profit, currencySymbol)}
        <span className="dashboard-chart-headline-label">{t('chartProfitLabel')}</span>
      </div>

      <div className="dashboard-bar-row">
        <span className="dashboard-bar-label">{t('chartEarningsLabel')}</span>
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="dashboard-bar-svg" role="img" aria-label={formatMoney(totalSell, currencySymbol)}>
          <rect x="0" y="0" width="100" height="10" rx="3" className="dashboard-bar-track" />
          <rect x="0" y="0" width={sellPct} height="10" rx="3" className="dashboard-bar-fill dashboard-bar-fill--sell" />
        </svg>
        <span className="dashboard-bar-value">{formatMoney(totalSell, currencySymbol)}</span>
      </div>

      <div className="dashboard-bar-row">
        <span className="dashboard-bar-label">{t('chartExpensesLabel')}</span>
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="dashboard-bar-svg" role="img" aria-label={formatMoney(totalCost, currencySymbol)}>
          <rect x="0" y="0" width="100" height="10" rx="3" className="dashboard-bar-track" />
          <rect x="0" y="0" width={costPct} height="10" rx="3" className="dashboard-bar-fill dashboard-bar-fill--cost" />
        </svg>
        <span className="dashboard-bar-value">{formatMoney(totalCost, currencySymbol)}</span>
      </div>

      <p className="dashboard-chart-footnote">{t('chartEarningsExpensesFootnote', { count: soldCount })}</p>
    </div>
  );
}
