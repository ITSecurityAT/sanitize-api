import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false, // Disabling bodyParser to use multer
    },
};

const uploadDir = path.join(process.cwd(), 'public/uploads/no-sanitization');

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
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'File upload failed' });
        }

        const filePath = `/uploads/no-sanitization/${req.file.filename}`;

        res.status(200).json({ message: 'File uploaded successfully!', filePath });
    });
};

export default handler;
