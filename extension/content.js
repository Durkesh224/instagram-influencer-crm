// Content Script for Instagram Profile Detection and Data Capture

const BACKEND_URL = 'http://localhost:8080/api/influencers';
const DASHBOARD_URL = 'http://localhost:5173';

const EXCLUDED_ROUTES = [
  'explore', 'direct', 'reels', 'stories', 'accounts', 'p', 'tv', 'live',
  'archive', 'notifications', 'create', 'search', 'settings'
];

function isInstagramProfile() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return false;
  
  const segments = path.split('/');
  if (segments.length > 2) return false;
  
  const username = segments[0];
  if (EXCLUDED_ROUTES.includes(username.toLowerCase())) return false;
  if (username.startsWith('?')) return false;

  return true;
}

function getCleanUsername() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return path.split('/')[0];
}

function extractProfileData() {
  const username = getCleanUsername();
  if (!username) return null;

  let name = username;
  let bio = 'N/A';
  let followers = 'N/A';
  let following = 'N/A';
  let posts = 'N/A';
  let profileImage = 'N/A';
  let websiteUrl = 'N/A';
  let category = 'Digital Creator';
  let location = 'N/A';

  // 1. Head Meta Tags
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || document.title || '';
  if (ogTitle) {
    const nameMatch = ogTitle.match(/^([^(•]+)\s*\(@/);
    if (nameMatch && nameMatch[1].trim()) name = nameMatch[1].trim();
  }
  if (name.toLowerCase().includes('follower') || name.toLowerCase().includes('following') || name.toLowerCase().includes('post') || name.toLowerCase().includes('instagram')) {
    name = username;
  }

  const ogImg = document.querySelector('meta[property="og:image"]')?.content;
  if (ogImg) profileImage = ogImg;

  const ogDesc = document.querySelector('meta[property="og:description"]')?.content || document.querySelector('meta[name="description"]')?.content || '';
  if (ogDesc) {
    const mFollowers = ogDesc.match(/([0-9.,KMBkm]+)\s*Followers/i);
    if (mFollowers) followers = mFollowers[1];

    const mFollowing = ogDesc.match(/([0-9.,KMBkm]+)\s*Following/i);
    if (mFollowing) following = mFollowing[1];

    const mPosts = ogDesc.match(/([0-9.,KMBkm]+)\s*posts?/i);
    if (mPosts) posts = mPosts[1];

    const parts = ogDesc.split('-');
    if (parts.length > 1) {
      bio = parts.slice(1).join('-').replace(/See Instagram photos and videos.*/i, '').trim();
    }
  }

  // 2. DOM Scraper
  const header = document.querySelector('header');
  if (header) {
    const fullText = header.innerText || '';
    if (followers === 'N/A') {
      const fMatch = fullText.match(/([0-9.,KMBkm]+)\s*followers/i);
      if (fMatch) followers = fMatch[1];
    }
    if (following === 'N/A') {
      const fMatch = fullText.match(/([0-9.,KMBkm]+)\s*following/i);
      if (fMatch) following = fMatch[1];
    }
    if (posts === 'N/A' || !posts) {
      const pMatch = fullText.match(/([0-9.,KMBkm]+)\s*posts?/i);
      if (pMatch) posts = pMatch[1];
    }

    // Header list items fallback
    if (posts === 'N/A' || !posts) {
      const items = header.querySelectorAll('li, span');
      for (let item of items) {
        const txt = item.innerText || '';
        if (txt.match(/posts?/i)) {
          const numMatch = txt.match(/([0-9.,KMBkm]+)/);
          if (numMatch) {
            posts = numMatch[1];
            break;
          }
        }
      }
    }

    const nameEl = header.querySelector('h1, h2, section span');
    if (nameEl && nameEl.innerText) {
      const text = nameEl.innerText.trim();
      if (text && text.toLowerCase() !== username.toLowerCase()) {
        name = text;
      }
    }

    const bioEl = header.querySelector('section > div:last-child, section span');
    if (bioEl && bioEl.innerText && bioEl.innerText.length > 5) {
      const bText = bioEl.innerText.trim();
      if (!bText.includes('followers') && !bText.includes('following')) {
        bio = bText;
      }
    }

    const linkEl = header.querySelector('a[href*="l.instagram.com"], a[target="_blank"], a[role="link"]');
    if (linkEl) {
      let href = linkEl.href || '';
      let text = linkEl.innerText ? linkEl.innerText.trim() : '';
      if (href && !href.includes('instagram.com/')) {
        if (href.includes('l.instagram.com/?u=')) {
          try {
            const rawUrl = new URL(href).searchParams.get('u');
            if (rawUrl) text = decodeURIComponent(rawUrl);
          } catch(e) {}
        }
        websiteUrl = text || href;
      }
    }

    category = detectCategory(bio, fullText, name);
  } else {
    category = detectCategory(bio, '', name);
  }

  return {
    name: name || username,
    username,
    profileUrl: `https://www.instagram.com/${username}/`,
    bio: bio || 'No bio details available',
    followers,
    following,
    posts,
    profileImage,
    websiteUrl,
    location,
    category,
    tag: 'Potential',
    notes: ''
  };
}

function detectCategory(bio = '', fullText = '', name = '') {
  const combined = `${bio} ${fullText} ${name}`.toLowerCase();
  if (combined.match(/\b(fit|fitness|gym|workout|trainer|coach|crossfit|health|bodybuilding|wellness)\b/)) return 'Fitness & Health';
  if (combined.match(/\b(sports|athlete|football|basketball|soccer|cricket|tennis|golf|runner|swimmer)\b/)) return 'Sports & Athletes';
  if (combined.match(/\b(fashion|style|outfit|model|clothing|wear|brand|apparel|stylist)\b/)) return 'Fashion & Style';
  if (combined.match(/\b(beauty|makeup|skincare|cosmetics|hair|aesthetic|mua|skin)\b/)) return 'Beauty & Cosmetics';
  if (combined.match(/\b(business|tech|founder|ceo|entrepreneur|investor|marketing|crypto|software|developer|startup)\b/)) return 'Business & Tech';
  if (combined.match(/\b(travel|explore|photographer|photography|adventure|wanderlust|vlog|vlogger|lifestyle)\b/)) return 'Travel & Lifestyle';
  return 'Digital Creator';
}

// Widget Injection
let widgetContainer = null;

async function injectWidget() {
  if (!isInstagramProfile()) {
    removeWidget();
    return;
  }

  if (document.getElementById('crm-floating-widget')) {
    return;
  }

  const username = getCleanUsername();

  widgetContainer = document.createElement('div');
  widgetContainer.id = 'crm-floating-widget';
  widgetContainer.innerHTML = `
    <style>
      #crm-floating-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .crm-btn {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease-in-out;
        text-decoration: none;
      }
      .crm-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
      }
      .crm-btn.loading {
        background: #94a3b8;
        cursor: wait;
      }
      .crm-btn.success, .crm-btn.exists {
        background: #10b981;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
      }
      .crm-btn.error {
        background: #ef4444;
      }
    </style>
    <button id="crm-add-btn" class="crm-btn">
      <span>+ Add to CRM</span>
    </button>
  `;

  document.body.appendChild(widgetContainer);

  const btn = document.getElementById('crm-add-btn');

  // Check if profile is already saved in CRM
  try {
    const res = await fetch(`${BACKEND_URL}/check?username=${encodeURIComponent(username)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.exists) {
        btn.className = 'crm-btn exists';
        btn.innerHTML = '<span>View in CRM Dashboard ↗</span>';
        btn.addEventListener('click', () => {
          window.open(`${DASHBOARD_URL}?search=${encodeURIComponent(username)}`, '_blank');
        });
        return;
      }
    }
  } catch (e) {}

  btn.addEventListener('click', handleAddToCRM);
}

function removeWidget() {
  const existing = document.getElementById('crm-floating-widget');
  if (existing) existing.remove();
}

async function handleAddToCRM() {
  const btn = document.getElementById('crm-add-btn');
  if (!btn || btn.classList.contains('loading')) return;

  btn.className = 'crm-btn loading';
  btn.innerHTML = '<span>Saving...</span>';

  const data = extractProfileData();
  if (!data || !data.username) {
    btn.className = 'crm-btn error';
    btn.innerHTML = '<span>Could not read profile</span>';
    setTimeout(resetBtn, 3000);
    return;
  }

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.status === 201 || response.ok || response.status === 409) {
      btn.className = 'crm-btn exists';
      btn.innerHTML = '<span>View in CRM Dashboard ↗</span>';
      btn.onclick = () => {
        window.open(`${DASHBOARD_URL}?search=${encodeURIComponent(data.username)}`, '_blank');
      };
    } else {
      btn.className = 'crm-btn error';
      btn.innerHTML = '<span>CRM server unavailable</span>';
      setTimeout(resetBtn, 3000);
    }
  } catch (err) {
    btn.className = 'crm-btn error';
    btn.innerHTML = '<span>CRM server offline</span>';
    setTimeout(resetBtn, 3000);
  }
}

function resetBtn() {
  const btn = document.getElementById('crm-add-btn');
  if (btn) {
    btn.className = 'crm-btn';
    btn.innerHTML = '<span>+ Add to CRM</span>';
  }
}

// Watch for SPA navigation
let lastPath = window.location.pathname;
setInterval(() => {
  if (window.location.pathname !== lastPath) {
    lastPath = window.location.pathname;
    removeWidget();
    setTimeout(injectWidget, 1000);
  }
}, 1000);

setTimeout(injectWidget, 1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProfileData') {
    const isProfile = isInstagramProfile();
    const data = isProfile ? extractProfileData() : null;
    sendResponse({ isProfile, data });
  }
});
