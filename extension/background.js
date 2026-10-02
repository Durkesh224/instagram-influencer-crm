// Background service worker for Chrome Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Instagram Influencer CRM Extension installed successfully.');
});

// Listener for messages from popup or content script if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkBackendStatus') {
    fetch('http://localhost:8080/api/stats')
      .then(res => res.json())
      .then(data => sendResponse({ status: 'online', data }))
      .catch(err => sendResponse({ status: 'offline', error: err.toString() }));
    return true;
  }
});
