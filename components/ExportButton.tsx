
import React from 'react';
import { exportToExcel } from '../services/excelExporter';
import type { PayrollData } from '../types';
import { ExcelIcon } from './icons/ExcelIcon';

interface ExportButtonProps {
    data: PayrollData[];
    fileName?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, fileName = 'datos_nomina' }) => {
    
    const handleExport = () => {
        // Los datos ya están listos para ser exportados, sin necesidad de mapeo.
        exportToExcel(data, fileName);
    };

    return (
        <button
            onClick={handleExport}
            disabled={data.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
            <ExcelIcon className="w-5 h-5 mr-2" />
            Exportar a Excel
        </button>
    );
};