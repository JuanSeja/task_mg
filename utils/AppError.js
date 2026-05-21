// * Clase personalizada para manejar errores en la aplicación
// * Permite crear errores con un mensaje y un código de estado HTTP específico
// * Se extiende de la clase Error nativa de JavaScript para aprovechar su funcionalidad básica
class AppError extends Error {
    // * El constructor recibe un mensaje de error y un código de estado HTTP
    constructor(message, status) {
        // * Llama al constructor de la clase padre (Error) con el mensaje proporcionado
        super(message);
        this.status = status;
    }
}

module.exports = AppError;