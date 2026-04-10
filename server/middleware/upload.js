/**
 * 文件上传中间件
 * 支持图片、视频、文档等多种文件类型
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// 上传根目录
const uploadRoot = path.join(__dirname, '..', '..', 'uploads');

// 文件类型分类
const FILE_TYPES = {
    image: {
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'],
        maxSize: 5 * 1024 * 1024, // 5MB
        dir: 'images'
    },
    video: {
        mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
        maxSize: 50 * 1024 * 1024, // 50MB
        dir: 'videos'
    },
    file: {
        mimeTypes: ['application/pdf'],
        maxSize: 20 * 1024 * 1024, // 20MB
        dir: 'files'
    }
};

// 获取文件类型分类
function getFileCategory(mimeType) {
    for (const [category, config] of Object.entries(FILE_TYPES)) {
        if (config.mimeTypes.includes(mimeType)) return category;
    }
    return null;
}

// 获取所有允许的 MIME 类型
function getAllowedMimeTypes() {
    return Object.values(FILE_TYPES).flatMap(c => c.mimeTypes);
}

// 获取文件大小限制
function getMaxFileSize(mimeType) {
    const category = getFileCategory(mimeType);
    if (!category) return 5 * 1024 * 1024;
    return FILE_TYPES[category].maxSize;
}

// 确保上传目录存在
function ensureUploadDir(category) {
    const config = FILE_TYPES[category] || FILE_TYPES.image;
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dir = path.join(uploadRoot, config.dir, `${year}-${month}`);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

// 存储配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = getFileCategory(file.mimetype) || 'image';
        const dir = ensureUploadDir(category);
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
    const allowed = getAllowedMimeTypes();
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型，支持 JPG/PNG/GIF/WebP/SVG/AVIF/MP4/WebM/OGG/PDF'), false);
    }
};

// Multer 配置
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB（最大限制，实际由中间件控制）
        files: 20
    }
});

/**
 * 文件处理中间件 - 图片生成缩略图，视频/文档记录元数据
 */
async function processImage(req, res, next) {
    if (!req.file) {
        return next();
    }

    try {
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;
        const category = getFileCategory(mimeType);

        // 图片：生成缩略图和获取尺寸
        if (category === 'image' && !mimeType.includes('svg')) {
            try {
                const metadata = await sharp(filePath).metadata();
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
            } catch (err) {
                console.error('图片处理错误:', err.message);
            }
        }

        // 视频/文档：记录基本信息
        if (category === 'video' || category === 'file') {
            req.imageMetadata = {
                width: null,
                height: null,
                format: mimeType.split('/')[1]
            };
        }

        next();
    } catch (error) {
        console.error('文件处理错误:', error);
        next();
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
                message: '文件大小超出限制（图片5MB/视频50MB/文档20MB）'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: '文件数量超出限制（最多20个）'
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
    ensureUploadDir,
    getFileCategory,
    FILE_TYPES
};
