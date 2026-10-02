import CreatorCard from './CreatorCard';

export default function CreatorGrid({ influencers = [], onToggleFavorite, onSelectCreator, onUpdateStatus }) {
  return (
    <div className="creator-cards-grid">
      {influencers.map(inf => (
        <CreatorCard
          key={inf.id}
          influencer={inf}
          onToggleFavorite={onToggleFavorite}
          onSelectCreator={onSelectCreator}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  );
}
