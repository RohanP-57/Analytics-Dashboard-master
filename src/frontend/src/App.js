import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './pages/Dashboard';
import Features from './pages/Features';
import Upload from './pages/Upload';
import MapView from './pages/MapView';
import TableView from './pages/TableView';
import Profile from './pages/Profile';
import VideoLinks from './pages/VideoLinks';
import Sites from './pages/Sites';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-6">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/features" element={
                <ProtectedRoute>
                  <Features />
                </ProtectedRoute>
              } />
              <Route path="/upload" element={
                <ProtectedRoute>
                  <AdminRoute>
                    <Upload />
                  </AdminRoute>
                </ProtectedRoute>
              } />
              <Route path="/map" element={
                <ProtectedRoute>
                  <MapView />
                </ProtectedRoute>
              } />
              <Route path="/table" element={
                <ProtectedRoute>
                  <TableView />
                </ProtectedRoute>
              } />
              <Route path="/video-links" element={
                <ProtectedRoute>
                  <VideoLinks />
                </ProtectedRoute>
              } />
              <Route path="/sites" element={
                <ProtectedRoute>
                  <Sites />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <AdminRoute>
                    <Profile />
                  </AdminRoute>
                </ProtectedRoute>
              } />
              
              {/* Redirect any unknown routes to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 