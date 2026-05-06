# LifeHub — Personal Life OS (PWA)

แอปบริหารชีวิตส่วนตัว iPad-first PWA — รายรับรายจ่าย, To-do, Workout, สุขภาพ, เป้าหมายชีวิต

---

## 🚀 เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
cd D:\LifeHub
npm install
```

### 2. สร้าง PWA icons

```bash
# วิธีที่ 1: Python (ง่ายที่สุด)
python generate_icons.py

# วิธีที่ 2: ถ้ามี Pillow
pip install Pillow
python generate_icons.py
```

### 3. รัน dev server

```bash
npm run dev
```

เปิด browser ไปที่: **http://localhost:5173**

---

## 📁 โครงสร้างไฟล์

```
lifehub/
├── public/
│   └── icons/               ← PWA icons (สร้างด้วย generate_icons.py)
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── AppLayout.jsx  ← Shell หลัก
│   │       ├── Sidebar.jsx    ← Navigation (tablet+)
│   │       ├── BottomNav.jsx  ← Navigation (mobile)
│   │       └── TopBar.jsx     ← Header
│   ├── pages/
│   │   ├── Dashboard.jsx    ← หน้าหลัก (Phase 1 ✓)
│   │   └── Placeholder.jsx  ← หน้าอื่น (Phase 2+)
│   ├── store/
│   │   └── storage.js       ← localStorage service
│   ├── hooks/
│   │   └── useStorage.js    ← React hook
│   ├── utils/
│   │   └── formatters.js    ← date/currency formatters
│   ├── styles/
│   │   └── global.css       ← Design system
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js           ← PWA config
└── package.json
```

---

## ✅ Phase 1 Checklist

ตรวจสอบว่า Phase 1 สำเร็จ:

- [ ] `npm run dev` รันได้ไม่มี error
- [ ] เปิด http://localhost:5173 เห็น Dashboard
- [ ] มี Sidebar ซ้ายมือ (ใน Chrome > 768px)
- [ ] กด collapse ปุ่มซ้ายล่าง Sidebar หดได้
- [ ] ย่อหน้าต่าง < 768px เห็น Bottom Navigation
- [ ] กดเมนู Finance/Todo/Workout แสดง "Phase 2"
- [ ] Dashboard แสดง stat cards (รายรับ/รายจ่าย/งาน)
- [ ] Dashboard แสดงกราฟ Area Chart
- [ ] Dashboard แสดง Goals progress bars
- [ ] ใน DevTools > Application > Manifest เห็น manifest.json
- [ ] ใน DevTools > Application > Service Workers เห็น SW registered
- [ ] Lighthouse PWA score > 80

---

## 📱 ทดสอบบน iPad

1. รัน `npm run build && npm run preview`
2. หา IP ของ PC: `ipconfig` (Windows) → IPv4 address
3. บน iPad Safari เปิด `http://192.168.x.x:4173`
4. ทดสอบ layout landscape/portrait
5. ทดสอบ Add to Home Screen:
   - กด Share icon → "Add to Home Screen" → Add

---

## 🌐 Deploy GitHub Pages

```bash
# 1. ใน vite.config.js เปลี่ยน base เป็นชื่อ repo
#    base: '/lifehub/'

# 2. สร้าง repo บน GitHub ชื่อ "lifehub"

# 3. Push code
git init
git add .
git commit -m "LifeHub Phase 1"
git remote add origin https://github.com/USERNAME/lifehub.git
git push -u origin main

# 4. Deploy
npm run deploy
```

URL: `https://USERNAME.github.io/lifehub/`

---

## 📦 Tech Stack

| | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| PWA | vite-plugin-pwa + Workbox |
| Routing | React Router v6 |
| Charts | Recharts |
| Storage | localStorage (Phase 1) → IndexedDB (Phase 2) |
| Fonts | DM Sans + Sora + DM Mono (Google Fonts) |
| Deploy | GitHub Pages |

---

## 🗺️ Roadmap

- **Phase 1** ✅ Layout + Dashboard + PWA Foundation
- **Phase 2** 🔜 Finance CRUD + Todo + Goals + Charts
- **Phase 3** 🔜 Workout + Health tracking + Export/Import
- **Phase 4** 🔜 Polish + Performance + Deploy
