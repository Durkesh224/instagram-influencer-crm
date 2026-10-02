import React from 'react';
import { Layers } from 'lucide-react';
import { detectCategoryFromText } from '../utils/helpers';

const CATEGORY_COLORS = {
  'Digital Creator': '#6366f1',
  'Sports & Athletes': '#3b82f6',
  'Fashion & Style': '#ec4899',
  'Beauty & Cosmetics': '#f43f5e',
  'Fitness & Health': '#10b981',
  'Business & Tech': '#8b5cf6',
  'Travel & Lifestyle': '#f59e0b'
};

export default function CategoryDistribution({ influencers = [], activeCategory, onSelectCategory }) {
  const total = influencers.length;

  const categoryCounts = {};
  influencers.forEach(inf => {
    let cat = inf.category;
    if (!cat || cat === 'N/A' || cat.trim() === '') {
      cat = detectCategoryFromText(inf.bio, inf.name, inf.username);
    }
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1]);

  const favCount = influencers.filter(i => Boolean(i.isFavorite || i.favorite)).length;

  return (
    <div className="insights-card">
      <div className="card-header-clean">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} className="text-accent" />
          <h3 className="card-title-clean">Creator Categories</h3>
        </div>
        <span className="card-badge-count">{Object.keys(categoryCounts).length} Categories</span>
      </div>

      <div className="category-bars-list">
        {favCount > 0 && (
          <div
            className={`category-bar-row ${activeCategory === 'Favorites ❤️' ? 'active' : ''}`}
            onClick={() => onSelectCategory(activeCategory === 'Favorites ❤️' ? 'All Categories' : 'Favorites ❤️')}
            title="Click to filter Starred Favorites"
            style={{ background: activeCategory === 'Favorites ❤️' ? '#ffe4e6' : '#fff1f2', borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}
          >
            <div className="category-bar-info">
              <span className="category-bar-name" style={{ color: '#e11d48', fontWeight: 700 }}>Starred Favorites ❤️</span>
              <span className="category-bar-stats" style={{ color: '#e11d48', fontWeight: 700 }}>{favCount} ({total > 0 ? Math.round((favCount / total) * 100) : 0}%)</span>
            </div>
            <div className="category-bar-track" style={{ background: '#fecdd3' }}>
              <div className="category-bar-fill" style={{ width: `${total > 0 ? Math.round((favCount / total) * 100) : 0}%`, background: '#f43f5e' }} />
            </div>
          </div>
        )}

        {sortedCategories.length === 0 ? (
          <div className="text-muted" style={{ padding: '20px 0', textAlign: 'center', fontSize: 13 }}>No categories registered yet.</div>
        ) : (
          sortedCategories.map(([catName, count]) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const color = CATEGORY_COLORS[catName] || '#64748b';
            const isActive = activeCategory === catName;

            return (
              <div
                key={catName}
                className={`category-bar-row ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(isActive ? 'All Categories' : catName)}
                title={`Click to filter by ${catName}`}
              >
                <div className="category-bar-info">
                  <span className="category-bar-name">{catName}</span>
                  <span className="category-bar-stats">{count} ({percentage}%)</span>
                </div>
                <div className="category-bar-track">
                  <div className="category-bar-fill" style={{ width: `${percentage}%`, background: color }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
