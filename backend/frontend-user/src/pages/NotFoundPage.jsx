import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <section className="card card--padded">
    <h2>Page not found</h2>
    <p className="muted">The page you are looking for does not exist.</p>
    <Link to="/">Return home</Link>
  </section>
);

export default NotFoundPage;
