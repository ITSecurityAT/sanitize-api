import { useState } from 'react';

export default function Sanitization() {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            const result = await res.json();
            alert('File uploaded and sanitized successfully!');
            setFile(null);  // Clear the file input
            e.target.reset();  // Reset the form
        } else {
            alert('File upload or sanitization failed!');
        }

        setIsUploading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl mb-4">Upload File</h1>
                <form onSubmit={handleSubmit} className="flex flex-col items-center">
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        className="mb-4 text-white" 
                    />
                    <button 
                        type="submit" 
                        className={`px-4 py-2 rounded ${isUploading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}`}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            </div>
        </div>
    );
}
