import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import './Switch.css';

export const Switch = React.forwardRef(({ className, ...props }, ref) => (
    <SwitchPrimitive.Root className={`SwitchRoot ${className || ''}`} {...props} ref={ref}>
        <SwitchPrimitive.Thumb className="SwitchThumb" />
    </SwitchPrimitive.Root>
));

Switch.displayName = 'Switch';
