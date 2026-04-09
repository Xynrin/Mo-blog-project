/**
 * 文件上传中间件
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// 上传目录
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'images');

// 确保上传目录存在
function ensureUploadDir() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dir = path.join(uploadDir, `${year}-${month}`);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

// 存储配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = ensureUploadDir();
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueSuffix + ext);
    }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP'), false);
    }
};

// Multer 配置
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
        files: 10
    }
});

/**
 * 图片处理中间件 - 生成缩略图和获取元数据
 */
async function processImage(req, res, next) {
    if (!req.file) {
        return next();
    }

    try {
        const filePath = req.file.path;
        const metadata = await sharp(filePath).metadata();

        // 存储图片元数据
        req.imageMetadata = {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format
        };

        // 生成缩略图
        const thumbPath = filePath.replace(/(\.\w+)$/, '-thumb$1');
        await sharp(filePath)
            .resize(400, 300, { fit: 'cover' })
            .toFile(thumbPath);

        req.thumbnailPath = thumbPath;

        next();
    } catch (error) {
        console.error('图片处理错误:', error);
        next(); // 即使处理失败也继续
    }
}

/**
 * 错误处理中间件
 */
function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '文件大小超出限制（最大 5MB）'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: '文件数量超出限制'
            });
        }
        return res.status(400).json({
            success: false,
            message: `上传错误: ${err.message}`
        });
    }

    if (err.message.includes('不支持的文件类型')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    next(err);
}

module.exports = {
    upload,
    processImage,
    handleUploadError,
    ensureUploadDir
};
