import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to Lift League</h1>
        <p>Your ultimate fitness tracking and competition platform</p>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Track Your Progress</h3>
          <p>Log workouts and monitor your gains over time</p>
        </div>

        <div className="feature-card">
          <h3>Compete with Friends</h3>
          <p>Join leagues and compete in challenges</p>
        </div>

        <div className="feature-card">
          <h3>Premium Features</h3>
          <p>Unlock advanced analytics and coaching</p>
          <Link to="/checkout" className="cta-button">
            Subscribe Now
          </Link>
        </div>
      </section>

      <section className="demo-info">
        <h2>Payment Service Demo</h2>
        <p>
          This is a demonstration of the Cloneable Payment Service integrated
          into a PWA application.
        </p>
        <ul>
          <li>
            <Link to="/checkout">Try the payment component</Link>
          </li>
          <li>
            <Link to="/balance">View account balance</Link>
          </li>
          <li>
            <Link to="/transactions">See transaction history</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
