import React from 'react';
import { Activity } from 'lucide-react';
import { formatRelativeTime } from '../utils/helpers';

export default function RecentActivity({ activities = [] }) {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="insights-card">
      <div className="card-header-clean">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} className="text-accent" />
          <h3 className="card-title-clean">Recent Activity</h3>
        </div>
        <span className="card-badge-count">{activities.length} Events</span>
      </div>

      <div className="activity-list">
        {activities.slice(0, 6).map((item, idx) => (
          <div key={idx} className="activity-row">
            <span className="activity-badge-icon">{item.icon || '✓'}</span>
            <div className="activity-text-box">
              <span className="activity-msg">{item.message}</span>
              <span className="activity-time">{formatRelativeTime(item.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
