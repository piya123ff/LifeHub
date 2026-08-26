import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = import.meta.env.BASE_URL || '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--text-primary, #fff)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 8px' }}>
            เกิดข้อผิดพลาดในการแสดงผล
          </h2>
          <p style={{ color: 'var(--text-secondary, #a1a1aa)', maxWidth: '420px', fontSize: '0.9rem', margin: '0 0 20px' }}>
            ระบบตรวจพบข้อผิดพลาดที่ไม่คาดคิด คุณสามารถลองรีโหลดหน้าเว็บ หรือกลับไปที่หน้าหลักได้ครับ
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleReload}
              className="btn btn-primary"
              style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: '8px' }}
            >
              🔄 รีโหลดหน้านี้
            </button>
            <button
              onClick={this.handleGoHome}
              className="btn btn-secondary"
              style={{ padding: '8px 18px', cursor: 'pointer', borderRadius: '8px' }}
            >
              🏠 กลับหน้าหลัก
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
