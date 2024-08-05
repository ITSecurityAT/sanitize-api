import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export const config = {
    api: {
        bodyParser: false, // Disabling bodyParser to use multer
    },
};

const uploadDir = path.join(process.cwd(), 'public/uploads/sanitization');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep the original filename
    },
});

const upload = multer({ storage: storage });

const handler = async (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'File upload failed' });
        }

        const filePath = path.join(uploadDir, req.file.filename);

        const votiroApiHost = process.env.VOTIRO_API_HOST;
        const votiroApiKey = process.env.VOTIRO_API_KEY;

        // Send the file to Votiro for sanitization
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('properties', JSON.stringify({
                ChannelType: 'FileConnector',
                ChannelId: '30acc6eb-16d9-4133-ae43-0f5b6d40a318',
                ChannelName: 'Nextjs-API',
                PolicyName: 'Default Policy'
            }));

            const votiroResponse = await axios.post(`${votiroApiHost}/upload`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${votiroApiKey}`,
                }
            });

            const documentId = votiroResponse.data.trim();
            console.log('Votiro response document ID:', documentId);

            if (documentId) {
                await fetchSanitizedFile(documentId, req.file.filename, votiroApiHost, votiroApiKey, res);
            }

            // Remove the original file if needed
            fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Error sending file to Votiro:', error);
            res.status(500).json({ message: 'File sanitization failed', error: error.message });
        }
    });
};

const fetchSanitizedFile = async (documentId, originalFileName, votiroApiHost, votiroApiKey, res, attempts = 0) => {
    const downloadHeaders = {
        'Authorization': `Bearer ${votiroApiKey}`,
        'Accept-Encoding': 'gzip, deflate, br',
        'X-Frame-Options': 'DENY'
    };

    try {
        const response = await axios.get(`${votiroApiHost}/download/${documentId}`, {
            headers: downloadHeaders,
            responseType: 'arraybuffer'
        });

        const sanitizedFilePath = path.join(process.cwd(), 'public/uploads/sanitization', `sanitized-${originalFileName}`);
        fs.writeFileSync(sanitizedFilePath, response.data);

        res.status(200).json({ message: 'File sanitized and saved successfully!', sanitizedFilePath: `/uploads/sanitization/sanitized-${originalFileName}` });

    } catch (error) {
        if (error.response && error.response.status === 404 && attempts < 5) {
            console.log('Sanitized file not ready, retrying...');
            setTimeout(() => fetchSanitizedFile(documentId, originalFileName, votiroApiHost, votiroApiKey, res, attempts + 1), 2000);
        } else {
            console.error('Error downloading sanitized file:', error);
            res.status(500).json({ message: 'Error downloading sanitized file', error: error.message });
        }
    }
};

export default handler;
