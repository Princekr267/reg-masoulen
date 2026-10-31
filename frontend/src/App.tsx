import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/Landing';
import RegisterPage from './pages/Register';
import RulesPage from './pages/Rules';
import StatusPage from './pages/Status';
import AdminPage from './pages/Admin';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
