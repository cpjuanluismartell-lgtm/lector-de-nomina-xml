
import React, { useMemo } from 'react';
import type { PayrollData } from '../types';
import { SortIcon } from './icons/SortIcon';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}
interface PayrollTableProps {
    data: PayrollData[]; // All data for calculating unique dates
    filteredData: PayrollData[]; // Data to display
    onSort: (key: string) => void;
    sortConfig: SortConfig;
    filters: Record<string, string | string[]>;
    onFilterChange: (key: string, value: string | string[]) => void;
}

const formatCurrency = (value: number): string => {
    return value.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const PayrollTable: React.FC<PayrollTableProps> = ({ data, filteredData, onSort, sortConfig, filters, onFilterChange }) => {
    
    const { headers, uniqueDates } = useMemo(() => {
        if (data.length === 0) return { headers: [], uniqueDates: {} };
        
        const keySet = new Set<string>();
        data.forEach(row => {
            Object.keys(row).forEach(key => keySet.add(key));
        });

        const allKeys = Array.from(keySet);
        const dateColumns = allKeys.filter(k => k.toLowerCase().includes('fecha'));
        
        const uniqueDates: Record<string, string[]> = {};
        dateColumns.forEach(col => {
            const dates = new Set<string>();
            data.forEach(row => {
                if (row[col]) {
                    dates.add(String(row[col]));
                }
            });
            uniqueDates[col] = Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        });

        const initialFixed = [
            'UUID', 'FechaTimbrado', 'FechaInicialPago', 'FechaFinalPago', 'FechaPago', 
            'Rfc Receptor', 'Nombre Receptor', 'TipoNomina', 'TotalPercepciones', 
            'TotalDeducciones', 'TotalOtrosPagos'
        ];
        const finalFixed = ['NumDiasPagados', 'TipoDeComprobante', 'Version', 'Total'];
        const perceptionKeys = allKeys.filter(k => k.includes('ImporteGravado') || k.includes('ImporteExento')).sort();
        const deductionKeys = allKeys.filter(k => k.startsWith('D-')).sort();
        const otherPaymentKeys = allKeys.filter(k => k.startsWith('O-')).sort();

        const fullHeaderList = [
            ...initialFixed,
            ...perceptionKeys,
            ...deductionKeys,
            ...otherPaymentKeys,
            ...finalFixed,
        ];
        
        const headers = fullHeaderList.filter(k => keySet.has(k));
        return { headers, uniqueDates };

    }, [data]);

    const totals = useMemo(() => {
        const totalsRow: Record<string, number> = {};
        if (filteredData.length === 0) return totalsRow;

        const numericHeaders = headers.filter(header => typeof filteredData[0][header] === 'number');

        numericHeaders.forEach(header => {
            totalsRow[header] = filteredData.reduce((sum, row) => sum + (Number(row[header]) || 0), 0);
        });

        return totalsRow;
    }, [filteredData, headers]);

    const getHeaderLabel = (header: string) => {
        if (header.startsWith('D-') || header.startsWith('O-')) {
            return header.substring(2);
        }
        return header;
    }

    const inputBaseClass = "w-full text-sm border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition";

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow ring-1 ring-black ring-opacity-5">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-600">
                    <tr>
                        {headers.map((header) => {
                            const isNumeric = data.length > 0 && typeof data[0][header] === 'number';
                            return (
                                <th
                                    key={header}
                                    scope="col"
                                    className={`px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider ${isNumeric ? 'text-right' : 'text-left'} select-none align-bottom`}
                                    onClick={() => onSort(header)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={`flex items-center gap-2 ${isNumeric ? 'justify-end' : 'justify-start'}`}>
                                        {getHeaderLabel(header)}
                                        {sortConfig.key === header && (
                                            <SortIcon direction={sortConfig.direction} />
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                    <tr>
                        {headers.map((header) => {
                            const isDateColumn = header.toLowerCase().includes('fecha');
                            return (
                                <th key={`${header}-filter`} className="px-2 py-1 font-normal bg-indigo-50 align-top">
                                    {isDateColumn ? (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <MultiSelectDropdown
                                                options={uniqueDates[header] || []}
                                                selectedOptions={(filters[header] as string[] | undefined) || []}
                                                onChange={(selected) => onFilterChange(header, selected)}
                                                placeholder="Filtrar fechas..."
                                            />
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={(filters[header] as string | undefined) || ''}
                                            onChange={(e) => onFilterChange(header, e.target.value)}
                                            placeholder={`Buscar...`}
                                            className={inputBaseClass}
                                            aria-label={`Filtrar por ${getHeaderLabel(header)}`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                        filteredData.map((row, index) => (
                            <tr key={row.uuid + index} className="hover:bg-indigo-50 transition-colors duration-150">
                                {headers.map(header => {
                                    const cellValue = row[header];
                                    const isNumeric = typeof cellValue === 'number';
                                    const displayValue = isNumeric
                                        ? formatCurrency(cellValue)
                                        : (cellValue !== undefined && cellValue !== null ? String(cellValue) : '');
                                    
                                    return (
                                        <td key={`${header}-${index}`} className={`px-6 py-4 whitespace-nowrap text-sm text-slate-700 ${isNumeric ? 'text-right font-mono' : 'text-left'}`}>
                                           {displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={headers.length} className="text-center py-12 px-6 text-slate-500">
                                No se encontraron resultados que coincidan con los filtros.
                            </td>
                        </tr>
                    )}
                </tbody>
                {filteredData.length > 0 && (
                    <tfoot className="bg-indigo-50">
                        <tr className="border-t-2 border-indigo-200">
                            {headers.map((header, index) => {
                                const totalValue = totals[header];
                                const isNumericTotal = typeof totalValue === 'number';
                                return (
                                    <th 
                                        key={`${header}-total`} 
                                        scope="row"
                                        className={`px-6 py-3 text-sm font-bold text-indigo-900 ${isNumericTotal ? 'text-right font-mono' : 'text-left'}`}
                                    >
                                        {index === 0 ? 'Totales' : isNumericTotal ? formatCurrency(totalValue) : ''}
                                    </th>
                                );
                            })}
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};