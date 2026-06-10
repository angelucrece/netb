// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Dossier de stockage
// const uploadDir = path.join(__dirname, '../../uploads/products');

// // Créer le dossier s'il n'existe pas
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Configuration du stockage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     cb(null, `product-${uniqueSuffix}${ext}`);
//   }
// });

// // Filtre pour n'accepter que les images
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Seules les images sont autorisées'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
//   fileFilter: fileFilter
// });

// module.exports = { upload, uploadDir };

const multer = require('multer');
const path   = require('node:path');
const fs     = require('node:fs');
const crypto = require('node:crypto'); // CSPRNG natif Node.js

// Dossier de stockage
const uploadDir = path.join(__dirname, '../../uploads/products');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // crypto.randomBytes : générateur cryptographiquement sûr (CSPRNG)
    // 16 octets → 32 caractères hex, garantit l'unicité sans prédictibilité
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

const upload = multer({
  storage:    storage,
  limits:     { fileSize: (Number.parseInt(process.env.UPLOAD_MAX_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: fileFilter,
});

module.exports = { upload, uploadDir };