import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import CommitStoryPage from './pages/CommitStoryPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        {/* Navigation Header */}
        <header className="navigation-header">
          <div className="nav-container">
            <Link to="/" className="nav-logo">SAILOR SKILLS</Link>
            <nav className="nav-links">
              <a href="https://www.sailorskills.com/">HOME</a>
              <a href="https://www.sailorskills.com/training">TRAINING</a>
              <Link to="/booking" className="nav-link">BOOK LESSONS</Link>
              <a href="/index.html" className="nav-link">DIVING CALCULATOR</a>
              <Link to="/admin" className="nav-link">ADMIN</Link>
            </nav>
          </div>
        </header>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/story" element={<CommitStoryPage />} />
        </Routes>
      </div>
    </Router>
  );
}

function HomePage() {
  return (
    <div className="homepage">
      <div className="hero-header">
        <div className="hero-content">
          <div className="hero-brand">SAILOR SKILLS</div>
          <h1 className="hero-service">SERVICES</h1>
          <div className="hero-tagline">PROFESSIONAL MARINE SERVICES</div>
        </div>
      </div>
      
      <div className="services-container">
        <h2>Our Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <h3>Diving Services</h3>
            <p>Underwater vessel care and maintenance</p>
            <a href="/index.html" className="service-link">Calculate Cost →</a>
          </div>
          
          <div className="service-card">
            <h3>Training & Lessons</h3>
            <p>Professional sailing instruction for all levels</p>
            <Link to="/booking" className="service-link">Book Now →</Link>
          </div>
          
          <div className="service-card">
            <h3>Admin Dashboard</h3>
            <p>Manage bookings and settings</p>
            <Link to="/admin" className="service-link">Access Admin →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;