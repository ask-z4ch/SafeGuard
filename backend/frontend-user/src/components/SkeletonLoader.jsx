const SkeletonLoader = ({ count = 3, height = '1rem' }) => (
  <div className="skeleton-group">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="skeleton" style={{ height }} />
    ))}
  </div>
);

export default SkeletonLoader;
