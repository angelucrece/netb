// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mon API',
      version: '1.0.0',
      description: 'Documentation de mon API'
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Serveur de développement'
      }
    ]
  },
  // Chemin depuis la RACINE du projet (où vous exécutez node)
  //apis: ['./src/modules/**/*Route.js']
  apis: ['./src/modules/**/*Route.js']
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
    console.log("🔥 Swagger monté");
  // Interface UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Route pour le JSON brut
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('✅ Documentation Swagger disponible sur /api-docs');
  console.log('📊 Endpoints trouvés :', Object.keys(swaggerSpec.paths || {}).length);
}

module.exports = setupSwagger;