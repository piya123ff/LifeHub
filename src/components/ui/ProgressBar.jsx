import React from 'react'
import { percentage } from '../../utils/calculations.js'

export default function ProgressBar({ value, total, color = 'violet', height = 6, showLabel = false }) {
  const pct = percentage(value, total)
  return (
    <div className="progress-wrap">
      {showLabel && (
        <div className="progress-label">
          <span>{pct}%</span>
          <span className="text-muted">{value} / {total}</span>
        </div>
      )}
      <div className="progress-track" style={{ height }}>
        <div
          className={`progress-fill fill-${color}`}
          style={{ width: `${pct}%`, height }}
        />
      </div>
    </div>
  )
}
