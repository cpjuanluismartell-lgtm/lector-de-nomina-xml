
declare const XLSX: any; // Declare XLSX to be available from the global scope (CDN)

export const exportToExcel = (data: any[], fileName: string) => {
    if (typeof XLSX === 'undefined') {
        console.error("XLSX library is not loaded. Make sure the script tag is in your index.html");
        alert("Error: La funcionalidad de exportación no está disponible.");
        return;
    }

    if (data.length === 0) return;

    // --- 1. OBTENER Y ORDENAR CABECERAS ---
    const keySet = new Set<string>();
    data.forEach(row => {
        Object.keys(row).forEach(key => keySet.add(key));
    });

    const allKeys = Array.from(keySet);
    const initialFixed = [
        'UUID', 'FechaTimbrado', 'FechaInicialPago', 'FechaFinalPago', 'FechaPago',
        'Rfc Receptor', 'Nombre Receptor', 'TipoNomina', 'TotalPercepciones',
        'TotalDeducciones', 'TotalOtrosPagos'
    ];
    const finalFixed = ['NumDiasPagados', 'TipoDeComprobante', 'Version', 'Total'];
    const perceptionKeys = allKeys.filter(k => k.includes('ImporteGravado') || k.includes('ImporteExento')).sort();
    const deductionKeys = allKeys.filter(k => k.startsWith('D-')).sort();
    const otherPaymentKeys = allKeys.filter(k => k.startsWith('O-')).sort();

    const orderedHeaders = [
        ...initialFixed,
        ...perceptionKeys,
        ...deductionKeys,
        ...otherPaymentKeys,
        ...finalFixed,
    ].filter(k => keySet.has(k));

    // --- 2. PREPARAR DATOS Y CABECERAS LIMPIAS ---
    const cleanHeaders = orderedHeaders.map(header =>
        header.startsWith('D-') || header.startsWith('O-') ? header.substring(2) : header
    );

    const dataForSheet = data.map(row => {
        const newRow: Record<string, any> = {};
        orderedHeaders.forEach((header, index) => {
            newRow[cleanHeaders[index]] = row[header];
        });
        return newRow;
    });

    // --- 3. CREAR HOJA DE CÁLCULO ---
    const worksheet = XLSX.utils.json_to_sheet(dataForSheet, { header: cleanHeaders });

    // --- 4. APLICAR ESTILOS Y FORMATOS ---
    const headerStyle = {
        fill: { fgColor: { rgb: "FF4F46E5" } }, // Indigo
        font: { color: { rgb: "FFFFFFFF" }, bold: true },
        alignment: { horizontal: "center", vertical: "center" }
    };
    const currencyFormat = '#,##0.00';

    // Identificar columnas numéricas
    const numericKeys = new Set<string>();
    orderedHeaders.forEach(header => {
        const firstRowWithValue = data.find(row => row[header] !== null && row[header] !== undefined);
        if (firstRowWithValue && typeof firstRowWithValue[header] === 'number') {
            numericKeys.add(header);
        }
    });

    const numericColumnIndexes = new Set<number>(
        orderedHeaders.map((h, i) => numericKeys.has(h) ? i : -1).filter(i => i !== -1)
    );

    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellAddress];
            if (!cell) continue;

            // Fila de cabecera
            if (R === 0) {
                cell.s = headerStyle;
                continue;
            }

            // Filas de datos
            const isNumericCell = numericColumnIndexes.has(C) && typeof cell.v === 'number';
            if (isNumericCell) {
                cell.t = 'n'; // Asegurar que el tipo de celda es numérico
                cell.s = { num_fmt: currencyFormat }; // Aplicar formato de moneda
            }
        }
    }

    // --- 5. AJUSTAR ANCHO DE COLUMNAS ---
    const colWidths = cleanHeaders.map(header => {
        const maxWidth = Math.max(
            header.length,
            ...dataForSheet.map(row => {
                const value = row[header];
                if (typeof value === 'number') {
                    return value.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).length;
                }
                return String(value || '').length;
            })
        );
        return { wch: Math.min(maxWidth + 2, 60) };
    });
    worksheet['!cols'] = colWidths;

    // --- 6. GENERAR Y DESCARGAR ARCHIVO ---
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nóminas');
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};