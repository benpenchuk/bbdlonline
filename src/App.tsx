import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import GamesPageESPN from './pages/GamesPageESPN';
import PlayersPage from './pages/PlayersPage';
import StatsPage from './pages/StatsPage';
import StandingsPage from './pages/StandingsPage';
import TeamPage from './pages/TeamPage';
import PlayoffsPage from './pages/PlayoffsPage';
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
                <Route path="/standings" element={<StandingsPage />} />
                <Route path="/team/:id" element={<TeamPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/playoffs" element={<PlayoffsPage />} />
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
