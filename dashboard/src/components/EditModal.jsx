import React, { useState, useEffect } from 'react';
import { X, Check, Heart } from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Digital Creator',
  'Sports & Athletes',
  'Fashion & Style',
  'Beauty & Cosmetics',
  'Fitness & Health',
  'Business & Tech',
  'Travel & Lifestyle'
];

export default function EditModal({ influencer, onClose, onSave }) {
  const [tag, setTag] = useState('Potential');
  const [category, setCategory] = useState('Digital Creator');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [followers, setFollowers] = useState('');
  const [following, setFollowing] = useState('');
  const [posts, setPosts] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (influencer) {
      setTag(influencer.tag || 'Potential');
      setCategory(influencer.category || 'Digital Creator');
      setLocation(influencer.location !== 'N/A' ? influencer.location : '');
      setWebsite(influencer.websiteUrl !== 'N/A' ? influencer.websiteUrl : '');
      setFollowers(influencer.followers !== 'N/A' ? influencer.followers : '');
      setFollowing(influencer.following !== 'N/A' ? influencer.following : '');
      setPosts(influencer.posts !== 'N/A' ? influencer.posts : '');
      setNotes(influencer.notes || '');
      setIsFavorite(Boolean(influencer.isFavorite || influencer.favorite));
    }
  }, [influencer]);

  if (!influencer) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    await onSave(influencer.id, {
      tag,
      category,
      location: location.trim() || 'N/A',
      websiteUrl: website.trim() || 'N/A',
      followers: followers.trim() || 'N/A',
      following: following.trim() || 'N/A',
      posts: posts.trim() || 'N/A',
      notes,
      isFavorite,
      favorite: isFavorite
    });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Edit Creator Details</h3>
            <span className="text-muted" style={{ fontSize: 13 }}>@{influencer.username}</span>
          </div>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group-grid">
            <div className="form-group">
              <label className="form-label">Industry Category</label>
              <select
                className="form-select-styled"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Campaign Pipeline Status</label>
              <select
                className="form-select-styled"
                value={tag}
                onChange={e => setTag(e.target.value)}
              >
                <option value="Potential">Potential</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Collaboration">Collaboration</option>
              </select>
            </div>
          </div>

          <div className="form-group-grid">
            <div className="form-group">
              <label className="form-label">Followers Count</label>
              <input
                type="text"
                className="form-input-styled"
                placeholder="e.g. 150K"
                value={followers}
                onChange={e => setFollowers(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-input-styled"
                placeholder="e.g. Los Angeles, CA"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Website / Link in Bio</label>
            <input
              type="text"
              className="form-input-styled"
              placeholder="e.g. https://linktr.ee/creator"
              value={website}
              onChange={e => setWebsite(e.target.value)}
            />
          </div>

          <div className="form-group-checkbox">
            <input
              type="checkbox"
              id="edit-fav-check"
              checked={isFavorite}
              onChange={e => setIsFavorite(e.target.checked)}
            />
            <label htmlFor="edit-fav-check" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              <Heart size={16} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : '#64748b'} />
              Mark as Starred Favorite Creator
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Campaign & Outreach Notes</label>
            <textarea
              className="form-textarea-styled"
              rows={3}
              placeholder="Add private campaign notes, rate quotes, brand alignment..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : <><Check size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
