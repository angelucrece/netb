//point d'entree du serveur Node.js// Point d'entrée du serveur Node.js
const express = require('express');
const app = express();
const path = require('path');


// 🔥 IMPORTANT : Importer Swagger
// Si vous avez choisi Option 1 (dans config)
const setupSwagger = require('../config/swagger');
const PORT = process.env.PORT || 4000;

app.use(express.json());
//  Servir les fichiers statiques (photos)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
//app.use(express.urlencoded({ extended: true }));

// ⚠️ CRITIQUE : Initialiser Swagger AVANT vos routes
setupSwagger(app);

const cors = require('cors');
app.use(cors()); // Permet toutes les origines
// Ou plus spécifiquement :
app.use(cors({
  origin: 'http://localhost:4000', // ou l'URL de votre frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// importer la route
const userRoutes = require('../modules/users/UserRoute');
const roleRoutes = require('../modules/roles/RoleRoute');
const siteRoutes = require('../modules/sites/SiteRoute');
const CategoryRoutes = require('../modules/categories/CategoryRoute');
const AuthRoutes = require('../modules/auth/AuthRoute');
const ProductRoutes = require('../modules/products/ProductRoute');
const StockRoutes = require('../modules/stocks/StockRoute');
const StockMovementRoutes = require('../modules/stockMovement/StockMovementRoute');
const InventoryRoutes = require('../modules/inventory/InventoryRoute');
const StockDocumentRoutes = require('../modules/stockDocuments/StockDocumentRoute');


// utiliser la route
app.use('/api/users', userRoutes);


app.use('/api/roles', roleRoutes);

app.use('/api/sites', siteRoutes);
app.use('/api/categories', CategoryRoutes);
app.use('/api/auth', AuthRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/stocks', StockRoutes);
app.use('/api/stock-movements', StockMovementRoutes);
app.use('/api/inventories', InventoryRoutes);
app.use('/api/documents', StockDocumentRoutes);


// // Gestion des erreurs 404
// app.use((req, res) => {
//   res.status(404).json({ message: 'Route non trouvée' });
// });

app.get('/', (req, res) => {
  res.send('Bienvenue sur le serveur Node.js!');
});
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});


