import React from 'react';

function Button({ text, onClick, className = '', variant = 'primary', isLoading = false, ...props }) {
  const vClass = variant === 'primary' ? 'button--primary'
               : variant === 'ghost'   ? 'button--ghost'
               : '';

  return (
    <button
      className={`button ${vClass} ${className}`}
      onClick={onClick}
      disabled={isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? 'Please wait…' : text}
    </button>
  );
}

export default Button;
