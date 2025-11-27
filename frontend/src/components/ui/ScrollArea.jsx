import React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import './ScrollArea.css';

export const ScrollArea = React.forwardRef(({ children, className, ...props }, ref) => (
    <ScrollAreaPrimitive.Root className={`ScrollAreaRoot ${className || ''}`} {...props} ref={ref}>
        <ScrollAreaPrimitive.Viewport className="ScrollAreaViewport">
            {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar className="ScrollAreaScrollbar" orientation="vertical">
            <ScrollAreaPrimitive.Thumb className="ScrollAreaThumb" />
        </ScrollAreaPrimitive.Scrollbar>
        <ScrollAreaPrimitive.Scrollbar className="ScrollAreaScrollbar" orientation="horizontal">
            <ScrollAreaPrimitive.Thumb className="ScrollAreaThumb" />
        </ScrollAreaPrimitive.Scrollbar>
        <ScrollAreaPrimitive.Corner className="ScrollAreaCorner" />
    </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = 'ScrollArea';
