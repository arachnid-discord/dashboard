import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { getToken } from "./lib/auth";
import { LoadingScreen } from "./components/ui";

import Login from "./pages/Login";
import Callback from "./pages/Callback";
import GuildPicker from "./pages/GuildPicker";
import DashboardLayout from "./pages/DashboardLayout";
import Overview from "./pages/Overview";
import Moderation from "./pages/Moderation";
import Music from "./pages/Music";
import SettingsPage from "./pages/SettingsPage";
import General from "./pages/General";

function RequireAuth({ children }) {
  const { loading, user } = useAuth();
  if (!getToken()) return <Navigate to="/login" replace />;
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Callback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route
            path="/guilds"
            element={
              <RequireAuth>
                <GuildPicker />
              </RequireAuth>
            }
          />
          <Route
            path="/g/:guildId"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="moderation" element={<Moderation />} />
            <Route path="music" element={<Music />} />
            <Route path="settings/:section" element={<SettingsPage />} />
            <Route path="general" element={<General />} />
          </Route>
          <Route path="*" element={<Navigate to="/guilds" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
