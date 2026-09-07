import { formatMoney } from '@/shared/utils';

const WIDTH = 800;
const HEIGHT = 340;
const PADDING = { top: 26, right: 28, bottom: 54, left: 84 };

function createScale(domainStart, domainEnd, rangeStart, rangeEnd) {
  const domainSize = domainEnd - domainStart || 1;
  return (value) => rangeStart + ((value - domainStart) / domainSize) * (rangeEnd - rangeStart);
}

function getNiceStep(range, targetTickCount = 5) {
  const roughStep = range / targetTickCount || 1;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const niceFactor = [1, 2, 2.5, 5, 10].find((factor) => normalizedStep <= factor) ?? 10;
  return niceFactor * magnitude;
}

function getMoneyTicks(values) {
  let minimum = Math.min(0, ...values);
  let maximum = Math.max(0, ...values);

  if (minimum === maximum) {
    const padding = Math.max(1, Math.abs(maximum) * 0.1);
    minimum -= padding;
    maximum += padding;
  }

  const step = getNiceStep(maximum - minimum);
  const niceMinimum = Math.floor(minimum / step) * step;
  const niceMaximum = Math.ceil(maximum / step) * step;
  const ticks = [];

  for (let value = niceMinimum; value <= niceMaximum + step / 1000; value += step) {
    ticks.push(Number(value.toFixed(10)));
  }

  return { minimum: niceMinimum, maximum: niceMaximum, ticks };
}

function getMonthTicks(firstDate, lastDate) {
  const ticks = [];
  const date = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);

  while (date <= lastDate) {
    ticks.push(new Date(date));
    date.setMonth(date.getMonth() + 1);
  }

  return ticks;
}

function formatMonth(date) {
  return new Intl.DateTimeFormat('es-ES', { month: 'short' })
    .format(date)
    .replace('.', '');
}

function getAxisLabelTicks(monthTicks) {
  const firstVisibleMonthByYear = new Set();

  return monthTicks.filter((date) => {
    const year = date.getFullYear();
    if (!firstVisibleMonthByYear.has(year)) {
      firstVisibleMonthByYear.add(year);
      return true;
    }

    return [3, 6, 9].includes(date.getMonth());
  });
}

export default function BalanceChart({ data, onSelectDate }) {
  if (!data.length) return <p className="balance-chart__empty">Todavía no hay movimientos para mostrar.</p>;

  const dates = data.map((point) => point.date.getTime());
  const balances = data.map((point) => point.balance);
  const x = createScale(Math.min(...dates), Math.max(...dates), PADDING.left, WIDTH - PADDING.right);
  const { minimum: minBalance, maximum: maxBalance, ticks: moneyTicks } = getMoneyTicks(balances);
  const y = createScale(minBalance, maxBalance, HEIGHT - PADDING.bottom, PADDING.top);
  const path = data.map((point, index) => `${index ? 'L' : 'M'} ${x(point.date.getTime())} ${y(point.balance)}`).join(' ');
  const monthTicks = getMonthTicks(data[0].date, data.at(-1).date);
  const axisLabelTicks = getAxisLabelTicks(monthTicks);
  const firstVisibleMonthByYear = new Set();

  return (
    <div className="balance-chart__canvas">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Evolución acumulada de los movimientos">
        {moneyTicks.map((value) => <g key={value}><line className="balance-chart__grid" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y(value)} y2={y(value)} /><text className="balance-chart__axis" x={PADDING.left - 10} y={y(value) + 4} textAnchor="end">{formatMoney(value)}</text></g>)}
        {monthTicks.map((date) => {
          const monthX = Math.max(PADDING.left, x(date.getTime()));
          return <line className="balance-chart__month-grid" key={date.toISOString()} x1={monthX} x2={monthX} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} />;
        })}
        {axisLabelTicks.map((date) => {
          const monthX = Math.max(PADDING.left, x(date.getTime()));
          const year = date.getFullYear();
          const isFirstVisibleMonthOfYear = !firstVisibleMonthByYear.has(year);
          firstVisibleMonthByYear.add(year);
          return <text className="balance-chart__axis" key={date.toISOString()} x={monthX} y={HEIGHT - PADDING.bottom + 23} textAnchor="middle">{isFirstVisibleMonthOfYear ? year : formatMonth(date)}</text>;
        })}
        <line className="balance-chart__axis-line" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={HEIGHT - PADDING.bottom} y2={HEIGHT - PADDING.bottom} />
        <path className="balance-chart__line" d={path} />
        {data.map((point) => <circle className="balance-chart__point" key={point.date.toISOString()} cx={x(point.date.getTime())} cy={y(point.balance)} r="5" tabIndex="0" role="button" aria-label={`Ver movimientos del ${point.date.toLocaleDateString('es-ES')}`} onClick={() => onSelectDate(point.date)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelectDate(point.date); }}><title>{`${point.date.toLocaleDateString('es-ES')}: ${formatMoney(point.balance)}`}</title></circle>)}
      </svg>
      <p className="balance-chart__hint">Selecciona un punto para ver los movimientos de ese día.</p>
    </div>
  );
}
