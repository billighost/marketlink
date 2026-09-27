import React, { useState } from 'react';
import styles from './BarChart.module.css';

/**
 * Shared BarChart component (Pure SVG, accessible, responsive, minimal).
 * Supports vertical columns (Insights & Reports) and horizontal rows (Revenue by Market).
 *
 * @param {object} props
 * @param {Array<{ label: string, value: number, valueLabel?: string }>} props.data
 * @param {number} [props.height=160]
 * @param {number} [props.highlightIndex]
 * @param {string} [props.ariaLabel]
 * @param {function} [props.valueFormatter]
 * @param {'vertical'|'horizontal'} [props.layout='vertical']
 */
export function BarChart({
  data = [],
  height = 160,
  highlightIndex,
  ariaLabel,
  valueFormatter = (v) => String(v),
  layout = 'vertical',
  className = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className={`${styles.emptyChart} ${className}`} style={{ height }}>
        <p className={styles.emptyText}>No data available for this range.</p>
      </div>
    );
  }

  const values = data.map((d) => (typeof d.value === 'number' && !isNaN(d.value) ? d.value : 0));
  const maxVal = Math.max(1, ...values);

  // Compute active item display text for the top preview line
  const activeIdx = hoveredIdx !== null ? hoveredIdx : highlightIndex !== undefined ? highlightIndex : null;
  const activeItem = activeIdx !== null && data[activeIdx] ? data[activeIdx] : null;

  // Auto-generate accessible aria label if not provided
  let computedAriaLabel = ariaLabel;
  if (!computedAriaLabel) {
    let highestIdx = 0;
    values.forEach((v, i) => {
      if (v > values[highestIdx]) highestIdx = i;
    });
    const highestItem = data[highestIdx] || { label: '', value: 0 };
    computedAriaLabel = `Chart with ${data.length} items. Highest is ${valueFormatter(highestItem.value)} on ${highestItem.label}.`;
  }

  // Horizontal Layout
  if (layout === 'horizontal') {
    return (
      <div className={`${styles.wrapper} ${className}`}>
        {activeItem && (
          <div className={styles.activeDisplay}>
            <span className={styles.activeLabel}>{activeItem.label}:</span>{' '}
            <strong className={styles.activeValue}>
              {activeItem.valueLabel || valueFormatter(activeItem.value)}
            </strong>
          </div>
        )}

        <div className={styles.horizontalContainer} role="img" aria-label={computedAriaLabel}>
          {data.map((item, idx) => {
            const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
            const isHighlighted = idx === activeIdx;

            return (
              <div
                key={idx}
                className={`${styles.hRow} ${isHighlighted ? styles.highlightedRow : ''}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                tabIndex={0}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx(null)}
              >
                <div className={styles.hLabel} title={item.label}>
                  {item.label}
                </div>
                <div className={styles.hBarTrack}>
                  <div
                    className={`${styles.hBarFill} ${isHighlighted ? styles.hBarHighlight : ''}`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <div className={styles.hValue}>
                  {item.valueLabel || valueFormatter(item.value)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Accessible table alternative */}
        <details className={styles.tableDetails}>
          <summary className={styles.tableSummary}>View as table</summary>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i}>
                  <td>{item.label}</td>
                  <td>{item.valueLabel || valueFormatter(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    );
  }

  // Vertical SVG Layout
  const barW = 20;
  const gap = 12;
  const W = Math.max(120, data.length * (barW + gap));
  const chartH = height - 32; // Reserve bottom 32px for x-axis labels

  // Pick up to 5 label positions: first, last, and evenly spaced (or all if <= 8 items)
  const labelIndices = new Set();
  if (data.length <= 8) {
    data.forEach((_, i) => labelIndices.add(i));
  } else {
    labelIndices.add(0);
    labelIndices.add(data.length - 1);
    const step = (data.length - 1) / 4;
    for (let i = 1; i < 4; i++) {
      labelIndices.add(Math.round(i * step));
    }
  }

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {/* Small informative text line above chart */}
      <div className={styles.activeDisplay}>
        {activeItem ? (
          <>
            <span className={styles.activeLabel}>{activeItem.label}:</span>{' '}
            <strong className={styles.activeValue}>
              {activeItem.valueLabel || valueFormatter(activeItem.value)}
            </strong>
          </>
        ) : (
          <span className={styles.activeHint}>Hover or tap a bar for details</span>
        )}
      </div>

      <div className={styles.svgContainer}>
        {/* Y-axis max label indicator */}
        <div className={styles.yMaxLabel}>{valueFormatter(maxVal)}</div>

        <div className={styles.svgScroll}>
          <svg
            viewBox={`0 0 ${W} ${chartH}`}
            className={styles.svg}
            style={{ width: '100%', minWidth: `${W}px`, height: `${chartH}px` }}
            role="img"
            aria-label={computedAriaLabel}
            preserveAspectRatio="none"
          >
            {/* Baseline hairline */}
            <line
              x1="0"
              y1={chartH - 1}
              x2={W}
              y2={chartH - 1}
              className={styles.baseline}
            />

            {/* Bars */}
            {data.map((item, idx) => {
              const barHeight = maxVal > 0 ? (item.value / maxVal) * (chartH - 10) : 0;
              const x = idx * (barW + gap) + gap / 2;
              const y = chartH - 1 - barHeight;
              const isHighlighted = idx === activeIdx;

              return (
                <g
                  key={idx}
                  className={styles.barGroup}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(idx)}
                >
                  {/* Invisible larger hit target for touch accessibility */}
                  <rect
                    x={x - gap / 4}
                    y={0}
                    width={barW + gap / 2}
                    height={chartH}
                    fill="transparent"
                    className={styles.hitTarget}
                  />
                  {/* Rendered Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(2, barHeight)}
                    rx="3"
                    className={`${styles.bar} ${isHighlighted ? styles.barHighlight : ''}`}
                  />
                </g>
              );
            })}
          </svg>

          {/* HTML X-axis Labels (never stretched by SVG aspect-ratio scaling) */}
          <div className={styles.xAxisRow} aria-hidden="true" style={{ width: '100%', minWidth: `${W}px` }}>
            {data.map((item, idx) => {
              const showLabel = labelIndices.has(idx);
              const isHighlighted = idx === activeIdx;
              const leftPct = ((idx + 0.5) / data.length) * 100;

              return (
                <div
                  key={idx}
                  className={`${styles.xAxisCell} ${isHighlighted ? styles.xAxisCellActive : ''}`}
                  style={{ left: `${leftPct}%` }}
                >
                  {showLabel ? item.label : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accessible data table alternative */}
      <details className={styles.tableDetails}>
        <summary className={styles.tableSummary}>View as table</summary>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Date / Item</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i}>
                <td>{item.label}</td>
                <td>{item.valueLabel || valueFormatter(item.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export default BarChart;