// Postify — background.js (Service Worker)

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Enable side panel for all URLs
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Detect vehicle detail pages and show badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url) return;

  const isVDP =
    /\/(used|new|inventory|vehicle|vdp|details|listing)\//i.test(tab.url) ||
    /\d{4}[-_](ford|ram|jeep|dodge|chrysler|chevrolet|gmc|toyota|honda|bmw|mercedes|audi|hyundai|kia|nissan|subaru|volkswagen|mazda|lexus|acura|infiniti|cadillac|buick|lincoln)/i.test(tab.url) ||
    /vin[=/][A-HJ-NPR-Z0-9]{17}/i.test(tab.url);

  if (isVDP) {
    chrome.action.setBadgeText({ text: "GO", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#6366f1", tabId });
    chrome.runtime.sendMessage({ type: "VDP_DETECTED", url: tab.url }).catch(() => {});
  } else {
    chrome.action.setBadgeText({ text: "", tabId });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PAGE_DETECTED") {
    chrome.action.setBadgeText({ text: "GO", tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#6366f1", tabId: sender.tab.id });
    chrome.runtime.sendMessage({ type: "VDP_DETECTED", url: msg.url }).catch(() => {});
  }
  if (msg.type === "GET_CURRENT_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] });
    });
    return true;
  }
});
