import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import './Avatar.css';

export const Avatar = React.forwardRef(({ className, ...props }, ref) => (
    <AvatarPrimitive.Root className={`AvatarRoot ${className || ''}`} {...props} ref={ref} />
));
Avatar.displayName = 'Avatar';

export const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image className={`AvatarImage ${className || ''}`} {...props} ref={ref} />
));
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback className={`AvatarFallback ${className || ''}`} {...props} ref={ref} />
));
AvatarFallback.displayName = 'AvatarFallback';
