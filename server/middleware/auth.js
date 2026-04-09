/**
 * JWT 认证中间件
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mo-blog-secret-key';

/**
 * 验证 JWT Token
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: '未提供认证令牌' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: '令牌已过期，请重新登录' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: '无效的认证令牌' 
        });
    }
}

/**
 * 可选认证 - 不强制要求登录
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // 忽略错误，继续执行
        }
    }

    next();
}

/**
 * 生成 JWT Token
 */
function generateToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * 验证密码
 */
function verifyPassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compareSync(password, hash);
}

/**
 * 哈希密码
 */
function hashPassword(password) {
    const bcrypt = require('bcryptjs');
    return bcrypt.hashSync(password, 10);
}

module.exports = {
    authMiddleware,
    optionalAuth,
    generateToken,
    verifyPassword,
    hashPassword
};
