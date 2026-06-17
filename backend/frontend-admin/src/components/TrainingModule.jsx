import { useState } from 'react';

const TrainingModule = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleModule = () => setIsVisible((prev) => !prev);

  return (
    <div className="training-module">
      <button type="button" className="launch-btn" onClick={toggleModule}>
        {isVisible ? 'Hide Training Module' : 'Launch Training Module'}
      </button>

      {isVisible && (
        <div className="iframe-wrapper">
          <iframe
            title="Police Training Module"
            src="/training-game/index.html"
            allow="autoplay; fullscreen"
          />
        </div>
      )}

      <style jsx>{`
        .training-module {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(15, 23, 42, 0.35);
          border-radius: 1rem;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }

        .launch-btn {
          align-self: flex-start;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: none;
          color: #f8fafc;
          border-radius: 999px;
          padding: 0.65rem 1.4rem;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 12px 24px -12px rgba(37, 99, 235, 0.65);
        }

        .launch-btn:hover {
          transform: translateY(-1px);
        }

        .iframe-wrapper {
          position: relative;
          width: 100%;
          height: 600px;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 24px 48px -28px rgba(15, 23, 42, 0.65);
        }

        .iframe-wrapper iframe {
          width: 100%;
          height: 100%;
          border: none;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .iframe-wrapper {
            height: 480px;
          }
        }
      `}</style>
    </div>
  );
};

export default TrainingModule;
