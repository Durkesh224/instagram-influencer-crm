import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import StatsGrid from './components/StatsGrid';
import CampaignPipeline from './components/CampaignPipeline';
import CategoryDistribution from './components/CategoryDistribution';
import RecentlyAdded from './components/RecentlyAdded';
import ProfileQualityCard from './components/ProfileQualityCard';
import RecentActivity from './components/RecentActivity';
import FilterBar from './components/FilterBar';
import CreatorTable from './components/CreatorTable';
import CreatorGrid from './components/CreatorGrid';
import CreatorProfileDrawer from './components/CreatorProfileDrawer';
import EditModal from './components/EditModal';
import Toast from './components/Toast';
import EmptyState from './components/EmptyState';
import { parseFollowerCount, calculateProfileQuality, formatDate, getCleanName, normalizeStage } from './utils/helpers';
import { RefreshCw, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

export default function App() {
  const [influencers, setInfluencers] = useState([]);
  const [stats, setStats] = useState({ totalInfluencers: 0, totalFollowers: '0', favoritesCount: 0, recentlyAdded: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [statusStage, setStatusStage] = useState('All');
  const [followerRange, setFollowerRange] = useState('All');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState('table');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);

  // Modals & Drawers
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [editCreatorItem, setEditCreatorItem] = useState(null);

  // UI Toasts & Session Activity
  const [toast, setToast] = useState(null);
  const [activities, setActivities] = useState([
    { message: 'System initialized CRM dashboard', timestamp: new Date().toISOString(), icon: '🚀' }
  ]);

  const logActivity = (message, icon = '✓') => {
    setActivities(prev => [{ message, timestamp: new Date().toISOString(), icon }, ...prev]);
  };

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
    setError(null);
    try {
      const url = new URL(`${API_BASE}/influencers`);
      if (sort) url.searchParams.append('sort', sort);

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInfluencers(data);
      } else {
        setError('Failed to connect to backend server API.');
      }
    } catch (err) {
      console.error('Failed to fetch influencers:', err);
      setError('Unable to load creator database. Ensure Spring Boot backend is active on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchInfluencers();
  }, [sort]);

  // Toggle favorite with instant optimistic UI & API update
  const handleToggleFavorite = async inf => {
    const isCurrentFav = Boolean(inf.isFavorite || inf.favorite);
    const updatedFav = !isCurrentFav;

    setInfluencers(prev =>
      prev.map(item => (item.id === inf.id ? { ...item, isFavorite: updatedFav, favorite: updatedFav } : item))
    );

    if (selectedCreator && selectedCreator.id === inf.id) {
      setSelectedCreator(prev => ({ ...prev, isFavorite: updatedFav, favorite: updatedFav }));
    }

    try {
      const res = await fetch(`${API_BASE}/influencers/${inf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: updatedFav, favorite: updatedFav })
      });
      if (res.ok) {
        fetchStats();
        logActivity(`${updatedFav ? 'Starred favorite' : 'Unstarred'} @${inf.username}`, '♥');
        setToast({
          message: updatedFav ? `Starred @${inf.username} as favorite` : `Removed @${inf.username} from favorites`,
          type: 'success'
        });
      } else {
        fetchInfluencers();
      }
    } catch (err) {
      fetchInfluencers();
    }
  };

  // Quick inline category updater
  const handleUpdateCategory = async (inf, newCat) => {
    setInfluencers(prev => prev.map(item => (item.id === inf.id ? { ...item, category: newCat } : item)));
    if (selectedCreator && selectedCreator.id === inf.id) {
      setSelectedCreator(prev => ({ ...prev, category: newCat }));
    }

    try {
      const res = await fetch(`${API_BASE}/influencers/${inf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCat })
      });
      if (res.ok) {
        fetchStats();
        logActivity(`Categorized @${inf.username} → ${newCat}`, '🏷');
        setToast({ message: `Updated category for @${inf.username} to ${newCat}`, type: 'success' });
      }
    } catch (err) {
      fetchInfluencers();
    }
  };

  // Quick status tag updater
  const handleUpdateStatus = async (id, newStatus) => {
    const normStage = normalizeStage(newStatus);
    const inf = influencers.find(i => i.id === id);
    if (!inf) return;

    setInfluencers(prev => prev.map(item => (item.id === id ? { ...item, tag: normStage } : item)));
    if (selectedCreator && selectedCreator.id === id) {
      setSelectedCreator(prev => ({ ...prev, tag: normStage }));
    }

    try {
      const res = await fetch(`${API_BASE}/influencers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: normStage })
      });
      if (res.ok) {
        fetchStats();
        logActivity(`Moved @${inf.username} stage → ${normStage}`, '🏷');
        setToast({ message: `Moved @${inf.username} stage to ${normStage}`, type: 'success' });
      }
    } catch (err) {
      fetchInfluencers();
    }
  };

  // Save Notes handler
  const handleSaveNotes = async (id, notesText) => {
    const inf = influencers.find(i => i.id === id);
    setInfluencers(prev => prev.map(item => (item.id === id ? { ...item, notes: notesText } : item)));
    if (selectedCreator && selectedCreator.id === id) {
      setSelectedCreator(prev => ({ ...prev, notes: notesText }));
    }

    try {
      const res = await fetch(`${API_BASE}/influencers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText })
      });
      if (res.ok) {
        logActivity(`Updated outreach notes for @${inf ? inf.username : 'creator'}`, '✎');
        setToast({ message: '✓ Notes saved successfully!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Failed to save notes to backend.', type: 'error' });
    }
  };

  // Edit creator full modal saver
  const handleSaveEditModal = async (id, payload) => {
    try {
      const res = await fetch(`${API_BASE}/influencers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setEditCreatorItem(null);
        if (selectedCreator && selectedCreator.id === id) {
          setSelectedCreator(updated);
        }
        fetchInfluencers();
        fetchStats();
        logActivity(`Updated details for @${updated.username}`, '✎');
        setToast({ message: '✓ Creator profile updated successfully!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Failed to update creator details.', type: 'error' });
    }
  };

  // Delete creator
  const handleDeleteCreator = async id => {
    const inf = influencers.find(i => i.id === id);
    const username = inf ? inf.username : 'creator';
    if (!window.confirm(`Are you sure you want to remove @${username} from your CRM?`)) return;

    try {
      const res = await fetch(`${API_BASE}/influencers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedCreator && selectedCreator.id === id) {
          setSelectedCreator(null);
        }
        fetchInfluencers();
        fetchStats();
        logActivity(`Removed @${username} from CRM`, '🗑');
        setToast({ message: `✓ Removed @${username} from CRM`, type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Failed to delete creator from backend.', type: 'error' });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (influencers.length === 0) {
      setToast({ message: 'No creator data available to export.', type: 'error' });
      return;
    }
    const headers = [
      'Name',
      'Username',
      'Instagram URL',
      'Bio',
      'Followers',
      'Following',
      'Posts',
      'Category',
      'Status Stage',
      'Notes',
      'Website',
      'Location',
      'Is Favorite',
      'Created At',
      'Updated At'
    ];
    const rows = influencers.map(i => [
      `"${getCleanName(i).replace(/"/g, '""')}"`,
      `"${i.username || ''}"`,
      `"${i.profileUrl || `https://www.instagram.com/${i.username}/`}"`,
      `"${(i.bio || '').replace(/"/g, '""')}"`,
      `"${i.followers || 'N/A'}"`,
      `"${i.following || 'N/A'}"`,
      `"${i.posts || 'N/A'}"`,
      `"${i.category || 'Digital Creator'}"`,
      `"${i.tag || 'Potential'}"`,
      `"${(i.notes || '').replace(/"/g, '""')}"`,
      `"${i.websiteUrl || 'N/A'}"`,
      `"${i.location || 'N/A'}"`,
      `"${i.isFavorite || i.favorite ? 'Yes' : 'No'}"`,
      `"${formatDate(i.createdAt)}"`,
      `"${formatDate(i.updatedAt || i.createdAt)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `influencer_crm_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logActivity('Exported creator database to CSV spreadsheet', '📊');
    setToast({ message: '✓ Creator database exported to CSV successfully!', type: 'success' });
  };

  // Follower range filter numeric evaluation
  const matchFollowerRange = (infFollowers, range) => {
    if (range === 'All') return true;
    const num = parseFollowerCount(infFollowers);
    if (range === '1K+') return num >= 1000;
    if (range === '10K+') return num >= 10000;
    if (range === '100K+') return num >= 100000;
    if (range === '1M+') return num >= 1000000;
    if (range === '10M+') return num >= 10000000;
    return true;
  };

  // Filtered dataset derivation
  const filteredInfluencers = useMemo(() => {
    return influencers.filter(inf => {
      // 1. Stage filter
      if (statusStage !== 'All' && normalizeStage(inf.tag) !== statusStage) return false;

      // 2. Category filter
      if (category !== 'All Categories') {
        if (category === 'Favorites ❤️') {
          if (!Boolean(inf.isFavorite || inf.favorite)) return false;
        } else {
          const cat = (inf.category || '').toLowerCase();
          const target = category.toLowerCase();
          if (!cat.includes(target) && !target.includes(cat)) return false;
        }
      }

      // 3. Follower range filter
      if (!matchFollowerRange(inf.followers, followerRange)) return false;

      // 4. Incomplete profiles filter toggle
      if (showOnlyIncomplete && calculateProfileQuality(inf) >= 80) return false;

      // 5. Search keyword filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const cleanName = getCleanName(inf).toLowerCase();
        const username = (inf.username || '').toLowerCase();
        const bio = (inf.bio || '').toLowerCase();
        const cat = (inf.category || '').toLowerCase();
        const loc = (inf.location || '').toLowerCase();
        if (!cleanName.includes(q) && !username.includes(q) && !bio.includes(q) && !cat.includes(q) && !loc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [influencers, search, category, statusStage, followerRange, showOnlyIncomplete]);

  const hasActiveFilters =
    search !== '' ||
    category !== 'All Categories' ||
    statusStage !== 'All' ||
    followerRange !== 'All' ||
    showOnlyIncomplete;

  const handleClearAllFilters = () => {
    setSearch('');
    setCategory('All Categories');
    setStatusStage('All');
    setFollowerRange('All');
    setShowOnlyIncomplete(false);
  };

  return (
    <div className="dashboard-container">
      {/* SECTION 1: HEADER */}
      <Header
        onRefresh={() => {
          fetchStats();
          fetchInfluencers();
          setToast({ message: '✓ Creator database refreshed', type: 'success' });
        }}
        onExport={handleExportCSV}
        totalCount={stats.totalInfluencers}
      />

      {/* SECTION 2: TOP STATISTICS KPI CARDS */}
      <StatsGrid stats={stats} />

      {/* SECTION 3: CAMPAIGN PIPELINE */}
      <CampaignPipeline
        influencers={influencers}
        activeStage={statusStage}
        onSelectStage={stg => setStatusStage(stg)}
        onClearStage={() => setStatusStage('All')}
      />

      {/* SECTION 4 & 5: INSIGHTS (CATEGORY DISTRIBUTION & RECENTLY ADDED) */}
      <section className="insights-grid">
        <CategoryDistribution
          influencers={influencers}
          activeCategory={category}
          onSelectCategory={cat => setCategory(cat)}
        />
        <RecentlyAdded
          influencers={influencers}
          onSelectCreator={inf => setSelectedCreator(inf)}
          onViewAll={() => {
            handleClearAllFilters();
            window.scrollTo({ top: 800, behavior: 'smooth' });
          }}
        />
      </section>

      {/* SECTION 9 & 13: DATA QUALITY & RECENT ACTIVITY */}
      <section className="insights-grid mt-24">
        <ProfileQualityCard
          influencers={influencers}
          showOnlyIncomplete={showOnlyIncomplete}
          onToggleIncomplete={() => setShowOnlyIncomplete(!showOnlyIncomplete)}
        />
        <RecentActivity activities={activities} />
      </section>

      {/* SECTION 8: CREATOR DATABASE TOOLBAR */}
      <section className="database-section mt-28">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Creator Database</h2>
            <p className="section-subtitle">
              Showing {filteredInfluencers.length} of {influencers.length} creators saved in CRM.
            </p>
          </div>
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          status={statusStage}
          onStatusChange={setStatusStage}
          followerRange={followerRange}
          onFollowerRangeChange={setFollowerRange}
          sort={sort}
          onSortChange={setSort}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAllFilters}
        />

        {/* SECTION 7, 14, 16: CREATOR DATABASE LIST / CARDS / EMPTY STATES */}
        <div className="database-content-card">
          {loading ? (
            <div className="empty-state-box">
              <RefreshCw className="spin text-accent" size={32} />
              <p className="empty-desc mt-16">Loading creator dataset from CRM database...</p>
            </div>
          ) : error ? (
            <div className="empty-state-box">
              <div className="empty-icon-circle error">⚠️</div>
              <h3 className="empty-title">{error}</h3>
              <button
                className="btn-primary mt-16"
                onClick={() => {
                  fetchStats();
                  fetchInfluencers();
                }}
              >
                <RefreshCw size={15} /> Retry Connection
              </button>
            </div>
          ) : filteredInfluencers.length === 0 ? (
            <EmptyState
              type={hasActiveFilters ? 'no-search' : 'none'}
              onClearFilters={handleClearAllFilters}
              onRefresh={() => {
                fetchStats();
                fetchInfluencers();
              }}
            />
          ) : viewMode === 'table' ? (
            <CreatorTable
              influencers={filteredInfluencers}
              onToggleFavorite={handleToggleFavorite}
              onSelectCreator={inf => setSelectedCreator(inf)}
              onEditCreator={inf => setEditCreatorItem(inf)}
              onDeleteCreator={handleDeleteCreator}
              onUpdateCategory={handleUpdateCategory}
            />
          ) : (
            <CreatorGrid
              influencers={filteredInfluencers}
              onToggleFavorite={handleToggleFavorite}
              onSelectCreator={inf => setSelectedCreator(inf)}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
        </div>
      </section>

      {/* SECTION 6: UNIFIED CREATOR PROFILE DRAWER / MODAL */}
      {selectedCreator && (
        <CreatorProfileDrawer
          influencer={selectedCreator}
          onClose={() => setSelectedCreator(null)}
          onEdit={inf => {
            setEditCreatorItem(inf);
          }}
          onToggleFavorite={handleToggleFavorite}
          onSaveNotes={handleSaveNotes}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* EDIT CREATOR MODAL */}
      {editCreatorItem && (
        <EditModal
          influencer={editCreatorItem}
          onClose={() => setEditCreatorItem(null)}
          onSave={handleSaveEditModal}
        />
      )}

      {/* TOAST SNACKBAR */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
