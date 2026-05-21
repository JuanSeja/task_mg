// * Middleware para autenticar solicitudes usando JWT
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET

module.exports = (req, res, next) => {
    // * Verificar el token JWT en el encabezado de autorización
    const authHeader = req.headers['authorization'];
    // * El token debe estar en el formato "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }
    // * Extraer el token del encabezado de autorización (la parte después de "Bearer ") 
    const token = authHeader.split(' ')[1];

    try {
        // * Verificar el token usando la clave secreta y decodificar su contenido
        const decoded = jwt.verify(token, SECRET);
        // * Agregar la información del usuario decodificada al objeto de solicitud para que esté disponible en las rutas protegidas
        req.user = decoded;
        // * Continuar con la siguiente función de middleware o ruta protegida 
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};