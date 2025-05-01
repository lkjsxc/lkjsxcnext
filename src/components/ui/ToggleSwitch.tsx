import React from 'react';

interface ToggleSwitchProps {
  isOn: boolean;
  handleToggle: () => void;
  label?: string;
  className?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, handleToggle, label, className }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {label && <span className="mr-2 text-gray-700">{label}</span>}
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isOn ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        onClick={handleToggle}
        role="switch"
        aria-checked={isOn}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isOn ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export { ToggleSwitch };