import React from 'react';
import { getAvatarById } from '../../utils/avatars';

interface UserAvatarProps {
  avatarId?: string | null;
  userName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7.5 h-7.5 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarId,
  userName,
  size = 'md',
  className = '',
  showBorder = false,
}) => {
  const initial = userName?.trim() ? userName.trim().charAt(0).toUpperCase() : 'U';
  const sizeClasses = sizeMap[size] || sizeMap.md;

  // If avatarId is explicitly 'initial', or not provided and no default, render initial
  if (avatarId === 'initial') {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-primary/15 text-primary dark:text-primary-light font-bold flex items-center justify-center select-none shrink-0 ${
          showBorder ? 'border border-primary/25 shadow-xs' : ''
        } ${className}`}
      >
        {initial}
      </div>
    );
  }

  const avatar = getAvatarById(avatarId);

  return (
    <div
      className={`${sizeClasses} rounded-xl overflow-hidden shrink-0 select-none flex items-center justify-center ${
        showBorder ? 'ring-2 ring-slate-200 dark:ring-slate-700/80 shadow-xs' : ''
      } ${className}`}
    >
      {avatar.render('w-full h-full')}
    </div>
  );
};

export default UserAvatar;

