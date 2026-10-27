// Cargamos las herramientas para leer rutas y variables de entorno.
const path = require('path');
const dotenv = require('dotenv');

// Buscamos la configuración en la raíz y también dentro de backend.
dotenv.config({ override: true });
dotenv.config({ path: path.join(__dirname, '../.env'), override: false });

// Importamos Sequelize y los tipos de datos de las tablas.
const { DataTypes, Sequelize } = require('sequelize');

// Leemos el nombre de la base de datos configurado en el entorno.
const databaseName = process.env.DB_NAME;

// Detenemos el programa si falta el nombre de la base de datos.
if (!databaseName) {
    throw new Error('DB_NAME no está configurado en las variables de entorno');
}

// Creamos la conexión principal con MySQL.
const sequelize = new Sequelize(
    databaseName,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false
    }
);

// Estos campos se repiten en casi todas las tablas.
const commonAttributes = {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdByUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    updatedByUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deletedAt: { type: DataTypes.DATE, allowNull: true }
};

// Tabla general para todos los usuarios del sistema.
const Usuario = sequelize.define('Usuario', {
    ...commonAttributes,
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'guest' },
    lastLoginAt: DataTypes.DATE,
    lastLoginIp: DataTypes.STRING(45),
    lastLoginUserAgent: DataTypes.STRING(500),
    emailVerifiedAt: DataTypes.DATE,
    passwordChangedAt: DataTypes.DATE,
    failedLoginAttempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    lockedUntil: DataTypes.DATE,
    passwordResetTokenHash: DataTypes.STRING(255),
    passwordResetExpiresAt: DataTypes.DATE,
    rememberTokenHash: DataTypes.STRING(255),
    twoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    twoFactorSecret: DataTypes.STRING(255),
    locale: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'es-VE' },
    timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'America/Caracas' }
}, { tableName: 'usuarios', paranoid: true });

// Datos personales y de contacto de cada huésped.
const Huesped = sequelize.define('Huesped', {
    ...commonAttributes,
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: false },
    documentType: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'CC' },
    documentNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    birthDate: DataTypes.DATEONLY,
    nationality: DataTypes.STRING(80),
    phone: DataTypes.STRING(40),
    city: DataTypes.STRING(100),
    address: DataTypes.STRING(255),
    emergencyName: DataTypes.STRING(200),
    emergencyPhone: DataTypes.STRING(40),
    notes: DataTypes.TEXT,
    accessibilityNeeds: DataTypes.TEXT,
    preferences: DataTypes.JSON
}, { tableName: 'huespedes', paranoid: true });

// Datos adicionales y permisos de cada administrador.
const Admin = sequelize.define('Admin', {
    ...commonAttributes,
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: false },
    phone: DataTypes.STRING(40),
    jobTitle: DataTypes.STRING(100),
    department: DataTypes.STRING(100),
    permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    lastActivityAt: DataTypes.DATE,
    notes: DataTypes.TEXT
}, { tableName: 'administradores', paranoid: true });

// Información, precio, servicios y disponibilidad de las habitaciones.
const Habitacion = sequelize.define('Habitacion', {
    ...commonAttributes,
    number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    floor: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'disponible' },
    capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    area: DataTypes.DECIMAL(8, 2),
    beds: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    bedType: DataTypes.STRING(40),
    pricePerNight: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    imageUrl: DataTypes.STRING(500),
    gallery: DataTypes.JSON,
    description: DataTypes.TEXT,
    airConditioning: { type: DataTypes.BOOLEAN, defaultValue: false },
    cableTv: { type: DataTypes.BOOLEAN, defaultValue: false },
    safe: { type: DataTypes.BOOLEAN, defaultValue: false },
    workstation: { type: DataTypes.BOOLEAN, defaultValue: false },
    wifi: { type: DataTypes.BOOLEAN, defaultValue: false },
    minibar: { type: DataTypes.BOOLEAN, defaultValue: false },
    privateBathroom: { type: DataTypes.BOOLEAN, defaultValue: false },
    balcony: { type: DataTypes.BOOLEAN, defaultValue: false },
    smokeFree: { type: DataTypes.BOOLEAN, defaultValue: false },
    checkInTime: { type: DataTypes.STRING(20), defaultValue: '15:00' },
    checkOutTime: { type: DataTypes.STRING(20), defaultValue: '12:00' },
    isVisible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isBookable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    unavailableFrom: DataTypes.DATE,
    unavailableUntil: DataTypes.DATE,
    maintenanceNotes: DataTypes.TEXT
}, { tableName: 'habitaciones', paranoid: true });

// Categorías que se muestran para organizar las comidas.
const CategoriaComida = sequelize.define('CategoriaComida', {
    ...commonAttributes,
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    description: DataTypes.TEXT,
    icon: DataTypes.STRING(100),
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isVisible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: 'categorias_comida', paranoid: true });

// Productos del restaurante y sus datos de venta.
const Comida = sequelize.define('Comida', {
    ...commonAttributes,
    categoryId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    description: DataTypes.TEXT,
    price: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'VES' },
    imageUrl: DataTypes.STRING(500),
    ingredients: DataTypes.TEXT,
    allergens: DataTypes.TEXT,
    preparationMinutes: DataTypes.INTEGER.UNSIGNED,
    stockQuantity: DataTypes.INTEGER.UNSIGNED,
    isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isSoldOut: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isVisible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: 'comidas', paranoid: true });

// Planes y actividades que el hotel puede ofrecer.
const Plan = sequelize.define('Plan', {
    ...commonAttributes,
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    summary: DataTypes.STRING(500),
    description: DataTypes.TEXT,
    price: DataTypes.DECIMAL(14, 2),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'VES' },
    imageUrl: DataTypes.STRING(500),
    services: DataTypes.JSON,
    terms: DataTypes.TEXT,
    validFrom: DataTypes.DATEONLY,
    validUntil: DataTypes.DATEONLY,
    isVisible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isBookable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: 'planes', paranoid: true });

// Reserva que relaciona a un usuario con una habitación.
const Reserva = sequelize.define('Reserva', {
    ...commonAttributes,
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    roomId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    planId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    reservationCode: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    checkIn: { type: DataTypes.DATEONLY, allowNull: false },
    checkOut: { type: DataTypes.DATEONLY, allowNull: false },
    adults: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    children: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    guests: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'proceso' },
    confirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    confirmedAt: DataTypes.DATE,
    confirmedByUserId: DataTypes.BIGINT.UNSIGNED,
    checkedInAt: DataTypes.DATE,
    checkedOutAt: DataTypes.DATE,
    roomCleared: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    roomClearedAt: DataTypes.DATE,
    roomClearedByUserId: DataTypes.BIGINT.UNSIGNED,
    pricePerNight: DataTypes.DECIMAL(14, 2),
    nights: DataTypes.INTEGER.UNSIGNED,
    subtotal: DataTypes.DECIMAL(14, 2),
    taxes: DataTypes.DECIMAL(14, 2),
    total: DataTypes.DECIMAL(14, 2),
    advance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    balance: DataTypes.DECIMAL(14, 2),
    paymentStatus: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pendiente' },
    paymentMethod: DataTypes.STRING(30),
    specialRequests: DataTypes.TEXT,
    cancellationReason: DataTypes.TEXT,
    cancelledAt: DataTypes.DATE
}, { tableName: 'reservas', paranoid: true });

// Pedido de comida realizado por un usuario.
const Pedido = sequelize.define('Pedido', {
    ...commonAttributes,
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    roomId: DataTypes.BIGINT.UNSIGNED,
    orderCode: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pendiente' },
    paymentStatus: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pendiente' },
    paymentMethod: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'cargo' },
    subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    taxes: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    notes: DataTypes.TEXT,
    requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    preparedAt: DataTypes.DATE,
    deliveredAt: DataTypes.DATE,
    paidAt: DataTypes.DATE,
    cancelledAt: DataTypes.DATE,
    cancellationReason: DataTypes.TEXT
}, { tableName: 'pedidos', paranoid: true });

// Productos y cantidades que forman parte de un pedido.
const DetallePedido = sequelize.define('DetallePedido', {
    ...commonAttributes,
    orderId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    foodId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    foodName: { type: DataTypes.STRING(150), allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    totalPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    notes: DataTypes.TEXT
}, { tableName: 'detalle_pedidos', paranoid: true });

// Pagos relacionados con reservas o pedidos.
const Pago = sequelize.define('Pago', {
    ...commonAttributes,
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    reservationId: DataTypes.BIGINT.UNSIGNED,
    orderId: DataTypes.BIGINT.UNSIGNED,
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'VES' },
    method: { type: DataTypes.STRING(30), allowNull: false },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pendiente' },
    transactionReference: DataTypes.STRING(150),
    paidAt: DataTypes.DATE,
    notes: DataTypes.TEXT
}, { tableName: 'pagos', paranoid: true });

// Avisos que el sistema puede enviar a los usuarios.
const Notificacion = sequelize.define('Notificacion', {
    ...commonAttributes,
    userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    type: DataTypes.STRING(50),
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    readAt: DataTypes.DATE,
    data: DataTypes.JSON
}, { tableName: 'notificaciones', paranoid: true });

// Registro de cambios importantes hechos en el sistema.
const Auditoria = sequelize.define('Auditoria', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: DataTypes.BIGINT.UNSIGNED,
    action: { type: DataTypes.STRING(100), allowNull: false },
    entity: { type: DataTypes.STRING(100), allowNull: false },
    entityId: DataTypes.BIGINT.UNSIGNED,
    ipAddress: DataTypes.STRING(45),
    userAgent: DataTypes.STRING(500),
    oldValues: DataTypes.JSON,
    newValues: DataTypes.JSON,
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'auditoria', updatedAt: false });

// Relacionamos usuarios con sus perfiles de huésped y administrador.
Usuario.hasOne(Huesped, { foreignKey: 'userId', as: 'huesped' });
Huesped.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });
Usuario.hasOne(Admin, { foreignKey: 'userId', as: 'administrador' });
Admin.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });
Usuario.hasMany(Reserva, { foreignKey: 'userId', as: 'reservas' });
Reserva.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });
Habitacion.hasMany(Reserva, { foreignKey: 'roomId', as: 'reservas' });
Reserva.belongsTo(Habitacion, { foreignKey: 'roomId', as: 'habitacion' });
Plan.hasMany(Reserva, { foreignKey: 'planId', as: 'reservas' });
Reserva.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
CategoriaComida.hasMany(Comida, { foreignKey: 'categoryId', as: 'comidas' });
Comida.belongsTo(CategoriaComida, { foreignKey: 'categoryId', as: 'categoria' });
Usuario.hasMany(Pedido, { foreignKey: 'userId', as: 'pedidos' });
Pedido.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });
Pedido.belongsTo(Habitacion, { foreignKey: 'roomId', as: 'habitacion' });
Pedido.hasMany(DetallePedido, { foreignKey: 'orderId', as: 'detalles' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'orderId', as: 'pedido' });
DetallePedido.belongsTo(Comida, { foreignKey: 'foodId', as: 'comida' });
Comida.hasMany(DetallePedido, { foreignKey: 'foodId', as: 'detallesPedido' });
Usuario.hasMany(Pago, { foreignKey: 'userId', as: 'pagos' });
Pago.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });
Reserva.hasMany(Pago, { foreignKey: 'reservationId', as: 'pagos' });
Pedido.hasMany(Pago, { foreignKey: 'orderId', as: 'pagos' });
Usuario.hasMany(Notificacion, { foreignKey: 'userId', as: 'notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });
Usuario.hasMany(Auditoria, { foreignKey: 'userId', as: 'auditoria' });
Auditoria.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

// Reunimos todos los modelos para exportarlos y sincronizarlos.
const models = {
    Usuario, Huesped, Admin, Habitacion, CategoriaComida, Comida, Plan,
    Reserva, Pedido, DetallePedido, Pago, Notificacion, Auditoria
};

// Creamos la base de datos y las tablas que todavía no existan.
async function connectDatabase() {
    // Usamos una conexión temporal para crear la base si hace falta.
    const adminSequelize = new Sequelize({
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false
    });

    // Escapamos el nombre para usarlo de forma segura en la consulta.
    const escapedDatabaseName = databaseName.replace(/`/g, '``');

    await adminSequelize.authenticate();
    await adminSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${escapedDatabaseName}\``);
    await adminSequelize.close();

    // Comprobamos la conexión y guardamos las tablas que ya existían.
    await sequelize.authenticate();
    const existingTables = new Set(
        (await sequelize.getQueryInterface().showAllTables()).map((table) =>
            typeof table === 'string' ? table : table.tableName
        )
    );
    // Sequelize crea solo las tablas faltantes y no cambia las existentes.
    await sequelize.sync({ alter: false });
    console.log('Database connected');
    for (const model of Object.values(models)) {
        if (!existingTables.has(model.getTableName())) {
            console.log(`Tabla ${model.getTableName()} creada.`);
        }
    }
}

// Exportamos la conexión, la función de inicio y los modelos.
module.exports = {
    sequelize,
    connectDatabase,
    models
};