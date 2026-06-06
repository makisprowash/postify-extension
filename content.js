// Postify — content.js
// 1. Detects VDP pages and notifies side panel
// 2. Injects "Insert Vehicle Data" button on Facebook Marketplace create page

(function () {
  const url = window.location.href;

  // ── VDP Detection ──────────────────────────────────────
  const isVDP =
    /\/(used|new|inventory|vehicle|vdp|details|listing)\//i.test(url) ||
    /\d{4}[-_](ford|ram|jeep|dodge|chrysler|chevrolet|gmc|toyota|honda|bmw|mercedes|audi|hyundai|kia|nissan|subaru|volkswagen|mazda|lexus|acura|infiniti|cadillac|buick|lincoln)/i.test(url) ||
    /vin[=/][A-HJ-NPR-Z0-9]{17}/i.test(url);

  if (isVDP) {
    chrome.runtime.sendMessage({ type: 'PAGE_DETECTED', url });
    const vehicleData = scrapeVehiclePage();
    if (vehicleData) {
      chrome.runtime.sendMessage({ type: 'VEHICLE_DATA', data: vehicleData, url });
    }
  }

  // ── Facebook Marketplace Auto-fill ────────────────────
  const isFBMarketplace = url.includes('facebook.com/marketplace/create');
  if (isFBMarketplace) {
    injectFBButton();
  }

  // ── Scrape vehicle data from dealership VDP ──────────
  function scrapeVehiclePage() {
    try {
      const text = document.body.innerText;
      const html = document.body.innerHTML;

      const vinMatch =
        text.match(/VIN[:\s#]*([A-HJ-NPR-Z0-9]{17})/i) ||
        html.match(/vin["\s:=]+([A-HJ-NPR-Z0-9]{17})/i);
      const vin = vinMatch?.[1] || null;

      const titleEl = document.querySelector('h1, .vehicle-title, .vdp-title, [class*="title"]');
      const titleText = titleEl?.innerText || document.title || '';
      const yearMatch = titleText.match(/\b(20\d{2}|19\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1]) : null;

      const makes = ['Ford','RAM','Ram','Chevrolet','GMC','Toyota','Honda','Jeep','Dodge','Chrysler','BMW','Mercedes','Audi','Hyundai','Kia','Nissan','Subaru','Volkswagen','Mazda','Lexus','Acura','Infiniti','Cadillac','Buick','Lincoln'];
      let make = null;
      for (const m of makes) {
        if (titleText.includes(m) || text.includes(m)) { make = m; break; }
      }

      let model = null;
      if (make && titleText) {
        const afterMake = titleText.split(make)[1];
        if (afterMake) {
          model = afterMake.trim().split(/\s+/).slice(0, 2).join(' ').replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
        }
      }

      const priceMatch = text.match(/\$\s*([\d,]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

      const mileageMatch = text.match(/([\d,]+)\s*(miles|mi|odometer)/i);
      const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, '')) : null;

      const extColorMatch = text.match(/exterior\s*color[:\s]+([A-Za-z\s]+)/i);
      const intColorMatch = text.match(/interior\s*color[:\s]+([A-Za-z\s]+)/i);
      const exterior_color = extColorMatch?.[1]?.trim().split('\n')[0] || null;
      const interior_color = intColorMatch?.[1]?.trim().split('\n')[0] || null;

      const stockMatch = text.match(/stock\s*[#:]?\s*([A-Z0-9]+)/i);
      const stock_number = stockMatch?.[1] || null;

      const imgs = Array.from(document.querySelectorAll('img'))
        .map(img => img.src)
        .filter(src => src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !src.includes('sprite'))
        .slice(0, 20);

      const descEl = document.querySelector('[class*="description"], [class*="comments"], [class*="details-text"]');
      const description = descEl?.innerText?.trim().slice(0, 1000) || null;

      const dealer_name = document.querySelector('[class*="dealer-name"], [class*="dealership"]')?.innerText?.trim() || null;
      const dealer_location = document.querySelector('[class*="address"], [class*="location"]')?.innerText?.trim().slice(0, 100) || null;

      return {
        vin, year, make, model, price, mileage,
        exterior_color, interior_color, stock_number,
        photo_urls: imgs,
        photo_url: imgs[0] || null,
        description, dealer_name, dealer_location,
        source_url: url, trim: null
      };
    } catch (e) {
      return null;
    }
  }

  // ── Inject "Insert Vehicle Data" button on Facebook ───
  function injectFBButton() {
    const interval = setInterval(() => {
      const form = document.querySelector('form, [role="main"]');
      if (!form) return;
      if (document.getElementById('postify-fb-btn')) return;

      chrome.storage.local.get(['postify_selected_vehicle'], (result) => {
        const vehicle = result.postify_selected_vehicle;

        const btn = document.createElement('button');
        btn.id = 'postify-fb-btn';
        btn.type = 'button';
        btn.textContent = 'Insert Vehicle Data';
        btn.style.cssText = `
          position: fixed;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(99,102,241,0.4);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          white-space: nowrap;
        `;

        btn.addEventListener('mouseenter', () => btn.style.background = '#4f46e5');
        btn.addEventListener('mouseleave', () => btn.style.background = '#6366f1');

        btn.addEventListener('click', () => {
          chrome.storage.local.get(['postify_selected_vehicle'], (r) => {
            const v = r.postify_selected_vehicle;
            if (!v) {
              alert('No vehicle selected. Open Postify sidebar, click a vehicle card to select it, then come back here.');
              return;
            }
            fillFBForm(v);
          });
        });

        document.body.appendChild(btn);
        clearInterval(interval);
      });
    }, 1000);

    setTimeout(() => clearInterval(interval), 15000);
  }

  // ── Fill Facebook Marketplace form ───────────────────
  function fillFBForm(v) {
    try {
      function setReactValue(el, value) {
        if (!el) return;
        const nativeSetter =
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
          Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (nativeSetter) nativeSetter.call(el, value);
        else el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }

      function selectDropdownOption(selector, value) {
        const el = document.querySelector(selector);
        if (!el) return;
        el.click();
        setTimeout(() => {
          const options = document.querySelectorAll('[role="option"], option');
          for (const opt of options) {
            if (opt.textContent.trim().toLowerCase().includes(value.toLowerCase())) {
              opt.click(); break;
            }
          }
        }, 500);
      }

      // Vehicle Type
      selectDropdownOption('[aria-label="Vehicle type"], select', 'Car/Truck');

      setTimeout(() => {
        // Year
        selectDropdownOption('[aria-label="Year"]', String(v.year || ''));

        // Make
        const makeInput = document.querySelector('[aria-label="Make"], input[placeholder*="Make"]');
        if (makeInput) setReactValue(makeInput, v.make || '');

        // Model
        const modelInput = document.querySelector('[aria-label="Model"], input[placeholder*="Model"]');
        if (modelInput) setReactValue(modelInput, v.model || '');

        // Price
        const priceInput = document.querySelector('[aria-label="Price"], input[placeholder*="rice"]');
        if (priceInput) setReactValue(priceInput, String(v.price || ''));

        // Description
        const descInput = document.querySelector('textarea[aria-label="Description"], textarea[placeholder*="escription"]');
        const descText = v.description ||
          `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}\n` +
          `${v.mileage ? v.mileage.toLocaleString() + ' miles' : ''}\n` +
          `${v.exterior_color ? 'Exterior: ' + v.exterior_color : ''}\n` +
          `${v.interior_color ? 'Interior: ' + v.interior_color : ''}\n` +
          `${v.vin ? 'VIN: ' + v.vin : ''}\n\nContact us for more information!`;
        if (descInput) setReactValue(descInput, descText);

        const btn = document.getElementById('postify-fb-btn');
        if (btn) {
          btn.textContent = '✓ Data Inserted!';
          btn.style.background = '#22c55e';
          setTimeout(() => {
            btn.textContent = 'Insert Vehicle Data';
            btn.style.background = '#6366f1';
          }, 3000);
        }
      }, 800);

    } catch (e) {
      console.error('Postify autofill error:', e);
    }
  }

})();
