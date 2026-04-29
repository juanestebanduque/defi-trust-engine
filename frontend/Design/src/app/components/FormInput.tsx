import { forwardRef, InputHTMLAttributes } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Label } from './ui/label';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  helperText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, success, helperText, className = '', ...props }, ref) => {
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    return (
      <div className="space-y-1.5">
        <Label htmlFor={props.id} className="text-sm font-medium text-gray-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </Label>

        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full px-3 py-2 rounded-lg border transition-all text-sm
              bg-slate-700 text-white placeholder:text-gray-500
              ${hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
                : hasSuccess
                ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30'
                : 'border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
              }
              ${props.disabled ? 'bg-slate-600 cursor-not-allowed opacity-50' : ''}
              outline-none
              ${className}
            `}
            {...props}
          />

          {(hasError || hasSuccess) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {hasError ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
