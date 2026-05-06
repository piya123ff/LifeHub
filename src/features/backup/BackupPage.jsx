import React, { useState, useRef } from 'react'
import { backupService } from '../../services/backupService.js'
import { appDataService } from '../../services/appDataService.js'
import './BackupPage.css'

function fmtBytes(n) {
  if (n < 1024) return n + ' B'
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1048576).toFixed(2) + ' MB'
}

function Toast({ msg, type }) {
  if (!msg) return null
  return React.createElement('div', { className: 'backup-toast backup-toast--' + type }, msg)
}

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <div className="backup-card">
      <div className="backup-card-head">
        <span className="backup-card-icon">{icon}</span>
        <div>
          <p className="backup-card-title">{title}</p>
          {subtitle && <p className="backup-card-sub">{subtitle}</p>}
        </div>
      </div>
      <div className="backup-card-body">{children}</div>
    </div>
  )
}

function ExportCard({ onFlash }) {
  const storageSize = backupService.getStorageSize()
  const [exporting, setExporting] = useState(false)
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const dateStr = now.getFullYear() + '-' + mm + '-' + dd

  function handleExport() {
    setExporting(true)
    try {
      backupService.export()
      onFlash('Export backup สำเร็จ', 'ok')
    } catch (e) {
      onFlash('Export ล้มเหลว: ' + e.message, 'error')
    } finally {
      setTimeout(() => setExporting(false), 800)
    }
  }

  return (
    <SectionCard icon="📤" title="Export ข้อมูล" subtitle="บันทึกข้อมูลทั้งหมดเป็นไฟล์ JSON">
      <div className="backup-info-row">
        <div className="backup-info-item">
          <span className="backup-info-label">ขนาดข้อมูล</span>
          <span className="backup-info-value">{fmtBytes(storageSize)}</span>
        </div>
        <div className="backup-info-item">
          <span className="backup-info-label">ชื่อไฟล์</span>
          <span className="backup-info-value backup-info-mono">lifehub-backup-{dateStr}.json</span>
        </div>
      </div>
      <div className="backup-covers">
        <p className="backup-covers-label">ครอบคลุมข้อมูล:</p>
        <div className="backup-covers-chips">
          {['💰 การเงิน', '✅ To-Do', '🏋️ Workout', '❤️ สุขภาพ', '🎯 เป้าหมาย'].map(t => (
            <span key={t} className="backup-chip">{t}</span>
          ))}
        </div>
      </div>
      <button
        className="btn btn-primary backup-action-btn"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? '⏳ กำลัง Export...' : '📥 Download Backup (.json)'}
      </button>
    </SectionCard>
  )
}

function ImportCard({ onFlash }) {
  const fileRef = useRef(null)
  const [preview,   setPreview]   = useState(null)
  const [fileObj,   setFileObj]   = useState(null)
  const [importing, setImporting] = useState(false)
  const [confirm,   setConfirm]   = useState(false)
  const [error,     setError]     = useState(null)

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setError(null)
    setConfirm(false)
    if (!file.name.endsWith('.json')) {
      setError('กรุณาเลือกไฟล์ .json เท่านั้น')
      setPreview(null)
      setFileObj(null)
      return
    }
    const reader = new FileReader()
    reader.onload = function(evt) {
      try {
        const data = JSON.parse(evt.target.result)
        const keys = ['finance', 'todos', 'workouts', 'health', 'goals']
        if (!keys.some(function(k) { return data[k] !== undefined })) {
          setError('ไฟล์นี้ไม่ใช่ LifeHub backup หรือเสียหาย')
          setPreview(null)
          setFileObj(null)
          return
        }
        setPreview({
          version:    data.version    || 'unknown',
          exportedAt: data.exportedAt ? new Date(data.exportedAt).toLocaleString('th-TH') : 'ไม่ทราบ',
          finance:    data.finance    ? data.finance.length  : 0,
          todos:      data.todos      ? data.todos.length    : 0,
          workouts:   data.workouts   ? data.workouts.length : 0,
          health:     data.health     ? data.health.length   : 0,
          goals:      data.goals      ? data.goals.length    : 0,
        })
        setFileObj(file)
      } catch (_) {
        setError('ไม่สามารถอ่านไฟล์ได้ — อาจเสียหายหรือไม่ใช่ JSON')
        setPreview(null)
        setFileObj(null)
      }
    }
    reader.readAsText(file)
  }

  function handleImport() {
    if (!fileObj) return
    if (!confirm) {
      setConfirm(true)
      setTimeout(function() { setConfirm(false) }, 5000)
      return
    }
    setImporting(true)
    backupService.import(fileObj)
      .then(function() {
        onFlash('Import สำเร็จ! กำลังรีโหลด...', 'ok')
        setPreview(null)
        setFileObj(null)
        setConfirm(false)
        if (fileRef.current) fileRef.current.value = ''
        setTimeout(function() { window.location.reload() }, 1800)
      })
      .catch(function(e) {
        onFlash('Import ล้มเหลว: ' + e.message, 'error')
      })
      .finally(function() {
        setImporting(false)
      })
  }

  return (
    <SectionCard icon="📥" title="Import ข้อมูล" subtitle="นำไฟล์ backup กลับเข้าแอป — ข้อมูลปัจจุบันจะถูกแทนที่">
      <label className="backup-file-label">
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="backup-file-input"
          onChange={handleFileChange}
        />
        <div className="backup-file-zone">
          <span className="backup-file-icon">📂</span>
          <span className="backup-file-text">{fileObj ? fileObj.name : 'กดเลือกไฟล์ .json'}</span>
          {fileObj && <span className="backup-file-size">{fmtBytes(fileObj.size)}</span>}
        </div>
      </label>

      {error && <div className="backup-error">⚠️ {error}</div>}

      {preview && !error && (
        <div className="backup-preview">
          <p className="backup-preview-title">📋 ข้อมูลในไฟล์ backup:</p>
          <div className="backup-preview-grid">
            <div className="backup-preview-row"><span>🕐 Export เมื่อ</span><strong>{preview.exportedAt}</strong></div>
            <div className="backup-preview-row"><span>📦 เวอร์ชัน</span><strong>{preview.version}</strong></div>
            <div className="backup-preview-row"><span>💰 รายการเงิน</span><strong>{preview.finance} รายการ</strong></div>
            <div className="backup-preview-row"><span>✅ To-Do</span><strong>{preview.todos} รายการ</strong></div>
            <div className="backup-preview-row"><span>🏋️ Workout</span><strong>{preview.workouts} รายการ</strong></div>
            <div className="backup-preview-row"><span>❤️ สุขภาพ</span><strong>{preview.health} รายการ</strong></div>
            <div className="backup-preview-row"><span>🎯 เป้าหมาย</span><strong>{preview.goals} รายการ</strong></div>
          </div>
          <div className="backup-warning">
            ⚠️ การ Import จะ<strong>แทนที่ข้อมูลปัจจุบัน</strong>ทั้งหมด
          </div>
          <button
            className={'btn backup-action-btn ' + (confirm ? 'btn-danger' : 'btn-primary')}
            onClick={handleImport}
            disabled={importing}
          >
            {importing
              ? '⏳ กำลัง Import...'
              : confirm
                ? '⚠️ ยืนยัน Import — ข้อมูลเดิมจะถูกแทนที่'
                : '📤 Import ข้อมูลนี้'}
          </button>
          {confirm && <p className="backup-confirm-hint">กดอีกครั้งภายใน 5 วินาทีเพื่อยืนยัน</p>}
        </div>
      )}
    </SectionCard>
  )
}

function StorageInfoCard() {
  const size  = backupService.getStorageSize()
  const quota = 5 * 1024 * 1024
  const pct   = Math.min(100, Math.round((size / quota) * 100))
  return (
    <SectionCard icon="💾" title="พื้นที่จัดเก็บ" subtitle="ข้อมูลเก็บใน localStorage บนอุปกรณ์นี้">
      <div className="storage-bar-wrap">
        <div className="storage-bar-track">
          <div
            className={'storage-bar-fill' + (pct > 80 ? ' storage-bar-fill--warn' : '')}
            style={{ width: pct + '%' }}
          />
        </div>
        <span className="storage-pct">{pct}%</span>
      </div>
      <p className="storage-detail">ใช้ {fmtBytes(size)} จาก ~5 MB</p>
    </SectionCard>
  )
}

function DangerCard({ onFlash }) {
  const [confirm, setConfirm] = useState(false)
  function handleReset() {
    if (confirm) {
      appDataService.resetAllData()
      onFlash('ล้างข้อมูลทั้งหมดแล้ว', 'warn')
      setConfirm(false)
      setTimeout(function() { window.location.reload() }, 1500)
    } else {
      setConfirm(true)
      setTimeout(function() { setConfirm(false) }, 5000)
    }
  }
  return (
    <SectionCard icon="⚠️" title="โซนอันตราย" subtitle="ล้างข้อมูลทั้งหมดออกจากอุปกรณ์นี้">
      <p className="backup-danger-desc">
        จะล้างข้อมูลทั้งหมด — การเงิน, To-Do, Workout, สุขภาพ และเป้าหมาย
        <br />
        <strong style={{ color: 'var(--accent-rose)' }}>แนะนำให้ Export backup ก่อนล้างข้อมูล</strong>
      </p>
      <button
        onClick={handleReset}
        className={'btn backup-action-btn ' + (confirm ? 'btn-danger' : 'btn-ghost')}
      >
        {confirm ? '⚠️ กดอีกครั้งเพื่อยืนยัน' : '🗑️ ล้างข้อมูลทั้งหมด'}
      </button>
      {confirm && <p className="backup-confirm-hint">กดภายใน 5 วินาทีเพื่อยืนยัน</p>}
    </SectionCard>
  )
}

export default function BackupPage() {
  const [flash, setFlash] = useState(null)
  function showFlash(msg, type) {
    setFlash({ msg: msg, type: type || 'ok' })
    setTimeout(function() { setFlash(null) }, 3000)
  }
  return (
    <div className="backup-page">
      <Toast msg={flash && flash.msg} type={flash && flash.type} />
      <div className="backup-grid">
        <ExportCard      onFlash={showFlash} />
        <ImportCard      onFlash={showFlash} />
        <StorageInfoCard />
        <DangerCard      onFlash={showFlash} />
      </div>
    </div>
  )
}
