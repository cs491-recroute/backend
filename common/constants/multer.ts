import multer from "multer";
import path from "path";

export const PATH = path.join(process.cwd().substring(0, process.cwd().lastIndexOf('/')) + '/uploads');

const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, PATH);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + file.originalname.substring(file.originalname.lastIndexOf('.')));
    }
});

const memoryStorage = multer.memoryStorage();

export const uploadAvatar = multer({ storage: memoryStorage, limits: { fileSize: 500000 } });
export const upload = multer({ storage: diskStorage });