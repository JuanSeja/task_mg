const express = require('express');
const router = express.Router();
const pool = require('../db');

const AppError = require('../utils/AppError');
const authMiddleware = require('../middleware/auth');
// ! Aplicar el middleware de autenticación a todas las rutas de este router
router.use(authMiddleware);
/* Cuando solo se quiera aplicar el Middleware a rutas específicas, se puede agregar como segundo argumento en la definición de la ruta, por ejemplo:
router.get('/', authMiddleware, async (req, res) => { ... });
*/

router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                * 
            FROM 
                users 
            ORDER BY 
                created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        next (err);
    }
});

router.get('/:id', async (req, res, next) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
    }

    try {
        const result = await pool.query(`
            SELECT 
                * 
            FROM 
                users 
            WHERE 
                id = $1`,
            [id]
        ); 

        if (result.rows.length === 0) {
            return next(new AppError('Usuario no encontrado', 404));
        }
        res.json(result.rows[0]);
    } catch (err) {
        next (err);
    }
});

router.get('/:id/tasks', async (req, res, next) => {
    const { id } = req.params;

    if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
    }

    try {
        const userResult = await pool.query(`
            SELECT 
                *
            FROM
                users
            WHERE
                id = $1`,
            [id]
        );

        if (userResult.rows.length === 0) {
            return next(new AppError('Usuario no encontrado', 404));
        }

        const taskResult = await pool.query(`
            SELECT 
                tasks.*
            FROM 
                tasks 
            WHERE
                user_id = $1
            ORDER BY
                created_at DESC`,
            [id]
        );

        res.json({
            usuario: userResult.rows[0],
            tareas: taskResult.rows
        });
        
    } catch (err) {
        next (err);
    }
}); 

router.post('/', async (req, res, next) => {
    const { name, email } = req.body; 

    if(!name || !email) {
        return next(new AppError('Faltan campos obligatorios: name y email', 400));
    } 

    try {
        const result = await pool.query(`
            INSERT INTO 
                users (name, email) 
            VALUES 
                ($1, $2) 
            RETURNING *`, 
            [name, email]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next (err);
    }
});

router.put('/:id', async (req, res, next) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name && !email) {
        return next(new AppError('Al menos un campo es obligatorio para actualizar el usuario (nombre || correo)', 400));
    }

    try {
        const result = await pool.query(`
            UPDATE 
                users 
            SET 
                name    = COALESCE($1, name)   , 
                email   = COALESCE($2, email) 
            WHERE 
                id = $3
            RETURNING *`,
            [name, email, id]
        ); 

        if (result.rows.length === 0) {
            return next(new AppError('Usuario no encontrado', 404));
        }

        res.json(result.rows[0]);
    } catch (err) {
        next (err);   
    }
}); 

router.delete('/:id', async (req, res, next) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            DELETE FROM 
                users 
            WHERE 
                id = $1 
            RETURNING *`,
            [id]
        ); 

        if (result.rows.length === 0) {
            return next(new AppError('Usuario no encontrado', 404));
        }

        res.json({ message: 'Usuario eliminado existosamente', user: result.rows[0]});
    } catch (err) {
        next (err); 
    }
}); 

module.exports = router;