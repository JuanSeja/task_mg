// * Middleware para manejar errores en la aplicación
module.exports = (err, req, res, next) => {
    console.error(err);
    
    const status = err.status || 500;
    const message = err.message || 'Error en el servidor';

    res.status(status).json({ error: message });
}