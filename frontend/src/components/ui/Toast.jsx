import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import './Toast.css';

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitive.Viewport className={`ToastViewport ${className || ''}`} {...props} ref={ref} />
));
ToastViewport.displayName = 'ToastViewport';

export const Toast = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitive.Root className={`ToastRoot ${className || ''}`} {...props} ref={ref} />
));
Toast.displayName = 'Toast';

export const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitive.Title className={`ToastTitle ${className || ''}`} {...props} ref={ref} />
));
ToastTitle.displayName = 'ToastTitle';

export const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitive.Description className={`ToastDescription ${className || ''}`} {...props} ref={ref} />
));
ToastDescription.displayName = 'ToastDescription';

export const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitive.Action className={`ToastAction ${className || ''}`} {...props} ref={ref} />
));
ToastAction.displayName = 'ToastAction';

export const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitive.Close className={`ToastClose ${className || ''}`} {...props} ref={ref} />
));
ToastClose.displayName = 'ToastClose';

// Hook for easier usage
export function useToast() {
    const [open, setOpen] = React.useState(false);
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [type, setType] = React.useState('info'); // info, success, error

    const toast = ({ title, description, type = 'info' }) => {
        setTitle(title);
        setDescription(description);
        setType(type);
        setOpen(true);
    };

    return {
        toast,
        ToastComponent: (
            <Toast open={open} onOpenChange={setOpen} className={`ToastRoot ${type}`}>
                <div className="ToastContent">
                    {title && <ToastTitle>{title}</ToastTitle>}
                    {description && <ToastDescription>{description}</ToastDescription>}
                </div>
                <ToastClose aria-label="Close">
                    <span aria-hidden>×</span>
                </ToastClose>
            </Toast>
        ),
    };
}
