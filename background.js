// Postify — background.js (Service Worker)
// Handles badge updates and message passing

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url) return;

  // Detect vehicle detail pages and show badge
  const isVDP =
    /\/(used|new|inventory|vehicle|vdp|details|listing)\//i.test(tab.url) ||
    /\d{4}[-_](ford|ram|jeep|dodge|chrysler|chevrolet|gmc|toyota|honda|bmw|mercedes|audi|hyundai|kia|nissan|subaru|volkswagen|mazda|lexus|acura|infiniti|cadillac|buick|lincoln)/i.test(tab.url) ||
    /vin[=/][A-HJ-NPR-Z0-9]{17}/i.test(tab.url);

  if (isVDP) {
    chrome.action.setBadgeText({ text: "GO", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#6366f1", tabId });
  } else {
    chrome.action.setBadgeText({ text: "", tabId });
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PAGE_DETECTED") {
    chrome.action.setBadgeText({ text: "GO", tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#6366f1", tabId: sender.tab.id });
  }
  return true;
});
