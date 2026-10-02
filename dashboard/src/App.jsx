import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Award, 
  Search, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Sparkles,
  RefreshCw,
  Globe,
  MapPin,
  Heart,
  Download,
  Layers,
  BarChart2,
  Link
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

const CATEGORY_TABS = [
  'All Categories',
  'Favorites ❤️',
  'Digital Creator',
  'Sports & Athletes',
  'Fashion & Style',
  'Beauty & Cosmetics',
  'Fitness & Health',
  'Business & Tech',
  'Travel & Lifestyle'
];

export default function App() {
  const [influencers, setInfluencers] = useState([]);
  const [stats, setStats] = useState({ totalInfluencers: 0, totalFollowers: '0', favoritesCount: 0, recentlyAdded: 0 });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [activeCategoryTab, setActiveCategoryTab] = useState('All Categories');
  const [tagFilter, setTagFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [editItem, setEditItem] = useState(null);
  const [editTag, setEditTag] = useState('Potential');
  const [editCategory, setEditCategory] = useState('Digital Creator');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editIsFavorite, setEditIsFavorite] = useState(false);

  // New Popups State
  const [statsModalItem, setStatsModalItem] = useState(null);
  const [linksModalItem, setLinksModalItem] = useState(null);

  const getCleanName = (inf) => {
    if (!inf) return 'Creator';
    let name = inf.name || '';
    if (!name || name === 'N/A' || name.trim() === '') {
      return `@${inf.username}`;
    }
    const lower = name.toLowerCase();
    if (lower.includes('follower') || lower.includes('following') || lower.includes('post') || lower.includes('instagram') || lower.includes('see photos')) {
      return `@${inf.username}`;
    }
    return name;
  };

  const getCleanPosts = (inf) => {
    if (!inf || !inf.posts || inf.posts === 'N/A' || inf.posts.trim() === '') {
      return '12+';
    }
    return inf.posts;
  };

  const getAllLinks = (inf) => {
    if (!inf) return [];
    const links = [];
    if (inf.websiteUrl && inf.websiteUrl !== 'N/A') {
      const formatted = inf.websiteUrl.startsWith('http') ? inf.websiteUrl : `https://${inf.websiteUrl}`;
      links.push({ label: 'Primary Website / Link in Bio', url: formatted });
    }
    const profileUrl = inf.profileUrl || `https://www.instagram.com/${inf.username}/`;
    links.push({ label: 'Official Instagram Profile', url: profileUrl });

    if (inf.bio && inf.bio !== 'N/A') {
      const found = inf.bio.match(/(https?:\/\/[^\s]+|linktr\.ee\/[^\s]+|beacons\.ai\/[^\s]+|twitter\.com\/[^\s]+)/gi);
      if (found) {
        found.forEach(u => {
          const full = u.startsWith('http') ? u : `https://${u}`;
          if (!links.some(l => l.url === full)) {
            links.push({ label: 'Bio Embedded Link', url: full });
          }
        });
      }
    }
    return links;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/influencers`);
      if (search) url.searchParams.append('search', search);
      if (sort) url.searchParams.append('sort', sort);

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInfluencers(data);
      }
    } catch (err) {
      console.error('Failed to fetch influencers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchInfluencers();
  }, [sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInfluencers();
  };

  const toggleFavorite = async (inf) => {
    const isCurrentFav = Boolean(inf.isFavorite || inf.favorite);
    const updatedFav = !isCurrentFav;

    // Optimistic UI update - set BOTH isFavorite and favorite so deselecting is instant
    setInfluencers(prev => prev.map(item => item.id === inf.id ? { ...item, isFavorite: updatedFav, favorite: updatedFav } : item));

    try {
      const res = await fetch(`${API_BASE}/influencers/${inf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: updatedFav, favorite: updatedFav })
      });
      if (res.ok) {
        fetchStats();
      } else {
        fetchInfluencers(); // Revert on failure
      }
    } catch (err) {
      fetchInfluencers();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this influencer from CRM?')) return;
    try {
      const res = await fetch(`${API_BASE}/influencers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchInfluencers();
        fetchStats();
      }
    } catch (err) {
      alert('Failed to delete influencer.');
    }
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setEditTag(item.tag || 'Potential');
    setEditCategory(item.category || 'Digital Creator');
    setEditLocation(item.location !== 'N/A' ? item.location : '');
    setEditWebsite(item.websiteUrl !== 'N/A' ? item.websiteUrl : '');
    setEditNotes(item.notes || '');
    setEditIsFavorite(Boolean(item.isFavorite || item.favorite));
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      const res = await fetch(`${API_BASE}/influencers/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: editTag,
          category: editCategory,
          location: editLocation || 'N/A',
          websiteUrl: editWebsite || 'N/A',
          notes: editNotes,
          isFavorite: editIsFavorite,
          favorite: editIsFavorite
        })
      });
      if (res.ok) {
        setEditItem(null);
        fetchInfluencers();
        fetchStats();
      }
    } catch (err) {
      alert('Failed to update influencer details.');
    }
  };

  const exportToCSV = () => {
    if (influencers.length === 0) return alert('No influencers to export.');
    const headers = ['Name', 'Username', 'Category', 'Followers', 'Following', 'Posts', 'Status Tag', 'Location', 'Website', 'Notes', 'Is Favorite'];
    const rows = influencers.map(i => [
      `"${i.name || ''}"`,
      `"${i.username || ''}"`,
      `"${i.category || 'General'}"`,
      `"${i.followers || 'N/A'}"`,
      `"${i.following || 'N/A'}"`,
      `"${i.posts || 'N/A'}"`,
      `"${i.tag || 'Potential'}"`,
      `"${i.location || 'N/A'}"`,
      `"${i.websiteUrl || 'N/A'}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
      `"${(i.isFavorite || i.favorite) ? 'Yes' : 'No'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `influencers_crm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const detectCategoryFromText = (bio = '', name = '', username = '') => {
    const combined = `${bio} ${name} ${username}`.toLowerCase();
    if (combined.match(/\b(fit|fitness|gym|workout|trainer|coach|crossfit|health|bodybuilding|wellness)\b/)) return 'Fitness & Health';
    if (combined.match(/\b(sports|athlete|football|basketball|soccer|cricket|tennis|golf|runner|swimmer)\b/)) return 'Sports & Athletes';
    if (combined.match(/\b(fashion|style|outfit|model|clothing|wear|brand|apparel|stylist)\b/)) return 'Fashion & Style';
    if (combined.match(/\b(beauty|makeup|skincare|cosmetics|hair|aesthetic|mua|skin)\b/)) return 'Beauty & Cosmetics';
    if (combined.match(/\b(business|tech|founder|ceo|entrepreneur|investor|marketing|crypto|software|developer|startup)\b/)) return 'Business & Tech';
    if (combined.match(/\b(travel|explore|photographer|photography|adventure|wanderlust|vlog|vlogger|lifestyle)\b/)) return 'Travel & Lifestyle';
    return 'Digital Creator';
  };

  const isCategoryMatch = (inf, activeTab) => {
    if (activeTab === 'All Categories') return true;
    if (activeTab === 'Favorites ❤️') return Boolean(inf?.isFavorite || inf?.favorite);

    let cat = inf?.category;
    if (!cat || cat === 'N/A' || cat.trim() === '') {
      cat = detectCategoryFromText(inf?.bio, inf?.name, inf?.username);
    }

    const catLower = cat.toLowerCase();
    const tabLower = activeTab.toLowerCase();

    if (catLower.includes(tabLower) || tabLower.includes(catLower)) return true;

    if (tabLower.includes('sports') && (catLower.includes('sport') || catLower.includes('athlete') || catLower.includes('game') || catLower.includes('fit'))) return true;
    if (tabLower.includes('fashion') && (catLower.includes('fashion') || catLower.includes('style') || catLower.includes('model') || catLower.includes('apparel') || catLower.includes('clothing') || catLower.includes('wear'))) return true;
    if (tabLower.includes('beauty') && (catLower.includes('beauty') || catLower.includes('cosmetic') || catLower.includes('makeup') || catLower.includes('skin') || catLower.includes('hair'))) return true;
    if (tabLower.includes('fitness') && (catLower.includes('fit') || catLower.includes('health') || catLower.includes('gym') || catLower.includes('workout') || catLower.includes('trainer') || catLower.includes('coach'))) return true;
    if (tabLower.includes('business') && (catLower.includes('business') || catLower.includes('tech') || catLower.includes('entrepreneur') || catLower.includes('founder') || catLower.includes('ceo') || catLower.includes('investor') || catLower.includes('crypto'))) return true;
    if (tabLower.includes('travel') && (catLower.includes('travel') || catLower.includes('lifestyle') || catLower.includes('vlog') || catLower.includes('explore') || catLower.includes('photo'))) return true;
    if (tabLower.includes('creator') && (catLower.includes('creator') || catLower.includes('digital') || catLower.includes('general') || catLower.includes('n/a'))) return true;

    return false;
  };

  const updateCategory = async (inf, newCategory) => {
    setInfluencers(prev => prev.map(item => item.id === inf.id ? { ...item, category: newCategory } : item));
    try {
      await fetch(`${API_BASE}/influencers/${inf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory })
      });
      fetchStats();
    } catch (err) {
      fetchInfluencers();
    }
  };

  const resetAllFilters = () => {
    setSearch('');
    setActiveCategoryTab('All Categories');
    setTagFilter('All');
  };

  const hasActiveFilters = search !== '' || activeCategoryTab !== 'All Categories' || tagFilter !== 'All';

  // Filtering logic
  const filteredInfluencers = influencers.filter(inf => {
    if (tagFilter !== 'All' && inf.tag !== tagFilter) return false;
    return isCategoryMatch(inf, activeCategoryTab);
  });

  return (
    <div className="dashboard-container">
      {/* Navbar Header */}
      <header className="dashboard-header">
        <div>
          <div className="brand-badge">
            <Sparkles size={14} /> Influencer CRM SaaS Hub
          </div>
          <h1 className="dashboard-title">Influencer Marketing Hub</h1>
          <p className="dashboard-subtitle">Organize, categorize, and manage your Instagram creator campaigns.</p>
        </div>

        <div className="header-actions">
          <button className="btn-secondary" onClick={exportToCSV} title="Export to CSV spreadsheet">
            <Download size={16} /> Export CSV
          </button>
          <button className="btn-secondary" onClick={() => { fetchStats(); fetchInfluencers(); }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      {/* Top 4 Metrics Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <Users size={22} />
          </div>
          <div>
            <div className="stat-label">Total Creators</div>
            <div className="stat-value">{stats.totalInfluencers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <Award size={22} />
          </div>
          <div>
            <div className="stat-label">Total Audience</div>
            <div className="stat-value">{stats.totalFollowers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper rose">
            <Heart size={22} />
          </div>
          <div>
            <div className="stat-label">Starred Favorites</div>
            <div className="stat-value">{stats.favoritesCount || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper amber">
            <UserPlus size={22} />
          </div>
          <div>
            <div className="stat-label">Recently Added</div>
            <div className="stat-value">{stats.recentlyAdded}</div>
          </div>
        </div>
      </section>

      {/* Category Tabs Bar */}
      <nav className="category-tabs-card">
        {CATEGORY_TABS.map((cat) => {
          const isActive = activeCategoryTab === cat;
          return (
            <button
              key={cat}
              className={`category-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveCategoryTab(isActive ? 'All Categories' : cat)}
            >
              {cat === 'Favorites ❤️' ? <Heart size={14} fill={isActive ? 'white' : '#ef4444'} /> : <Layers size={14} />}
              {cat}
            </button>
          );
        })}
      </nav>

      {/* Filter & Search Bar */}
      <div className="controls-card">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, handle, category, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="filter-group">
          <select className="select-input" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="All">All Status Tags</option>
            <option value="Potential">Potential</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Collaboration">Collaboration</option>
          </select>

          <select className="select-input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="followers">Sort: Most Followers</option>
          </select>

          {hasActiveFilters && (
            <button className="btn-secondary" onClick={resetAllFilters} title="Clear all filters and search" style={{ background: '#f1f5f9', color: '#64748b' }}>
              <X size={15} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="table-card">
        {loading ? (
          <div className="empty-state">
            <RefreshCw className="spin" size={32} />
            <p className="empty-desc" style={{ marginTop: 12 }}>Loading saved creators...</p>
          </div>
        ) : filteredInfluencers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📸</div>
            <h3 className="empty-title">No creators found</h3>
            <p className="empty-desc">
              {search || activeCategoryTab !== 'All Categories' 
                ? 'Try adjusting your search or category filter.' 
                : 'Visit an Instagram profile and click "+ Add to CRM" in the Chrome Extension to save your first creator.'}
            </p>
          </div>
        ) : (
          <table className="influencer-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>❤️</th>
                <th>Creator & Handle</th>
                <th>Category</th>
                <th>Followers & Live Stats</th>
                <th>Website & Links</th>
                <th>Status Tag</th>
                <th>CRM Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInfluencers.map((inf) => {
                const isFav = Boolean(inf.isFavorite || inf.favorite);
                const allLinks = getAllLinks(inf);
                return (
                  <tr key={inf.id}>
                    <td>
                      <button 
                        className={`favorite-star-btn ${isFav ? 'active' : ''}`}
                        onClick={() => toggleFavorite(inf)}
                        title={isFav ? 'Unfavorite' : 'Favorite'}
                      >
                        <Heart size={18} fill={isFav ? '#ef4444' : 'none'} />
                      </button>
                    </td>
                    <td>
                      <div className="profile-cell">
                        {inf.profileImage && inf.profileImage !== 'N/A' ? (
                          <img 
                            src={inf.profileImage} 
                            alt={inf.username} 
                            className="profile-avatar"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} 
                          />
                        ) : null}
                        <div className="profile-avatar-fallback" style={{ display: inf.profileImage && inf.profileImage !== 'N/A' ? 'none' : 'flex' }}>
                          {(inf.name || inf.username || 'I').charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-info">
                          <span className="profile-name">{getCleanName(inf)}</span>
                          <a 
                            href={inf.profileUrl || `https://www.instagram.com/${inf.username}/`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="profile-username"
                          >
                            @{inf.username} <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="select-input"
                        style={{ fontSize: 12, padding: '4px 8px', borderRadius: 20, fontWeight: 600, background: '#f8fafc', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                        value={inf.category && inf.category !== 'N/A' ? inf.category : 'Digital Creator'}
                        onChange={(e) => updateCategory(inf, e.target.value)}
                      >
                        <option value="Digital Creator">Digital Creator</option>
                        <option value="Sports & Athletes">Sports & Athletes</option>
                        <option value="Fashion & Style">Fashion & Style</option>
                        <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                        <option value="Fitness & Health">Fitness & Health</option>
                        <option value="Business & Tech">Business & Tech</option>
                        <option value="Travel & Lifestyle">Travel & Lifestyle</option>
                      </select>
                      {inf.location && inf.location !== 'N/A' && (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={12} /> {inf.location}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span className="followers-badge" style={{ fontWeight: 700, fontSize: 13 }}>👥 {inf.followers || 'N/A'}</span>
                        <button className="view-stats-btn" onClick={() => setStatsModalItem(inf)}>
                          <BarChart2 size={13} /> View Stats & Posts
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {inf.websiteUrl && inf.websiteUrl !== 'N/A' ? (
                          <a 
                            href={inf.websiteUrl.startsWith('http') ? inf.websiteUrl : `https://${inf.websiteUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ fontSize: 12, color: '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                          >
                            <Globe size={12} /> {inf.websiteUrl.length > 20 ? inf.websiteUrl.substring(0, 20) + '...' : inf.websiteUrl}
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>No website link</span>
                        )}
                        <button className="see-links-btn" onClick={() => setLinksModalItem(inf)}>
                          <Link size={13} /> See All Links ({allLinks.length})
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`tag-badge ${inf.tag || 'Potential'}`}>
                        {inf.tag || 'Potential'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: '#64748b' }}>
                        {inf.notes ? (inf.notes.length > 30 ? inf.notes.substring(0, 30) + '...' : inf.notes) : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn" title="Edit Creator Details" onClick={() => openEditModal(inf)}>
                          <Edit3 size={15} />
                        </button>
                        <button className="icon-btn delete" title="Delete Creator" onClick={() => handleDelete(inf.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* View Stats & Posts Modal */}
      {statsModalItem && (
        <div className="modal-overlay" onClick={() => setStatsModalItem(null)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  📊 Stats & Posts: {getCleanName(statsModalItem)}
                </h3>
                <span style={{ fontSize: 13, color: '#64748b' }}>@{statsModalItem.username}</span>
              </div>
              <button className="icon-btn" onClick={() => setStatsModalItem(null)}><X size={18} /></button>
            </div>

            <div className="stats-modal-grid">
              <div className="stat-modal-box">
                <div className="stat-modal-label">Followers</div>
                <div className="stat-modal-val" style={{ color: '#4f46e5' }}>👥 {statsModalItem.followers || 'N/A'}</div>
              </div>
              <div className="stat-modal-box">
                <div className="stat-modal-label">Following</div>
                <div className="stat-modal-val">👤 {statsModalItem.following || 'N/A'}</div>
              </div>
              <div className="stat-modal-box">
                <div className="stat-modal-label">Total Posts</div>
                <div className="stat-modal-val" style={{ color: '#10b981' }}>📸 {getCleanPosts(statsModalItem)}</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Instagram Profile Bio</div>
              <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>
                {statsModalItem.bio || 'No bio details available'}
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                className="btn-secondary" 
                onClick={() => { fetchStats(); fetchInfluencers(); alert('Live stats refreshed!'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} /> Refresh Live Stats
              </button>

              <a 
                href={statsModalItem.profileUrl || `https://www.instagram.com/${statsModalItem.username}/`} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={15} /> Open Instagram Profile & Posts ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* See All Links Modal */}
      {linksModalItem && (
        <div className="modal-overlay" onClick={() => setLinksModalItem(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  🔗 All Links for {getCleanName(linksModalItem)}
                </h3>
                <span style={{ fontSize: 13, color: '#64748b' }}>@{linksModalItem.username}</span>
              </div>
              <button className="icon-btn" onClick={() => setLinksModalItem(null)}><X size={18} /></button>
            </div>

            <div className="links-list">
              {getAllLinks(linksModalItem).map((link, idx) => (
                <div key={idx} className="link-item-card">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{link.label}</div>
                    <div className="link-url-text">{link.url}</div>
                  </div>
                  <a href={link.url} target="_blank" rel="noreferrer" className="link-action-btn">
                    Open <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setLinksModalItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Creator: @{editItem.username}</h3>
              <button className="icon-btn" onClick={() => setEditItem(null)}><X size={18} /></button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Industry Category Grouping</label>
              <select className="form-select" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                <option value="Digital Creator">Digital Creator</option>
                <option value="Sports & Athletes">Sports & Athletes</option>
                <option value="Fashion & Style">Fashion & Style</option>
                <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                <option value="Fitness & Health">Fitness & Health</option>
                <option value="Business & Tech">Business & Tech</option>
                <option value="Travel & Lifestyle">Travel & Lifestyle</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Campaign Status Tag</label>
              <select className="form-select" value={editTag} onChange={(e) => setEditTag(e.target.value)}>
                <option value="Potential">Potential</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Collaboration">Collaboration</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="edit-favorite-check"
                checked={editIsFavorite}
                onChange={(e) => setEditIsFavorite(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="edit-favorite-check" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                Star / Favorite this Creator ❤️
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Los Angeles, USA"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website / Link in Bio</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. https://linktr.ee/creator"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Private Campaign Notes</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Add outreach notes, rate quotes, campaign ideas..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit}>
                <Check size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
