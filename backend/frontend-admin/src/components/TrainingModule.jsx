import { useState } from 'react';

const TrainingModule = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setIsVisible((v) => !v)}>
        {isVisible ? 'Close training module' : 'Launch training module'}
      </button>
      {isVisible && (
        <div style={{ marginTop: '0.5rem', width: '100%', height: '520px', border: '1px solid #ccc', overflow: 'hidden' }}>
          <iframe
            title="Police Training Module"
            src="/training-game/index.html"
            allow="autoplay; fullscreen"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )}
    </div>
  );
};

export default TrainingModule;
