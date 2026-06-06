// Postify — content.js
// Injects floating sidebar widget on all pages

(function () {
  if (document.getElementById('postify-sidebar')) return;

  // ── Config ──────────────────────────────────────────────
  const SUPABASE_URL = 'https://xfkunytzqduvgzauywtq.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // replace with your actual anon key
  const APP_URL = 'https://postify-ivory-gamma.vercel.app';

  // ── Detect current page ──────────────────────────────────
  const currentUrl = window.location.href;
  const isVDP =
    /\/(used|new|inventory|vehicle|vdp|details|listing)\//i.test(currentUrl) ||
    /\d{4}[-_](ford|ram|jeep|dodge|chrysler|chevrolet|gmc|toyota|honda|bmw|mercedes|audi|hyundai|kia|nissan|subaru|volkswagen|mazda|lexus|acura|infiniti|cadillac|buick|lincoln)/i.test(currentUrl) ||
    /vin[=/][A-HJ-NPR-Z0-9]{17}/i.test(currentUrl);

  if (isVDP) {
    chrome.runtime.sendMessage({ type: 'PAGE_DETECTED', url: currentUrl });
  }

  // ── Inject CSS ───────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #postify-sidebar * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #postify-sidebar {
      position: fixed;
      top: 80px;
      right: 0;
      width: 300px;
      max-height: 85vh;
      background: #ffffff;
      border-radius: 12px 0 0 12px;
      box-shadow: -4px 0 24px rgba(0,0,0,0.15), 0 4px 24px rgba(0,0,0,0.1);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
      border: 1px solid #e5e7eb;
      border-right: none;
      overflow: hidden;
    }
    #postify-sidebar.collapsed {
      transform: translateX(300px);
    }
    #postify-toggle-tab {
      position: fixed;
      top: 80px;
      right: 0;
      z-index: 2147483646;
      background: #6366f1;
      color: white;
      border-radius: 8px 0 0 8px;
      padding: 10px 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      box-shadow: -2px 0 12px rgba(99,102,241,0.4);
      transition: all 0.2s;
      border: none;
    }
    #postify-toggle-tab:hover { background: #4f46e5; }
    #postify-toggle-tab .tab-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
    }
    #postify-toggle-tab .tab-icon { font-size: 14px; }

    /* Header */
    #postify-sidebar .ps-header {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    #postify-sidebar .ps-logo-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #postify-sidebar .ps-logo {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 14px;
      flex-shrink: 0;
    }
    #postify-sidebar .ps-brand {
      color: white;
      font-size: 14px;
      font-weight: 700;
    }
    #postify-sidebar .ps-tagline {
      color: rgba(255,255,255,0.6);
      font-size: 10px;
    }
    #postify-sidebar .ps-close {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    #postify-sidebar .ps-close:hover { background: rgba(255,255,255,0.2); }

    /* VDP Banner */
    #postify-sidebar .ps-vdp-banner {
      background: #f0fdf4;
      border-bottom: 1px solid #bbf7d0;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    #postify-sidebar .ps-vdp-banner .vdp-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22c55e; flex-shrink: 0;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
    }
    #postify-sidebar .ps-vdp-banner span {
      font-size: 11px; color: #15803d; font-weight: 600;
    }
    #postify-sidebar .ps-vdp-banner .ps-generate-btn {
      margin-left: auto;
      background: #22c55e;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    #postify-sidebar .ps-vdp-banner .ps-generate-btn:hover { background: #16a34a; }

    /* Stats bar */
    #postify-sidebar .ps-stats {
      display: flex;
      background: #f8f9fb;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    #postify-sidebar .ps-stat {
      flex: 1;
      padding: 8px 0;
      text-align: center;
      border-right: 1px solid #e5e7eb;
    }
    #postify-sidebar .ps-stat:last-child { border-right: none; }
    #postify-sidebar .ps-stat-num {
      font-size: 16px;
      font-weight: 700;
      color: #1e1b4b;
      line-height: 1;
    }
    #postify-sidebar .ps-stat-label {
      font-size: 9px;
      color: #9ca3af;
      font-weight: 500;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* FB Groups dropdown */
    #postify-sidebar .ps-groups-row {
      padding: 10px 14px;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    #postify-sidebar .ps-groups-row label {
      font-size: 10px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 5px;
    }
    #postify-sidebar .ps-groups-select {
      width: 100%;
      padding: 7px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 7px;
      font-size: 12px;
      color: #374151;
      background: white;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
    }

    /* Search */
    #postify-sidebar .ps-search-row {
      padding: 8px 14px;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    #postify-sidebar .ps-search {
      width: 100%;
      padding: 7px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 7px;
      font-size: 12px;
      color: #374151;
      background: #f9fafb;
    }
    #postify-sidebar .ps-search:focus {
      outline: none;
      border-color: #6366f1;
      background: white;
    }

    /* Vehicle list */
    #postify-sidebar .ps-list {
      overflow-y: auto;
      flex: 1;
    }
    #postify-sidebar .ps-list::-webkit-scrollbar { width: 4px; }
    #postify-sidebar .ps-list::-webkit-scrollbar-track { background: #f1f5f9; }
    #postify-sidebar .ps-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

    #postify-sidebar .ps-vehicle {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.15s;
    }
    #postify-sidebar .ps-vehicle:hover { background: #fafafa; }

    #postify-sidebar .ps-thumb {
      width: 52px;
      height: 40px;
      border-radius: 6px;
      object-fit: cover;
      background: #e5e7eb;
      flex-shrink: 0;
      border: 1px solid #e5e7eb;
    }
    #postify-sidebar .ps-thumb-placeholder {
      width: 52px;
      height: 40px;
      border-radius: 6px;
      background: linear-gradient(135deg, #e0e7ff, #ede9fe);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      border: 1px solid #e5e7eb;
    }

    #postify-sidebar .ps-vinfo { flex: 1; min-width: 0; }
    #postify-sidebar .ps-vname {
      font-size: 11px;
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }
    #postify-sidebar .ps-vmeta {
      font-size: 10px;
      color: #6b7280;
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #postify-sidebar .ps-vprice {
      font-size: 11px;
      font-weight: 700;
      color: #1e1b4b;
      margin-top: 2px;
    }

    #postify-sidebar .ps-actions { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
    #postify-sidebar .ps-btn-post {
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    #postify-sidebar .ps-btn-post:hover { background: #4f46e5; }
    #postify-sidebar .ps-btn-repost {
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    #postify-sidebar .ps-btn-repost:hover { background: #fecaca; }
    #postify-sidebar .ps-btn-posted {
      background: #f0fdf4;
      color: #16a34a;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 10px;
      font-weight: 700;
      cursor: default;
      white-space: nowrap;
    }

    /* Loading / empty states */
    #postify-sidebar .ps-loading {
      padding: 24px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    #postify-sidebar .ps-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: ps-spin 0.7s linear infinite;
      margin: 0 auto 8px;
    }
    @keyframes ps-spin { to { transform: rotate(360deg); } }

    /* Footer */
    #postify-sidebar .ps-footer {
      padding: 8px 14px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      background: #fafafa;
    }
    #postify-sidebar .ps-footer a {
      font-size: 10px;
      color: #6366f1;
      text-decoration: none;
      font-weight: 600;
    }
    #postify-sidebar .ps-footer a:hover { text-decoration: underline; }
    #postify-sidebar .ps-footer-right {
      font-size: 10px;
      color: #9ca3af;
    }
  `;
  document.head.appendChild(style);

  // ── Build sidebar HTML ────────────────────────────────────
  const sidebar = document.createElement('div');
  sidebar.id = 'postify-sidebar';
  sidebar.innerHTML = `
    <div class="ps-header">
      <div class="ps-logo-row">
        <div class="ps-logo">P</div>
        <div>
          <div class="ps-brand">Postify</div>
          <div class="ps-tagline">Auto Lister</div>
        </div>
      </div>
      <button class="ps-close" id="ps-close-btn">✕</button>
    </div>

    <div class="ps-vdp-banner" id="ps-vdp-banner" style="display:none;">
      <div class="vdp-dot"></div>
      <span>Vehicle page detected!</span>
      <button class="ps-generate-btn" id="ps-generate-now">Generate</button>
    </div>

    <div class="ps-stats">
      <div class="ps-stat">
        <div class="ps-stat-num" id="ps-total">—</div>
        <div class="ps-stat-label">Total</div>
      </div>
      <div class="ps-stat">
        <div class="ps-stat-num" id="ps-listed">—</div>
        <div class="ps-stat-label">Listed</div>
      </div>
      <div class="ps-stat">
        <div class="ps-stat-num" id="ps-remaining">—</div>
        <div class="ps-stat-label">Remaining</div>
      </div>
    </div>

    <div class="ps-groups-row">
      <label>FB Group</label>
      <select class="ps-groups-select" id="ps-groups-select">
        <option value="">— Select FB Group —</option>
        <option value="local">Local Cars For Sale</option>
        <option value="marketplace">Facebook Marketplace</option>
      </select>
    </div>

    <div class="ps-search-row">
      <input class="ps-search" id="ps-search" type="text" placeholder="Search by VIN, make, model…"/>
    </div>

    <div class="ps-list" id="ps-list">
      <div class="ps-loading">
        <div class="ps-spinner"></div>
        Loading inventory…
      </div>
    </div>

    <div class="ps-footer">
      <a href="${APP_URL}" target="_blank">Open Dashboard</a>
      <span class="ps-footer-right">Postify v1.0</span>
    </div>
  `;
  document.body.appendChild(sidebar);

  // ── Toggle tab ────────────────────────────────────────────
  const toggleTab = document.createElement('button');
  toggleTab.id = 'postify-toggle-tab';
  toggleTab.innerHTML = `<span class="tab-icon">🚗</span><span class="tab-label">POSTIFY</span>`;
  document.body.appendChild(toggleTab);

  // ── State ─────────────────────────────────────────────────
  let allVehicles = [];
  let listedVins = new Set();
  let collapsed = false;

  // ── Toggle sidebar ────────────────────────────────────────
  function toggleSidebar() {
    collapsed = !collapsed;
    sidebar.classList.toggle('collapsed', collapsed);
    toggleTab.style.display = collapsed ? 'flex' : 'none';
  }

  document.getElementById('ps-close-btn').addEventListener('click', toggleSidebar);
  toggleTab.addEventListener('click', toggleSidebar);

  // ── VDP banner ────────────────────────────────────────────
  if (isVDP) {
    document.getElementById('ps-vdp-banner').style.display = 'flex';
    document.getElementById('ps-generate-now').addEventListener('click', () => {
      window.open(`${APP_URL}?url=${encodeURIComponent(currentUrl)}`, '_blank');
    });
  }

  // ── Load inventory from Supabase ──────────────────────────
  async function loadInventory() {
    try {
      // Try to get auth token from storage
      const stored = await new Promise(resolve =>
        chrome.storage.local.get(['postify_session'], resolve)
      );
      const token = stored.postify_session?.access_token;

      const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/vehicles?select=id,vin,year,make,model,trim,mileage,price,photo_url,listing_status&order=created_at.desc&limit=100`,
        { headers }
      );

      if (!res.ok) throw new Error('Auth required');
      const vehicles = await res.json();
      allVehicles = vehicles;

      // Track listed VINs
      listedVins = new Set(
        vehicles.filter(v => v.listing_status === 'posted').map(v => v.vin)
      );

      updateStats();
      renderVehicles(vehicles);
    } catch (err) {
      // Fallback: show sample vehicles for demo
      allVehicles = getSampleVehicles();
      updateStats();
      renderVehicles(allVehicles);
    }
  }

  function getSampleVehicles() {
    return [
      { id: 1, vin: '3C6RR6NT0HG155092', year: 2018, make: 'RAM', model: '1500', trim: 'Big Horn', mileage: 90833, price: 22988, listing_status: 'posted' },
      { id: 2, vin: '1GT49REY0LF104001', year: 2020, make: 'GMC', model: 'Sierra 2500HD', trim: 'SLE', mileage: 105602, price: 56873, listing_status: null },
      { id: 3, vin: '1FT7W2BT2JEC90083', year: 2018, make: 'Ford', model: 'F-250', trim: 'Super Duty', mileage: 95454, price: 43756, listing_status: null },
      { id: 4, vin: '1FT7W2BT2HEC30311', year: 2017, make: 'Ford', model: 'F-250', trim: 'Super Duty', mileage: 133391, price: 49988, listing_status: 'posted' },
      { id: 5, vin: '1FT7W2BT4KES26004', year: 2019, make: 'Ford', model: 'F-250', trim: 'Super Duty', mileage: 68793, price: 62970, listing_status: null },
      { id: 6, vin: '3GCUYGE00BLZ37848', year: 2020, make: 'Chevrolet', model: 'Silverado 1500', trim: 'LTZ', mileage: 112303, price: 37698, listing_status: null },
      { id: 7, vin: '1FT7W2BT2NEC66680', year: 2022, make: 'Ford', model: 'F-250', trim: 'Super Duty', mileage: 56800, price: 60877, listing_status: null },
    ];
  }

  function updateStats() {
    const total = allVehicles.length;
    const listed = allVehicles.filter(v => v.listing_status === 'posted').length;
    document.getElementById('ps-total').textContent = total;
    document.getElementById('ps-listed').textContent = listed;
    document.getElementById('ps-remaining').textContent = total - listed;
  }

  function renderVehicles(vehicles) {
    const list = document.getElementById('ps-list');
    if (!vehicles.length) {
      list.innerHTML = `<div class="ps-loading">No vehicles found.</div>`;
      return;
    }

    list.innerHTML = vehicles.map(v => {
      const isPosted = v.listing_status === 'posted';
      const name = `${v.year} ${v.make} ${v.model}`;
      const meta = `${v.vin?.slice(-8) || 'N/A'} · ${Number(v.mileage || 0).toLocaleString()} mi`;
      const price = v.price ? `$${Number(v.price).toLocaleString()}` : 'Call';
      const thumb = v.photo_url
        ? `<img class="ps-thumb" src="${v.photo_url}" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="ps-thumb-placeholder" style="display:none">🚗</div>`
        : `<div class="ps-thumb-placeholder">🚗</div>`;

      const actionBtn = isPosted
        ? `<button class="ps-btn-posted">✓ Posted</button>
           <button class="ps-btn-repost" data-vin="${v.vin}" data-id="${v.id}">Post Again</button>`
        : `<button class="ps-btn-post" data-vin="${v.vin}" data-id="${v.id}" data-name="${name}" data-price="${v.price || ''}">Post</button>`;

      return `
        <div class="ps-vehicle" data-vin="${v.vin}">
          ${thumb}
          <div class="ps-vinfo">
            <div class="ps-vname">${name}</div>
            <div class="ps-vmeta">${meta}</div>
            <div class="ps-vprice">${price}</div>
          </div>
          <div class="ps-actions">${actionBtn}</div>
        </div>
      `;
    }).join('');

    // Attach button listeners
    list.querySelectorAll('.ps-btn-post').forEach(btn => {
      btn.addEventListener('click', () => handlePost(btn));
    });
    list.querySelectorAll('.ps-btn-repost').forEach(btn => {
      btn.addEventListener('click', () => handleRepost(btn));
    });
  }

  function handlePost(btn) {
    const vin = btn.dataset.vin;
    const id = btn.dataset.id;
    // Open Postify app to generate listing for this vehicle
    window.open(`${APP_URL}?vehicle_id=${id}&vin=${vin}`, '_blank');
  }

  function handleRepost(btn) {
    const vin = btn.dataset.vin;
    const id = btn.dataset.id;
    window.open(`${APP_URL}?vehicle_id=${id}&vin=${vin}&repost=true`, '_blank');
  }

  // ── Search ────────────────────────────────────────────────
  document.getElementById('ps-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { renderVehicles(allVehicles); return; }
    const filtered = allVehicles.filter(v =>
      `${v.year} ${v.make} ${v.model} ${v.vin} ${v.trim}`.toLowerCase().includes(q)
    );
    renderVehicles(filtered);
  });

  // ── Init ──────────────────────────────────────────────────
  loadInventory();

})();
