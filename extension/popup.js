const BACKEND_URL = 'http://localhost:8080/api/influencers';
const DASHBOARD_URL = 'http://localhost:5173';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingContainer = document.getElementById('loading-container');
  const profileContainer = document.getElementById('profile-container');
  const nonProfileContainer = document.getElementById('non-profile-container');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.includes('instagram.com')) {
    showNonProfile();
    return;
  }

  const urlObj = new URL(tab.url);
  const path = urlObj.pathname.replace(/^\/+|\/+$/g, '');
  const username = path.split('/')[0];
  const excluded = ['explore', 'direct', 'reels', 'stories', 'accounts', 'p', 'tv', 'live', 'archive', 'notifications', 'create', 'search', 'settings'];

  if (!username || excluded.includes(username.toLowerCase())) {
    showNonProfile();
    return;
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractInstagramDataFromPage
    });

    if (results && results[0] && results[0].result) {
      showProfile(results[0].result);
      return;
    }
  } catch (err) {
    console.warn('Scripting execution fallback:', err);
  }

  // Messaging fallback
  chrome.tabs.sendMessage(tab.id, { action: 'getProfileData' }, (response) => {
    if (!chrome.runtime.lastError && response && response.isProfile && response.data) {
      showProfile(response.data);
    } else {
      showProfile({
        name: username,
        username: username,
        profileUrl: `https://www.instagram.com/${username}/`,
        bio: 'Instagram Influencer Profile',
        followers: 'N/A',
        following: 'N/A',
        posts: 'N/A',
        profileImage: 'N/A',
        websiteUrl: 'N/A',
        location: 'N/A',
        category: 'Digital Creator',
        tag: 'Potential',
        notes: ''
      });
    }
  });
});

function extractInstagramDataFromPage() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return null;
  const username = path.split('/')[0];
  const excluded = ['explore', 'direct', 'reels', 'stories', 'accounts', 'p', 'tv', 'live', 'archive', 'notifications', 'create', 'search', 'settings'];
  if (excluded.includes(username.toLowerCase())) return null;

  let name = username;
  let bio = 'N/A';
  let followers = 'N/A';
  let following = 'N/A';
  let posts = 'N/A';
  let profileImage = 'N/A';
  let websiteUrl = 'N/A';
  let category = 'Digital Creator';
  let location = 'N/A';

  // 1. Meta Tags (Immediate & High Reliability)
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
    // Only extract bio from meta — NOT counts (meta uses different rounding than what's shown on screen)
    const parts = ogDesc.split('-');
    if (parts.length > 1) {
      bio = parts.slice(1).join('-').replace(/See Instagram photos and videos.*/i, '').trim();
    }
  }

  // 2. DOM Elements Search — READ SCREEN VALUES FIRST (matches what the user sees on Instagram)
  const header = document.querySelector('header');
  if (header) {
    const fullText = header.innerText || '';

    // Best: read from <li> stats rows (exact same text shown on Instagram page)
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

    // Fallback: full header text match
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

    // Last resort: meta tag (Instagram rounds these differently from what's shown on screen)
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

    category = detectCategoryInPage(bio, fullText, name, username);
  } else {
    category = detectCategoryInPage(bio, '', name, username);
  }

  function detectCategoryInPage(bioStr = '', fullTextStr = '', nameStr = '', userStr = '') {
    const combined = `${bioStr} ${fullTextStr} ${nameStr} ${userStr}`.toLowerCase();

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

    // 3. Fallback
    return 'Digital Creator';
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

let currentData = null;
let isAlreadySaved = false;

function showNonProfile() {
  document.getElementById('loading-container').classList.add('hidden');
  document.getElementById('non-profile-container').classList.remove('hidden');
}

async function showProfile(data) {
  currentData = data;
  document.getElementById('loading-container').classList.add('hidden');
  document.getElementById('profile-container').classList.remove('hidden');

  try {
    const nameEl = document.getElementById('pop-name');
    if (nameEl) nameEl.innerText = (data.name && data.name !== 'N/A') ? data.name : data.username;
  } catch (e) {}

  try {
    const userEl = document.getElementById('pop-username');
    if (userEl) {
      userEl.innerText = `@${data.username}`;
      userEl.href = data.profileUrl || `https://www.instagram.com/${data.username}/`;
    }
  } catch (e) {}

  try {
    const catEl = document.getElementById('pop-category');
    if (catEl) catEl.innerText = data.category || 'General';
  } catch (e) {}

  try {
    const fEl = document.getElementById('pop-followers');
    if (fEl) fEl.innerText = data.followers || 'N/A';
  } catch (e) {}

  try {
    const fwEl = document.getElementById('pop-following');
    if (fwEl) fwEl.innerText = data.following || 'N/A';
  } catch (e) {}

  try {
    const pEl = document.getElementById('pop-posts');
    if (pEl) pEl.innerText = data.posts || 'N/A';
  } catch (e) {}

  try {
    const bEl = document.getElementById('pop-bio');
    if (bEl) bEl.innerText = data.bio || 'No bio details available';
  } catch (e) {}

  // Website Link
  try {
    const webContainer = document.getElementById('pop-website-container');
    const webLink = document.getElementById('pop-website');
    if (data.websiteUrl && data.websiteUrl !== 'N/A') {
      webLink.href = data.websiteUrl.startsWith('http') ? data.websiteUrl : `https://${data.websiteUrl}`;
      webLink.innerText = data.websiteUrl;
      webContainer.classList.remove('hidden');
    } else {
      webContainer.classList.add('hidden');
    }
  } catch (e) {}

  // Location
  try {
    const locContainer = document.getElementById('pop-location-container');
    const locEl = document.getElementById('pop-location');
    if (data.location && data.location !== 'N/A') {
      locEl.innerText = data.location;
      locContainer.classList.remove('hidden');
    } else {
      locContainer.classList.add('hidden');
    }
  } catch (e) {}

  // Profile Avatar display fix
  try {
    const avatarImg = document.getElementById('pop-avatar');
    const avatarFallback = document.getElementById('pop-avatar-fallback');
    const initialLetter = (data.name || data.username || 'I').charAt(0).toUpperCase();

    if (data.profileImage && data.profileImage !== 'N/A') {
      avatarImg.src = data.profileImage;
      avatarImg.classList.remove('hidden');
      avatarFallback.classList.add('hidden');

      avatarImg.onerror = () => {
        avatarImg.classList.add('hidden');
        avatarFallback.innerText = initialLetter;
        avatarFallback.classList.remove('hidden');
      };
    } else {
      avatarImg.classList.add('hidden');
      avatarFallback.innerText = initialLetter;
      avatarFallback.classList.remove('hidden');
    }
  } catch (e) {}

  // Check if influencer is already in CRM
  checkIfSavedInCRM(data.username);
}

async function checkIfSavedInCRM(username) {
  const addBtn = document.getElementById('pop-add-btn');
  try {
    const res = await fetch(`${BACKEND_URL}/check?username=${encodeURIComponent(username)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.exists && data.influencer) {
        isAlreadySaved = true;

        // Pre-fill tag and notes from database
        if (data.influencer.tag) {
          document.getElementById('pop-tag-select').value = data.influencer.tag;
        }
        if (data.influencer.notes) {
          document.getElementById('pop-notes-input').value = data.influencer.notes;
        }

        // Change button to View in Dashboard link
        if (addBtn) {
          addBtn.className = 'action-btn exists';
          addBtn.innerText = 'View in CRM Dashboard ↗';
          addBtn.onclick = () => {
            chrome.tabs.create({ url: `${DASHBOARD_URL}?search=${encodeURIComponent(username)}` });
          };
        }
        return;
      }
    }
  } catch (e) {
    console.warn('Check CRM failed:', e);
  }

  // Default state: Add to CRM
  isAlreadySaved = false;
  if (addBtn) {
    addBtn.className = 'action-btn';
    addBtn.innerText = '+ Save to CRM';
    addBtn.onclick = handleAddFromPopup;
  }
}

async function handleAddFromPopup() {
  if (!currentData) return;
  const btn = document.getElementById('pop-add-btn');
  btn.className = 'action-btn loading';
  btn.innerText = 'Saving...';

  const selectedTag = document.getElementById('pop-tag-select').value;
  const userNotes = document.getElementById('pop-notes-input').value;

  const payload = {
    ...currentData,
    tag: selectedTag,
    notes: userNotes
  };

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 201 || res.ok) {
      btn.className = 'action-btn exists';
      btn.innerText = 'View in CRM Dashboard ↗';
      btn.onclick = () => {
        chrome.tabs.create({ url: `${DASHBOARD_URL}?search=${encodeURIComponent(currentData.username)}` });
      };
    } else if (res.status === 409) {
      btn.className = 'action-btn exists';
      btn.innerText = 'View in CRM Dashboard ↗';
      btn.onclick = () => {
        chrome.tabs.create({ url: `${DASHBOARD_URL}?search=${encodeURIComponent(currentData.username)}` });
      };
    } else {
      btn.className = 'action-btn';
      btn.innerText = 'Error saving';
    }
  } catch (err) {
    btn.className = 'action-btn';
    btn.innerText = 'Server offline';
  }
}
