
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploaderProps {
    onFilesSelected: (files: FileList) => void;
    disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, disabled = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if(!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            if (fileInputRef.current) {
                fileInputRef.current.files = files;
            }
            onFilesSelected(files);
        }
    }, [onFilesSelected, disabled]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFilesSelected(files);
        }
    };
    
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const dragClass = isDragging ? 'border-indigo-600 bg-indigo-100' : 'border-indigo-300';
    const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    return (
        <div
            className={`flex justify-center items-center w-full ${disabledClass}`}
            onClick={!disabled ? handleClick : undefined}
        >
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative w-full h-48 rounded-lg border-2 border-dashed ${dragClass} flex flex-col justify-center items-center text-center p-4 transition-colors duration-200`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".xml"
                    onChange={handleFileChange}
                    disabled={disabled}
                />
                <UploadIcon className="w-12 h-12 text-indigo-400" />
                <p className="mt-4 text-lg font-semibold text-slate-700">
                    Arrastra y suelta tus archivos XML aquí
                </p>
                <p className="text-sm text-slate-500">
                    o <span className="text-indigo-600 font-semibold">haz clic para seleccionar</span>
                </p>
            </div>
        </div>
    );
};