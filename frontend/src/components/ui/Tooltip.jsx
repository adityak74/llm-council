import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import './Tooltip.css';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef(({ children, className, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content className={`TooltipContent ${className || ''}`} sideOffset={5} {...props} ref={ref}>
            {children}
            <TooltipPrimitive.Arrow className="TooltipArrow" />
        </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';
