const { Op } = require('sequelize');

const INITIAL_CATEGORIES = [
    { name: 'Entradas', slug: 'entradas', description: 'Para comenzar la experiencia gastronómica.', sortOrder: 1 },
    { name: 'Platos fuertes', slug: 'platos-fuertes', description: 'Preparaciones principales del restaurante.', sortOrder: 2 },
    { name: 'Bebidas', slug: 'bebidas', description: 'Bebidas frías y calientes.', sortOrder: 3 }
];

const INITIAL_FOODS = [
    {
        name: 'Carne asada con salsa criolla',
        slug: 'carne-asada-salsa-criolla',
        description: 'Carne tierna acompañada de salsa criolla y guarnición del día.',
        price: 28000,
        imageUrl: '/images/restaurant/carne-asada-con-salsa.jpg',
        categorySlug: 'platos-fuertes',
        sortOrder: 1
    },
    {
        name: 'Ravioli con pan de ajo',
        slug: 'ravioli-pan-ajo',
        description: 'Ravioli artesanal servido con pan de ajo recién horneado.',
        price: 24000,
        imageUrl: '/images/restaurant/ravioli-pan-ajo.jpeg',
        categorySlug: 'platos-fuertes',
        sortOrder: 2
    },
    {
        name: 'Tacos mexicanos de pollo',
        slug: 'tacos-mexicanos-pollo',
        description: 'Tacos de pollo sazonado con vegetales frescos.',
        price: 18000,
        imageUrl: '/images/restaurant/tacos-mexicanos-con-pollo.jpg',
        categorySlug: 'entradas',
        sortOrder: 3
    },
    {
        name: 'Cerveza fría',
        slug: 'cerveza-fria',
        description: 'Cerveza servida fría para acompañar tu comida.',
        price: 8000,
        imageUrl: '/images/restaurant/cerveza-piscina.jpeg',
        categorySlug: 'bebidas',
        sortOrder: 4
    }
];

const INITIAL_ROOMS = [
    {
        number: '101',
        floor: 1,
        type: 'Doble',
        capacity: 2,
        beds: 1,
        bedType: 'Matrimonial',
        pricePerNight: 180000,
        imageUrl: '/images/rooms/cama-azul.jpeg',
        gallery: ['/images/rooms/cama-azul.jpeg', '/images/rooms/jacuzzi-bano.jpeg'],
        description: 'Habitación cómoda para dos personas, con baño privado y wifi.',
        wifi: true,
        privateBathroom: true,
        cableTv: true,
        isVisible: true,
        isBookable: true
    },
    {
        number: '201',
        floor: 2,
        type: 'Familiar',
        capacity: 4,
        beds: 2,
        bedType: 'Doble',
        pricePerNight: 260000,
        imageUrl: '/images/rooms/cama-blanca.jpeg',
        gallery: ['/images/rooms/cama-blanca.jpeg', '/images/rooms/cama-verde.jpeg'],
        description: 'Espacio amplio para familias, con dos camas y ambiente tranquilo.',
        wifi: true,
        privateBathroom: true,
        balcony: true,
        isVisible: true,
        isBookable: true
    },
    {
        number: '301',
        floor: 3,
        type: 'Suite',
        capacity: 2,
        beds: 1,
        bedType: 'King',
        pricePerNight: 340000,
        imageUrl: '/images/rooms/jacuzzi-bano.jpeg',
        gallery: ['/images/rooms/jacuzzi-bano.jpeg', '/images/rooms/cama-verde.jpeg'],
        description: 'Suite para una estadía especial, con jacuzzi y balcón.',
        wifi: true,
        privateBathroom: true,
        balcony: true,
        safe: true,
        airConditioning: true,
        isVisible: true,
        isBookable: true
    }
];

const INITIAL_PLANS = [
    {
        name: 'Ruta de montaña tachirense',
        slug: 'ruta-montana-tachirense',
        summary: 'Paisajes y miradores del área metropolitana.',
        description: 'Una experiencia para conocer los paisajes de montaña que rodean San Cristóbal.',
        price: 95000,
        imageUrl: '/tourism/ruta-montana-tachirense.jpeg',
        services: ['Transporte local', 'Guía turístico', 'Refrigerio'],
        validFrom: '2025-01-01',
        validUntil: '2099-12-31',
        sortOrder: 1
    },
    {
        name: 'Sabores del Táchira',
        slug: 'sabores-del-tachira',
        summary: 'Recorrido gastronómico por la región.',
        description: 'Descubre preparaciones tradicionales y productos locales del Táchira.',
        price: 75000,
        imageUrl: '/tourism/sabores-del-tachira.jpeg',
        services: ['Degustación', 'Acompañamiento local'],
        validFrom: '2025-01-01',
        validUntil: '2099-12-31',
        sortOrder: 2
    },
    {
        name: 'Atardecer en San Cristóbal',
        slug: 'atardecer-san-cristobal',
        summary: 'Una tarde para disfrutar la ciudad y sus alrededores.',
        description: 'Plan relajado para contemplar el atardecer desde un mirador cercano.',
        price: 60000,
        imageUrl: '/tourism/atardecer-san-cristobal.jpeg',
        services: ['Traslado', 'Bebida de bienvenida'],
        validFrom: '2025-01-01',
        validUntil: '2099-12-31',
        sortOrder: 3
    }
];

async function seedInitialData({ models, sequelize }) {
    const { CategoriaComida, Comida, Habitacion, Plan } = models;
    const today = new Date().toISOString().slice(0, 10);

    await Plan.destroy({ where: { validUntil: { [Op.lt]: today } } });

    const categories = new Map();
    for (const categoryData of INITIAL_CATEGORIES) {
        const [category] = await CategoriaComida.findOrCreate({
            where: { slug: categoryData.slug },
            defaults: categoryData
        });
        categories.set(categoryData.slug, category.id);
    }

    for (const foodData of INITIAL_FOODS) {
        const { categorySlug, ...data } = foodData;
        await Comida.findOrCreate({
            where: { slug: data.slug },
            defaults: { ...data, categoryId: categories.get(categorySlug) }
        });
    }

    for (const roomData of INITIAL_ROOMS) {
        await Habitacion.findOrCreate({
            where: { number: roomData.number },
            defaults: roomData
        });
    }

    for (const planData of INITIAL_PLANS) {
        await Plan.findOrCreate({
            where: { slug: planData.slug },
            defaults: planData
        });
    }

    await sequelize.query('SELECT 1');
    console.log('Initial restaurant, room and plan data ready.');
}

module.exports = { seedInitialData };
