import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import TransactionsPage from './pages/TransactionsPage';
import BalancePage from './pages/BalancePage';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Lift League</h1>
        <nav className="app-nav">
          <Link to="/">Home</Link>
          <Link to="/checkout">Checkout</Link>
          <Link to="/balance">Balance</Link>
          <Link to="/transactions">Transactions</Link>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/balance" element={<BalancePage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>Lift League - Powered by Cloneable Services Architecture</p>
      </footer>
    </div>
  );
}

export default App;
