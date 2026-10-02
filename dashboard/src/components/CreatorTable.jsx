import React from 'react';
import { Heart, ExternalLink, Edit3, Trash2, MapPin, Eye, User } from 'lucide-react';
import { getCleanName, formatDate, normalizeStage } from '../utils/helpers';

const CATEGORY_OPTIONS = [
  'Digital Creator',
  'Sports & Athletes',
  'Fashion & Style',
  'Beauty & Cosmetics',
  'Fitness & Health',
  'Business & Tech',
  'Travel & Lifestyle'
];

export default function CreatorTable({
  influencers = [],
  onToggleFavorite,
  onSelectCreator,
  onEditCreator,
  onDeleteCreator,
  onUpdateCategory,
  onUpdateStatus
}) {
  return (
    <div className="table-responsive-wrapper">
      <table className="creator-table">
        <thead>
          <tr>
            <th style={{ width: 44, textAlign: 'center' }}>❤️</th>
            <th>Creator</th>
            <th>Category</th>
            <th>Followers</th>
            <th>Following</th>
            <th>Posts</th>
            <th>Status Stage</th>
            <th>Added</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {influencers.map(inf => {
            const isFav = Boolean(inf.isFavorite || inf.favorite);
            const cleanName = getCleanName(inf);
            const currentTag = normalizeStage(inf.tag);

            return (
              <tr key={inf.id} className="creator-table-row">
                <td style={{ textAlign: 'center' }}>
                  <button
                    className={`fav-star-btn ${isFav ? 'active' : ''}`}
                    onClick={e => {
                      e.stopPropagation();
                      onToggleFavorite(inf);
                    }}
                    title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Heart size={16} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#94a3b8'} />
                  </button>
                </td>

                <td>
                  <div className="creator-cell-info" onClick={() => onSelectCreator(inf)}>
                    <div className="creator-avatar-wrapper">
                      {inf.profileImage && inf.profileImage !== 'N/A' ? (
                        <img
                          src={inf.profileImage}
                          alt={inf.username}
                          className="creator-avatar"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="creator-avatar-fallback" style={{ display: inf.profileImage && inf.profileImage !== 'N/A' ? 'none' : 'flex' }}>
                        <User size={16} />
                      </div>
                    </div>

                    <div className="creator-names">
                      <div className="creator-primary-name">{cleanName}</div>
                      <div className="creator-secondary-handle">@{inf.username}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <select
                    className="category-pill-select"
                    value={inf.category && inf.category !== 'N/A' ? inf.category : 'Digital Creator'}
                    onChange={e => onUpdateCategory(inf, e.target.value)}
                    onClick={e => e.stopPropagation()}
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {inf.location && inf.location !== 'N/A' && (
                    <div className="location-tag">
                      <MapPin size={11} /> {inf.location}
                    </div>
                  )}
                </td>

                <td>
                  <span className="followers-cell-badge">👥 {inf.followers || 'N/A'}</span>
                </td>

                <td>
                  <span className="stats-cell-num">{inf.following || 'N/A'}</span>
                </td>

                <td>
                  <span className="stats-cell-num">{inf.posts || 'N/A'}</span>
                </td>

                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <select
                      className={`status-select-hero ${currentTag.toLowerCase()}`}
                      value={currentTag}
                      onChange={e => {
                        e.stopPropagation();
                        if (onUpdateStatus) onUpdateStatus(inf.id, e.target.value);
                      }}
                      onClick={e => e.stopPropagation()}
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      <option value="Potential">Potential</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Interested">Interested</option>
                      <option value="Collaboration">Collaboration</option>
                    </select>

                    {currentTag === 'Potential' && onUpdateStatus && (
                      <button
                        className="quick-contact-btn"
                        title="Mark outreach sent to creator"
                        onClick={e => {
                          e.stopPropagation();
                          onUpdateStatus(inf.id, 'Contacted');
                        }}
                      >
                        📧 Mark Contacted
                      </button>
                    )}
                  </div>
                </td>

                <td>
                  <span className="date-cell-text">{formatDate(inf.createdAt)}</span>
                </td>

                <td>
                  <div className="table-actions-cell">
                    <button
                      className="table-action-btn primary"
                      title="View Full Profile"
                      onClick={() => onSelectCreator(inf)}
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      className="table-action-btn"
                      title="Edit Creator"
                      onClick={e => {
                        e.stopPropagation();
                        onEditCreator(inf);
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="table-action-btn danger"
                      title="Delete Creator"
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteCreator(inf.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
