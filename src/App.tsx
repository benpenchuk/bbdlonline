import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import GamesPageESPN from './pages/GamesPageESPN';
import PlayersPage from './pages/PlayersPage';
import StatsPage from './pages/StatsPage';
import TournamentPage from './pages/TournamentPage';
import AdminPage from './pages/AdminPage';
import ContactPage from './pages/ContactPage';
import { AppProvider, DataProvider, AuthProvider } from './state';
import './App.css';

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/games" element={<GamesPageESPN />} />
                <Route path="/players" element={<PlayersPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/tournament" element={<TournamentPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Routes>
            </Layout>
          </Router>
        </DataProvider>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
