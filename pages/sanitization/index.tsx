import { useState } from 'react';
import Head from 'next/head';

export default function Sanitization() {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [sanitizedFilePath, setSanitizedFilePath] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
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
        formData.append('password', password);  // Append the password to the FormData object

        const res = await fetch('/api/uploadSanitization', {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            const result = await res.json();
            alert('File uploaded and sanitized successfully!');
            setSanitizedFilePath(result.sanitizedFilePath);
            setFile(null);  // Clear the file input
            setPassword('');  // Clear the password
            e.target.reset();  // Reset the form
        } else {
            alert('File upload or sanitization failed!');
        }

        setIsUploading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Head>
                <title>Sanitization Web</title>
                <meta property="og:title" content="My page title" key="title" />
            </Head>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
                <h1 className="text-2xl mb-4 text-center text-gray-900 dark:text-gray-100">Upload File</h1>
                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
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
                    <h1>If a file has password, please input the password before sanitization process</h1>
                    <input 
                        type="password"
                        placeholder="Enter file password"
                        value={password}
                        onChange={handlePasswordChange}
                        className="mb-4 px-3 py-2 border rounded w-full text-gray-900 bg-gray-900 border-none active:border-none text-white"
                    />
                    <button 
                        type="submit" 
                        className={`px-4 py-2 rounded text-white ${isUploading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}`}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
                {sanitizedFilePath && (
                    <div className="mt-4">
                        <a href={`http://localhost:80${sanitizedFilePath}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">View Sanitized File</a>
                    </div>
                )}
            </div>
        </div>
    );
}
