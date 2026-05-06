# LifeHub — Deploy Guide (GitHub Pages + iPad PWA)

## ขั้นตอนที่ 1: ตั้งชื่อ repo ให้ตรงกับ vite.config.js

เปิดไฟล์ `vite.config.js` ดูบรรทัด:
```js
base: '/lifehub/',
```
ชื่อ GitHub repo ของคุณต้องตรงกับ `/lifehub/` เป๊ะ (case-sensitive)

> ถ้าชื่อ repo ต่างกัน เช่น `LifeHub` หรือ `my-lifehub` → เปลี่ยน `base` ให้ตรง

---

## ขั้นตอนที่ 2: Push ขึ้น GitHub

```bash
cd D:\LifeHub

# ครั้งแรก
git init
git add .
git commit -m "feat: LifeHub Phase 5 — Goals, Backup, PWA deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lifehub.git
git push -u origin main

# ครั้งต่อไป
git add .
git commit -m "update"
git push
```

---

## ขั้นตอนที่ 3: เปิด GitHub Pages ด้วย Actions

1. ไปที่ repo บน GitHub → **Settings** → **Pages**
2. ใต้ "Build and deployment" เลือก:
   - **Source**: `GitHub Actions`
3. กด Save
4. ไปที่ **Actions** tab → รอ workflow `Deploy LifeHub to GitHub Pages` ให้เสร็จ (1-2 นาที)
5. แอปจะอยู่ที่: `https://YOUR_USERNAME.github.io/lifehub/`

---

## วิธีทดสอบบน iPad

### เปิดผ่าน Safari
1. เปิด Safari บน iPad
2. พิมพ์ URL: `https://YOUR_USERNAME.github.io/lifehub/`

### Add to Home Screen
1. กดปุ่ม **Share** (กล่องมีลูกศรขึ้น) ที่แถบ Safari
2. เลื่อนลงหา **"Add to Home Screen"** (เพิ่มไปที่หน้าจอหลัก)
3. ตั้งชื่อ: **LifeHub**
4. กด **Add** (เพิ่ม)
5. กลับไปที่ Home Screen → แตะไอคอน LifeHub
6. แอปจะเปิดแบบ Standalone (ไม่มี address bar!)

### ทดสอบ Offline
1. เปิดแอปผ่าน Home Screen icon (ต้องเป็น standalone mode)
2. ปิด WiFi / เปิด Airplane Mode
3. กด Refresh — แอปยังทำงานได้ = ✅ Offline สำเร็จ

---

## Deploy แบบ Manual (ไม่ใช้ Actions)

```bash
cd D:\LifeHub
npm run deploy
```

> ใช้ `gh-pages` package push branch `gh-pages` ขึ้น GitHub อัตโนมัติ
> แล้วเปิด Settings → Pages → Source: **Deploy from branch → gh-pages**

---

## Checklist ก่อนใช้งานจริง

### ✅ Code
- [ ] `vite.config.js` → `base: '/lifehub/'` ตรงกับชื่อ repo
- [ ] `manifest.webmanifest` → `scope` และ `start_url` ใช้ `/lifehub/`
- [ ] `App.jsx` → `BrowserRouter` ใช้ `basename={BASE}`

### ✅ Build
- [ ] `npm run build` สำเร็จ ไม่มี error
- [ ] ไฟล์ใน `dist/` มีครบ: `index.html`, `sw.js`, `manifest.webmanifest`

### ✅ Deploy
- [ ] GitHub repo ตั้งชื่อถูกต้อง
- [ ] GitHub Pages เปิดใช้งาน (Settings → Pages → GitHub Actions)
- [ ] Actions workflow ผ่าน (สีเขียว ✓)
- [ ] เปิด URL ได้ใน Chrome บนคอม

### ✅ iPad / PWA
- [ ] Safari เปิด URL ได้ ไม่มี 404
- [ ] "Add to Home Screen" ทำได้ ไอคอนแสดงถูกต้อง
- [ ] เปิดจาก Home Screen → ไม่มี address bar (standalone mode)
- [ ] ลองปิด WiFi → แอปยังใช้งานได้ (offline)
- [ ] หน้าจอแนวนอน + แนวตั้งแสดงผลถูกต้อง
- [ ] ปุ่มและ input กดได้ง่ายบน iPad (touch target ≥44px)

### ✅ Features
- [ ] Goals: เพิ่ม/แก้ไข/ลบเป้าหมายได้
- [ ] Goals: อัปเดต progress bar ได้
- [ ] Backup: Export JSON ได้
- [ ] Backup: Import JSON กลับได้ (มี preview + confirm)
- [ ] Backup: Storage info แสดงถูก
- [ ] ทุกหน้า: ข้อมูลบันทึกลง localStorage และยังอยู่หลัง refresh

---

## โครงสร้างไฟล์ Phase 5

```
src/
├── features/
│   ├── goals/
│   │   ├── GoalsPage.jsx      ← Goal cards + modal + progress
│   │   ├── GoalsPage.css      ← iPad grid layout
│   │   └── goalsUtils.js      ← calcPct, deadlineLabel, validate
│   └── backup/
│       ├── BackupPage.jsx     ← Export / Import / Storage / Danger
│       └── BackupPage.css     ← 2-col grid layout
├── App.jsx                    ← BrowserRouter ใช้ BASE_URL
.github/
└── workflows/
    └── deploy.yml             ← Auto-deploy บน push to main
public/
└── manifest.webmanifest       ← scope + start_url ใช้ /lifehub/
vite.config.js                 ← base: '/lifehub/', PWA settings
```
