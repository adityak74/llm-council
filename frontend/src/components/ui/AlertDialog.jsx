import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import './AlertDialog.css';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export const AlertDialogContent = React.forwardRef(({ children, className, ...props }, ref) => (
    <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="AlertDialogOverlay" />
        <AlertDialogPrimitive.Content className={`AlertDialogContent ${className || ''}`} {...props} ref={ref}>
            {children}
        </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = 'AlertDialogContent';

export const AlertDialogHeader = ({ className, ...props }) => (
    <div className={`AlertDialogHeader ${className || ''}`} {...props} />
);

export const AlertDialogFooter = ({ className, ...props }) => (
    <div className={`AlertDialogFooter ${className || ''}`} {...props} />
);

export const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Title className={`AlertDialogTitle ${className || ''}`} {...props} ref={ref} />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Description className={`AlertDialogDescription ${className || ''}`} {...props} ref={ref} />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

export const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Action className={`AlertDialogAction ${className || ''}`} {...props} ref={ref} />
));
AlertDialogAction.displayName = 'AlertDialogAction';

export const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Cancel className={`AlertDialogCancel ${className || ''}`} {...props} ref={ref} />
));
AlertDialogCancel.displayName = 'AlertDialogCancel';
