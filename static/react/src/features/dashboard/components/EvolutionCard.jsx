import { useMemo } from 'react';
import { useActiveCurrency } from '@/features/session';
import { formatMoney } from '@/shared/utils';
import './dashboard.css';

const WIDTH = 720;
const HEIGHT = 300;
const PADDING = { top: 20, right: 20, bottom: 44, left: 76 };

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

function formatShortMonth(year, month) {
  return new Intl.DateTimeFormat('es-ES', { month: 'short' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '');
}

function formatLongMonth(year, month) {
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1));
}

export default function EvolutionCard({ evolution }) {
  const currency = useActiveCurrency();
  const points = useMemo(
    () => (Array.isArray(evolution) ? evolution : []),
    [evolution],
  );

  if (!points.length) {
    return (
      <section className="dash-evolution" aria-labelledby="evolution-title">
        <header className="dash-evolution__header">
          <h2 id="evolution-title">Evolución</h2>
        </header>
        <p className="dash-evolution__empty">Todavía no hay movimientos para mostrar.</p>
      </section>
    );
  }

  const ingresos = points.map((point) => Number(point.ingresos) || 0);
  const egresos = points.map((point) => Number(point.egresos) || 0);
  const { minimum, maximum, ticks } = getMoneyTicks([...ingresos, ...egresos]);
  const x = createScale(0, points.length - 1, PADDING.left, WIDTH - PADDING.right);
  const y = createScale(minimum, maximum, HEIGHT - PADDING.bottom, PADDING.top);
  const toPath = (values) => values.map((value, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(value)}`).join(' ');

  return (
    <section className="dash-evolution" aria-labelledby="evolution-title">
      <header className="dash-evolution__header">
        <h2 id="evolution-title">Evolución</h2>
        <div className="dash-evolution__legend">
          <span className="dash-evolution__legend-item"><i className="dash-evolution__dot dash-evolution__dot--income" />Ingresos</span>
          <span className="dash-evolution__legend-item"><i className="dash-evolution__dot dash-evolution__dot--expense" />Egresos</span>
        </div>
      </header>
      <div className="dash-evolution__canvas">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Evolución mensual de ingresos y egresos">
          {ticks.map((value) => (
            <g key={value}>
              <line className="dash-evolution__grid" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y(value)} y2={y(value)} />
              <text className="dash-evolution__axis" x={PADDING.left - 10} y={y(value) + 4} textAnchor="end">{formatMoney(value, currency)}</text>
            </g>
          ))}
          {points.map((point, index) => (
            <text className="dash-evolution__axis" key={point.key ?? `${point.year}-${point.month}`} x={x(index)} y={HEIGHT - PADDING.bottom + 23} textAnchor="middle">
              {formatShortMonth(point.year, point.month)}
            </text>
          ))}
          <line className="dash-evolution__axis-line" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={HEIGHT - PADDING.bottom} y2={HEIGHT - PADDING.bottom} />
          <path className="dash-evolution__line dash-evolution__line--income" d={toPath(ingresos)} />
          <path className="dash-evolution__line dash-evolution__line--expense" d={toPath(egresos)} />
          {points.map((point, index) => (
            <g key={point.key ?? `${point.year}-${point.month}-points`}>
              <circle className="dash-evolution__point dash-evolution__point--income" cx={x(index)} cy={y(ingresos[index])} r="5" tabIndex="0" aria-label={`${formatLongMonth(point.year, point.month)}: ingresos ${formatMoney(ingresos[index], currency)}`}>
                <title>{`${formatLongMonth(point.year, point.month)}: ingresos ${formatMoney(ingresos[index], currency)}`}</title>
              </circle>
              <circle className="dash-evolution__point dash-evolution__point--expense" cx={x(index)} cy={y(egresos[index])} r="5" tabIndex="0" aria-label={`${formatLongMonth(point.year, point.month)}: egresos ${formatMoney(egresos[index], currency)}`}>
                <title>{`${formatLongMonth(point.year, point.month)}: egresos ${formatMoney(egresos[index], currency)}`}</title>
              </circle>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
