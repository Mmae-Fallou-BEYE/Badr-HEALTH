// Generated with AI assistance (Antigravity). Reviewed by the team.
import React, { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { repository } from '../data/repository';
import { useAppStore } from '../data/store';

export const App: React.FC = () => {
  const astronautId = useAppStore((state) => state.astronaut.id);
  const initializeRemoteData = useAppStore((state) => state.initializeRemoteData);
  const receiveRemoteReading = useAppStore((state) => state.receiveRemoteReading);
  const receiveRemoteAlert = useAppStore((state) => state.receiveRemoteAlert);

  useEffect(() => {
    if (!repository.isRemote()) return;

    let active = true;
    void initializeRemoteData(astronautId);
    const unsubscribe = repository.subscribe(
      astronautId,
      (reading) => {
        if (active) receiveRemoteReading(reading);
      },
      (alert) => {
        if (active) receiveRemoteAlert(alert);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [astronautId, initializeRemoteData, receiveRemoteAlert, receiveRemoteReading]);

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
};

export default App;
