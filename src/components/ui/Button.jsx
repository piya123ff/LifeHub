import React from 'react'

/**
 * <Button variant="primary|ghost|danger|icon" size="sm|md|lg" loading disabled>
 */
export default function Button({
  children, variant = 'ghost', size = 'md',
  loading = false, disabled = false,
  className = '', onClick, type = 'button', ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-size-${size} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading && (
        <svg className="btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" strokeLinecap="round"/>
        </svg>
      )}
      {children}
    </button>
  )
}
