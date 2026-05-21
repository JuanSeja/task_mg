require('dotenv').config();                                             // * || Cargar variables de entorno desde el archivo .env 

const express = require('express');                                     // * || Importar el framework Express para crear el servidor web
const app = express();                                                  // * || Crear una instancia de la aplicación Express

const tasksRouter = require('./routes/tasks');                          // * || Importar el enrutador para las tareas
const usersRouter = require('./routes/users');                          // * || Importar el enrutador para los usuarios
const authRouter = require('./routes/auth');                            // * || Importar el enrutador para la autenticación

const errorHandler = require('./middleware/errorHandler');              // ! || Importar el middleware para manejar errores

app.use(express.json());                                                // * || Middleware para parsear el cuerpo de las solicitudes como JSON    

app.use('/tasks', tasksRouter);                                         // * || Usar el enrutador de tareas para las rutas que comienzan con /tasks
app.use('/users', usersRouter);                                         // * || Usar el enrutador de usuarios para las rutas que comienzan con /users           
app.use('/auth', authRouter);                                           // * || Usar el enrutador de autenticación para las rutas que comienzan con /auth 

app.use(errorHandler);                                                   // ! || Usar el middleware de manejo de errores para capturar y responder a los errores

const PORT = process.env.PORT || 3000;                                  // * || Obtener el puerto del entorno o usar el puerto 3000 por defecto
app.listen(PORT, () => {                                                // * || Iniciar el servidor en el puerto 3000 y mostrar un mensaje en la consola
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
});