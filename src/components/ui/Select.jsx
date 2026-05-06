import React from 'react'

export default function Select({ label, error, options = [], placeholder, className = '', ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <div className="field-wrap select-wrap">
        <select className={`input select ${error ? 'input-error' : ''}`} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.emoji ? `${opt.emoji} ` : ''}{opt.label ?? opt}
            </option>
          ))}
        </select>
        <svg className="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
