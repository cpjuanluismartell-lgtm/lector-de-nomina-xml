
import React from 'react';
import { TrashIcon } from './icons/TrashIcon';

interface ClearButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export const ClearButton: React.FC<ClearButtonProps> = ({ onClick, disabled = false }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Limpiar tabla de datos"
        >
            <TrashIcon className="w-5 h-5 mr-2" />
            Limpiar
        </button>
    );
};