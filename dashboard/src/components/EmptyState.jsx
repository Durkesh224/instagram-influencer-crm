import React from 'react';
import { Sparkles, Search, RefreshCw } from 'lucide-react';

export default function EmptyState({ type = 'none', onClearFilters, onRefresh }) {
  if (type === 'no-search') {
    return (
      <div className="empty-state-box">
        <div className="empty-icon-circle">
          <Search size={28} />
        </div>
        <h3 className="empty-title">No creators match your current filters</h3>
        <p className="empty-desc">Try adjusting your search keyword, category, status stage, or follower range.</p>
        <button className="btn-secondary mt-16" onClick={onClearFilters}>
          Clear All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state-box">
      <div className="empty-icon-circle accent">
        <Sparkles size={28} />
      </div>
      <h3 className="empty-title">No influencers saved yet</h3>
      <p className="empty-desc">Start building your creator database by adding influencers from Instagram using the Chrome Extension.</p>
      <button className="btn-primary mt-16" onClick={onRefresh}>
        <RefreshCw size={15} /> Refresh Database
      </button>
    </div>
  );
}
