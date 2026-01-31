/**
 * @file Index - App entry redirect
 * @description Redirects to appropriate screen based on auth state
 */

import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Loading } from '@/components/ui';

export default function Index() {
  const { isAuthenticated, isLocked, isInitialized, hasMasterPassword, initialize } = useAuthStore();

  // Initialize auth store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Show loading while initializing
  if (!isInitialized) {
    return <Loading fullScreen message="Loading..." />;
  }

  // Redirect based on auth state
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // User is authenticated but hasn't set Master Password yet
  if (!hasMasterPassword) {
    return <Redirect href="/(auth)/set-master-password" />;
  }

  // User has Master Password but vault is locked
  if (isLocked) {
    return <Redirect href="/(auth)/unlock" />;
  }

  return <Redirect href="/(tabs)/vault" />;
}
