const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #F0F4F8; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes pop { 0%{transform:scale(.92);opacity:0} 70%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-up { animation: fadeUp .5s ease both; }
    .fade-in { animation: fadeIn .4s ease both; }
    .pop { animation: pop .3s cubic-bezier(.22,1,.36,1) both; }
    .slide-down { animation: slideDown .25s ease both; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: #0D1B2A; }
    ::-webkit-scrollbar-thumb { background: #E8520A; border-radius: 10px; }
    .card { background:#fff; border-radius:14px; box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04); transition:box-shadow .2s; }
    .card:hover { box-shadow:0 4px 20px rgba(0,0,0,.1); }
    .btn-primary { background:#E8520A; color:#fff; border:none; border-radius:8px; padding:9px 18px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:6px; }
    .btn-primary:hover { background:#C94308; box-shadow:0 4px 14px rgba(232,82,10,.35); transform:translateY(-1px); }
    .btn-primary:active { transform:translateY(0); }
    .btn-primary:disabled { background:#E2E8F0; color:#94A3B8; box-shadow:none; transform:none; cursor:not-allowed; }
    .btn-secondary { background:#fff; color:#0D1B2A; border:1.5px solid #E2E8F0; border-radius:8px; padding:8px 16px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:6px; }
    .btn-secondary:hover { border-color:#E8520A; color:#E8520A; background:#FFF5F0; }
    .btn-ghost { background:transparent; color:#64748B; border:none; border-radius:8px; padding:7px 12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:5px; }
    .btn-ghost:hover { background:#F1F5F9; color:#0D1B2A; }
    .btn-danger { background:transparent; color:#EF4444; border:1.5px solid #FECACA; border-radius:7px; padding:5px 10px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all .18s; }
    .btn-danger:hover { background:#FEF2F2; border-color:#EF4444; }
    .btn-success { background:#10B981; color:#fff; border:none; border-radius:8px; padding:7px 14px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all .2s; display:inline-flex; align-items:center; gap:5px; }
    .btn-success:hover { background:#059669; }
    .inp { width:100%; padding:9px 13px; border:1.5px solid #E2E8F0; border-radius:9px; font-size:13px; color:#0D1B2A; outline:none; background:#fff; font-family:'DM Sans',sans-serif; transition:border-color .18s,box-shadow .18s; }
    .inp:focus { border-color:#E8520A; box-shadow:0 0 0 3px rgba(232,82,10,.11); }
    .inp:disabled { background:#F8FAFC; color:#94A3B8; cursor:not-allowed; }
    input, select, textarea { font-family:'DM Sans',sans-serif; border:1.5px solid #E2E8F0; border-radius:8px; padding:9px 13px; font-size:13px; color:#0D1B2A; outline:none; transition:border-color .2s,box-shadow .2s; background:#fff; width:100%; }
    input:focus, select:focus, textarea:focus { border-color:#E8520A; box-shadow:0 0 0 3px rgba(232,82,10,.12); }
    table { width:100%; border-collapse:collapse; }
    thead th { background:#F8FAFC; color:#64748B; font-size:11px; font-weight:600; letter-spacing:.6px; text-transform:uppercase; padding:10px 14px; text-align:left; border-bottom:1px solid #E2E8F0; }
    tbody td { padding:12px 14px; font-size:13px; color:#1E293B; border-bottom:1px solid #F1F5F9; vertical-align:middle; }
    tbody tr:hover td { background:#FAFBFF; }
    tbody tr:last-child td { border-bottom:none; }
    .sidebar-item { display:flex; align-items:center; gap:11px; padding:10px 14px; border-radius:10px; cursor:pointer; transition:all .2s; color:#8CA4BE; font-size:13.5px; font-weight:500; position:relative; }
    .sidebar-item:hover { background:rgba(255,255,255,.07); color:#fff; }
    .sidebar-item.active { background:rgba(232,82,10,.18); color:#fff; font-weight:600; }
    .sidebar-item.active::before { content:''; position:absolute; left:0; top:50%; transform:translateY(-50%); width:3px; height:60%; background:#E8520A; border-radius:0 3px 3px 0; }
    .kpi-card { padding:22px 24px; border-radius:14px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04); animation:fadeUp .5s ease both; }
    .progress-bar { height:6px; background:#F1F5F9; border-radius:100px; overflow:hidden; }
    .progress-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,#E8520A,#FF8C5A); transition:width 1s ease; }
    .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600; letter-spacing:.3px; }
    .tab { padding:8px 16px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:500; color:#64748B; transition:all .2s; border:none; background:transparent; }
    .tab.active { background:#E8520A; color:#fff; font-weight:600; }
    .tab:not(.active):hover { background:#F1F5F9; color:#0D1B2A; }
    .notification-dot { width:7px; height:7px; background:#E8520A; border-radius:50%; position:absolute; top:2px; right:2px; animation:pulse 2s infinite; }
    .modal-overlay { position:fixed; inset:0; background:rgba(13,27,42,.6); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; animation:fadeIn .2s ease; }
    .modal { background:#fff; border-radius:18px; width:560px; max-width:100%; max-height:92vh; overflow-y:auto; box-shadow:0 24px 80px rgba(0,0,0,.28); animation:fadeUp .3s ease; }
  `}</style>
);

export default FontLink;
