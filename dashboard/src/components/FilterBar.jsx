import React from 'react';
import { Search, X, LayoutGrid, Table, ArrowUpDown, Filter } from 'lucide-react';

const CATEGORIES = [
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

const STATUSES = ['All Status Tags', 'Potential', 'Contacted', 'Interested', 'Collaboration'];

const FOLLOWER_RANGES = [
  { label: 'All Followers', value: 'All' },
  { label: '1K+ Followers', value: '1K+' },
  { label: '10K+ Followers', value: '10K+' },
  { label: '100K+ Followers', value: '100K+' },
  { label: '1M+ Followers', value: '1M+' },
  { label: '10M+ Followers', value: '10M+' }
];

const SORT_OPTIONS = [
  { label: 'Sort: Recently Added', value: 'newest' },
  { label: 'Sort: Oldest First', value: 'oldest' },
  { label: 'Sort: Name (A-Z)', value: 'name_asc' },
  { label: 'Sort: Name (Z-A)', value: 'name_desc' },
  { label: 'Sort: Followers (High → Low)', value: 'followers' },
  { label: 'Sort: Followers (Low → High)', value: 'followers_asc' },
  { label: 'Sort: Favorites First', value: 'favorites_first' }
];

export default function FilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  followerRange,
  onFollowerRangeChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters
}) {
  return (
    <div className="filter-toolbar-card">
      <div className="search-box-large">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="search-input-large"
          placeholder="Search creators by name, @handle, bio, category, or location..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
        {search && (
          <button className="clear-search-btn" onClick={() => onSearchChange('')}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="filter-controls-row">
        <div className="filter-select-group">
          <select
            className="filter-select"
            value={category}
            onChange={e => onCategoryChange(e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c === 'All Categories' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={status}
            onChange={e => onStatusChange(e.target.value)}
          >
            {STATUSES.map(s => (
              <option key={s} value={s === 'All Status Tags' ? 'All' : s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={followerRange}
            onChange={e => onFollowerRangeChange(e.target.value)}
          >
            {FOLLOWER_RANGES.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            className="filter-select sort-select"
            value={sort}
            onChange={e => onSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-actions-right">
          {hasActiveFilters && (
            <button className="clear-all-filters-btn" onClick={onClearFilters}>
              <X size={14} /> Clear Filters
            </button>
          )}

          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => onViewModeChange('table')}
              title="Table View"
            >
              <Table size={16} /> Table
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => onViewModeChange('cards')}
              title="Cards View"
            >
              <LayoutGrid size={16} /> Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
