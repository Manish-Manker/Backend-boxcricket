
import multer from 'multer';
import path from 'path';
import { createUserUploadFolder } from '../utils/createUserUploadFolder.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user?.id;
        const userFolder = createUserUploadFolder(userId);
        cb(null, userFolder);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const fieldName = file.fieldname;
        cb(null, `${fieldName}${ext}`); 
    }
});

// Accept unlimited number of fields dynamically
export const upload = multer({ storage }).any(); 
