import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { AVATAR_OPTIONS, getAvatarById, type AvatarOption } from '../utils/avatars';

interface AvatarContextType {
  avatarId: string;
  setAvatar: (avatarId: string) => void;
  activeAvatar: AvatarOption;
  availableAvatars: AvatarOption[];
}

const AvatarContext = createContext<AvatarContextType>({
  avatarId: 'sprout',
  setAvatar: () => {},
  activeAvatar: AVATAR_OPTIONS[0],
  availableAvatars: AVATAR_OPTIONS,
});

const DEFAULT_AVATAR_ID = 'sprout';

export const AvatarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const getStorageKey = useCallback((userId?: string) => {
    return userId ? `habitflow_avatar_${userId}` : 'habitflow_avatar_guest';
  }, []);

  const [avatarId, setAvatarIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(user?.id));
      return stored || DEFAULT_AVATAR_ID;
    } catch {
      return DEFAULT_AVATAR_ID;
    }
  });

  // Keep avatar in sync when user logs in or switches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(user?.id));
      setAvatarIdState(stored || DEFAULT_AVATAR_ID);
    } catch {
      setAvatarIdState(DEFAULT_AVATAR_ID);
    }
  }, [user?.id, getStorageKey]);

  const setAvatar = useCallback(
    (newAvatarId: string) => {
      setAvatarIdState(newAvatarId);
      try {
        localStorage.setItem(getStorageKey(user?.id), newAvatarId);
        window.dispatchEvent(
          new CustomEvent('habitflow:avatar_updated', {
            detail: { userId: user?.id, avatarId: newAvatarId },
          })
        );
      } catch (err) {
        console.error('Failed to save avatar preference in localStorage:', err);
      }
    },
    [user?.id, getStorageKey]
  );

  const activeAvatar = useMemo(() => getAvatarById(avatarId), [avatarId]);

  return (
    <AvatarContext.Provider
      value={{
        avatarId,
        setAvatar,
        activeAvatar,
        availableAvatars: AVATAR_OPTIONS,
      }}
    >
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => useContext(AvatarContext);

