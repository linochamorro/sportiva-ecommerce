const request = require('supertest');
const app = require('../server'); 

// ===================================================================
// MOCK DE LA BASE DE DATOS
// Esto evita que los tests se conecten a tu MySQL real.
// Simulamos respuestas exitosas de la base de datos.
// ===================================================================
jest.mock('../src/config/database', () => {
    return {
        execute: jest.fn((query, params) => {
            // Simulación: Si buscamos un email, devolvemos vacío (para registro) 
            // o un usuario ficticio (para login) dependiendo del caso.
            
            // 1. Simular búsqueda de email (para evitar duplicados en registro)
            if (query.includes('SELECT id_cliente FROM CLIENTE WHERE email')) {
                return Promise.resolve([[]]); // Array vacío = no existe
            }
            
            // 2. Simular búsqueda de usuario para Login (devuelve un usuario con hash de password)
            // Usamos un hash real de 'password123' para que bcrypt no falle
            if (query.includes('SELECT') && query.includes('FROM CLIENTE') && params[0] === 'test@sportiva.com') {
                return Promise.resolve([[{
                    id_cliente: 1,
                    nombre: 'Usuario',
                    apellido: 'Test',
                    email: 'test@sportiva.com',
                    password: '$2a$10$X.uj.iK.xK.zK.xK.xK.xK.xK.xK.xK.xK.xK.xK.xK.xK', // Hash simulado
                    estado: 'Activo'
                }]]);
            }

            // 3. Simular Inserción (Registro exitoso)
            if (query.includes('INSERT INTO CLIENTE')) {
                return Promise.resolve([{ insertId: 1, affectedRows: 1 }]);
            }

            // 4. Simular búsqueda genérica por ID
            if (query.includes('WHERE id_cliente = ?')) {
                return Promise.resolve([[{
                    id_cliente: 1,
                    nombre: 'Usuario',
                    apellido: 'Test',
                    email: 'test@sportiva.com'
                }]]);
            }
            
            // Default: Devolver array vacío
            return Promise.resolve([[]]);
        }),
        getConnection: jest.fn(() => ({
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            execute: jest.fn().mockResolvedValue([{ insertId: 1, affectedRows: 1 }])
        }))
    };
});

// Mock de bcrypt para que el login funcione sin hash real complejo
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true) // Siempre dice que la contraseña es correcta en el test
}));

// ===================================================================
// PRUEBAS
// ===================================================================

describe('Pruebas de Autenticación (Unitarias)', () => {

    // PRUEBA 1: Registro de Usuario
    it('Debe registrar un nuevo cliente correctamente (Status 201)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                nombre: 'Juan',
                apellido: 'Perez',
                email: 'nuevo@ejemplo.com', // Email nuevo
                password: 'Password123!', // Cumple requisitos
                telefono: '999888777'
            });
        
        // Esperamos éxito o un error controlado si el mock falla
        // En TDD estricto, validamos el 201
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('token');
    });

    // PRUEBA 2: Validación de Datos (Registro Fallido)
    it('Debe fallar si el password es muy corto (Status 400)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                nombre: 'Juan',
                apellido: 'Perez',
                email: 'juan@test.com',
                password: '123' // Muy corta
            });
        
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // PRUEBA 3: Login Exitoso
    it('Debe loguear al usuario correctamente (Status 200)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@sportiva.com', // Email que el mock reconoce
                password: 'password123'
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
    
    // PRUEBA 4: Verificar Health Check (Smoke Test)
    it('La API debe estar viva (Health Check)', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('ok');
    });

});
