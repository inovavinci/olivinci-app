import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Challenge from './pages/Challenge';
import Admin from './pages/Admin';
import Ranking from './pages/Ranking';

import { GameStateProvider } from './hooks/GameStateContext';

function App() {
  return (
    <GameStateProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/desafio/:id" element={<Challenge />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </GameStateProvider>
  );
}

export default App;
