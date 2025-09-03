import React from 'react';
import styles from './ProductForm.module.css';

interface FormFieldProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: string;
  step?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  error,
  options,
  rows,
  min,
  step
}) => {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
        />
      ) : options ? (
        <select
          value={value}
          onChange={onChange}
          className={error ? styles.error : ''}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          step={step}
          className={error ? styles.error : ''}
        />
      )}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default FormField;