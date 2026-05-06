import React from 'react'

export default function Input({ label, error, prefix, suffix, className = '', ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <div className={`field-wrap ${prefix ? 'has-prefix' : ''} ${suffix ? 'has-suffix' : ''}`}>
        {prefix && <span className="field-prefix">{prefix}</span>}
        <input className={`input ${error ? 'input-error' : ''}`} {...props} />
        {suffix && <span className="field-suffix">{suffix}</span>}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
