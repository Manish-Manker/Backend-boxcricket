
import fs from 'fs';
import path from 'path';

// export const uploadLogo = (req, res) => {
//     try {
//         const userId = req.user.id;
//         const files = req.files;

//         const fileMap = {
//             mainLogo: null,
//             ads: [],
//         };

//         for (const file of files) {
//             const relativePath = `/uploads/${userId}/${file.filename}`;

//             if (file.fieldname === 'mainLogo') {
//                 fileMap.mainLogo = relativePath;
//             } else if (file.fieldname.startsWith('ad')) {
//                 fileMap.ads.push({ field: file.fieldname, path: relativePath });
//             }
//         }

//         return res.status(200).json({
//             message: 'Logos and ads uploaded successfully.',
//             files: fileMap
//         });

//     } catch (error) {
//         console.error('Upload error:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };


// export const getLogos = (req, res) => {
//     try {
//         const userId = req.user.id;
//         const userFolder = path.join('public', 'uploads', String(userId));

//         let mainLogo = null;
//         let ads = [];

//         if (fs.existsSync(userFolder)) {
//             const files = fs.readdirSync(userFolder);

//             const mainLogoFile = files.find(file =>
//                 file.startsWith('mainLogo')
//             );

//             const adFiles = files.filter(file =>
//                 file.startsWith('ad')
//             );

//             mainLogo = mainLogoFile
//                 ? `/uploads/${userId}/${mainLogoFile}`
//                 : null;

//             ads = adFiles.map(file => ({
//                 field: file.split('.')[0],
//                 path: `/uploads/${userId}/${file}`
//             }));
//         }

//         return res.status(200).json({
//             message: 'Logos fetched successfully',
//             data: {
//                 mainLogo,
//                 ads
//             }
//         });

//     } catch (error) {
//         console.log('Error in getLogos:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };


// export const deleteLogo = (req, res) => {
//     try {
//         const userId = req.user.id;
//         const { field } = req.params;

//         // Prevent directory traversal
//         const safeField = path.basename(field);

//         const userFolder = path.join('public', 'uploads', String(userId));

//         const files = fs.existsSync(userFolder)
//             ? fs.readdirSync(userFolder)
//             : [];

//         const fileToDelete = files.find(file =>
//             file.startsWith(safeField)
//         );

//         if (!fileToDelete) {
//             return res.status(404).json({ message: `${safeField} not found` });
//         }

//         const fullPath = path.join(userFolder, fileToDelete);

//         fs.unlinkSync(fullPath);

//         return res.status(200).json({ message: `${safeField} deleted successfully` });

//     } catch (error) {
//         console.error('Error deleting logo:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };


export const uploadLogo = (req, res) => {
    try {
        const files = req.files;

        const fileMap = {
            mainLogo: null,
            ads: [],
        };

        for (const file of files) {
            const url = file.location;
            if (file.fieldname === 'mainLogo') {
                fileMap.mainLogo = url;
            } else if (file.fieldname.startsWith('ad')) {
                fileMap.ads.push({ field: file.fieldname, url });
            }
        }

        return res.status(200).json({
            message: 'Files uploaded to S3',
            files: fileMap
        });

    } catch (error) {
        console.error('S3 Upload Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const deleteLogo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { field } = req.params;

        const prefix = `logos/${userId}/${field}`;

        // List matching objects
        const list = await s3.listObjectsV2({
            Bucket: process.env.AWS_BUCKET_NAME,
            Prefix: prefix
        }).promise();

        if (!list.Contents.length) {
            return res.status(404).json({ message: `${field} not found` });
        }

        // Delete all matching objects
        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: {
                Objects: list.Contents.map(obj => ({ Key: obj.Key }))
            }
        };

        await s3.deleteObjects(deleteParams).promise();

        return res.status(200).json({ message: `${field} deleted from S3` });

    } catch (error) {
        console.error('S3 Delete Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
