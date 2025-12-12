# 🏃 Sportiva E-Commerce

![Estado del Proyecto](https://img.shields.io/badge/Estado-Finalizado-success)
![Versión](https://img.shields.io/badge/Versión-1.0.0-blue)
![Licencia](https://img.shields.io/badge/Licencia-MIT-green)

> **Plataforma web de comercio electrónico especializada en implementos deportivos.** > Proyecto desarrollado para el curso **Integrador I: Sistemas - Software** de la UTP.

---

## 📋 Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Demo en Vivo](#-demo-en-vivo)
3. [Características Principales](#-características-principales)
4. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
5. [Arquitectura del Sistema](#-arquitectura-del-sistema)
6. [Instalación y Configuración](#-instalación-y-configuración)
7. [Base de Datos](#-base-de-datos)

---

## 📖 Descripción General

**Sportiva** nace como una solución integral para la gestión y venta de artículos deportivos. El sistema permite a los usuarios navegar por un catálogo dinámico, gestionar su carrito de compras y realizar pedidos de manera segura. Para los administradores, ofrece un control centralizado del inventario y seguimiento de ventas.

El proyecto destaca por su arquitectura robusta, separación de responsabilidades y despliegue en la nube mediante servicios modernos.

---

## 🌐 Demo en Vivo

El proyecto se encuentra totalmente desplegado y operativo en la nube:

| Componente | URL de Acceso | Plataforma |
|------------|---------------|------------|
| **Frontend** | [sportiva-ecommerce.vercel.app](https://sportiva-ecommerce.vercel.app) | Vercel ▲ |
| **Backend API** | [sportiva-ecommerce-production.up.railway.app](https://sportiva-ecommerce-production.up.railway.app) | Railway 🚂 |

---

## ✨ Características Principales

### 👤 Cliente
- **Autenticación Segura:** Registro y Login con encriptación (Bcrypt) y manejo de sesiones vía JWT.
- **Catálogo Dinámico:** Filtrado por categorías, búsqueda en tiempo real y visualización de stock.
- **Carrito de Compras:** Gestión de productos, cálculo automático de totales y validación de stock.
- **Checkout:** Proceso de compra en 3 pasos con integración visual de múltiples pasarelas de pago.
- **Perfil de Usuario:** Historial de pedidos y gestión de direcciones.

### 🛡️ Sistema / Backend
- **API RESTful:** Endpoints estructurados y documentados.
- **Validaciones:** Middlewares de seguridad y validación de datos (Express Validator).
- **Seguridad:** Protección contra ataques comunes (Rate Limiting, Helmet, CORS).
- **Logs:** Sistema de registro de eventos y errores para auditoría.

---

## 🛠 Tecnologías Utilizadas

### Frontend
- **Lenguajes:** HTML5, CSS3, JavaScript (Vanilla ES6+).
- **Diseño:** CSS Grid/Flexbox, Diseño Responsivo (Mobile First).
- **Comunicación:** Fetch API para consumo de servicios REST.

### Backend
- **Runtime:** Node.js.
- **Framework:** Express.js.
- **Seguridad:** JSON Web Tokens (JWT), Bcrypt, Helmet.
- **Base de Datos:** MySQL (con controlador `mysql2`).

### Infraestructura & Herramientas
- **Control de Versiones:** Git & GitHub.
- **Despliegue:** Vercel (Front) + Railway (Back/BD).
- **Diseño:** Figma (Prototipado).

---

## 🏗 Arquitectura del Sistema

El proyecto sigue el patrón de diseño **MVC (Modelo-Vista-Controlador)** complementado con una arquitectura de capas para asegurar la escalabilidad y mantenibilidad:

1.  **Vista (Frontend):** Interfaz de usuario desacoplada.
2.  **Controladores:** Manejo de peticiones HTTP.
3.  **Servicios (Service Layer):** Lógica de negocio pura.
4.  **Acceso a Datos (DAO):** Interacción directa con la base de datos MySQL.

💻 Instalación y Configuración

Sigue estos pasos para levantar el proyecto en tu entorno local:
1. Clonar el Repositorio
  git clone [https://github.com/linochamorro/sportiva-ecommerce.git](https://github.com/linochamorro/sportiva-ecommerce.git)
  cd sportiva-ecommerce

2. Configuración del Backend
  npm install

  Crea un archivo .env en la carpeta backend/ basándote en el .env.example:
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=tu_password
    DB_NAME=sportiva_db
    JWT_SECRET=tu_secreto_super_seguro
    JWT_EXPIRES_IN=24h
    FRONTEND_URL=[http://127.0.0.1:5500](http://127.0.0.1:5500)

  Para iniciar el servidor:
    npm run dev

3. Configuración del Frontend

  El frontend es estático. Puedes ejecutarlo con cualquier servidor local (ej. Live Server de VS Code) apuntando a la carpeta frontend/.

    Nota: Asegúrate de que frontend/assets/js/apiConfig.js apunte a tu servidor local (http://localhost:3000) si estás en desarrollo.


🗄 Base de Datos

  Los scripts necesarios para crear la estructura de la base de datos se encuentran en la carpeta: backend/scripts/
  Ejecútalos en tu gestor MySQL en el siguiente orden:

    1.sportiva_db.sql (Crea tablas y relaciones)
    2.sportiva_data.sql (Datos semilla/iniciales)