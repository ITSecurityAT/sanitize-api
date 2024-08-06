import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false, // Disabling bodyParser to use multer
    },
};

const localUploadDir = path.join(process.cwd(), 'public/uploads/no-sanitization');
const xamppUploadDir = 'C:/xampp/htdocs/uploads/no-sanitization';

// Ensure both upload directories exist
if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}

if (!fs.existsSync(xamppUploadDir)) {
    fs.mkdirSync(xamppUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, localUploadDir); // Save to local directory first
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

        const localFilePath = path.join(localUploadDir, req.file.filename);
        const xamppFilePath = path.join(xamppUploadDir, req.file.filename);

        // Copy the file to the XAMPP directory
        fs.copyFile(localFilePath, xamppFilePath, (copyErr) => {
            if (copyErr) {
                console.error('Error copying file to XAMPP directory:', copyErr);
                return res.status(500).json({ message: 'File upload failed' });
            }

            res.status(200).json({ message: 'File uploaded successfully!', filePath: `/uploads/no-sanitization/${req.file.filename}` });
        });
    });
};

export default handler;
