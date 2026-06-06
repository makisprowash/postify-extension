const SCRAPER = "https://autolister-scraper-production.up.railway.app";
const POSTIFY_URL = "https://postify-ivory-gamma.vercel.app";

let currentContent = null;
let currentVehicle = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  setStatus("gray", "Checking page...");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    const isVDP = /\/(used|new|inventory|vehicle|vdp|details|listing)\//i.test(url) ||
                  /\d{4}[-_](ford|ram|jeep|dodge|chrysler|chevrolet|gmc|toyota|honda|bmw|mercedes|audi|hyundai|kia|nissan|subaru|volkswagen|mazda|lexus|acura|infiniti|cadillac|buick|lincoln)/i.test(url) ||
                  /vin[=/][A-HJ-NPR-Z0-9]{17}/i.test(url);

    if (!isVDP) {
      setStatus("gray", "Not a vehicle page");
      document.getElementById("generate-btn").disabled = true;
      document.getElementById("hint-text").textContent = "Navigate to a vehicle listing page to use Postify.";
      return;
    }

    setStatus("green", "Vehicle page detected!");
    document.getElementById("hint-text").textContent = url.replace(/^https?:\/\//, "").substring(0, 50) + "...";

    const titleMatch = tab.title?.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z\s]+)/);
    if (titleMatch) {
      document.getElementById("vehicle-info").style.display = "block";
      document.getElementById("v-name").textContent = `${titleMatch[1]} ${titleMatch[2]} ${titleMatch[3].trim().split(" ").slice(0,2).join(" ")}`;
      document.getElementById("v-meta").textContent = "Ready to generate listing";
    }

  } catch (e) {
    setStatus("gray", "Could not detect page");
  }
});

// ─── OPEN IN POSTIFY (fixes popup closing issue) ──────────────────────────────
async function openInPostify() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = encodeURIComponent(tab.url);
    chrome.tabs.create({ url: `${POSTIFY_URL}?url=${url}&autoload=1` });
  } catch(e) {
    showError("Could not open Postify: " + e.message);
  }
}

// ─── GENERATE (used when popup stays open) ────────────────────────────────────
async function generate() {
  const btn = document.getElementById("generate-btn");
  btn.disabled = true;
  btn.textContent = "⏳ Scraping vehicle...";
  setStatus("amber", "Extracting vehicle data...");
  hideError();
  document.getElementById("output").style.display = "none";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    const scrapeRes = await fetch(`${SCRAPER}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!scrapeRes.ok) throw new Error(`Scrape failed: ${scrapeRes.status}`);
    const vehicle = await scrapeRes.json();
    currentVehicle = vehicle;

    const name = `${vehicle.year||""} ${vehicle.make||""} ${vehicle.model||""} ${vehicle.trim||""}`.trim();
    document.getElementById("vehicle-info").style.display = "block";
    document.getElementById("v-name").textContent = name || "Vehicle detected";
    document.getElementById("v-meta").textContent = [
      vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} mi` : "",
      vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : "",
      vehicle.photos?.length ? `${vehicle.photos.length} photos` : ""
    ].filter(Boolean).join(" · ");

    btn.textContent = "✨ AI writing listing...";
    setStatus("amber", "AI writing your listing...");

    const genRes = await fetch(`${SCRAPER}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle })
    });

    if (!genRes.ok) throw new Error(`Generation failed: ${genRes.status}`);
    const content = await genRes.json();
    currentContent = content;

    document.getElementById("out-title").textContent = content.title || "";
    document.getElementById("out-desc").textContent = content.description || "";
    document.getElementById("out-highlights").textContent = content.highlights?.map(h => `• ${h}`).join("\n") || "";
    document.getElementById("output").style.display = "block";

    setStatus("green", "Listing ready!");
    btn.textContent = "↺ Regenerate";
    btn.disabled = false;
    document.getElementById("hint-text").textContent = "";

    await chrome.storage.local.set({ lastVehicle: vehicle, lastContent: content });

  } catch (e) {
    showError(e.message);
    setStatus("gray", "Something went wrong");
    btn.textContent = "✨ Generate Listing";
    btn.disabled = false;
  }
}

// ─── COPY ─────────────────────────────────────────────────────────────────────
function copyField(field) {
  if (!currentContent) return;
  let text = "";
  if (field === "title") text = currentContent.title || "";
  if (field === "description") text = currentContent.description || "";
  if (field === "highlights") text = currentContent.highlights?.map(h => `• ${h}`).join("\n") || "";
  navigator.clipboard.writeText(text);
  const btn = event.target;
  btn.textContent = "Copied!";
  setTimeout(() => btn.textContent = "Copy", 1500);
}

function copyAll() {
  if (!currentContent) return;
  const c = currentContent;
  const full = [c.title,"",c.description,"",c.highlights?.map(h=>`• ${h}`).join("\n"),"",c.financing,"",c.cta].join("\n");
  navigator.clipboard.writeText(full);
  const btn = event.target;
  btn.textContent = "✓ Copied!";
  setTimeout(() => btn.textContent = "📋 Copy Full Listing", 1500);
}

function openFacebook() {
  if (currentContent) {
    const c = currentContent;
    const full = [c.title,"",c.description,"",c.highlights?.map(h=>`• ${h}`).join("\n"),"",c.financing,"",c.cta].join("\n");
    navigator.clipboard.writeText(full);
  }
  chrome.tabs.create({ url: "https://www.facebook.com/marketplace/create/vehicle" });
}

function openPostify() {
  chrome.tabs.create({ url: POSTIFY_URL });
}

function setStatus(color, text) {
  const dot = document.getElementById("status-dot");
  const txt = document.getElementById("status-text");
  dot.className = `dot dot-${color}`;
  txt.textContent = text;
}

function showError(msg) {
  const el = document.getElementById("error-box");
  el.style.display = "block";
  el.textContent = msg;
}

function hideError() {
  document.getElementById("error-box").style.display = "none";
}
