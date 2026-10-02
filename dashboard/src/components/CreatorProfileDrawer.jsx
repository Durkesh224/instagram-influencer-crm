import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  ExternalLink,
  MapPin,
  Globe,
  Edit3,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  User,
  MessageSquare,
  FileText
} from 'lucide-react';
import { getCleanName, formatDate, calculateProfileQuality, normalizeStage } from '../utils/helpers';

export default function CreatorProfileDrawer({
  influencer,
  onClose,
  onEdit,
  onToggleFavorite,
  onSaveNotes,
  onUpdateStatus
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [notesText, setNotesText] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (influencer) {
      setNotesText(influencer.notes || '');
    }
  }, [influencer]);

  if (!influencer) return null;

  const isFav = Boolean(influencer.isFavorite || influencer.favorite);
  const cleanName = getCleanName(influencer);
  const quality = calculateProfileQuality(influencer);

  const handleSaveNotesSubmit = async () => {
    setSavingNotes(true);
    await onSaveNotes(influencer.id, notesText);
    setSavingNotes(false);
    setIsEditingNotes(false);
  };

  const profileUrl = influencer.profileUrl || `https://www.instagram.com/${influencer.username}/`;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content-box" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <span className="drawer-title-lbl">Creator Profile</span>
            <div className="quality-pill-badge" title="Data completeness score">
              <ShieldCheck size={13} /> {quality}% Complete
            </div>
          </div>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Creator Hero Card */}
        <div className="drawer-hero-section">
          <div className="drawer-avatar-wrapper">
            {influencer.profileImage && influencer.profileImage !== 'N/A' ? (
              <img
                src={influencer.profileImage}
                alt={influencer.username}
                className="drawer-avatar-img"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div className="drawer-avatar-fallback" style={{ display: influencer.profileImage && influencer.profileImage !== 'N/A' ? 'none' : 'flex' }}>
              <User size={32} />
            </div>
          </div>

          <div className="drawer-hero-details">
            <div className="drawer-hero-name-row">
              <h2 className="drawer-hero-name">{cleanName}</h2>
              <button
                className={`fav-star-btn ${isFav ? 'active' : ''}`}
                onClick={() => onToggleFavorite(influencer)}
                title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Heart size={20} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#94a3b8'} />
              </button>
            </div>

            <a href={profileUrl} target="_blank" rel="noreferrer" className="drawer-hero-handle">
              @{influencer.username} <ExternalLink size={13} />
            </a>

            <div className="drawer-hero-pills">
              <span className="category-pill-hero">{influencer.category || 'Digital Creator'}</span>
              <select
                className={`status-select-hero ${normalizeStage(influencer.tag).toLowerCase()}`}
                value={normalizeStage(influencer.tag)}
                onChange={e => onUpdateStatus(influencer.id, e.target.value)}
              >
                <option value="Potential">Potential</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Collaboration">Collaboration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="drawer-tabs-bar">
          <button
            className={`drawer-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Audience & Stats
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            Links & Contact
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            CRM Notes
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="drawer-body">
          {activeTab === 'overview' && (
            <div className="drawer-tab-pane">
              <div className="pane-section">
                <h4 className="pane-section-title">Instagram Bio</h4>
                <div className="pane-bio-box">
                  {influencer.bio && influencer.bio !== 'N/A' ? (
                    <p>{influencer.bio}</p>
                  ) : (
                    <span className="text-muted">No bio details captured for this creator.</span>
                  )}
                </div>
              </div>

              <div className="pane-stats-row">
                <div className="pane-stat-card">
                  <span className="pane-stat-num">👥 {influencer.followers || 'N/A'}</span>
                  <span className="pane-stat-lbl">Followers</span>
                </div>
                <div className="pane-stat-card">
                  <span className="pane-stat-num">👤 {influencer.following || 'N/A'}</span>
                  <span className="pane-stat-lbl">Following</span>
                </div>
                <div className="pane-stat-card">
                  <span className="pane-stat-num">📸 {influencer.posts || 'N/A'}</span>
                  <span className="pane-stat-lbl">Total Posts</span>
                </div>
              </div>

              <div className="outreach-controller-bar">
                <div className="outreach-controller-title">
                  <MessageSquare size={15} color="#3b82f6" /> Campaign Outreach Stage
                </div>
                <div className="outreach-btns-group">
                  {[
                    { id: 'Potential', label: '🎯 Potential', color: '#6366f1', bg: '#eef2ff' },
                    { id: 'Contacted', label: '📧 Contacted', color: '#2563eb', bg: '#eff6ff' },
                    { id: 'Interested', label: '👍 Interested', color: '#d97706', bg: '#fffbeb' },
                    { id: 'Collaboration', label: '🤝 Collaboration', color: '#059669', bg: '#ecfdf5' }
                  ].map(stg => (
                    <button
                      key={stg.id}
                      className={`stage-action-pill ${normalizeStage(influencer.tag) === stg.id ? 'active' : ''}`}
                      style={{
                        '--pill-color': stg.color,
                        '--pill-bg': stg.bg
                      }}
                      onClick={() => onUpdateStatus(influencer.id, stg.id)}
                    >
                      {stg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pane-section mt-16">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 className="pane-section-title" style={{ margin: 0 }}>Outreach & CRM Notes</h4>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="quick-contact-btn"
                      onClick={() => {
                        const now = new Date();
                        const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const logText = (influencer.notes ? `${influencer.notes}\n` : '') + `[${timeStr}] Contacted creator via Instagram DM / Email.`;
                        onSaveNotes(influencer.id, logText);
                        onUpdateStatus(influencer.id, 'Contacted');
                      }}
                    >
                      📧 Log Outreach
                    </button>
                    <button className="text-btn" onClick={() => setActiveTab('notes')}>
                      <Edit3 size={13} /> Edit Notes
                    </button>
                  </div>
                </div>
                <div className="notes-display-box" style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}>
                  {influencer.notes ? (
                    <p style={{ margin: 0, whitespace: 'pre-line' }}>{influencer.notes}</p>
                  ) : (
                    <span className="text-muted">No outreach notes added. Click "Log Outreach" above to log initial contact.</span>
                  )}
                </div>
              </div>

              <div className="pane-section mt-16">
                <h4 className="pane-section-title">CRM Metadata</h4>
                <div className="metadata-list-box">
                  <div className="meta-item">
                    <span className="meta-lbl"><Calendar size={13} /> Saved Date:</span>
                    <span className="meta-val">{formatDate(influencer.createdAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl"><Clock size={13} /> Last Updated:</span>
                    <span className="meta-val">{formatDate(influencer.updatedAt || influencer.createdAt)}</span>
                  </div>
                  {influencer.location && influencer.location !== 'N/A' && (
                    <div className="meta-item">
                      <span className="meta-lbl"><MapPin size={13} /> Location:</span>
                      <span className="meta-val">{influencer.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="drawer-tab-pane">
              <div className="pane-stats-large-grid">
                <div className="stat-large-card purple">
                  <span className="stat-large-title">Followers Count</span>
                  <span className="stat-large-val">👥 {influencer.followers || 'N/A'}</span>
                </div>
                <div className="stat-large-card blue">
                  <span className="stat-large-title">Following Count</span>
                  <span className="stat-large-val">👤 {influencer.following || 'N/A'}</span>
                </div>
                <div className="stat-large-card green">
                  <span className="stat-large-title">Total Posts</span>
                  <span className="stat-large-val">📸 {influencer.posts || 'N/A'}</span>
                </div>
              </div>

              <div className="pane-section mt-20">
                <h4 className="pane-section-title">Profile Completeness Score</h4>
                <div className="quality-pane-box">
                  <div className="quality-bar-track">
                    <div className="quality-bar-fill" style={{ width: `${quality}%` }} />
                  </div>
                  <span className="quality-pane-desc">{quality}% of standard Instagram profile attributes captured.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="drawer-tab-pane">
              <div className="pane-links-list">
                <div className="pane-link-card">
                  <div>
                    <span className="link-card-lbl">Official Instagram Profile</span>
                    <a href={profileUrl} target="_blank" rel="noreferrer" className="link-card-url">
                      {profileUrl}
                    </a>
                  </div>
                  <a href={profileUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
                    Open <ExternalLink size={12} />
                  </a>
                </div>

                {influencer.websiteUrl && influencer.websiteUrl !== 'N/A' && (
                  <div className="pane-link-card">
                    <div>
                      <span className="link-card-lbl">Primary Website / Link in Bio</span>
                      <a
                        href={influencer.websiteUrl.startsWith('http') ? influencer.websiteUrl : `https://${influencer.websiteUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="link-card-url"
                      >
                        {influencer.websiteUrl}
                      </a>
                    </div>
                    <a
                      href={influencer.websiteUrl.startsWith('http') ? influencer.websiteUrl : `https://${influencer.websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary btn-sm"
                    >
                      Open <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="drawer-tab-pane">
              <div className="pane-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4 className="pane-section-title" style={{ margin: 0 }}>Private Outreach Notes</h4>
                  {!isEditingNotes && (
                    <button className="text-btn" onClick={() => setIsEditingNotes(true)}>
                      <Edit3 size={13} /> Edit Notes
                    </button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="notes-edit-container">
                    <textarea
                      className="form-textarea-styled"
                      rows={5}
                      placeholder="Add campaign outreach notes, rate quotes, collaboration ideas..."
                      value={notesText}
                      onChange={e => setNotesText(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                      <button className="btn-secondary btn-sm" onClick={() => setIsEditingNotes(false)}>
                        Cancel
                      </button>
                      <button className="btn-primary btn-sm" onClick={handleSaveNotesSubmit} disabled={savingNotes}>
                        {savingNotes ? 'Saving...' : <><Check size={14} /> Save Notes</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="notes-display-box">
                    {influencer.notes ? (
                      <p>{influencer.notes}</p>
                    ) : (
                      <span className="text-muted">No campaign notes added yet. Click "Edit Notes" above to add notes.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="drawer-footer">
          <button className="btn-secondary" onClick={() => onEdit(influencer)}>
            <Edit3 size={15} /> Edit Creator
          </button>

          <a href={profileUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>
            <ExternalLink size={15} /> Open Instagram Profile ↗
          </a>
        </div>
      </div>
    </div>
  );
}
