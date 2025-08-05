
// import multer from 'multer';
// import path from 'path';
// import { createUserUploadFolder } from '../utils/createUserUploadFolder.js';

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const userId = req.user?.id;
//         const userFolder = createUserUploadFolder(userId);
//         cb(null, userFolder);
//     },
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname);
//         const fieldName = file.fieldname;
//         cb(null, `${fieldName}${ext}`); 
//     }
// });

// // Accept unlimited number of fields dynamically
// export const upload = multer({ storage }).any(); 



import multer from 'multer';
import multerS3 from 'multer-s3';
import s3 from '../Config/s3Config.js';

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        key: function (req, file, cb) {
            const userId = req.user.id;
            const fileName = `${file.fieldname}-${Date.now()}.png`;
            cb(null, `logos/${userId}/${fileName}`);
        }
    })
});

export default upload;
