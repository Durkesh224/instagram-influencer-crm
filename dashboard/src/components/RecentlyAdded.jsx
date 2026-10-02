import React from 'react';
import { Clock, ArrowRight, User } from 'lucide-react';
import { getCleanName, formatRelativeTime } from '../utils/helpers';

export default function RecentlyAdded({ influencers = [], onSelectCreator, onViewAll }) {
  const recentList = [...influencers]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="insights-card">
      <div className="card-header-clean">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} className="text-accent" />
          <h3 className="card-title-clean">Recently Added</h3>
        </div>
        <button className="text-link-btn" onClick={onViewAll}>
          View All <ArrowRight size={13} />
        </button>
      </div>

      <div className="recent-list">
        {recentList.length === 0 ? (
          <div className="text-muted" style={{ padding: '20px 0', textAlign: 'center', fontSize: 13 }}>
            No recent creators saved yet.
          </div>
        ) : (
          recentList.map(inf => (
            <div key={inf.id} className="recent-item-row" onClick={() => onSelectCreator(inf)}>
              {/* Avatar */}
              <div className="recent-avatar-wrapper">
                {inf.profileImage && inf.profileImage !== 'N/A' ? (
                  <img
                    src={inf.profileImage}
                    alt={inf.username}
                    className="recent-avatar-img"
                    onError={e => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="recent-avatar-fallback"
                  style={{ display: inf.profileImage && inf.profileImage !== 'N/A' ? 'none' : 'flex' }}
                >
                  <User size={14} />
                </div>
              </div>

              {/* Name & handle */}
              <div className="recent-info-block">
                <div className="recent-name">{getCleanName(inf)}</div>
                <div className="recent-handle">@{inf.username}</div>
              </div>

              {/* Category & time */}
              <div className="recent-right-block">
                <span className="recent-category">{inf.category || 'Digital Creator'}</span>
                <div className="recent-time">{formatRelativeTime(inf.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
