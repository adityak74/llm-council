import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import './Tabs.css';

export const Tabs = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.Root className={`TabsRoot ${className || ''}`} {...props} ref={ref} />
));
Tabs.displayName = 'Tabs';

export const TabsList = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.List className={`TabsList ${className || ''}`} {...props} ref={ref} />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger className={`TabsTrigger ${className || ''}`} {...props} ref={ref} />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.Content className={`TabsContent ${className || ''}`} {...props} ref={ref} />
));
TabsContent.displayName = 'TabsContent';
