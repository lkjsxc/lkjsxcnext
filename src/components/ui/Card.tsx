import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // Add any specific card props here if needed
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export { Card };