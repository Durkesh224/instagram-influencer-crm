// Helper utility functions for Influencer CRM Dashboard

export function parseFollowerCount(countStr) {
  if (!countStr || countStr === 'N/A' || countStr.trim() === '') return 0;
  try {
    const clean = countStr.trim().toUpperCase().replace(/,/g, '').replace(/ /g, '');
    let multiplier = 1;
    let numStr = clean;

    if (clean.endsWith('K')) {
      multiplier = 1000;
      numStr = clean.slice(0, -1);
    } else if (clean.endsWith('M')) {
      multiplier = 1000000;
      numStr = clean.slice(0, -1);
    } else if (clean.endsWith('B')) {
      multiplier = 1000000000;
      numStr = clean.slice(0, -1);
    }

    const parsed = parseFloat(numStr);
    return isNaN(parsed) ? 0 : Math.round(parsed * multiplier);
  } catch (e) {
    return 0;
  }
}

export function formatFollowerCount(num) {
  if (!num || isNaN(num)) return 'N/A';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function getCleanName(inf) {
  if (!inf) return 'Creator';
  const name = inf.name || '';
  if (!name || name === 'N/A' || name.trim() === '') {
    return `@${inf.username}`;
  }
  const lower = name.toLowerCase();
  if (
    lower.includes('follower') ||
    lower.includes('following') ||
    lower.includes('post') ||
    lower.includes('instagram') ||
    lower.includes('see photos')
  ) {
    return `@${inf.username}`;
  }
  return name;
}

export function formatRelativeTime(dateString) {
  if (!dateString) return 'recently';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'recently';
  }
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'N/A';
  }
}

export function calculateProfileQuality(inf) {
  if (!inf) return 0;
  const fields = [
    Boolean(inf.name && inf.name !== 'N/A' && !inf.name.toLowerCase().includes('follower')),
    Boolean(inf.username && inf.username !== 'N/A'),
    Boolean(inf.bio && inf.bio !== 'N/A' && inf.bio.trim().length > 5),
    Boolean(inf.followers && inf.followers !== 'N/A'),
    Boolean(inf.profileImage && inf.profileImage !== 'N/A'),
    Boolean(inf.websiteUrl && inf.websiteUrl !== 'N/A'),
    Boolean(inf.category && inf.category !== 'N/A')
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export function detectCategoryFromText(bio = '', name = '', username = '') {
  const combined = `${bio} ${name} ${username}`.toLowerCase();
  if (
    combined.match(/\b(sport|sports|athlete|athletes|player|captain|cricket|cricketer|football|footballer|basketball|soccer|tennis|golf|runner|swimmer|racing|wwe|f1|olympian|badminton|hockey|boxer|wrestler|baller|striker|midfielder|bowler|batsman|allrounder|trophy|champion|champions|stadium|match)\b/) ||
    combined.match(/(⚽|🏏|🏀|🎾|🏆|🥇|🏎️|🥊|⚾|🏈)/) ||
    combined.match(/\b(cristiano|ronaldo|virat|kohli|messi|leomessi|neymar|mbappe|lebron|kingjames|rohit|dhoni|sachin|hardik|bumrah|klrahul|siuu|siuuuu|rcb|bcci|one8|wrogn|realmadrid|alnassr|juventus|barcelona|psg|fifa|icc|ipl)\b/)
  ) return 'Sports & Athletes';
  if (combined.match(/\b(fit|fitness|gym|workout|trainer|coach|crossfit|health|bodybuilding|wellness|physique|exercise|nutrition)\b/)) return 'Fitness & Health';
  if (combined.match(/\b(fashion|style|outfit|model|modeling|clothing|wear|brand|apparel|stylist|vogue|couture|wardrobe)\b/)) return 'Fashion & Style';
  if (combined.match(/\b(beauty|makeup|skincare|cosmetics|hair|hairstylist|aesthetic|mua|skin|glow|salon)\b/)) return 'Beauty & Cosmetics';
  if (combined.match(/\b(business|tech|technology|founder|ceo|co-founder|entrepreneur|investor|marketing|crypto|software|developer|startup|agency|corporate)\b/)) return 'Business & Tech';
  if (combined.match(/\b(travel|explore|photographer|photography|adventure|wanderlust|vlog|vlogger|lifestyle|food|foodie|chef|hotel|traveler)\b/)) return 'Travel & Lifestyle';
  return 'Digital Creator';
}

export function normalizeStage(tag) {
  if (!tag || tag === 'N/A' || tag.trim() === '') return 'Potential';
  const lower = tag.trim().toLowerCase();
  if (lower === 'contacted') return 'Contacted';
  if (lower === 'interested') return 'Interested';
  if (lower === 'collaboration' || lower === 'collaborated' || lower === 'collaborating') return 'Collaboration';
  return 'Potential';
}
