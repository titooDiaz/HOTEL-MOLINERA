# HOTEL-MOLINERA

Aplicación web para huéspedes y administración del Hotel Molinera. El backend usa Express, Sequelize y MySQL; el frontend usa React y Vite.

## Requisitos

- Node.js compatible con Vite 8.
- MySQL accesible desde el backend.

## Configuración

Define estas variables en `backend/.env` (no subas credenciales al repositorio):

```env
PORT=3000
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_clave_mysql
DB_NAME=hotel_molinera
DB_DIALECT=mysql

# Crea una cuenta administradora inicial si el correo todavía no existe.
ADMIN_EMAIL=admin@tuhotel.com
ADMIN_PASSWORD=una_clave_segura_de_al_menos_8_caracteres
ADMIN_NAME=Administrador Hotel
HOTEL_NAME=Hotel Molinera

# Correo para la verificación en dos pasos (ver sección más abajo).
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASSWORD=contraseña_de_aplicacion
MAIL_FROM="Hotel Molinera <tu_correo@gmail.com>"
```

La cuenta configurada con `ADMIN_EMAIL` y `ADMIN_PASSWORD` se crea al iniciar el backend, junto a su perfil de administrador. Si la cuenta ya existe, el backend no reemplaza su contraseña. Para entrar, abre **Reservar** y selecciona **Iniciar sesión**; desde ese mismo flujo los huéspedes pueden registrarse. Un administrador también puede crear otras cuentas desde Configuración.

Las tablas que faltan se crean al arrancar. La aplicación no altera las columnas de tablas existentes.

## Ejecución local

Instala dependencias en cada proyecto y ejecuta el backend y frontend en terminales separadas:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Vite envía las llamadas `/api` al backend en `http://localhost:3000`. Para producción, construye el frontend con `npm run build` en `frontend` y arranca el backend con `npm start` en `backend`.

## Funcionalidades conectadas

- Registro, inicio/cierre de sesión y restauración de sesión con contraseñas hash y token de sesión.
- Acceso de administrador inicial mediante variables de entorno; las rutas administrativas requieren rol admin.
- Gestión/listado de habitaciones, huéspedes, reservas y pedidos; formularios para publicar productos y planes.
- Menú y planes públicos, pedidos de huéspedes y formulario de contacto persistido.
- Las reservas comprueban disponibilidad, fechas y capacidad; los pedidos validan productos y cantidades en el servidor.
- Los datos del hotel y las preferencias de apariencia/región del panel se guardan en el navegador; el cambio de contraseña y el perfil del huésped usan la API.

## Verificación en dos pasos por correo

Cada usuario (huésped o administrador) puede activarla desde su página de configuración. Una vez activa, iniciar sesión requiere la contraseña **y** un código de 6 dígitos enviado al correo de la cuenta.

- El código vence a los 10 minutos, se puede usar una sola vez y se guarda solo como hash.
- Máximo 5 intentos por código. Si se agotan 5 códigos seguidos, la cuenta se bloquea 15 minutos.
- El reenvío exige esperar 60 segundos.
- Para activarla hay que confirmar un código recibido por correo; para desactivarla hay que escribir la contraseña actual.
- Requiere configurar `SMTP_*` y `MAIL_FROM` en `backend/.env`. Con Gmail usa una *contraseña de aplicación*, no la contraseña normal de la cuenta.
- Sin `SMTP_HOST` y fuera de producción (`NODE_ENV` distinto de `production`), el código se imprime en la consola del backend para poder probar sin correo. En producción el backend se niega a enviar si falta `SMTP_HOST`.
- La tabla `codigos_verificacion` se crea sola al arrancar; no se modifica ninguna tabla existente.
