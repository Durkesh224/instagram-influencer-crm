import React from 'react';
import { Target, MessageSquare, Flame, Handshake, Filter, X } from 'lucide-react';
import { normalizeStage } from '../utils/helpers';

const STAGES = [
  { id: 'Potential', name: 'Potential', icon: Target, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  { id: 'Contacted', name: 'Contacted', icon: MessageSquare, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { id: 'Interested', name: 'Interested', icon: Flame, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { id: 'Collaboration', name: 'Collaboration', icon: Handshake, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
];

export default function CampaignPipeline({ influencers = [], activeStage, onSelectStage, onClearStage }) {
  const total = influencers.length;

  const stageCounts = STAGES.reduce((acc, stage) => {
    acc[stage.id] = influencers.filter(i => normalizeStage(i.tag) === stage.id).length;
    return acc;
  }, {});

  return (
    <section className="pipeline-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Campaign Pipeline</h2>
          <p className="section-subtitle">Track and filter creator progress across recruitment stages.</p>
        </div>
        {activeStage && activeStage !== 'All' && (
          <button className="clear-stage-btn" onClick={onClearStage}>
            <X size={14} /> Clear Stage Filter ({activeStage})
          </button>
        )}
      </div>

      <div className="pipeline-grid">
        {STAGES.map(stage => {
          const count = stageCounts[stage.id] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`pipeline-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectStage(isActive ? 'All' : stage.id)}
              style={{ '--stage-color': stage.color }}
            >
              <div className="pipeline-card-header">
                <div className="pipeline-icon" style={{ color: stage.color, background: stage.bg }}>
                  <Icon size={18} />
                </div>
                <span className="pipeline-count">{count}</span>
              </div>

              <div className="pipeline-title">{stage.name}</div>

              <div className="pipeline-progress-wrapper">
                <div className="pipeline-progress-bar" style={{ width: `${percentage}%`, background: stage.color }} />
              </div>

              <div className="pipeline-meta">
                <span>{percentage}% of database</span>
                {isActive && <span className="active-badge"><Filter size={10} /> Active</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
