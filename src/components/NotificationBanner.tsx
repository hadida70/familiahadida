import React from 'react';
import { PushNotification } from '../types';

interface NotificationBannerProps {
  recentToast?: PushNotification | null;
  onClearToast?: () => void;
  pushPermission?: NotificationPermission;
  onRequestPermission?: () => Promise<NotificationPermission>;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = () => {
  // Completely removed floating black popup banner
  return null;
};
