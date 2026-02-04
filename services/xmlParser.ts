
import type { PayrollData } from '../types';

export const parsePayrollXml = (xmlString: string, fileName: string): PayrollData => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    
    const errorNode = xmlDoc.querySelector('parsererror');
    if (errorNode) {
        throw new Error('El archivo no es un XML válido.');
    }

    const getAttr = (selector: string, attr: string): string => {
        const element = xmlDoc.querySelector(selector);
        return element?.getAttribute(attr) || '';
    };
    
    const parseToNumber = (value: string | null): number => {
        if (value === null || value === '') return 0;
        const number = parseFloat(value);
        return isNaN(number) ? 0 : number;
    }

    const timbreSelector = 'tfd\\:TimbreFiscalDigital, TimbreFiscalDigital';
    if (!xmlDoc.querySelector(timbreSelector)) {
        throw new Error('El archivo no parece ser un CFDI válido. Falta el Timbre Fiscal Digital.');
    }
    
    const fechaTimbradoCompleta = getAttr(timbreSelector, 'FechaTimbrado');

    const data: PayrollData = {
        fileName,
        uuid: getAttr(timbreSelector, 'UUID'),
        'UUID': getAttr(timbreSelector, 'UUID'),
        'FechaTimbrado': fechaTimbradoCompleta ? fechaTimbradoCompleta.split('T')[0] : '',
        'FechaInicialPago': getAttr('nomina12\\:Nomina, Nomina', 'FechaInicialPago'),
        'FechaFinalPago': getAttr('nomina12\\:Nomina, Nomina', 'FechaFinalPago'),
        'FechaPago': getAttr('nomina12\\:Nomina, Nomina', 'FechaPago'),
        'Rfc Receptor': getAttr('cfdi\\:Receptor, Receptor', 'Rfc'),
        'Nombre Receptor': getAttr('cfdi\\:Receptor, Receptor', 'Nombre'),
        'TipoNomina': getAttr('nomina12\\:Nomina, Nomina', 'TipoNomina'),
        'TotalPercepciones': parseToNumber(getAttr('nomina12\\:Nomina, Nomina', 'TotalPercepciones')),
        'TotalDeducciones': parseToNumber(getAttr('nomina12\\:Nomina, Nomina', 'TotalDeducciones')),
        'TotalOtrosPagos': parseToNumber(getAttr('nomina12\\:Nomina, Nomina', 'TotalOtrosPagos')),
        'NumDiasPagados': parseToNumber(getAttr('nomina12\\:Nomina, Nomina', 'NumDiasPagados')),
        'TipoDeComprobante': getAttr('cfdi\\:Comprobante, Comprobante', 'TipoDeComprobante'),
        'Version': getAttr('cfdi\\:Comprobante, Comprobante', 'Version'),
        'Total': parseToNumber(getAttr('cfdi\\:Comprobante, Comprobante', 'Total')),
    };

    // Procesar Percepciones
    const percepciones = xmlDoc.querySelectorAll('nomina12\\:Percepcion, Percepcion');
    percepciones.forEach(p => {
        const tipo = p.getAttribute('TipoPercepcion');
        const concepto = p.getAttribute('Concepto');
        const gravado = parseToNumber(p.getAttribute('ImporteGravado'));
        const exento = parseToNumber(p.getAttribute('ImporteExento'));
        if (tipo && concepto) {
            data[`${tipo} ${concepto} ImporteGravado`] = gravado;
            data[`${tipo} ${concepto} ImporteExento`] = exento;
        }
    });

    // Procesar Deducciones
    const deducciones = xmlDoc.querySelectorAll('nomina12\\:Deduccion, Deduccion');
    deducciones.forEach(d => {
        const tipo = d.getAttribute('TipoDeduccion');
        const concepto = d.getAttribute('Concepto');
        const importe = parseToNumber(d.getAttribute('Importe'));
        if (tipo && concepto) {
            // Se añade prefijo para ordenar y distinguir
            data[`D-${tipo} ${concepto}`] = importe;
        }
    });
    
    // Procesar Otros Pagos
    const otrosPagos = xmlDoc.querySelectorAll('nomina12\\:OtroPago, OtroPago');
    otrosPagos.forEach(o => {
        const tipo = o.getAttribute('TipoOtroPago');
        const concepto = o.getAttribute('Concepto');
        const importe = parseToNumber(o.getAttribute('Importe'));
        if (tipo && concepto) {
            // Se añade prefijo para ordenar y distinguir
            data[`O-${tipo} ${concepto}`] = importe;
        }
    });

    return data;
};
