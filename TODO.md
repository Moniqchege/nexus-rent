<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NEXUS RENT — Mobile Tenant</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Sora:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #0B0F19;
  --bg-card: #111827;
  --bg-card2: #0d1520;
  --border: #1F2937;
  --neon: #00F0FF;
  --purple: #7C3AED;
  --danger: #FF3B81;
  --success: #00FFA3;
  --warn: #FFB84D;
  --text: #E5E7EB;
  --muted: #9CA3AF;
  --glass: rgba(17,24,39,0.8);
}

* { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color: transparent; }

body {
  background: #060A14;
  font-family: 'Sora', sans-serif;
  color: var(--text);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 60px;
}

/* ─── OUTER FRAME ─── */
.phone-frame {
  width: 390px;
  background: var(--bg);
  border-radius: 50px;
  overflow: hidden;
  border: 2px solid #1a2540;
  box-shadow:
    0 0 0 6px #0d1220,
    0 0 60px rgba(0,240,255,0.08),
    0 40px 80px rgba(0,0,0,0.8);
  position: relative;
}

/* Dynamic island */
.island {
  width: 120px; height: 34px;
  background: #000;
  border-radius: 20px;
  position: absolute;
  top: 14px; left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.island-cam {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  position: relative;
}
.island-cam::after {
  content: '';
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #1a2535;
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
}
.island-pill {
  width: 50px; height: 8px;
  background: #0a0a0a;
  border-radius: 4px;
}

/* ─── SCREEN WRAPPER ─── */
.screen {
  display: none;
  flex-direction: column;
  min-height: 844px;
  padding-top: 60px;
  padding-bottom: 90px;
  position: relative;
  overflow: hidden;
}
.screen.active { display: flex; }

/* Status bar */
.status-bar {
  position: absolute;
  top: 18px; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px 0 36px;
  z-index: 100;
}
.status-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.status-icons { display: flex; gap: 5px; align-items: center; }
.status-icons span { font-size: 12px; color: var(--text); }

/* ─── BOTTOM NAV ─── */
.bottom-nav {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 84px;
  background: rgba(10,14,22,0.97);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: 16px;
  backdrop-filter: blur(20px);
  z-index: 150;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 12px;
  transition: all 0.25s;
  position: relative;
}
.nav-item.active .nav-icon { color: var(--neon); }
.nav-item.active .nav-label { color: var(--neon); }
.nav-item.active::before {
  content: '';
  position: absolute;
  top: 0; left: 50%; transform: translateX(-50%);
  width: 20px; height: 2px;
  background: var(--neon);
  border-radius: 2px;
  box-shadow: 0 0 8px var(--neon);
}
.nav-icon { font-size: 20px; color: var(--muted); }
.nav-label { font-size: 9px; color: var(--muted); letter-spacing: 0.5px; font-family: 'Orbitron', monospace; }
.nav-badge {
  position: absolute;
  top: 4px; right: 6px;
  background: var(--danger);
  color: #fff;
  font-size: 8px;
  min-width: 14px; height: 14px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
}

/* ─── SCROLL AREA ─── */
.scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 0 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.scroll-area::-webkit-scrollbar { display: none; }

/* ─── PAGE HEADER ─── */
.page-header {
  padding: 16px 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-header-left {}
.page-greeting {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 2px;
  letter-spacing: 0.5px;
}
.page-title {
  font-family: 'Orbitron', monospace;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(90deg, var(--neon), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.avatar {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--purple), var(--neon));
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  border: 2px solid rgba(0,240,255,0.3);
  box-shadow: 0 0 16px rgba(0,240,255,0.2);
}

/* ─── AMBIENT GLOW ─── */
.ambient {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;
}

/* ─── HERO RENT CARD ─── */
.hero-card {
  margin: 0 20px 20px;
  background: linear-gradient(135deg, rgba(0,240,255,0.08), rgba(124,58,237,0.12));
  border: 1px solid rgba(0,240,255,0.2);
  border-radius: 24px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  z-index: 1;
}
.hero-card::before {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 160px; height: 160px;
  background: radial-gradient(circle, rgba(0,240,255,0.12), transparent 70%);
}
.hero-card-label {
  font-size: 10px;
  font-family: 'Orbitron', monospace;
  letter-spacing: 2px;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.hero-rent {
  font-family: 'JetBrains Mono', monospace;
  font-size: 40px;
  font-weight: 600;
  color: var(--neon);
  line-height: 1;
  margin-bottom: 4px;
  text-shadow: 0 0 30px rgba(0,240,255,0.4);
}
.hero-rent sup {
  font-size: 18px;
  vertical-align: super;
  opacity: 0.7;
}
.hero-rent-sub { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
.hero-meta {
  display: flex;
  gap: 12px;
}
.hero-meta-item {
  flex: 1;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 10px 12px;
}
.hmi-label { font-size: 9px; color: var(--muted); letter-spacing: 1px; margin-bottom: 4px; font-family: 'Orbitron', monospace; }
.hmi-value { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; }

/* ─── AI FORECAST BANNER ─── */
.ai-banner {
  margin: 0 20px 20px;
  background: rgba(255,59,129,0.06);
  border: 1px solid rgba(255,59,129,0.25);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
  cursor: pointer;
  transition: all 0.3s;
}
.ai-banner:hover { background: rgba(255,59,129,0.1); }
.ai-banner-icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: rgba(255,59,129,0.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.ai-banner-text {}
.ai-banner-title { font-size: 13px; font-weight: 600; color: var(--danger); margin-bottom: 2px; }
.ai-banner-sub { font-size: 11px; color: var(--muted); }
.ai-banner-arrow { margin-left: auto; color: var(--danger); font-size: 16px; }

/* ─── SECTION TITLE ─── */
.s-title {
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--muted);
  text-transform: uppercase;
  padding: 0 20px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.s-title-link { color: var(--neon); font-size: 10px; cursor: pointer; }

/* ─── QUICK ACTIONS ─── */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 0 20px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}
.qa-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.qa-icon {
  width: 54px; height: 54px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  border: 1px solid;
  transition: all 0.3s;
}
.qa-icon:hover { transform: translateY(-2px); }
.qa-label { font-size: 10px; color: var(--muted); text-align: center; line-height: 1.3; }

/* ─── MINI STATS ROW ─── */
.stats-row {
  display: flex;
  gap: 12px;
  padding: 0 20px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}
.mini-stat {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px 14px;
  position: relative;
  overflow: hidden;
}
.mini-stat::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
}
.ms-icon { font-size: 18px; margin-bottom: 8px; }
.ms-label { font-size: 9px; color: var(--muted); letter-spacing: 1px; font-family: 'Orbitron', monospace; margin-bottom: 4px; }
.ms-value { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; }
.ms-change { font-size: 10px; margin-top: 3px; display: flex; align-items: center; gap: 3px; }

/* ─── PROPERTY CARD (horizontal) ─── */
.my-property {
  margin: 0 20px 24px;
  background: var(--bg-card);
  border: 1px solid rgba(0,240,255,0.2);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 30px rgba(0,240,255,0.06);
}
.prop-image-strip {
  height: 160px;
  background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.prop-image-strip::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 40%, rgba(17,24,39,0.95));
}
.prop-image-emoji { font-size: 60px; opacity: 0.15; }
.prop-overlay {
  position: absolute;
  bottom: 12px; left: 14px; right: 14px;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.prop-badge-row { display: flex; gap: 6px; }
.prop-badge {
  background: rgba(0,240,255,0.15);
  border: 1px solid rgba(0,240,255,0.3);
  color: var(--neon);
  font-size: 9px;
  font-family: 'Orbitron', monospace;
  padding: 3px 8px;
  border-radius: 8px;
  letter-spacing: 1px;
}
.prop-badge.active-badge {
  background: rgba(0,255,163,0.15);
  border-color: rgba(0,255,163,0.3);
  color: var(--success);
}
.prop-body {
  padding: 16px;
}
.prop-name-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.prop-name { font-size: 16px; font-weight: 700; }
.prop-price-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px;
  color: var(--neon);
  font-weight: 600;
}
.prop-addr { font-size: 12px; color: var(--muted); margin-bottom: 14px; display: flex; align-items: center; gap: 4px; }
.prop-specs {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.prop-spec {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--muted);
}
.spec-icon { color: var(--purple); font-size: 13px; }

/* ─── PAYMENT SECTION ─── */
.payment-card {
  margin: 0 20px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 18px;
  position: relative;
  z-index: 1;
}
.payment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.payment-title {
  font-family: 'Orbitron', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
}
.payment-status-pill {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 80px;
  margin-bottom: 8px;
}
.bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}
.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: opacity 0.3s;
  min-height: 6px;
}
.bar-lbl { font-size: 8px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

/* ─── AI FORECAST CARDS ─── */
.forecast-row {
  display: flex;
  gap: 10px;
  padding: 0 20px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}
.forecast-card {
  flex: 1;
  border-radius: 16px;
  padding: 14px 10px;
  text-align: center;
  border: 1px solid;
}
.fc-month { font-size: 9px; color: var(--muted); margin-bottom: 6px; font-family: 'Orbitron', monospace; letter-spacing: 1px; }
.fc-amount { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; margin-bottom: 3px; }
.fc-change { font-size: 9px; }

/* ─── TIMELINE ─── */
.timeline {
  padding: 0 20px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}
.timeline-item {
  display: flex;
  gap: 14px;
  padding-bottom: 16px;
  position: relative;
}
.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 16px;
  top: 32px;
  bottom: 0;
  width: 1px;
  background: linear-gradient(var(--border), transparent);
}
.tl-dot {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
  border: 1px solid;
}
.tl-body { flex: 1; }
.tl-title { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.tl-sub { font-size: 11px; color: var(--muted); }
.tl-amt { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; margin-left: auto; flex-shrink: 0; }

/* ─── SEARCH PAGE ─── */
.search-bar-wrap {
  padding: 8px 20px 16px;
  position: relative;
  z-index: 1;
}
.search-bar {
  background: var(--bg-card);
  border: 1px solid rgba(0,240,255,0.2);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 0 20px rgba(0,240,255,0.08);
}
.search-bar input {
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-family: 'Sora', sans-serif;
  font-size: 14px;
  flex: 1;
}
.search-bar input::placeholder { color: var(--muted); }
.search-icon { color: var(--neon); font-size: 16px; }
.filter-btn {
  background: rgba(124,58,237,0.15);
  border: 1px solid rgba(124,58,237,0.3);
  color: var(--purple);
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

/* Horizontal scroll chips */
.chips-wrap {
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0 20px 16px;
  position: relative;
  z-index: 1;
}
.chips-wrap::-webkit-scrollbar { display: none; }
.chips { display: flex; gap: 8px; width: max-content; }
.chip {
  padding: 7px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-family: 'Sora', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid var(--border);
  color: var(--muted);
  background: var(--bg-card);
  transition: all 0.25s;
}
.chip.active {
  background: rgba(0,240,255,0.1);
  border-color: rgba(0,240,255,0.4);
  color: var(--neon);
}

/* Property list cards */
.prop-list-card {
  margin: 0 20px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  z-index: 1;
}
.prop-list-card:hover {
  border-color: rgba(0,240,255,0.3);
  box-shadow: 0 4px 20px rgba(0,240,255,0.1);
}
.plc-img {
  width: 100px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  position: relative;
  overflow: hidden;
}
.plc-body {
  flex: 1;
  padding: 14px;
}
.plc-price { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 600; margin-bottom: 2px; }
.plc-name { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.plc-loc { font-size: 11px; color: var(--muted); margin-bottom: 8px; }
.plc-tags { display: flex; gap: 6px; }
.plc-tag {
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
}
.plc-ai { position: absolute; top: 10px; right: 10px; }

/* ─── PROFILE PAGE ─── */
.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 20px 24px;
  position: relative;
  z-index: 1;
}
.profile-avatar {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--purple), var(--neon));
  display: flex; align-items: center; justify-content: center;
  font-size: 36px;
  border: 3px solid rgba(0,240,255,0.3);
  box-shadow: 0 0 30px rgba(0,240,255,0.25);
  margin-bottom: 12px;
}
.profile-name { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.profile-tag {
  background: rgba(0,240,255,0.1);
  border: 1px solid rgba(0,240,255,0.2);
  color: var(--neon);
  font-size: 10px;
  font-family: 'Orbitron', monospace;
  letter-spacing: 2px;
  padding: 4px 12px;
  border-radius: 10px;
  margin-bottom: 20px;
}
.profile-stats {
  display: flex;
  gap: 0;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
}
.ps-item {
  flex: 1;
  padding: 14px 8px;
  text-align: center;
  border-right: 1px solid var(--border);
}
.ps-item:last-child { border-right: none; }
.ps-val { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; margin-bottom: 3px; }
.ps-lbl { font-size: 9px; color: var(--muted); font-family: 'Orbitron', monospace; letter-spacing: 0.5px; }

.settings-group {
  margin: 0 20px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
.settings-group-title {
  font-size: 9px;
  font-family: 'Orbitron', monospace;
  letter-spacing: 2px;
  color: var(--muted);
  padding: 12px 16px 6px;
  text-transform: uppercase;
}
.setting-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 14px;
  border-top: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.2s;
}
.setting-row:first-of-type { border-top: none; }
.setting-row:hover { background: rgba(255,255,255,0.02); }
.setting-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.setting-text { flex: 1; }
.setting-name { font-size: 14px; font-weight: 600; margin-bottom: 1px; }
.setting-desc { font-size: 11px; color: var(--muted); }
.setting-arrow { color: var(--muted); font-size: 14px; }
.toggle-switch {
  width: 44px; height: 24px;
  background: var(--success);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0,255,163,0.3);
}
.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px; right: 3px;
  width: 18px; height: 18px;
  background: #fff;
  border-radius: 50%;
}
.toggle-switch.off {
  background: var(--border);
  box-shadow: none;
}
.toggle-switch.off::after { right: auto; left: 3px; }

/* ─── NOTIFICATIONS ─── */
.notif-item {
  margin: 0 20px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  position: relative;
  z-index: 1;
  cursor: pointer;
  transition: all 0.3s;
}
.notif-item.unread {
  border-color: rgba(0,240,255,0.2);
  background: rgba(0,240,255,0.03);
}
.notif-item.urgent { border-color: rgba(255,59,129,0.25); background: rgba(255,59,129,0.03); }
.notif-icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.notif-body { flex: 1; }
.notif-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
.notif-text { font-size: 11px; color: var(--muted); line-height: 1.5; margin-bottom: 4px; }
.notif-time { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
.unread-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--neon);
  box-shadow: 0 0 6px var(--neon);
  flex-shrink: 0;
  margin-top: 6px;
}

/* ─── ANIMATIONS ─── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(0,240,255,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(0,240,255,0); }
}
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

.screen.active > * {
  animation: fadeUp 0.4s ease forwards;
}

/* Page label */
.page-label-bar {
  padding: 0 20px 4px;
  position: relative;
  z-index: 1;
}
.plb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,240,255,0.07);
  border: 1px solid rgba(0,240,255,0.15);
  color: var(--neon);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 9px;
  font-family: 'Orbitron', monospace;
  letter-spacing: 2px;
}
.plb::before {
  content: '';
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--neon);
  box-shadow: 0 0 6px var(--neon);
  animation: blink 1.5s infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

/* Page title inside scroll */
.scroll-page-title {
  font-family: 'Orbitron', monospace;
  font-size: 18px;
  font-weight: 700;
  padding: 4px 20px 16px;
  position: relative;
  z-index: 1;
}

/* AI insight card */
.ai-insight-card {
  margin: 0 20px 16px;
  background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,240,255,0.06));
  border: 1px solid rgba(124,58,237,0.25);
  border-radius: 18px;
  padding: 16px;
  position: relative;
  z-index: 1;
  overflow: hidden;
}
.ai-insight-card::before {
  content: '🤖';
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  opacity: 0.07;
}
.aic-label { font-size: 9px; color: var(--purple); font-family: 'Orbitron', monospace; letter-spacing: 2px; margin-bottom: 6px; }
.aic-text { font-size: 13px; line-height: 1.6; color: var(--text); }
.aic-text strong { color: var(--neon); }
</style>
</head>
<body>

<div class="phone-frame">
  <!-- Dynamic Island -->
  <div class="island">
    <div class="island-cam"></div>
    <div class="island-pill"></div>
  </div>

  <!-- ═══════════════════════════════════ -->
  <!-- SCREEN 1: HOME / OVERVIEW          -->
  <!-- ═══════════════════════════════════ -->
  <div class="screen active" id="screen-home">
    <div class="ambient" style="top:-60px;left:-60px;width:280px;height:280px;background:radial-gradient(circle,rgba(124,58,237,0.1),transparent 70%);"></div>
    <div class="ambient" style="bottom:100px;right:-80px;width:220px;height:220px;background:radial-gradient(circle,rgba(0,240,255,0.07),transparent 70%);"></div>

    <div class="status-bar">
      <div class="status-time">9:41</div>
      <div class="status-icons">
        <span>▲▲▲</span>
        <span>WiFi</span>
        <span>🔋</span>
      </div>
    </div>

    <div class="scroll-area">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-greeting">Good morning,</div>
          <div class="page-title">Alex Kimani</div>
        </div>
        <div class="avatar">👤</div>
      </div>

      <!-- AI Warning Banner -->
      <div class="ai-banner">
        <div class="ai-banner-icon">🤖</div>
        <div class="ai-banner-text">
          <div class="ai-banner-title">Rent Increase Predicted</div>
          <div class="ai-banner-sub">+20% in ~90 days · Tap to review</div>
        </div>
        <div class="ai-banner-arrow">›</div>
      </div>

      <!-- Hero Card -->
      <div class="hero-card">
        <div class="hero-card-label">CURRENT MONTHLY RENT</div>
        <div class="hero-rent"><sup>$</sup>2,400</div>
        <div class="hero-rent-sub">Sky Vista Penthouse · Westlands</div>
        <div class="hero-meta">
          <div class="hero-meta-item">
            <div class="hmi-label">LEASE LEFT</div>
            <div class="hmi-value" style="color:var(--neon);">147 days</div>
          </div>
          <div class="hero-meta-item">
            <div class="hmi-label">STATUS</div>
            <div class="hmi-value" style="color:var(--success);">✓ Paid</div>
          </div>
          <div class="hero-meta-item">
            <div class="hmi-label">NEXT DUE</div>
            <div class="hmi-value" style="color:var(--warn);">Mar 1</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="s-title">QUICK ACTIONS</div>
      <div class="quick-actions">
        <div class="qa-item">
          <div class="qa-icon" style="background:rgba(0,240,255,0.08);border-color:rgba(0,240,255,0.25);color:var(--neon);">💳</div>
          <div class="qa-label">Pay Rent</div>
        </div>
        <div class="qa-item">
          <div class="qa-icon" style="background:rgba(124,58,237,0.08);border-color:rgba(124,58,237,0.25);color:var(--purple);">📄</div>
          <div class="qa-label">My Lease</div>
        </div>
        <div class="qa-item">
          <div class="qa-icon" style="background:rgba(0,255,163,0.08);border-color:rgba(0,255,163,0.25);color:var(--success);">🔧</div>
          <div class="qa-label">Maintenance</div>
        </div>
        <div class="qa-item">
          <div class="qa-icon" style="background:rgba(255,59,129,0.08);border-color:rgba(255,59,129,0.25);color:var(--danger);">📞</div>
          <div class="qa-label">Contact Owner</div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="mini-stat" style="">
          <div style="position:absolute;top:0;left:0;right:0;height:2px;background:var(--neon);box-shadow:0 0 8px var(--neon);"></div>
          <div class="ms-icon">🏢</div>
          <div class="ms-label">OCCUPANCY</div>
          <div class="ms-value" style="color:var(--neon);">3 yrs</div>
          <div class="ms-change" style="color:var(--success);">↑ Loyal tenant</div>
        </div>
        <div class="mini-stat">
          <div style="position:absolute;top:0;left:0;right:0;height:2px;background:var(--purple);box-shadow:0 0 8px var(--purple);"></div>
          <div class="ms-icon">✅</div>
          <div class="ms-label">ON-TIME RATE</div>
          <div class="ms-value" style="color:var(--purple);">98.4%</div>
          <div class="ms-change" style="color:var(--success);">↑ Excellent</div>
        </div>
        <div class="mini-stat">
          <div style="position:absolute;top:0;left:0;right:0;height:2px;background:var(--success);box-shadow:0 0 8px var(--success);"></div>
          <div class="ms-icon">📊</div>
          <div class="ms-label">AI SCORE</div>
          <div class="ms-value" style="color:var(--success);">94</div>
          <div class="ms-change" style="color:var(--success);">↑ Premium</div>
        </div>
      </div>

      <!-- AI Forecast -->
      <div class="s-title">AI RENT FORECAST <span class="s-title-link">Details ›</span></div>
      <div class="forecast-row">
        <div class="forecast-card" style="background:rgba(0,240,255,0.04);border-color:rgba(0,240,255,0.15);">
          <div class="fc-month">MAR 2025</div>
          <div class="fc-amount" style="color:var(--neon);">$2,400</div>
          <div class="fc-change" style="color:var(--success);">No change</div>
        </div>
        <div class="forecast-card" style="background:rgba(255,184,77,0.04);border-color:rgba(255,184,77,0.2);">
          <div class="fc-month">APR 2025</div>
          <div class="fc-amount" style="color:var(--warn);">$2,640</div>
          <div class="fc-change" style="color:var(--warn);">↑ +10%</div>
        </div>
        <div class="forecast-card" style="background:rgba(255,59,129,0.04);border-color:rgba(255,59,129,0.2);">
          <div class="fc-month">MAY 2025</div>
          <div class="fc-amount" style="color:var(--danger);">$2,880</div>
          <div class="fc-change" style="color:var(--danger);">↑ +20%</div>
        </div>
      </div>

      <!-- AI Insight -->
      <div class="ai-insight-card">
        <div class="aic-label">◈ AI INSIGHT</div>
        <div class="aic-text">Westlands development index rose <strong>+12.3%</strong> this quarter. New commercial zones and road upgrades near your property suggest a <strong>rent adjustment is likely</strong>. Consider negotiating a fixed rate before May.</div>
      </div>

      <!-- Recent Activity -->
      <div class="s-title">RECENT ACTIVITY</div>
      <div class="timeline">
        <div class="timeline-item">
          <div class="tl-dot" style="background:rgba(0,255,163,0.1);border-color:rgba(0,255,163,0.3);color:var(--success);">✓</div>
          <div class="tl-body">
            <div class="tl-title">February Rent Paid</div>
            <div class="tl-sub">Feb 1, 2025 · On time · M-Pesa</div>
          </div>
          <div class="tl-amt" style="color:var(--success);">$2,400</div>
        </div>
        <div class="timeline-item">
          <div class="tl-dot" style="background:rgba(0,240,255,0.1);border-color:rgba(0,240,255,0.3);color:var(--neon);">📄</div>
          <div class="tl-body">
            <div class="tl-title">Lease Renewed</div>
            <div class="tl-sub">Jan 15, 2025 · 6 months extension</div>
          </div>
          <div class="tl-amt" style="color:var(--neon);">↑ Done</div>
        </div>
        <div class="timeline-item">
          <div class="tl-dot" style="background:rgba(255,59,129,0.1);border-color:rgba(255,59,129,0.3);color:var(--danger);">🔧</div>
          <div class="tl-body">
            <div class="tl-title">AC Maintenance Request</div>
            <div class="tl-sub">Jan 8, 2025 · Resolved in 48h</div>
          </div>
          <div class="tl-amt" style="color:var(--muted);">Closed</div>
        </div>
      </div>
    </div>

    <!-- Bottom Nav -->
    <div class="bottom-nav">
      <div class="nav-item active" onclick="switchScreen('home', this)">
        <div class="nav-icon">⊞</div>
        <div class="nav-label">Home</div>
      </div>
      <div class="nav-item" onclick="switchScreen('search', this)">
        <div class="nav-icon">⌕</div>
        <div class="nav-label">Explore</div>
      </div>
      <div class="nav-item" onclick="switchScreen('payments', this)">
        <div class="nav-icon">💳</div>
        <div class="nav-label">Pay</div>
      </div>
      <div class="nav-item" onclick="switchScreen('notifs', this)">
        <div class="nav-icon">🔔</div>
        <div class="nav-label">Alerts</div>
        <div class="nav-badge">3</div>
      </div>
      <div class="nav-item" onclick="switchScreen('profile', this)">
        <div class="nav-icon">👤</div>
        <div class="nav-label">Profile</div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════ -->
  <!-- SCREEN 2: EXPLORE / SEARCH         -->
  <!-- ═══════════════════════════════════ -->
  <div class="screen" id="screen-search">
    <div class="ambient" style="top:-40px;right:-60px;width:240px;height:240px;background:radial-gradient(circle,rgba(0,240,255,0.08),transparent 70%);"></div>

    <div class="scroll-area">
      <div class="page-header">
        <div>
          <div class="page-greeting">FIND YOUR NEXT</div>
          <div class="page-title">Explore</div>
        </div>
        <div style="display:flex;gap:8px;">
          <div style="width:42px;height:42px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;">🗺</div>
        </div>
      </div>

      <div class="search-bar-wrap">
        <div class="search-bar">
          <span class="search-icon">⌕</span>
          <input type="text" placeholder="Westlands, Nairobi..." readonly>
          <div class="filter-btn">⊞ Filter</div>
        </div>
      </div>

      <div class="chips-wrap">
        <div class="chips">
          <div class="chip active">All Areas</div>
          <div class="chip">Westlands</div>
          <div class="chip">Kilimani</div>
          <div class="chip">Karen</div>
          <div class="chip">Lavington</div>
          <div class="chip">Parklands</div>
          <div class="chip">Upper Hill</div>
        </div>
      </div>

      <div class="s-title">12 AVAILABLE NEAR YOU <span class="s-title-link">Map ›</span></div>

      <!-- Featured horizontal card -->
      <div style="overflow-x:auto;scrollbar-width:none;padding:0 20px 16px;position:relative;z-index:1;">
        <div style="display:flex;gap:12px;width:max-content;">
          <div style="width:200px;background:var(--bg-card);border:1px solid rgba(0,240,255,0.2);border-radius:18px;overflow:hidden;flex-shrink:0;box-shadow:0 0 20px rgba(0,240,255,0.06);">
            <div style="height:110px;background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);display:flex;align-items:center;justify-content:center;font-size:44px;opacity:0.4;position:relative;">
              🏙
              <div style="position:absolute;top:8px;left:8px;background:rgba(0,240,255,0.15);border:1px solid rgba(0,240,255,0.3);color:var(--neon);font-size:8px;font-family:'Orbitron',monospace;padding:2px 7px;border-radius:6px;">AI 94%</div>
            </div>
            <div style="padding:12px;">
              <div style="font-family:'JetBrains Mono',monospace;font-size:15px;color:var(--neon);font-weight:600;">$2,400<span style="font-size:10px;color:var(--muted);font-family:'Sora',sans-serif;">/mo</span></div>
              <div style="font-size:12px;font-weight:600;margin-bottom:2px;">Sky Vista</div>
              <div style="font-size:10px;color:var(--muted);">📍 Westlands</div>
            </div>
          </div>
          <div style="width:200px;background:var(--bg-card);border:1px solid rgba(124,58,237,0.2);border-radius:18px;overflow:hidden;flex-shrink:0;">
            <div style="height:110px;background:linear-gradient(135deg,#1a0533,#2d1b6e,#1a0533);display:flex;align-items:center;justify-content:center;font-size:44px;opacity:0.3;position:relative;">
              🏘
              <div style="position:absolute;top:8px;left:8px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);color:var(--purple);font-size:8px;font-family:'Orbitron',monospace;padding:2px 7px;border-radius:6px;">AI 88%</div>
            </div>
            <div style="padding:12px;">
              <div style="font-family:'JetBrains Mono',monospace;font-size:15px;color:var(--purple);font-weight:600;">$1,850<span style="font-size:10px;color:var(--muted);font-family:'Sora',sans-serif;">/mo</span></div>
              <div style="font-size:12px;font-weight:600;margin-bottom:2px;">Aurora Res.</div>
              <div style="font-size:10px;color:var(--muted);">📍 Kilimani</div>
            </div>
          </div>
          <div style="width:200px;background:var(--bg-card);border:1px solid rgba(0,255,163,0.2);border-radius:18px;overflow:hidden;flex-shrink:0;">
            <div style="height:110px;background:linear-gradient(135deg,#0b2013,#0d3b22,#0b2013);display:flex;align-items:center;justify-content:center;font-size:44px;opacity:0.3;position:relative;">
              🌿
              <div style="position:absolute;top:8px;left:8px;background:rgba(0,255,163,0.15);border:1px solid rgba(0,255,163,0.3);color:var(--success);font-size:8px;font-family:'Orbitron',monospace;padding:2px 7px;border-radius:6px;">AI 91%</div>
            </div>
            <div style="padding:12px;">
              <div style="font-family:'JetBrains Mono',monospace;font-size:15px;color:var(--success);font-weight:600;">$3,100<span style="font-size:10px;color:var(--muted);font-family:'Sora',sans-serif;">/mo</span></div>
              <div style="font-size:12px;font-weight:600;margin-bottom:2px;">Emerald Court</div>
              <div style="font-size:10px;color:var(--muted);">📍 Karen</div>
            </div>
          </div>
        </div>
      </div>

      <div class="s-title" style="margin-top:4px;">ALL LISTINGS</div>

      <div class="prop-list-card">
        <div class="plc-img" style="background:linear-gradient(135deg,#1a0a2e,#16213e);">🏯</div>
        <div class="plc-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div class="plc-price" style="color:var(--danger);">$5,500<span style="font-size:10px;color:var(--muted);font-family:'Sora',sans-serif;">/mo</span></div>
            <div style="font-size:9px;background:rgba(255,59,129,0.1);border:1px solid rgba(255,59,129,0.3);color:var(--danger);padding:2px 6px;border-radius:6px;font-family:'Orbitron',monospace;">AI 83%</div>
          </div>
          <div class="plc-name">The Crimson Tower</div>
          <div class="plc-loc">📍 Upper Hill · 1.8 km</div>
          <div class="plc-tags">
            <div class="plc-tag" style="background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);">5 Beds</div>
            <div class="plc-tag" style="background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);">4 Baths</div>
            <div class="plc-tag" style="background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);">3.6K sqft</div>
          </div>
        </div>
      </div>

      <div class="prop-list-card">
        <div class="plc-img" style="background:linear-gradient(135deg,#0a1628,#0d2137);">🌊</div>
        <div class="plc-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div class="plc-price" style="color:var(--neon);">$2,800<span style="font-size:10px;color:var(--muted);font-family:'Sora',sans-serif;">/mo</span></div>
            <div style="font-size:9px;background:rgba(0,240,255,0.08);border:1px solid rgba(0,240,255,0.2);color:var(--neon);padding:2px 6px;border-radius:6px;font-family:'Orbitron',monospace;">AI 79%</div>
          </div>
          <div class="plc-name">Azure Heights</div>
          <div class="plc-loc">📍 Lavington · 3.1 km</div>
          <div class="plc-tags">
            <div class="plc-tag" style="background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);">3 Beds</div>
            <div class="plc-tag" style="background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);">2 Baths</div>
            <div class="plc-tag" style="background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);">1.6K sqft</div>
          </div>
        </div>
      </div>

      <div class="prop-list-card">
        <div class="plc-img" style="background:linear-gradient(135deg,#0f2027,#203a43);">🏗</div>
        <div class="plc-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div class="plc-price" style="color:var(--neon);">$1,200<span style="font-size:10px;color:var(--muted);font-family:'Sora',sans-serif;">/mo</span></div>
            <div style="font-size:9px;background:rgba(0,240,255,0.08);border:1px solid rgba(0,240,255,0.2);color:var(--neon);padding:2px 6px;border-radius:6px;font-family:'Orbitron',monospace;">AI 76%</div>
          </div>
          <div class="plc-name">Sapphire Studios</div>
          <div class="plc-loc">📍 Parklands · 0.5 km</div>
          <div class="plc-tags">
            <div class="plc-tag" style="background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);">1 Bed</div>
            <div class="plc-tag" style="background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);">1 Bath</div>
            <div class="plc-tag" style="background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);">550 sqft</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" onclick="switchScreen('home', this)"><div class="nav-icon">⊞</div><div class="nav-label">Home</div></div>
      <div class="nav-item active" onclick="switchScreen('search', this)"><div class="nav-icon">⌕</div><div class="nav-label">Explore</div></div>
      <div class="nav-item" onclick="switchScreen('payments', this)"><div class="nav-icon">💳</div><div class="nav-label">Pay</div></div>
      <div class="nav-item" onclick="switchScreen('notifs', this)"><div class="nav-icon">🔔</div><div class="nav-label">Alerts</div><div class="nav-badge">3</div></div>
      <div class="nav-item" onclick="switchScreen('profile', this)"><div class="nav-icon">👤</div><div class="nav-label">Profile</div></div>
    </div>
  </div>

  <!-- ═══════════════════════════════════ -->
  <!-- SCREEN 3: PAYMENTS                 -->
  <!-- ═══════════════════════════════════ -->
  <div class="screen" id="screen-payments">
    <div class="ambient" style="top:100px;left:-80px;width:250px;height:250px;background:radial-gradient(circle,rgba(0,255,163,0.07),transparent 70%);"></div>

    <div class="status-bar">
      <div class="status-time">9:41</div>
      <div class="status-icons"><span>▲▲▲</span><span>WiFi</span><span>🔋</span></div>
    </div>

    <div class="scroll-area">
      <div class="page-header">
        <div>
          <div class="page-greeting">BILLING & HISTORY</div>
          <div class="page-title">Payments</div>
        </div>
        <div style="width:42px;height:42px;background:rgba(0,255,163,0.08);border:1px solid rgba(0,255,163,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;color:var(--success);">⬇</div>
      </div>

      <!-- Pay Now Card -->
      <div style="margin:0 20px 20px;background:linear-gradient(135deg,rgba(0,255,163,0.08),rgba(0,240,255,0.05));border:1px solid rgba(0,255,163,0.2);border-radius:22px;padding:22px;position:relative;z-index:1;overflow:hidden;">
        <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:radial-gradient(circle,rgba(0,255,163,0.1),transparent 70%);"></div>
        <div style="font-size:10px;font-family:'Orbitron',monospace;letter-spacing:2px;color:var(--muted);margin-bottom:8px;">NEXT PAYMENT DUE</div>
        <div style="font-size:28px;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--success);margin-bottom:4px;">$2,400</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:20px;">March 1, 2025 · Sky Vista Penthouse</div>
        <button style="width:100%;background:linear-gradient(135deg,var(--success),#00cc82);border:none;color:#0B0F19;padding:14px;border-radius:14px;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;box-shadow:0 0 20px rgba(0,255,163,0.3);">
          PAY NOW ›
        </button>
      </div>

      <!-- Payment chart -->
      <div class="payment-card" style="position:relative;z-index:1;">
        <div class="payment-header">
          <div class="payment-title">PAYMENT HISTORY</div>
          <div class="payment-status-pill" style="background:rgba(0,255,163,0.1);border:1px solid rgba(0,255,163,0.2);color:var(--success);">98.4% On-Time</div>
        </div>
        <div class="bar-chart">
          <div class="bar-wrap"><div class="bar" style="height:55%;background:var(--border);border-radius:4px 4px 0 0;"></div><div class="bar-lbl">Jul</div></div>
          <div class="bar-wrap"><div class="bar" style="height:65%;background:var(--border);"></div><div class="bar-lbl">Aug</div></div>
          <div class="bar-wrap"><div class="bar" style="height:60%;background:var(--border);"></div><div class="bar-lbl">Sep</div></div>
          <div class="bar-wrap"><div class="bar" style="height:72%;background:rgba(124,58,237,0.5);"></div><div class="bar-lbl">Oct</div></div>
          <div class="bar-wrap"><div class="bar" style="height:78%;background:rgba(124,58,237,0.6);"></div><div class="bar-lbl">Nov</div></div>
          <div class="bar-wrap"><div class="bar" style="height:70%;background:rgba(0,240,255,0.5);"></div><div class="bar-lbl">Dec</div></div>
          <div class="bar-wrap"><div class="bar" style="height:88%;background:linear-gradient(var(--neon),var(--purple));box-shadow:0 0 10px rgba(0,240,255,0.3);"></div><div class="bar-lbl" style="color:var(--neon);">Jan</div></div>
          <div class="bar-wrap"><div class="bar" style="height:100%;background:linear-gradient(var(--success),var(--neon));box-shadow:0 0 12px rgba(0,255,163,0.35);"></div><div class="bar-lbl" style="color:var(--success);">Feb</div></div>
        </div>
      </div>

      <div class="s-title" style="margin-top:20px;">TRANSACTION HISTORY</div>

      <!-- Transaction list -->
      <div class="timeline" style="margin-top:4px;">
        <div class="timeline-item">
          <div class="tl-dot" style="background:rgba(0,255,163,0.1);border-color:rgba(0,255,163,0.3);color:var(--success);">✓</div>
          <div class="tl-body">
            <div class="tl-title">February Rent</div>
            <div class="tl-sub">Feb 1, 2025 · M-Pesa · On time</div>
          </div>
          <div class="tl-amt" style="color:var(--success);">-$2,400</div>
        </div>
        <div class="timeline-item">
          <div class="tl-dot" style="background:rgba(0,255,163,0.1);border-color:rgba(0,255,163,0.3);color:var(--success);">✓</div>
          <div class="tl-body">
            <div class="tl-title">January Rent</div>
            <div class="tl-sub">Jan 1, 2025 · M-Pesa · On time</div>
          </div>
          <div class="tl-amt" style="color:var(--success);">-$2,400</div>
        </div>
        <div class="timeline-item">
          <div class="tl-dot" style="background:rgba(0,255,163,0.1);border-color:rgba(0,255,163,0.3);color:var(--success);">✓</div>
          <div class="tl-body">
            <div class="tl-title">December Rent</div>
            <div class="tl-sub">Dec 1, 2024 · M-Pesa · On time</div>
          </div>
          <div class="tl-amt" style="color:var(--success);">-$2,400</div>
        </div>
        <div class="timeline-item">
          <div class="tl-dot" style="background:rgba(255,184,77,0.1);border-color:rgba(255,184,77,0.3);color:var(--warn);">!</div>
          <div class="tl-body">
            <div class="tl-title">November Rent</div>
            <div class="tl-sub">Nov 3, 2024 · M-Pesa · 2 days late</div>
          </div>
          <div class="tl-amt" style="color:var(--warn);">-$2,400</div>
        </div>
        <div class="timeline-item">
          <div class="tl-dot" style="background:rgba(0,255,163,0.1);border-color:rgba(0,255,163,0.3);color:var(--success);">✓</div>
          <div class="tl-body">
            <div class="tl-title">Security Deposit</div>
            <div class="tl-sub">Jan 5, 2022 · Bank Transfer</div>
          </div>
          <div class="tl-amt" style="color:var(--muted);">-$4,800</div>
        </div>
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" onclick="switchScreen('home', this)"><div class="nav-icon">⊞</div><div class="nav-label">Home</div></div>
      <div class="nav-item" onclick="switchScreen('search', this)"><div class="nav-icon">⌕</div><div class="nav-label">Explore</div></div>
      <div class="nav-item active" onclick="switchScreen('payments', this)"><div class="nav-icon">💳</div><div class="nav-label">Pay</div></div>
      <div class="nav-item" onclick="switchScreen('notifs', this)"><div class="nav-icon">🔔</div><div class="nav-label">Alerts</div><div class="nav-badge">3</div></div>
      <div class="nav-item" onclick="switchScreen('profile', this)"><div class="nav-icon">👤</div><div class="nav-label">Profile</div></div>
    </div>
  </div>

  <!-- ═══════════════════════════════════ -->
  <!-- SCREEN 4: NOTIFICATIONS            -->
  <!-- ═══════════════════════════════════ -->
  <div class="screen" id="screen-notifs">
    <div class="ambient" style="top:80px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(255,59,129,0.08),transparent 70%);"></div>

    <div class="status-bar">
      <div class="status-time">9:41</div>
      <div class="status-icons"><span>▲▲▲</span><span>WiFi</span><span>🔋</span></div>
    </div>

    <div class="scroll-area">
      <div class="page-header">
        <div>
          <div class="page-greeting">UPDATES & ALERTS</div>
          <div class="page-title">Notifications</div>
        </div>
        <div style="background:rgba(255,59,129,0.1);border:1px solid rgba(255,59,129,0.25);color:var(--danger);padding:6px 12px;border-radius:10px;font-size:11px;font-family:'Orbitron',monospace;cursor:pointer;">Mark All</div>
      </div>

      <div class="s-title" style="margin-bottom:12px;">NEW <span style="background:var(--danger);color:#fff;font-size:9px;padding:1px 7px;border-radius:8px;margin-left:6px;">3</span></div>

      <div class="notif-item urgent unread">
        <div class="notif-icon" style="background:rgba(255,59,129,0.1);border:1px solid rgba(255,59,129,0.2);">🤖</div>
        <div class="notif-body">
          <div class="notif-title" style="color:var(--danger);">Rent Increase Alert</div>
          <div class="notif-text">AI predicts a 20% rent adjustment for Sky Vista Penthouse starting May 2025. Review your options before the deadline.</div>
          <div class="notif-time">2 hours ago</div>
        </div>
        <div class="unread-dot" style="background:var(--danger);box-shadow:0 0 6px var(--danger);"></div>
      </div>

      <div class="notif-item unread">
        <div class="notif-icon" style="background:rgba(0,240,255,0.08);border:1px solid rgba(0,240,255,0.15);">📄</div>
        <div class="notif-body">
          <div class="notif-title">Lease Renewal Reminder</div>
          <div class="notif-text">Your lease expires July 15, 2025 — 147 days away. Start the renewal process to secure your current rate.</div>
          <div class="notif-time">Yesterday, 3:42 PM</div>
        </div>
        <div class="unread-dot"></div>
      </div>

      <div class="notif-item unread">
        <div class="notif-icon" style="background:rgba(0,255,163,0.08);border:1px solid rgba(0,255,163,0.15);">✅</div>
        <div class="notif-body">
          <div class="notif-title" style="color:var(--success);">Payment Confirmed</div>
          <div class="notif-text">Your February rent payment of $2,400 was received and confirmed. Receipt sent to your email.</div>
          <div class="notif-time">Feb 1, 2025 · 9:12 AM</div>
        </div>
        <div class="unread-dot" style="background:var(--success);box-shadow:0 0 6px var(--success);"></div>
      </div>

      <div class="s-title" style="margin-top:8px;margin-bottom:12px;">EARLIER</div>

      <div class="notif-item">
        <div class="notif-icon" style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.15);">📊</div>
        <div class="notif-body">
          <div class="notif-title">Market Report Ready</div>
          <div class="notif-text">January 2025 Westlands area market analysis is available. Development index up 12.3%.</div>
          <div class="notif-time">Jan 31, 2025</div>
        </div>
      </div>

      <div class="notif-item">
        <div class="notif-icon" style="background:rgba(255,184,77,0.08);border:1px solid rgba(255,184,77,0.15);">🔧</div>
        <div class="notif-body">
          <div class="notif-title">Maintenance Resolved</div>
          <div class="notif-text">Your AC maintenance request has been completed. Technician: James M. Duration: 2h 30m.</div>
          <div class="notif-time">Jan 10, 2025</div>
        </div>
      </div>

      <div class="notif-item">
        <div class="notif-icon" style="background:rgba(0,255,163,0.08);border:1px solid rgba(0,255,163,0.15);">🎉</div>
        <div class="notif-body">
          <div class="notif-title">Lease Extended</div>
          <div class="notif-text">Your lease for Sky Vista Penthouse has been successfully extended for 6 months.</div>
          <div class="notif-time">Jan 15, 2025</div>
        </div>
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" onclick="switchScreen('home', this)"><div class="nav-icon">⊞</div><div class="nav-label">Home</div></div>
      <div class="nav-item" onclick="switchScreen('search', this)"><div class="nav-icon">⌕</div><div class="nav-label">Explore</div></div>
      <div class="nav-item" onclick="switchScreen('payments', this)"><div class="nav-icon">💳</div><div class="nav-label">Pay</div></div>
      <div class="nav-item active" onclick="switchScreen('notifs', this)"><div class="nav-icon">🔔</div><div class="nav-label">Alerts</div></div>
      <div class="nav-item" onclick="switchScreen('profile', this)"><div class="nav-icon">👤</div><div class="nav-label">Profile</div></div>
    </div>
  </div>

  <!-- ═══════════════════════════════════ -->
  <!-- SCREEN 5: PROFILE                  -->
  <!-- ═══════════════════════════════════ -->
  <div class="screen" id="screen-profile">
    <div class="ambient" style="top:60px;left:50%;transform:translateX(-50%);width:300px;height:200px;background:radial-gradient(ellipse,rgba(124,58,237,0.1),transparent 70%);"></div>

    <div class="status-bar">
      <div class="status-time">9:41</div>
      <div class="status-icons"><span>▲▲▲</span><span>WiFi</span><span>🔋</span></div>
    </div>

    <div class="scroll-area">
      <div class="page-header" style="padding-bottom:4px;">
        <div>
          <div class="page-greeting">ACCOUNT</div>
          <div class="page-title">Profile</div>
        </div>
        <div style="width:42px;height:42px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;">⚙</div>
      </div>

      <div class="profile-hero">
        <div class="profile-avatar">👤</div>
        <div class="profile-name">Alex Kimani</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">alex.kimani@email.com</div>
        <div class="profile-tag">◈ VERIFIED TENANT</div>
        <div class="profile-stats">
          <div class="ps-item">
            <div class="ps-val" style="color:var(--neon);">3 yrs</div>
            <div class="ps-lbl">Tenancy</div>
          </div>
          <div class="ps-item">
            <div class="ps-val" style="color:var(--success);">98.4%</div>
            <div class="ps-lbl">On-Time</div>
          </div>
          <div class="ps-item">
            <div class="ps-val" style="color:var(--purple);">94</div>
            <div class="ps-lbl">AI Score</div>
          </div>
        </div>
      </div>

      <!-- My Property -->
      <div class="s-title">MY PROPERTY</div>
      <div class="my-property">
        <div class="prop-image-strip">
          <div class="prop-image-emoji">🏙</div>
          <div class="prop-overlay">
            <div class="prop-badge-row">
              <div class="prop-badge active-badge">● ACTIVE LEASE</div>
              <div class="prop-badge">AI 94%</div>
            </div>
          </div>
        </div>
        <div class="prop-body">
          <div class="prop-name-row">
            <div class="prop-name">Sky Vista Penthouse</div>
            <div class="prop-price-tag">$2,400/mo</div>
          </div>
          <div class="prop-addr">📍 Westlands, Nairobi · Floor 18</div>
          <div class="prop-specs">
            <div class="prop-spec"><span class="spec-icon">⊞</span>3 Beds</div>
            <div class="prop-spec"><span class="spec-icon">◎</span>2 Baths</div>
            <div class="prop-spec"><span class="spec-icon">▣</span>1,400 sqft</div>
            <div class="prop-spec"><span class="spec-icon">📅</span>Jul 15</div>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="s-title" style="margin-top:4px;">ACCOUNT SETTINGS</div>

      <div class="settings-group">
        <div class="settings-group-title">Preferences</div>
        <div class="setting-row">
          <div class="setting-icon" style="background:rgba(0,240,255,0.08);color:var(--neon);">🔔</div>
          <div class="setting-text">
            <div class="setting-name">AI Rent Alerts</div>
            <div class="setting-desc">Get notified of AI price predictions</div>
          </div>
          <div class="toggle-switch"></div>
        </div>
        <div class="setting-row">
          <div class="setting-icon" style="background:rgba(124,58,237,0.08);color:var(--purple);">📊</div>
          <div class="setting-text">
            <div class="setting-name">Market Reports</div>
            <div class="setting-desc">Monthly area analysis digest</div>
          </div>
          <div class="toggle-switch"></div>
        </div>
        <div class="setting-row">
          <div class="setting-icon" style="background:rgba(0,255,163,0.08);color:var(--success);">💳</div>
          <div class="setting-text">
            <div class="setting-name">Auto-Pay</div>
            <div class="setting-desc">Auto-debit on due date</div>
          </div>
          <div class="toggle-switch off"></div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Account</div>
        <div class="setting-row">
          <div class="setting-icon" style="background:rgba(255,255,255,0.04);">👤</div>
          <div class="setting-text"><div class="setting-name">Edit Profile</div></div>
          <div class="setting-arrow">›</div>
        </div>
        <div class="setting-row">
          <div class="setting-icon" style="background:rgba(255,255,255,0.04);">🔐</div>
          <div class="setting-text"><div class="setting-name">Security & Password</div></div>
          <div class="setting-arrow">›</div>
        </div>
        <div class="setting-row">
          <div class="setting-icon" style="background:rgba(255,255,255,0.04);">📄</div>
          <div class="setting-text"><div class="setting-name">My Documents</div></div>
          <div class="setting-arrow">›</div>
        </div>
      </div>

      <div class="settings-group" style="margin-bottom:8px;">
        <div class="setting-row">
          <div class="setting-icon" style="background:rgba(255,59,129,0.08);color:var(--danger);">⎋</div>
          <div class="setting-text"><div class="setting-name" style="color:var(--danger);">Sign Out</div></div>
          <div class="setting-arrow" style="color:var(--danger);">›</div>
        </div>
      </div>

      <div style="text-align:center;padding:8px 20px 4px;position:relative;z-index:1;">
        <div style="font-family:'Orbitron',monospace;font-size:13px;font-weight:700;background:linear-gradient(90deg,var(--neon),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;">NEXUS RENT</div>
        <div style="font-size:10px;color:var(--muted);font-family:'JetBrains Mono',monospace;">v2.4.1 · AI Rental Platform</div>
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" onclick="switchScreen('home', this)"><div class="nav-icon">⊞</div><div class="nav-label">Home</div></div>
      <div class="nav-item" onclick="switchScreen('search', this)"><div class="nav-icon">⌕</div><div class="nav-label">Explore</div></div>
      <div class="nav-item" onclick="switchScreen('payments', this)"><div class="nav-icon">💳</div><div class="nav-label">Pay</div></div>
      <div class="nav-item" onclick="switchScreen('notifs', this)"><div class="nav-icon">🔔</div><div class="nav-label">Alerts</div><div class="nav-badge">3</div></div>
      <div class="nav-item active" onclick="switchScreen('profile', this)"><div class="nav-icon">👤</div><div class="nav-label">Profile</div></div>
    </div>
  </div>

</div>

<!-- Screen navigation tabs -->
<div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap;justify-content:center;">
  <button onclick="switchScreenBtn('home')" class="tab-btn active" id="tab-home" style="padding:8px 18px;background:rgba(0,240,255,0.1);border:1px solid rgba(0,240,255,0.3);color:var(--neon,#00F0FF);border-radius:20px;font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all 0.3s;">HOME</button>
  <button onclick="switchScreenBtn('search')" class="tab-btn" id="tab-search" style="padding:8px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#9CA3AF;border-radius:20px;font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all 0.3s;">EXPLORE</button>
  <button onclick="switchScreenBtn('payments')" class="tab-btn" id="tab-payments" style="padding:8px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#9CA3AF;border-radius:20px;font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all 0.3s;">PAYMENTS</button>
  <button onclick="switchScreenBtn('notifs')" class="tab-btn" id="tab-notifs" style="padding:8px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#9CA3AF;border-radius:20px;font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all 0.3s;">ALERTS</button>
  <button onclick="switchScreenBtn('profile')" class="tab-btn" id="tab-profile" style="padding:8px 18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#9CA3AF;border-radius:20px;font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all 0.3s;">PROFILE</button>
</div>
<div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#4B5563;margin-top:10px;letter-spacing:1px;">390 × 844 · MOBILE TENANT UI</div>

<script>
function switchScreen(id, navEl) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  // Reset scroll
  document.querySelector('#screen-' + id + ' .scroll-area')?.scrollTo(0, 0);
  // Update tab buttons
  updateTabs(id);
}

function switchScreenBtn(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  document.querySelector('#screen-' + id + ' .scroll-area')?.scrollTo(0, 0);
  updateTabs(id);
}

function updateTabs(id) {
  const map = { home: '#00F0FF', search: '#00F0FF', payments: '#00F0FF', notifs: '#00F0FF', profile: '#00F0FF' };
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.style.background = 'rgba(255,255,255,0.04)';
    b.style.borderColor = 'rgba(255,255,255,0.1)';
    b.style.color = '#9CA3AF';
  });
  const active = document.getElementById('tab-' + id);
  if (active) {
    active.style.background = 'rgba(0,240,255,0.1)';
    active.style.borderColor = 'rgba(0,240,255,0.3)';
    active.style.color = '#00F0FF';
  }
}

// Toggle switch clicks
document.querySelectorAll('.toggle-switch').forEach(sw => {
  sw.addEventListener('click', function() {
    this.classList.toggle('off');
    if (!this.classList.contains('off')) {
      this.style.background = 'var(--success, #00FFA3)';
      this.style.boxShadow = '0 0 8px rgba(0,255,163,0.3)';
    } else {
      this.style.background = 'var(--border, #1F2937)';
      this.style.boxShadow = 'none';
    }
  });
});

// Chips
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', function() {
    this.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
  });
});

// Notif items dismiss on click
document.querySelectorAll('.notif-item').forEach(item => {
  item.addEventListener('click', function() {
    this.classList.remove('unread', 'urgent');
    this.querySelector('.unread-dot')?.remove();
    const badge = document.querySelectorAll('.nav-badge');
    badge.forEach(b => {
      const n = parseInt(b.textContent);
      if (n > 0) b.textContent = Math.max(0, n-1);
      if (parseInt(b.textContent) === 0) b.style.display = 'none';
    });
  });
});
</script>
</body>
</html>