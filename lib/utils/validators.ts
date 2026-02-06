// Form validation helpers

export interface ValidationResult {
    valid: boolean;
    message?: string;
}

/**
 * Validate email format.
 */
export function validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        return { valid: false, message: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
}

/**
 * Validate required field.
 */
export function validateRequired(value: string | undefined, fieldName: string): ValidationResult {
    if (!value || value.trim() === '') {
        return { valid: false, message: `${fieldName} is required` };
    }
    return { valid: true };
}

/**
 * Validate max length.
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
    if (value.length > maxLength) {
        return { valid: false, message: `${fieldName} must be ${maxLength} characters or less` };
    }
    return { valid: true };
}

/**
 * Validate positive number.
 */
export function validatePositiveNumber(value: number, fieldName: string): ValidationResult {
    if (isNaN(value) || value <= 0) {
        return { valid: false, message: `${fieldName} must be a positive number` };
    }
    return { valid: true };
}

/**
 * Validate date is not in the past.
 */
export function validateFutureDate(dateString: string, fieldName: string): ValidationResult {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
        return { valid: false, message: `${fieldName} cannot be in the past` };
    }
    return { valid: true };
}
