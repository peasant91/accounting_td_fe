import styles from './Input.module.css';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className = '', id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

        return (
            <div className={styles.wrapper}>
                {label && (
                    <label htmlFor={inputId} className={styles.label}>
                        {label}
                        {props.required && <span className={styles.required}>*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`${styles.input} ${error ? styles.error : ''} ${className}`}
                    {...props}
                />
                {hint && !error && <span className={styles.hint}>{hint}</span>}
                {error && <span className={styles.errorText}>{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
