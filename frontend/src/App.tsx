import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TwinsDirectory from './pages/TwinsDirectory';
import TwinProfile from './pages/TwinProfile';
import ProjectWorkspace from './pages/ProjectWorkspace';
import DecisionMemory from './pages/DecisionMemory';
import ExpertiseSearch from './pages/ExpertiseSearch';
import ReviewerRecommend from './pages/ReviewerRecommend';
import AdminSeed from './pages/AdminSeed';

// Private Route Wrapper
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('twinos_token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Private Layout Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/twins" 
          element={
            <PrivateRoute>
              <TwinsDirectory />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/twins/:id" 
          element={
            <PrivateRoute>
              <TwinProfile />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/projects" 
          element={
            <PrivateRoute>
              <ProjectWorkspace />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/decisions" 
          element={
            <PrivateRoute>
              <DecisionMemory />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/expertise" 
          element={
            <PrivateRoute>
              <ExpertiseSearch />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/reviewers" 
          element={
            <PrivateRoute>
              <ReviewerRecommend />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/seed" 
          element={
            <PrivateRoute>
              <AdminSeed />
            </PrivateRoute>
          } 
        />

        {/* Catch-all fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
