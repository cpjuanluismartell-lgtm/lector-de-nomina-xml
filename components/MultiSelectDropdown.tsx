
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckIcon } from './icons/CheckIcon';

interface MultiSelectDropdownProps {
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedOptions,
  onChange,
  placeholder = 'Seleccionar...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleOptionToggle = (option: string) => {
    const newSelection = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option];
    onChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedOptions.length === options.length) {
      onChange([]); // Deselect all
    } else {
      onChange(options); // Select all
    }
  };

  const getButtonLabel = () => {
    if (selectedOptions.length === 0) return placeholder;
    if (selectedOptions.length === options.length) return 'Todas las fechas';
    if (selectedOptions.length === 1) return selectedOptions[0];
    return `${selectedOptions.length} fechas seleccionadas`;
  };

  const isAllSelected = selectedOptions.length === options.length && options.length > 0;

  return (
    <div className="relative w-full text-sm" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left bg-white border border-slate-300 rounded-md shadow-sm pl-3 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate">{getButtonLabel()}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          <div
            className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-slate-900 hover:bg-indigo-100"
            onClick={handleSelectAll}
          >
            <div className="flex items-center">
              <span
                className={`flex items-center justify-center h-5 w-5 border rounded ${
                  isAllSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                }`}
              >
                {isAllSelected && <CheckIcon className="h-4 w-4 text-white" />}
              </span>
              <span className="font-semibold ml-3 block truncate">
                {isAllSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </span>
            </div>
          </div>

          {options.map((option) => {
            const isSelected = selectedOptions.includes(option);
            return (
              <div
                key={option}
                onClick={() => handleOptionToggle(option)}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-slate-900 hover:bg-indigo-100"
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-center">
                  <span
                    className={`flex items-center justify-center h-5 w-5 border rounded ${
                      isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <CheckIcon className="h-4 w-4 text-white" />}
                  </span>
                  <span className="font-normal ml-3 block truncate">{option}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};