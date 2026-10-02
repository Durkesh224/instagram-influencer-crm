import React from 'react';
import { Users, Award, Heart, UserPlus } from 'lucide-react';

export default function StatsGrid({ stats }) {
  const { totalInfluencers = 0, totalFollowers = '0', favoritesCount = 0, recentlyAdded = 0 } = stats || {};

  return (
    <section className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrapper purple">
          <Users size={20} />
        </div>
        <div>
          <div className="stat-label">Total Creators</div>
          <div className="stat-value">{totalInfluencers}</div>
          <div className="stat-subtext">Saved in database</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper green">
          <Award size={20} />
        </div>
        <div>
          <div className="stat-label">Total Audience</div>
          <div className="stat-value">{totalFollowers}</div>
          <div className="stat-subtext">Across all creators</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper rose">
          <Heart size={20} />
        </div>
        <div>
          <div className="stat-label">Favorites</div>
          <div className="stat-value">{favoritesCount}</div>
          <div className="stat-subtext">Starred creators</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper amber">
          <UserPlus size={20} />
        </div>
        <div>
          <div className="stat-label">Recently Added</div>
          <div className="stat-value">{recentlyAdded}</div>
          <div className="stat-subtext">This week</div>
        </div>
      </div>
    </section>
  );
}
