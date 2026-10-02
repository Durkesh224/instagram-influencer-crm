import React from 'react';
import { Sparkles, Download, RefreshCw } from 'lucide-react';

export default function Header({ onRefresh, onExport, totalCount }) {
  return (
    <header className="dashboard-header">
      <div>
        <div className="brand-badge">
          <Sparkles size={14} /> Influencer CRM
        </div>
        <h1 className="dashboard-title">Influencer CRM</h1>
        <p className="dashboard-subtitle">Discover, organize and manage your creator database.</p>
      </div>

      <div className="header-actions">
        <button className="btn-secondary" onClick={onExport} title="Export current creator data to CSV">
          <Download size={15} /> Export CSV
        </button>
        <button className="btn-primary" onClick={onRefresh} title="Refresh creator dataset">
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>
    </header>
  );
}
