export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="wavvy-skeleton wavvy-skeleton-title" style={{ width: '240px' }} />
    </div>
  )
}