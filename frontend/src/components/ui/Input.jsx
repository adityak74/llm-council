import React from 'react';
import './Input.css';

const Input = React.forwardRef(({ className = '', ...props }, ref) => {
    return (
        <input
            className={`ui-input ${className}`}
            ref={ref}
            {...props}
        />
    );
});

Input.displayName = 'Input';

export { Input };
