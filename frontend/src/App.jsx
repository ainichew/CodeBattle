import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/Landing';
import ContestArena from './pages/ContestArena';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/contest/:contestId" element={<ContestArena />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
