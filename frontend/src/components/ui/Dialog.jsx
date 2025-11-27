import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import './Dialog.css';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef(({ children, title, description, className, ...props }, ref) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="DialogOverlay" />
        <DialogPrimitive.Content className={`DialogContent ${className || ''}`} {...props} ref={ref}>
            {title && <DialogPrimitive.Title className="DialogTitle">{title}</DialogPrimitive.Title>}
            {description && <DialogPrimitive.Description className="DialogDescription">{description}</DialogPrimitive.Description>}
            {children}
            <DialogPrimitive.Close className="DialogClose" aria-label="Close">
                ×
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
));

DialogContent.displayName = 'DialogContent';
