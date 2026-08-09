import React, { useEffect, useState } from 'react';
import { SafeAreaView, ActivityIndicator } from 'react-native';
import { initSchema } from './db/sqlite';
import { getCurrentUser, onAuthStateChange } from './services/authService';
import { fullSync, watchConnectivityAndSync } from './sync/syncManager';
import { requestNotificationPermission } from './notifications/notificationService';
import AppNavigator from './navigation/AppNavigator';
import type { AuthUser } from './types';

export default function App() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined); // undefined = still loading
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initSchema();
      await requestNotificationPermission();
      const current = await getCurrentUser();
      setUser(current);
      setReady(true);
    })();

    const unsubscribeAuth = onAuthStateChange(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) await fullSync(nextUser.id);
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribeConnectivity = watchConnectivityAndSync(user.id);
    return unsubscribeConnectivity;
  }, [user?.id]);

  if (!ready || user === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return <AppNavigator isAuthenticated={!!user} />;
}
