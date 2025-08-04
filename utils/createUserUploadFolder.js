
import fs from 'fs';
import path from 'path';

export const createUserUploadFolder = (userId) => {
    const uploadPath = path.join('public', 'uploads', String(userId));
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    return uploadPath;
};
