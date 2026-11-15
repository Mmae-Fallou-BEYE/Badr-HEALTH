// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { CrewAccessPage, readCrewAccessSession } from '../features/access/CrewAccessPage';
import { useAppStore } from '../data/store';
import { OverviewPage } from '../features/overview/OverviewPage';
import { BodyMapPage } from '../features/body-map/BodyMapPage';
import { VitalsPage } from '../features/vitals/VitalsPage';
import { HazardsPage } from '../features/hazards/HazardsPage';
import { MissionPage } from '../features/mission/MissionPage';
import { GuidesPage } from '../features/guides/GuidesPage';
import { AlertsPage } from '../features/alerts/AlertsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { AssistantPage } from '../features/assistant/AssistantPage';

export const AppRoutes: React.FC = () => {
  useLocation();
  const session = readCrewAccessSession();
  const switchAstronaut = useAppStore((state) => state.switchAstronaut);
  const setEnvironment = useAppStore((state) => state.setEnvironment);

  useEffect(() => {
    if (session) {
      switchAstronaut(session.crewId);
      setEnvironment(session.environment);
    }
  }, [session?.crewId, session?.environment, setEnvironment, switchAstronaut]);

  return (
    <Routes>
      <Route
        path="/access"
        element={session ? <Navigate to="/" replace /> : <CrewAccessPage />}
      />
      <Route
        element={session ? <Outlet /> : <Navigate to="/access" replace />}
      >
        <Route path="/" element={<Layout />}>
        <Route index element={<OverviewPage />} />
        <Route path="body-map" element={<BodyMapPage />} />
        <Route path="vitals" element={<VitalsPage />} />
        <Route path="hazards" element={<HazardsPage />} />
        <Route path="mission" element={<MissionPage />} />
        <Route path="guides" element={<GuidesPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
