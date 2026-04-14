// Chargement des modules
const express = require('express');
const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Importation des routes
const userRoutes = require('../routes/userRoutes');
const productRoutes = require('../routes/productRoutes');
const authRoutes = require('../routes/authRoutes');
// Ajoutez d'autres routes ici si nécessaire

// Utilisation des routes
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/auth', authRoutes);
// Ajoutez d'autres app.use ici si nécessaire

module.exports = app;
