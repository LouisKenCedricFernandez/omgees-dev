// eto gagamitin na props para ma-log natin mga activities bawat user
import { useState, useCallback } from 'react';

export const useActivityLogger = (currentUser) => {
  const [activities, setActivities] = useState([]);
  
  const logActivity = useCallback((activity) => {
    const newActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'System',
      userType: currentUser?.type || 'system',
      ...activity
    };
    
    setActivities(prev => [newActivity, ...prev.slice(0, 99)]);
  }, [currentUser]);
  
  return { activities, logActivity };
};