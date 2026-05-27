export default function Loading() {
  return (
    <div className="wavvy-page">
      <div className="wavvy-skeleton wavvy-skeleton-title" />
      <div className="wavvy-song-grid">
        {Array(6).fill(0).map((_, index) => (
          <div key={index} className="wavvy-skeleton wavvy-skeleton-card" />
        ))}
      </div>
    </div>
  )
}