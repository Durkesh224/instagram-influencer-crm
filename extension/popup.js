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

  // 2. DOM Elements Search
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

    const combined = (bio + ' ' + fullText + ' ' + name).toLowerCase();
    if (combined.match(/\b(fit|fitness|gym|workout|trainer|coach|crossfit|health|bodybuilding|wellness)\b/)) category = 'Fitness & Health';
    else if (combined.match(/\b(sports|athlete|football|basketball|soccer|cricket|tennis|golf|runner|swimmer)\b/)) category = 'Sports & Athletes';
    else if (combined.match(/\b(fashion|style|outfit|model|clothing|wear|brand|apparel|stylist)\b/)) category = 'Fashion & Style';
    else if (combined.match(/\b(beauty|makeup|skincare|cosmetics|hair|aesthetic|mua|skin)\b/)) category = 'Beauty & Cosmetics';
    else if (combined.match(/\b(business|tech|founder|ceo|entrepreneur|investor|marketing|crypto|software|developer|startup)\b/)) category = 'Business & Tech';
    else if (combined.match(/\b(travel|explore|photographer|photography|adventure|wanderlust|vlog|vlogger|lifestyle)\b/)) category = 'Travel & Lifestyle';
  } else {
    const combined = (bio + ' ' + name).toLowerCase();
    if (combined.match(/\b(fit|fitness|gym|workout|trainer|coach|crossfit|health|bodybuilding|wellness)\b/)) category = 'Fitness & Health';
    else if (combined.match(/\b(sports|athlete|football|basketball|soccer|cricket|tennis|golf|runner|swimmer)\b/)) category = 'Sports & Athletes';
    else if (combined.match(/\b(fashion|style|outfit|model|clothing|wear|brand|apparel|stylist)\b/)) category = 'Fashion & Style';
    else if (combined.match(/\b(beauty|makeup|skincare|cosmetics|hair|aesthetic|mua|skin)\b/)) category = 'Beauty & Cosmetics';
    else if (combined.match(/\b(business|tech|founder|ceo|entrepreneur|investor|marketing|crypto|software|developer|startup)\b/)) category = 'Business & Tech';
    else if (combined.match(/\b(travel|explore|photographer|photography|adventure|wanderlust|vlog|vlogger|lifestyle)\b/)) category = 'Travel & Lifestyle';
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
