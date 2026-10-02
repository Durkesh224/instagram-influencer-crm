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
    // Only use meta for bio — counts in meta use different rounding than what Instagram shows on screen
    const parts = ogDesc.split('-');
    if (parts.length > 1) {
      bio = parts.slice(1).join('-').replace(/See Instagram photos and videos.*/i, '').trim();
    }
  }

  // 2. DOM Scraper — read from DOM first (matches exactly what user sees)
  const header = document.querySelector('header');
  if (header) {
    const fullText = header.innerText || '';

    // Best source: Instagram stat list items
    const statItems = header.querySelectorAll('li');
    for (let li of statItems) {
      const liText = li.innerText || '';
      const liLower = liText.toLowerCase();
      const numMatch = liText.match(/([0-9][0-9,]*\.?[0-9]*\s*[KMBkmb]?)/);
      if (numMatch) {
        const val = numMatch[1].trim();
        if (liLower.includes('follower') && followers === 'N/A') followers = val;
        else if (liLower.includes('following') && following === 'N/A') following = val;
        else if (liLower.includes('post') && (posts === 'N/A' || !posts)) posts = val;
      }
    }

    // Fallback: full header text
    if (followers === 'N/A') {
      const fMatch = fullText.match(/([0-9][0-9,.]*[KMBkmb]?)\s*followers/i);
      if (fMatch) followers = fMatch[1];
    }
    if (following === 'N/A') {
      const fMatch = fullText.match(/([0-9][0-9,.]*[KMBkmb]?)\s*following/i);
      if (fMatch) following = fMatch[1];
    }
    if (posts === 'N/A' || !posts) {
      const pMatch = fullText.match(/([0-9][0-9,.]*[KMBkmb]?)\s*posts?/i);
      if (pMatch) posts = pMatch[1];
    }

    // Last resort: meta tag numbers
    if (ogDesc) {
      if (followers === 'N/A') {
        const mF = ogDesc.match(/([0-9.,KMBkm]+)\s*Followers/i);
        if (mF) followers = mF[1];
      }
      if (following === 'N/A') {
        const mFw = ogDesc.match(/([0-9.,KMBkm]+)\s*Following/i);
        if (mFw) following = mFw[1];
      }
      if (posts === 'N/A' || !posts) {
        const mP = ogDesc.match(/([0-9.,KMBkm]+)\s*posts?/i);
        if (mP) posts = mP[1];
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

    category = detectCategory(bio, fullText, name, username);
  } else {
    category = detectCategory(bio, '', name, username);
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

function detectCategory(bio = '', fullText = '', name = '', username = '') {
  const combined = `${bio} ${fullText} ${name} ${username}`.toLowerCase();

  // 1. Check Specific Categories First (Prevents "Digital Creator" false positive)
  if (
    combined.match(/\b(sport|sports|athlete|athletes|player|captain|cricket|cricketer|football|footballer|basketball|soccer|tennis|golf|runner|swimmer|racing|wwe|f1|olympian|badminton|hockey|boxer|wrestler|baller|striker|midfielder|bowler|batsman|allrounder|trophy|champion|champions|stadium|match)\b/) ||
    combined.match(/(⚽|🏏|🏀|🎾|🏆|🥇|🏎️|🥊|⚾|🏈)/) ||
    combined.match(/\b(cristiano|ronaldo|virat|kohli|messi|leomessi|neymar|mbappe|lebron|kingjames|rohit|dhoni|sachin|hardik|bumrah|klrahul|siuu|siuuuu|rcb|bcci|one8|wrogn|realmadrid|alnassr|juventus|barcelona|psg|fifa|icc|ipl)\b/)
  ) {
    return 'Sports & Athletes';
  }
  if (combined.match(/\b(fit|fitness|gym|workout|trainer|coach|crossfit|health|bodybuilding|wellness|physique|exercise|nutrition)\b/)) {
    return 'Fitness & Health';
  }
  if (combined.match(/\b(fashion|style|outfit|model|modeling|clothing|wear|brand|apparel|stylist|vogue|couture|wardrobe)\b/)) {
    return 'Fashion & Style';
  }
  if (combined.match(/\b(beauty|makeup|skincare|cosmetics|hair|hairstylist|aesthetic|mua|skin|glow|salon)\b/)) {
    return 'Beauty & Cosmetics';
  }
  if (combined.match(/\b(business|tech|technology|founder|ceo|co-founder|entrepreneur|investor|marketing|crypto|software|developer|startup|agency|corporate)\b/)) {
    return 'Business & Tech';
  }
  if (combined.match(/\b(travel|explore|photographer|photography|adventure|wanderlust|vlog|vlogger|lifestyle|food|foodie|chef|hotel|traveler)\b/)) {
    return 'Travel & Lifestyle';
  }

  // 2. DOM Specific Category Tag search on Instagram Profile Header
  if (typeof document !== 'undefined') {
    const categoryElements = document.querySelectorAll('header div, header span, header button, header a');
    for (let el of categoryElements) {
      const txt = el.innerText ? el.innerText.trim() : '';
      if (txt && txt.length > 2 && txt.length < 35 && !txt.includes('followers') && !txt.includes('following') && !txt.includes('posts')) {
        const lower = txt.toLowerCase();
        if (lower.includes('athlete') || lower.includes('cricketer') || lower.includes('sport')) return 'Sports & Athletes';
        if (lower.includes('fitness') || lower.includes('gym') || lower.includes('health')) return 'Fitness & Health';
        if (lower.includes('fashion') || lower.includes('model') || lower.includes('clothing')) return 'Fashion & Style';
        if (lower.includes('beauty') || lower.includes('makeup') || lower.includes('cosmetics')) return 'Beauty & Cosmetics';
        if (lower.includes('business') || lower.includes('tech') || lower.includes('entrepreneur')) return 'Business & Tech';
        if (lower.includes('travel') || lower.includes('photographer') || lower.includes('lifestyle') || lower.includes('food')) return 'Travel & Lifestyle';
      }
    }
  }

  // 3. Fallback
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
