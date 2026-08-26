import React, { useState, useRef, useCallback } from 'react'
import { backupService, BACKUP_MANIFEST } from '../../services/backupService.js'
import { appDataService } from '../../services/appDataService.js'
import './BackupPage.css'

/* ── Helpers ── */
function fmtBytes(n) {
  if (n < 1024) return n + ' B'
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1048576).toFixed(2) + ' MB'
}

/* ── Toast ── */
function Toast({ flash }) {
  if (!flash) return null
  return (
    <div className={"backup-toast backup-toast--" + flash.type}>
      {flash.msg}
    </div>
  )
}

/* ── Section Card shell ── */
function SectionCard({ icon, title, subtitle, accent, children }) {
  return (
    <div className={"backup-card" + (accent ? " backup-card--" + accent : "")}>
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

/* ── Current Data Summary ── */
function CurrentDataCard() {
  const stats = backupService.getCurrentStats()
  const size  = backupService.getStorageSize()
  const quota = 5 * 1024 * 1024
  const pct   = Math.min(100, Math.round((size / quota) * 100))

  const rows = BACKUP_MANIFEST.filter(m => m.key !== 'settings' && m.key !== 'habit_logs')
  const getCount = (key) => {
    const v = stats[key]
    if (v === null || v === undefined) return '—'
    return v + (typeof v === 'number' && v !== 1 ? '' : '')
  }

  return (
    <SectionCard icon="💾" title="ข้อมูลในอุปกรณ์นี้" subtitle="สรุปข้อมูลทั้งหมดที่บันทึกไว้">
      <div className="current-stats-grid">
        {rows.map(m => (
          <div key={m.key} className="current-stat-item">
            <span className="current-stat-icon">{m.icon}</span>
            <span className="current-stat-label">{m.label.replace(/^.{1,2}\s/, '')}</span>
            <span className="current-stat-count">{getCount(m.key)}</span>
          </div>
        ))}
      </div>
      <div className="storage-bar-wrap" style={{ marginTop: 12 }}>
        <div className="storage-bar-track">
          <div
            className={"storage-bar-fill" + (pct > 80 ? " storage-bar-fill--warn" : "")}
            style={{ width: pct + "%" }}
          />
        </div>
        <span className="storage-pct">{pct}%</span>
      </div>
      <p className="storage-detail">ใช้ {fmtBytes(size)} จาก ~5 MB</p>
    </SectionCard>
  )
}

/* ── Export Card ── */
function ExportCard({ onFlash }) {
  const [exporting, setExporting] = useState(false)
  const now    = new Date()
  const dateStr = now.toISOString().slice(0, 10)

  function handleExport() {
    setExporting(true)
    try {
      const fname = backupService.export()
      onFlash("📥 Download สำเร็จ: " + fname, "ok")
    } catch (e) {
      onFlash("Export ล้มเหลว: " + e.message, "error")
    } finally {
      setTimeout(() => setExporting(false), 800)
    }
  }

  return (
    <SectionCard icon="📤" title="Export Backup" subtitle="บันทึกข้อมูลทั้งหมดเป็นไฟล์ JSON ลงเครื่อง">
      <div className="backup-info-row">
        <div className="backup-info-item">
          <span className="backup-info-label">ชื่อไฟล์</span>
          <span className="backup-info-mono">lifehub-backup-{dateStr}.json</span>
        </div>
      </div>
      <div className="backup-covers">
        <p className="backup-covers-label">ครอบคลุมข้อมูลทั้งหมด:</p>
        <div className="backup-covers-chips">
          {BACKUP_MANIFEST.map(m => (
            <span key={m.key} className="backup-chip">{m.label}</span>
          ))}
        </div>
      </div>
      <button
        className="btn btn-primary backup-action-btn"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? "⏳ กำลัง Export..." : "📥 Download Backup (.json)"}
      </button>
      <p className="backup-hint">💡 บน iPad: ไฟล์จะบันทึกไปที่แอป Files → Downloads</p>
    </SectionCard>
  )
}

/* ── Import Card ── */
function ImportCard({ onFlash }) {
  const fileRef = useRef(null)
  const [preview,   setPreview]   = useState(null)   // { stats, warnings, data }
  const [fileObj,   setFileObj]   = useState(null)
  const [mode,      setMode]      = useState("replace")
  const [step,      setStep]      = useState("idle")  // idle | preview | confirm | done
  const [error,     setError]     = useState(null)

  const reset = useCallback(() => {
    setPreview(null); setFileObj(null)
    setStep("idle"); setError(null)
    if (fileRef.current) fileRef.current.value = ""
  }, [])

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setError(null); setStep("idle"); setPreview(null)

    backupService.parseFile(file)
      .then(({ stats, warnings, data }) => {
        setPreview({ stats, warnings, data })
        setFileObj(file)
        setStep("preview")
      })
      .catch(err => {
        setError(err.message)
        setFileObj(null)
      })
  }

  function handleImport() {
    if (step === "preview") { setStep("confirm"); return }
    if (step !== "confirm")  return

    backupService.importData(preview.data, mode)
    onFlash("✅ Import สำเร็จ! กำลังรีโหลด...", "ok")
    setStep("done")
    setTimeout(() => window.location.reload(), 1800)
  }

  const previewRows = BACKUP_MANIFEST.filter(m => {
    if (!preview) return false
    return preview.stats[m.key] !== null && preview.stats[m.key] !== undefined
  })

  return (
    <SectionCard icon="📥" title="Import Backup" subtitle="นำไฟล์ backup กลับเข้าแอป">

      {/* File picker */}
      <label className="backup-file-label">
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="backup-file-input"
          onChange={handleFileChange}
        />
        <div className={"backup-file-zone" + (fileObj ? " backup-file-zone--selected" : "")}>
          <span className="backup-file-icon">{fileObj ? "✅" : "📂"}</span>
          <span className="backup-file-text">{fileObj ? fileObj.name : "กดเลือกไฟล์ .json"}</span>
          {fileObj && <span className="backup-file-size">{fmtBytes(fileObj.size)}</span>}
        </div>
      </label>

      {error && <div className="backup-error">⚠️ {error}</div>}

      {/* Mode selector */}
      {step === "preview" && (
        <div className="import-mode-row">
          <span className="import-mode-label">โหมด Import:</span>
          <div className="import-mode-btns">
            <button
              className={"import-mode-btn" + (mode === "replace" ? " import-mode-btn--active" : "")}
              onClick={() => setMode("replace")}
            >
              🔄 Replace — แทนที่ทั้งหมด
            </button>
            <button
              className={"import-mode-btn" + (mode === "merge" ? " import-mode-btn--active" : "")}
              onClick={() => setMode("merge")}
            >
              🔀 Merge — รวมกับข้อมูลเดิม
            </button>
          </div>
          <p className="import-mode-desc">
            {mode === "replace"
              ? "⚠️ ข้อมูลเดิมทั้งหมดจะถูกแทนที่ด้วยข้อมูลจาก backup"
              : "✨ รายการที่ไม่มี id ตรงกันจะถูกเพิ่มเข้ามา ข้อมูลเดิมจะถูกเก็บไว้"}
          </p>
        </div>
      )}

      {/* Preview */}
      {preview && (step === "preview" || step === "confirm") && (
        <div className={"backup-preview" + (step === "confirm" ? " backup-preview--confirm" : "")}>
          <p className="backup-preview-title">📋 ข้อมูลในไฟล์ backup:</p>
          <div className="backup-preview-grid">
            <div className="backup-preview-row">
              <span>🕐 Export เมื่อ</span>
              <strong>{preview.stats.exportedAt}</strong>
            </div>
            <div className="backup-preview-row">
              <span>📦 เวอร์ชัน</span>
              <strong>{preview.stats.version}</strong>
            </div>
            {previewRows.map(m => (
              <div key={m.key} className="backup-preview-row">
                <span>{m.label}</span>
                <strong>
                  {preview.stats[m.key] !== null
                    ? preview.stats[m.key] + (m.type === "array" ? " รายการ" : " ค่า")
                    : "—"}
                </strong>
              </div>
            ))}
          </div>

          {preview.warnings.length > 0 && (
            <div className="backup-warnings">
              {preview.warnings.map((w, i) => (
                <p key={i} className="backup-warn-item">⚠️ {w}</p>
              ))}
            </div>
          )}

          {step === "confirm" && (
            <div className="backup-confirm-banner">
              {mode === "replace"
                ? "⚠️ ข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่ ยืนยันหรือไม่?"
                : "🔀 ข้อมูลใหม่จาก backup จะถูก merge เข้ามา ยืนยันหรือไม่?"}
            </div>
          )}

          <div className="import-action-row">
            {step === "confirm" ? (
              <>
                <button className="btn btn-ghost import-cancel-btn" onClick={() => setStep("preview")}>
                  ← กลับ
                </button>
                <button className="btn btn-danger import-confirm-btn" onClick={handleImport}>
                  ✅ ยืนยัน Import
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost import-cancel-btn" onClick={reset}>
                  ยกเลิก
                </button>
                <button className="btn btn-primary import-confirm-btn" onClick={handleImport}>
                  ต่อไป →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <p className="backup-hint">💡 บน iPad: กด "เลือกไฟล์" → Files → เลือกไฟล์ .json</p>
    </SectionCard>
  )
}

/* ── Danger Zone ── */
function DangerCard({ onFlash }) {
  const [step, setStep] = useState("idle") // idle | confirm1 | confirm2

  function handleReset() {
    if (step === "idle") {
      setStep("confirm1")
      setTimeout(() => setStep("idle"), 6000)
      return
    }
    if (step === "confirm1") {
      setStep("confirm2")
      setTimeout(() => setStep("idle"), 6000)
      return
    }
    // confirm2 — do it
    backupService.clearAll()
    onFlash("🗑️ ล้างข้อมูลทั้งหมดแล้ว", "warn")
    setTimeout(() => window.location.reload(), 1500)
  }

  const label =
    step === "idle"     ? "🗑️ ล้างข้อมูลทั้งหมด" :
    step === "confirm1" ? "⚠️ กดอีกครั้งเพื่อยืนยัน (1/2)" :
                          "🔴 กดเพื่อยืนยันครั้งสุดท้าย (2/2)"

  return (
    <SectionCard icon="⚠️" title="โซนอันตราย" subtitle="ล้างข้อมูลทั้งหมดออกจากอุปกรณ์นี้" accent="danger">
      <p className="backup-danger-desc">
        จะล้างข้อมูลทั้งหมด ได้แก่ การเงิน, To-Do, Workout, สุขภาพ, เป้าหมาย, Habits และ Sleep
        <br />
        <strong style={{ color: "var(--accent-rose)" }}>แนะนำ Export backup ก่อนล้าง</strong>
      </p>
      {step !== "idle" && (
        <p className="backup-confirm-hint" style={{ color: "var(--accent-rose)" }}>
          ต้องกด {step === "confirm1" ? 2 : 1} ครั้งอีก เพื่อยืนยัน — รีเซ็ตใน 6 วินาที
        </p>
      )}
      <button
        onClick={handleReset}
        className={"btn backup-action-btn " + (step === "idle" ? "btn-ghost" : "btn-danger")}
      >
        {label}
      </button>
    </SectionCard>
  )
}

/* ── Main Page ── */
export default function BackupPage() {
  const [flash, setFlash] = useState(null)

  function showFlash(msg, type) {
    setFlash({ msg, type: type || "ok" })
    setTimeout(() => setFlash(null), 3500)
  }

  return (
    <div className="backup-page">
      <Toast flash={flash} />
      <div className="backup-grid">
        <ExportCard      onFlash={showFlash} />
        <ImportCard      onFlash={showFlash} />
        <CurrentDataCard />
        <DangerCard      onFlash={showFlash} />
      </div>
    </div>
  )
}
