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
SMTP_USER=hotelmolinera@gmail.com
SMTP_PASSWORD=xeliofjflticonou
MAIL_FROM="Hotel Molinera <hotelmolinera@gmail.com>"
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
- En el listado de clientes, administración puede consultar el perfil e historial de reservas, crear una reserva con el cliente preseleccionado y eliminar su acceso. La eliminación conserva el historial y se bloquea si tiene reservas vigentes o futuras.
- Menú y planes públicos, pedidos de huéspedes y formulario de contacto persistido.
- Administración de habitaciones desde el panel: edición de sus datos, programación de mantenimiento y bloqueos temporales, y eliminación individual de fotos con limpieza de imágenes que ya no se usan.
- Gestión del restaurante desde el panel: edición y disponibilidad de platos, control de existencias y CRUD de categorías. Los huéspedes pueden cancelar pedidos pendientes; al registrar como pagado un pedido se guarda también su pago.
- Edición y retiro lógico de planes desde administración. Los huéspedes autenticados pueden solicitar una experiencia sin reservar habitación; la solicitud queda pendiente de confirmación y el pago se coordina con recepción.
- Caja y pagos: administración consulta `/api/payments`, cada huésped consulta solo sus transacciones en `/api/me/payments`; los abonos a reservas se registran individualmente, admiten referencia para transferencia/Pago Móvil y actualizan el saldo pendiente.
- Estados de cuenta descargables en PDF desde **Mi habitación** y la administración. Incluyen alojamiento, pedidos asociados a la habitación durante las fechas de estadía, abonos y saldo; son comprobantes informativos, no facturas fiscales.
- Notificaciones por usuario para nuevas reservas, pedidos y mensajes; los huéspedes reciben cambios de reserva y avisos cuando su pedido está preparado o en camino. Se consultan y marcan como leídas desde las barras superiores; los cambios en tiempo real se entregan por SSE autenticado, sin sondeo periódico.
- Las reservas comprueban disponibilidad, fechas y capacidad; los pedidos validan productos y cantidades en el servidor.
- Los datos del hotel y las preferencias de apariencia/región del panel se guardan en el navegador; el cambio de contraseña y el perfil del huésped usan la API.

## Solicitudes directas de planes

Las experiencias con precio configurado se pueden solicitar desde **Planes**, sin una reserva de habitación. La solicitud registra fechas, participantes y el precio calculado por el servidor, y comienza en estado `pendiente`; el hotel la confirma desde **Planes y actividades**. Esta función no procesa pagos en línea. Las tablas que falten, incluida `reservas_planes`, se crean al iniciar el backend; no se alteran columnas de tablas existentes.

## Pagos y estados de cuenta

- `GET /api/payments` requiere administrador; `GET /api/me/payments` requiere sesión y devuelve únicamente las transacciones del usuario.
- `PATCH /api/reservations/:id/payment` registra un abono de una reserva. Acepta `amount` (opcional; si falta, cobra el saldo completo), `paymentMethod` (`efectivo`, `tarjeta`, `transferencia` o `pago_movil`), `transactionReference` y `notes`. Los pagos por transferencia y Pago Móvil requieren referencia; cada abono queda como transacción independiente y actualiza el saldo.
- Los estados de cuenta PDF se obtienen mediante `GET /api/reservations/:id/receipt.pdf` (administración) o `GET /api/me/reservations/:id/receipt.pdf` (huésped propietario). Incluyen habitación, consumos de restaurante durante el horario de estadía, pagos y saldo. Son comprobantes informativos, no facturas fiscales.

## Verificación en dos pasos por correo

Cada usuario (huésped o administrador) puede activarla desde su página de configuración. Una vez activa, iniciar sesión requiere la contraseña **y** un código de 6 dígitos enviado al correo de la cuenta.

- El código vence a los 10 minutos, se puede usar una sola vez y se guarda solo como hash.
- Máximo 5 intentos por código. Si se agotan 5 códigos seguidos, la cuenta se bloquea 15 minutos.
- El reenvío exige esperar 60 segundos.
- Para activarla hay que confirmar un código recibido por correo; para desactivarla hay que escribir la contraseña actual.
- Requiere configurar `SMTP_*` y `MAIL_FROM` en `backend/.env`. Con Gmail usa una *contraseña de aplicación*, no la contraseña normal de la cuenta.
- Sin `SMTP_HOST` y fuera de producción (`NODE_ENV` distinto de `production`), el código se imprime en la consola del backend para poder probar sin correo. En producción el backend se niega a enviar si falta `SMTP_HOST`.
- La tabla `codigos_verificacion` se crea sola al arrancar; no se modifica ninguna tabla existente.

## Captcha en contacto y registro

El formulario de contacto (`POST /api/contact`) y la creación de cuentas (`POST /api/auth/register`) usan **Cloudflare Turnstile**. El widget del frontend solo genera un token; el backend lo valida contra Cloudflare en `backend/src/captcha.js` antes de ejecutar la ruta. Un token de un formulario no sirve en el otro (se comprueba la acción `contact` o `register`).

Configuración:

1. Crea un sitio en [Cloudflare Dashboard > Turnstile](https://dash.cloudflare.com/) y añade tu dominio (para local también puedes añadir `localhost`).
2. En `backend/.env`, define `TURNSTILE_SECRET_KEY`. Opcionalmente, `TURNSTILE_HOSTNAMES` con los dominios permitidos separados por coma.
3. En `frontend/.env`, define `VITE_TURNSTILE_SITE_KEY` con la clave pública del sitio.
4. Reinicia backend y frontend.

Para desarrollo sin crear un sitio, este entorno ya tiene configuradas las **claves de prueba oficiales** de Cloudflare (`1x...AA`) en `backend/.env` y `frontend/.env`; siempre validan, así que no las uses en producción. Como esos archivos no se versionan, al clonar el proyecto usa los `.env.example` como plantilla. Con `NODE_ENV=production` el backend rechaza las claves de prueba con un error 503.

Comportamiento sin configurar:

- Sin `TURNSTILE_SECRET_KEY` y fuera de producción, el captcha se **omite** con un aviso en la consola del backend.
- En producción, sin clave o con clave de prueba, las rutas protegidas responden 503 (nunca se abren por falta de configuración).
- Si Cloudflare no responde, la solicitud se rechaza: un fallo de red no permite saltarse la verificación.

Los tokens son de un solo uso y caducan; el frontend reinicia el widget después de cada envío o error para pedir uno nuevo.
