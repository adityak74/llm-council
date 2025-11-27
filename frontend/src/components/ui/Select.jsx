import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import './Select.css';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef(({ children, className, ...props }, ref) => (
    <SelectPrimitive.Trigger className={`SelectTrigger ${className || ''}`} {...props} ref={ref}>
        {children}
        <SelectPrimitive.Icon className="SelectIcon">
            ▼
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = React.forwardRef(({ children, className, ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content className={`SelectContent ${className || ''}`} {...props} ref={ref}>
            <SelectPrimitive.Viewport className="SelectViewport">
                {children}
            </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef(({ children, className, ...props }, ref) => (
    <SelectPrimitive.Item className={`SelectItem ${className || ''}`} {...props} ref={ref}>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="SelectItemIndicator">
            ✓
        </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';
