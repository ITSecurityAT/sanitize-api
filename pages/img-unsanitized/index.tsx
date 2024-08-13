import { useState } from 'react';
import Head from 'next/head';

export default function Sanitization() {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFilePath, setUploadedFilePath] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        setFile(e.dataTransfer.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/uploadNoSanitization', {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            const result = await res.json();
            alert('File uploaded successfully!');
            setUploadedFilePath(result.filePath);
            setFile(null);  // Clear the file input
            e.target.reset();  // Reset the form
        } else {
            alert('File upload failed!');
        }

        setIsUploading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Head>
                <title>Web Image Upload - Unsanitize</title>
                <meta property="og:title" content="My page title" key="title" />
            </Head>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
                <h1 className="text-2xl mb-4 text-center text-gray-900 dark:text-gray-100">Upload File</h1>
                <form onSubmit={handleSubmit} className="flex flex-col items-center">
                    <div 
                        className={`border-2 border-dashed rounded-lg p-8 w-full text-center ${dragActive ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'} ${isUploading ? 'pointer-events-none' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {!file && (
                            <>
                                <p className="text-gray-600 dark:text-gray-400">Upload your file here, or <label htmlFor="file-upload" className="text-blue-500 cursor-pointer">browse</label></p>
                                <p className="text-gray-400 dark:text-gray-500">Supports: Any type files</p>
                                <input 
                                    id="file-upload"
                                    type="file" 
                                    onChange={handleFileChange} 
                                    className="hidden"
                                />
                            </>
                        )}
                        {file && <p className="mb-4 text-black dark:text-white">Selected File: {file.name}</p>}
                    </div>
                    <button 
                        type="submit" 
                        className={`mt-4 px-4 py-2 rounded text-white ${isUploading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}`}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
                {uploadedFilePath && (
                    <div className="mt-4">
                        <a href={`http://localhost:80${uploadedFilePath}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">View Sanitized File</a>
                    </div>
                )}
            </div>
        </div>
    );
}
