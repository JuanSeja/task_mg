const express = require('express');
const router = express.Router();
const pool = require('../db');
// bcrypt para hashear contraseñas y jwt para generar tokens de autenticación
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

const AppError = require('../utils/AppError');

// POST /auth/register - Registrar un nuevo usuario
router.post('/register', async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return next(new AppError('Faltan campos obligatorios: name, email y password', 400));
    }

    try {
        // Verificar si el email ya está registrado
        const existingEmail = await pool.query(`
            SELECT 
                * 
            FROM 
                users 
            WHERE 
                email = $1`, 
            [email]
        );

        if (existingEmail.rows.length > 0) {
            return next(new AppError('El email ya está registrado', 400));
        }

        // ! Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario en la base de datos
        const result = await pool.query(`
            INSERT INTO 
                users (name, email, password) 
            VALUES 
                ($1, $2, $3) 
            RETURNING id, name, email, created_at`, 
            [name, email, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next (err);
    }
}); 

// POST /auth/login - Iniciar sesión
router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Faltan campos obligatorios: email y password', 400));
    }

    try {
        // Verificar si el usuario existe
        const userResult = await pool.query(`
            SELECT 
                * 
            FROM
                users 
            WHERE 
                email = $1`, 
            [email]
        );

        if (userResult.rows.length === 0) {
            return next(new AppError('Credenciales inválidas', 400));
        }

        const user = userResult.rows[0];

        // ! Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return next(new AppError('Credenciales inválidas', 400));
        }

        // ! Generar un token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            SECRET, 
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (err) {
        next (err);
    }
});

module.exports = router;