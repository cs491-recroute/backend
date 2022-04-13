import multer from "multer";

export const PATH = '/home/recroute/uploads/';

const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, PATH)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
});

const memoryStorage = multer.memoryStorage();

export const uploadAvatar = multer({ storage: memoryStorage, limits: { fileSize: 500000 } });
export const upload = multer({ storage: diskStorage });