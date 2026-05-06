import React from 'react'

export default function Textarea({ label, error, className = '', rows = 3, ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <textarea
        className={`input textarea ${error ? 'input-error' : ''}`}
        rows={rows}
        {...props}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
