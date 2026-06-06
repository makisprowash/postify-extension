// Postify — content.js
// Detects vehicle pages and notifies the side panel

(function () {
  const url = window.location.href;
  const isVDP =
    /\/(used|new|inventory|vehicle|vdp|details|listing)\//i.test(url) ||
    /\d{4}[-_](ford|ram|jeep|dodge|chrysler|chevrolet|gmc|toyota|honda|bmw|mercedes|audi|hyundai|kia|nissan|subaru|volkswagen|mazda|lexus|acura|infiniti|cadillac|buick|lincoln)/i.test(url) ||
    /vin[=/][A-HJ-NPR-Z0-9]{17}/i.test(url);

  if (isVDP) {
    chrome.runtime.sendMessage({ type: 'PAGE_DETECTED', url });
  }
})();
