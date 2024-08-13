import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export const config = {
    api: {
        bodyParser: false,
    },
};

const localUploadDir = path.join(process.cwd(), 'public/uploads/sanitization');
const xamppUploadDir = 'C:/xampp/htdocs/uploads/sanitization';

if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}

if (!fs.existsSync(xamppUploadDir)) {
    fs.mkdirSync(xamppUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, localUploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); 
    },
});

const upload = multer({ storage: storage });

const handler = async (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'File upload failed' });
        }

        const filePath = path.join(localUploadDir, req.file.filename);
        const password = req.body.password; 

        const votiroApiHost = process.env.VOTIRO_API_HOST;
        const votiroApiKey = process.env.VOTIRO_API_KEY;

        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('properties', JSON.stringify({
                ChannelType: 'FileConnector',
                ChannelId: '30acc6eb-16d9-4133-ae43-0f5b6d40a318',
                ChannelName: 'Nextjs-API',
                PolicyName: 'Default Policy',
                Password: password
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
                await checkFileStatus(documentId, votiroApiHost, votiroApiKey, req.file.filename, res);
            }
            fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Error sending file to Votiro:', error);
            res.status(500).json({ message: 'File sanitization failed', error: error.message });
        }
    });
};

const checkFileStatus = async (documentId, votiroApiHost, votiroApiKey, originalFileName, res, attempts = 0) => {
    const statusHeaders = {
        'Authorization': `Bearer ${votiroApiKey}`,
        'Accept-Encoding': 'gzip, deflate, br',
        'X-Frame-Options': 'DENY'
    };

    try {
        const statusResponse = await axios.get(`${votiroApiHost}/status/${documentId}`, {
            headers: statusHeaders
        });

        const status = statusResponse.data.trim();
        console.log('Status: ', status);

        switch (status) {
            case 'Done':
                await fetchSanitizedFile(documentId, originalFileName, votiroApiHost, votiroApiKey, res);
                break;
            case 'Processing':
                if (attempts < 10) {
                    console.log('File is still processing, retrying...');
                    setTimeout(() => checkFileStatus(documentId, votiroApiHost, votiroApiKey, originalFileName, res, attempts + 1), 3000);
                } else {
                    console.error('File processing took too long');
                    res.status(500).json({ message: 'File processing took too long' });
                }
                break;
            case 'Blocked':
                console.error('File was blocked by Votiro');
                res.status(400).json({ message: 'File was blocked by Votiro' });
                break;
            case 'Error':
                console.error('An error occurred while processing the file');
                res.status(500).json({ message: 'An error occurred while processing the file' });
                break;
            case 'NotExist':
                console.error('File does not exist in Votiro');
                res.status(404).json({ message: 'File does not exist in Votiro' });
                break;
            default:
                console.error('Unknown status received from Votiro:', status);
                res.status(500).json({ message: 'Unknown status received from Votiro' });
                break;
        }

    } catch (error) {
        console.error('Error checking file status:', error);
        res.status(500).json({ message: 'Error checking file status', error: error.message });
        throw error;
    }
};

const fetchSanitizedFile = async (documentId, originalFileName, votiroApiHost, votiroApiKey, res) => {
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

        const sanitizedFilePath = path.join(localUploadDir, `sanitized-${originalFileName}`);
        fs.writeFileSync(sanitizedFilePath, response.data);

        const xamppSanitizedFilePath = path.join(xamppUploadDir, `sanitized-${originalFileName}`);
        fs.copyFileSync(sanitizedFilePath, xamppSanitizedFilePath);

        res.status(200).json({ message: 'File sanitized and saved successfully!', sanitizedFilePath: `/uploads/sanitization/sanitized-${originalFileName}` });

    } catch (error) {
        console.error('Error downloading sanitized file:', error);
        res.status(500).json({ message: 'Error downloading sanitized file', error: error.message });
    }
};

export default handler;
