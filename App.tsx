
import React, { useState, useCallback, useMemo } from 'react';
import { FileUploader } from './components/FileUploader';
import { PayrollTable } from './components/PayrollTable';
import { ExportButton } from './components/ExportButton';
import { ClearButton } from './components/ClearButton';
import { Spinner } from './components/Spinner';
import { parsePayrollXml } from './services/xmlParser';
import type { PayrollData } from './types';

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

const App: React.FC = () => {
    const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'FechaInicialPago', direction: 'asc' });
    const [filters, setFilters] = useState<Record<string, string | string[]>>({});

    const handleFiles = useCallback(async (files: FileList) => {
        setIsLoading(true);
        setError(null);
        setPayrollData([]);
        setFilters({}); // Reset filters
        setSortConfig({ key: 'FechaInicialPago', direction: 'asc' });

        const parsingPromises = Array.from(files).map(file => {
            return new Promise<PayrollData>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const xmlString = event.target?.result as string;
                        if (!xmlString) {
                           reject(new Error(`Error al leer el archivo ${file.name}`));
                           return;
                        }
                        const data = parsePayrollXml(xmlString, file.name);
                        resolve(data);
                    } catch (e) {
                        if (e instanceof Error) {
                             reject(new Error(`Error al procesar ${file.name}: ${e.message}`));
                        } else {
                             reject(new Error(`Error desconocido al procesar ${file.name}`));
                        }
                    }
                };
                reader.onerror = () => reject(new Error(`No se pudo leer el archivo ${file.name}`));
                reader.readAsText(file);
            });
        });

        try {
            const results = await Promise.allSettled(parsingPromises);
            const successfulData: PayrollData[] = [];
            let firstError: string | null = null;
            
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    successfulData.push(result.value);
                } else {
                    if (!firstError) {
                        firstError = result.reason.message;
                    }
                    console.error(result.reason);
                }
            });
            
            setPayrollData(successfulData);

            if (firstError) {
                setError(firstError + ". Algunos archivos no pudieron ser procesados.");
            }

        } catch (e) {
            console.error(e);
            setError('Ocurrió un error inesperado al procesar los archivos.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSort = useCallback((key: string) => {
        setSortConfig(currentConfig => {
            let direction: 'asc' | 'desc' = 'asc';
            if (currentConfig.key === key && currentConfig.direction === 'asc') {
                direction = 'desc';
            }
            return { key, direction };
        });
    }, []);

    const handleFilterChange = useCallback((key: string, value: string | string[]) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [key]: value
        }));
    }, []);
    
    const filteredAndSortedData = useMemo(() => {
        // 1. Filtering
        const filteredData = payrollData.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];

                if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
                    return true;
                }

                const itemValue = item[key];
                if (itemValue === null || itemValue === undefined) {
                    return false;
                }

                if (Array.isArray(filterValue)) {
                    // Handle multi-select date filter
                    return filterValue.includes(String(itemValue));
                } else {
                    // Simple string inclusion check works for text inputs
                    return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
                }
            });
        });
    
        // 2. Sorting (on the filtered data)
        const sortableItems = [...filteredData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                let comparison = 0;
                const isDateColumn = sortConfig.key.toLowerCase().includes('fecha');
                if (isDateColumn) {
                    const dateA = new Date(aValue).getTime();
                    const dateB = new Date(bValue).getTime();
                    if (!isNaN(dateA) && !isNaN(dateB)) {
                        comparison = dateA - dateB;
                    }
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                     comparison = aValue - bValue;
                } else {
                    comparison = String(aValue).localeCompare(String(bValue));
                }

                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [payrollData, sortConfig, filters]);

    const handleClear = useCallback(() => {
        setPayrollData([]);
        setError(null);
        setFilters({});
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-white to-indigo-100 font-sans text-slate-800">
            <main className="px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-indigo-900">Lector de Nómina XML</h1>
                    <p className="text-lg text-slate-600 mt-2 max-w-2xl mx-auto">
                        Extrae y organiza fácilmente los datos de tus recibos de nómina.
                    </p>
                </header>

                <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
                    <FileUploader onFilesSelected={handleFiles} disabled={isLoading} />

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center my-12">
                            <Spinner />
                            <p className="mt-4 text-slate-600 font-medium">Procesando archivos...</p>
                        </div>
                    )}
                    
                    {error && (
                         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-6 rounded-md" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {!isLoading && payrollData.length > 0 && (
                        <div className="mt-8">
                           <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                             <h2 className="text-2xl font-semibold text-slate-800">Datos Extraídos</h2>
                             <div className="flex items-center gap-2">
                                <ClearButton onClick={handleClear} />
                                <ExportButton data={filteredAndSortedData} />
                             </div>
                           </div>
                           <PayrollTable 
                                data={payrollData} // Pass original data to table for unique date calculation
                                filteredData={filteredAndSortedData}
                                onSort={handleSort}
                                sortConfig={sortConfig}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                           />
                        </div>
                    )}

                     {!isLoading && payrollData.length === 0 && !error && (
                        <div className="text-center my-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-slate-800">Listo para empezar</h3>
                            <p className="mt-1 text-slate-500">Sube uno o más archivos XML para ver los datos aquí.</p>
                        </div>
                     )}
                </div>
                <footer className="text-center mt-8 text-slate-500 text-sm">
                    <p>Creado con ❤️ para simplificar la gestión de nóminas.</p>
                </footer>
            </main>
        </div>
    );
};

export default App;