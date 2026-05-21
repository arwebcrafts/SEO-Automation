// Background Service Worker
console.log('GBP Inspector Background Service Worker Loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('GBP Inspector extension installed');
  } else if (details.reason === 'update') {
    console.log('GBP Inspector extension updated');
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'contentScriptLoaded') {
    console.log('Content script loaded on tab:', sender.tab.url);
  }
});
