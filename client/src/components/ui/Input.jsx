import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, helper, error, className = "", id, ...props },
  ref
) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <input ref={ref} id={id} className="input" {...props} />
      {error ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : helper ? (
        <p className="helper">{helper}</p>
      ) : null}
    </div>
  );
});

export default Input;
