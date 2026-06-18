const EmergencyInfoPage = () => {
  return (
    <section className="card card--padded" style={{ width: 'min(720px, 100%)' }}>
      <header className="dashboard-header">
        <h2>Emergency information</h2>
        <span className="tag info">works offline</span>
      </header>
      <p className="muted" style={{ fontSize: '0.75rem' }}>
        Key contacts and guidance available without internet access.
      </p>

      <div className="grid" style={{ marginTop: '1rem', gap: '1rem' }}>
        <div className="card" style={{ padding: '0.8rem' }}>
          <h3 style={{ fontSize: '0.85rem', margin: '0 0 0.4rem' }}>Global emergencies</h3>
          <ul className="emergency-list">
            <li><strong>112</strong> — International emergency (mobile)</li>
            <li><strong>911</strong> — US / Canada</li>
            <li><strong>999</strong> — UK</li>
            <li><strong>100</strong> — India (police)</li>
            <li><strong>102</strong> — India (ambulance)</li>
            <li><strong>101</strong> — India (fire)</li>
          </ul>
        </div>

        <div className="card" style={{ padding: '0.8rem' }}>
          <h3 style={{ fontSize: '0.85rem', margin: '0 0 0.4rem' }}>If you are in danger</h3>
          <ul className="emergency-list">
            <li>Stay calm and find a safe location if possible</li>
            <li>Use the SOS button on the dashboard to alert authorities with your location</li>
            <li>Record voice notes describing your situation</li>
            <li>Share your live location with someone you trust</li>
            <li>Keep your digital ID accessible</li>
          </ul>
        </div>

        <div className="card" style={{ padding: '0.8rem' }}>
          <h3 style={{ fontSize: '0.85rem', margin: '0 0 0.4rem' }}>Lost or missing documents</h3>
          <ul className="emergency-list">
            <li>Contact your country's embassy or consulate immediately</li>
            <li>Your digital credential can serve as temporary identification</li>
            <li>File a police report at the nearest station</li>
            <li>Notify your travel insurance provider</li>
          </ul>
        </div>

        <div className="card" style={{ padding: '0.8rem' }}>
          <h3 style={{ fontSize: '0.85rem', margin: '0 0 0.4rem' }}>First aid quick guide</h3>
          <ul className="emergency-list">
            <li><strong>Bleeding:</strong> Apply direct pressure with clean cloth</li>
            <li><strong>Burns:</strong> Cool under running water for 10 minutes</li>
            <li><strong>Choking:</strong> Back blows then abdominal thrusts</li>
            <li><strong>Unconscious:</strong> Check breathing, place in recovery position</li>
            <li><strong>Fracture:</strong> Immobilize, do not move the injured area</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default EmergencyInfoPage;
