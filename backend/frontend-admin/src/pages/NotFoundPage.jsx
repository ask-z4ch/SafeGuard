import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <section className="card card--padded">
    <h2>Not found</h2>
    <p className="muted">The requested admin page does not exist.</p>
    <Link to="/dashboard">Go to dashboard</Link>
  </section>
);

export default NotFoundPage;
