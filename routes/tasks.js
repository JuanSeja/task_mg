const express = require('express');
const router = express.Router();
const pool = require('../db');

const AppError = require('../utils/AppError');
const authMiddleware = require('../middleware/auth');
// ! Aplicar el middleware de autenticación a todas las rutas de este router
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                tasks.*              , 
                users.name AS Usuario 
            FROM 
                tasks 
            JOIN 
                users ON tasks.user_id = users.id
            ORDER BY 
                created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        next (err)
    }
});

/* NOTAS - El endpoint GET /tasks/:id utiliza un parámetro de ruta para identificar la tarea específica que se desea obtener.
- El valor del parámetro de ruta se extrae utilizando req.params.id.
- Se utiliza una consulta SQL parametrizada para evitar inyecciones SQL, pasando el id como un parámetro separado.
- Si no se encuentra la tarea con el id proporcionado, se devuelve un error 404 con un mensaje adecuado.
- Si ocurre cualquier otro error durante la consulta, se captura y se devuelve un error 500 con un mensaje de error genérico.
- $1 en la consulta SQL se refiere al primer parámetro que se pasa en el array después de la consulta, en este caso, el id de la tarea.
- IsNaN(id) se utiliza para validar que el id proporcionado sea un número válido antes de ejecutar la consulta SQL. Si el id no es un número, se devuelve un error 400 con un mensaje adecuado.
*/
router.get('/:id', async (req, res, next) => {
    const { id } = req.params;

    if(isNaN(id)) {
        return next(new AppError('ID inválido', 400));
    }

    try {
        const result = await pool.query(`
            SELECT 
                * 
            FROM 
                tasks 
            WHERE 
                id = $1`, 
            [id]
        );
        
        if (result.rows.length === 0) {
            return next(new AppError('Tarea no encontrada', 404));
        }
        res.json(result.rows[0]);
    } catch (err) {
        next (err);
    }
});

/* NOTAS - El endpoint POST /tasks se utiliza para crear una nueva tarea.
- El título de la tarea se espera en el cuerpo de la solicitud (req.body).
- Se valida que el título esté presente; si no lo está, se devuelve un error 400 con un mensaje adecuado. 
- Si el título es válido, se ejecuta una consulta SQL parametrizada para insertar la nueva tarea en la base de datos, utilizando RETURNING * para obtener la fila recién insertada.
- Si la inserción es exitosa, se devuelve un estado 201 (Creado) junto con la tarea recién creada en formato JSON.
- RETURNING * es una cláusula de SQL que se utiliza para devolver la fila recién insertada después de ejecutar una consulta INSERT. Esto es útil para obtener el ID generado automáticamente u otros campos que se hayan establecido durante la inserción.
*/
router.post('/', async (req, res, next) => {
    const { title} = req.body;
    // * El ID del usuario autenticado se obtiene del objeto req.user que fue agregado por el middleware de autenticación
    // ! El user_id no debería venir del body porque cualquiera podría mandar el id que quiera. Debe venir del token, que el servidor mismo firmó.
    const user_id = req.user.id;

    // * Validar que el título esté presente en el cuerpo de la solicitud
    // ! No es necesario validar el user_id porque el middleware de autenticación ya garantiza que req.user.id esté presente y sea válido
    if (!title) {
        return next(new AppError('El título es obligatorio', 400));
    }

    try {
        const result = await pool.query(`
            INSERT INTO 
                tasks (title, user_id) 
            VALUES 
                ($1, $2) 
            RETURNING *`, // Returning * devuelve la fila recién insertada
            [title, user_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        next (err);
    }
});

/* NOTAS - El endpoint PUT /tasks/:id se utiliza para actualizar una tarea existente.
- El id de la tarea a actualizar se obtiene del parámetro de ruta (req.params.id).
- El título y el estado de la tarea se esperan en el cuerpo de la solicitud (req.body). 
- Se valida que al menos uno de los campos (title o done) esté presente; si no lo están, se devuelve un error 400 con un mensaje adecuado.
- Se utiliza una consulta SQL parametrizada para actualizar la tarea, utilizando COALESCE para mantener el valor actual si no se proporciona un nuevo valor.
- Si no se encuentra la tarea con el id proporcionado, se devuelve un error 404 con un mensaje adecuado.
- Si la actualización es exitosa, se devuelve la tarea actualizada en formato JSON.
*/
router.put('/:id', async (req, res, next) => {
    const { id } = req.params; 
    const { title, done } = req.body;
    
    if (!title && done === undefined) {
        return next(new AppError('Al menos un campo es obligatorio para actualizar la tarea', 400));
    }

    try {
        const result = await pool.query(`
            UPDATE 
                tasks 
            SET 
                title   = COALESCE($1, title) , 
                done    = COALESCE($2, done) 
            WHERE 
                id      = $3            AND
                user_id = $4
            RETURNING *`,
            [title, done, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return next(new AppError('Tarea no encontrada', 404));
        }

        res.json(result.rows[0]);
    } catch (err) {
        next (err);
    }
});

/* NOTAS - El endpoint DELETE /tasks/:id se utiliza para eliminar una tarea existente.
- El id de la tarea a eliminar se obtiene del parámetro de ruta (req.params.id).
- Se utiliza una consulta SQL parametrizada para eliminar la tarea, pasando el id como un parámetro separado.
- Si no se encuentra la tarea con el id proporcionado, se devuelve un error 404 con un mensaje adecuado.
- Si la eliminación es exitosa, se devuelve un mensaje de éxito junto con la tarea eliminada en formato JSON.
*/
router.delete('/:id', async (req, res, next) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            DELETE FROM 
                tasks 
            WHERE 
                id      = $1         AND
                user_id = $2
            RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return next(new AppError('Tarea no encontrada', 404));
        }

        res.json({ message: 'Tarea eliminada exitosamente', task: result.rows[0] });
    } catch (err) {
        next (err);
    }
}); 

module.exports = router;