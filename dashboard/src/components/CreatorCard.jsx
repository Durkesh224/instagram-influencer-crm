import React from 'react';
import { Heart, ExternalLink, User, Eye, MapPin } from 'lucide-react';
import { getCleanName, normalizeStage } from '../utils/helpers';

export default function CreatorCard({ influencer, onToggleFavorite, onSelectCreator, onUpdateStatus }) {
  const isFav = Boolean(influencer.isFavorite || influencer.favorite);
  const cleanName = getCleanName(influencer);
  const currentTag = normalizeStage(influencer.tag);

  return (
    <div className="creator-card-box">
      <div className="card-top-actions">
        <select
          className={`status-select-hero ${currentTag.toLowerCase()}`}
          value={currentTag}
          onChange={e => {
            e.stopPropagation();
            if (onUpdateStatus) onUpdateStatus(influencer.id, e.target.value);
          }}
          onClick={e => e.stopPropagation()}
          style={{ padding: '3px 7px', fontSize: 11 }}
        >
          <option value="Potential">Potential</option>
          <option value="Contacted">Contacted</option>
          <option value="Interested">Interested</option>
          <option value="Collaboration">Collaboration</option>
        </select>

        <button
          className={`fav-star-btn ${isFav ? 'active' : ''}`}
          onClick={e => {
            e.stopPropagation();
            onToggleFavorite(influencer);
          }}
          title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Heart size={18} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#94a3b8'} />
        </button>
      </div>

      <div className="card-profile-center" onClick={() => onSelectCreator(influencer)}>
        <div className="card-avatar-container">
          {influencer.profileImage && influencer.profileImage !== 'N/A' ? (
            <img
              src={influencer.profileImage}
              alt={influencer.username}
              className="card-avatar-img"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className="card-avatar-fallback" style={{ display: influencer.profileImage && influencer.profileImage !== 'N/A' ? 'none' : 'flex' }}>
            <User size={24} />
          </div>
        </div>

        <h3 className="card-creator-name">{cleanName}</h3>
        <a
          href={influencer.profileUrl || `https://www.instagram.com/${influencer.username}/`}
          target="_blank"
          rel="noreferrer"
          className="card-creator-handle"
          onClick={e => e.stopPropagation()}
        >
          @{influencer.username} <ExternalLink size={12} />
        </a>
      </div>

      <div className="card-stats-banner">
        <div className="card-stat-col">
          <span className="card-stat-val">👥 {influencer.followers || 'N/A'}</span>
          <span className="card-stat-lbl">Followers</span>
        </div>
        <div className="card-stat-divider" />
        <div className="card-stat-col">
          <span className="card-stat-val">{influencer.category || 'Digital Creator'}</span>
          <span className="card-stat-lbl">Category</span>
        </div>
      </div>

      {influencer.location && influencer.location !== 'N/A' && (
        <div className="card-location-text">
          <MapPin size={12} /> {influencer.location}
        </div>
      )}

      <button className="btn-primary card-view-btn" onClick={() => onSelectCreator(influencer)}>
        <Eye size={15} /> View Profile
      </button>
    </div>
  );
}
