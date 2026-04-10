/**
 * 认证路由
 */

const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { generateToken, verifyPassword } = require('../middleware/auth');

/**
 * 管理员登录
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请输入用户名和密码'
            });
        }

        // 查询管理员
        const admin = db.prepare(`
            SELECT id, username, password_hash, email, display_name, avatar
            FROM admins 
            WHERE username = ?
        `).get(username);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 验证密码
        if (!verifyPassword(password, admin.password_hash)) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 更新最后登录时间
        db.prepare(`
            UPDATE admins SET last_login = datetime('now') WHERE id = ?
        `).run(admin.id);

        // 生成 Token
        const token = generateToken({
            id: admin.id,
            username: admin.username
        });

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email,
                    displayName: admin.display_name,
                    avatar: admin.avatar
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
});

/**
 * 验证 Token
 * GET /api/auth/verify
 */
router.get('/verify', require('../middleware/auth').authMiddleware, (req, res) => {
    try {
        const admin = db.prepare(`
            SELECT id, username, email, display_name, avatar
            FROM admins 
            WHERE id = ?
        `).get(req.user.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                displayName: admin.display_name,
                avatar: admin.avatar
            }
        });
    } catch (error) {
        console.error('验证错误:', error);
        res.status(500).json({
            success: false,
            message: '验证失败'
        });
    }
});

/**
 * 修改密码
 * POST /api/auth/change-password
 */
router.post('/change-password', require('../middleware/auth').authMiddleware, (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '请输入旧密码和新密码'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度至少 6 位'
            });
        }

        // 获取当前管理员
        const admin = db.prepare(`
            SELECT id, password_hash FROM admins WHERE id = ?
        `).get(req.user.id);

        // 验证旧密码
        if (!verifyPassword(oldPassword, admin.password_hash)) {
            return res.status(400).json({
                success: false,
                message: '旧密码错误'
            });
        }

        // 更新密码
        const { hashPassword } = require('../middleware/auth');
        db.prepare(`
            UPDATE admins SET password_hash = ? WHERE id = ?
        `).run(hashPassword(newPassword), admin.id);

        res.json({
            success: true,
            message: '密码修改成功'
        });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            success: false,
            message: '修改密码失败'
        });
    }
});

module.exports = router;
