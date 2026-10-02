import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';
import { calculateProfileQuality } from '../utils/helpers';

export default function ProfileQualityCard({ influencers = [], showOnlyIncomplete, onToggleIncomplete }) {
  const total = influencers.length;

  if (total === 0) return null;

  const completenessScores = influencers.map(i => calculateProfileQuality(i));
  const avgCompleteness = Math.round(completenessScores.reduce((a, b) => a + b, 0) / total);

  const completeCount  = influencers.filter(i => calculateProfileQuality(i) >= 80).length;
  const missingBio     = influencers.filter(i => !i.bio || i.bio === 'N/A' || i.bio.trim().length < 5).length;
  const missingWebsite = influencers.filter(i => !i.websiteUrl || i.websiteUrl === 'N/A').length;
  const missingFollowers = influencers.filter(i => !i.followers || i.followers === 'N/A').length;

  return (
    <div className="insights-card">
      {/* Header */}
      <div className="quality-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="quality-icon-wrapper">
            <ShieldCheck size={20} className="text-accent" />
          </div>
          <div>
            <h4 className="quality-title">Profile Data Quality</h4>
            <p className="quality-subtitle">Scraped Instagram profile completeness</p>
          </div>
        </div>

        <div className="quality-score-badge">
          <span className="quality-score-num">{avgCompleteness}%</span>
          <span className="quality-score-label">Avg Complete</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="quality-progress-track">
        <div className="quality-progress-fill" style={{ width: `${avgCompleteness}%` }} />
      </div>

      {/* Metrics 2×2 grid */}
      <div className="quality-metrics-grid" style={{ marginBottom: 14 }}>
        <div className="quality-metric-item">
          <CheckCircle2 size={14} color="#10b981" style={{ marginBottom: 4 }} />
          <div className="metric-val">{completeCount}</div>
          <div className="metric-lbl">Complete Profiles</div>
        </div>

        <div className="quality-metric-item">
          <AlertTriangle size={14} color="#f59e0b" style={{ marginBottom: 4 }} />
          <div className="metric-val">{missingBio}</div>
          <div className="metric-lbl">Missing Bio</div>
        </div>

        <div className="quality-metric-item">
          <AlertTriangle size={14} color="#f43f5e" style={{ marginBottom: 4 }} />
          <div className="metric-val">{missingWebsite}</div>
          <div className="metric-lbl">Missing Website</div>
        </div>

        <div className="quality-metric-item">
          <AlertTriangle size={14} color="#8b5cf6" style={{ marginBottom: 4 }} />
          <div className="metric-val">{missingFollowers}</div>
          <div className="metric-lbl">Missing Followers</div>
        </div>
      </div>

      {/* Filter toggle */}
      <button
        className={`quality-filter-btn ${showOnlyIncomplete ? 'active' : ''}`}
        onClick={onToggleIncomplete}
      >
        <Filter size={13} />
        {showOnlyIncomplete
          ? 'Showing Incomplete Profiles — Click to Reset'
          : 'Show Incomplete Profiles (<80%)'}
      </button>
    </div>
  );
}
