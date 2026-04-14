
// Description : Service AUTH (logique métier)

// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const db = require('../../config/database');
// const logger = require('../../config/logger');

// const generateToken = (user) => {
//   return jwt.sign(
//     {
//       id: user.id,
//       email: user.email,
//       role: user.role,
//       firstName: user.first_name,
//       lastName: user.last_name
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: '1h' }
//   );
// };

// // 🔐 LOGIN
// const login = async ({ email, password }, ip) => {
//   logger.info('Tentative connexion', { ip });

//   const result = await db.query(
//     'SELECT * FROM users WHERE email = $1 AND active = true',
//     [email]
//   );

//   if (result.rows.length === 0) {
//     logger.warn('Email inexistant', { email, ip });
//     throw new Error('Email ou mot de passe incorrect');
//   }

//   const user = result.rows[0];

//   const validPassword = await bcrypt.compare(password, user.password);

//   if (!validPassword) {
//     logger.warn('Mot de passe incorrect', { userId: user.id, ip });
//     throw new Error('Email ou mot de passe incorrect');
//   }

//   const token = generateToken(user);

//   await db.query(
//     'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
//     [user.id]
//   );

//   logger.info('Connexion réussie', { userId: user.id });

//   return {
//     success: true,
//     message: 'Connexion réussie',
//     token,
//     user: {
//       id: user.id,
//       email: user.email,
//       role: user.role,
//       firstName: user.first_name,
//       lastName: user.last_name
//     }
//   };
// };

// // 👤 REGISTER
// const register = async (data, currentUser) => {
//   const { email, password, firstName, lastName, role } = data;

//   logger.info('Création utilisateur', {
//     email,
//     createdBy: currentUser.id
//   });

//   const existing = await db.query(
//     'SELECT id FROM users WHERE email = $1',
//     [email]
//   );

//   if (existing.rows.length > 0) {
//     logger.warn('Email déjà utilisé', { email });
//     throw new Error('Email déjà utilisé');
//   }

//   const hashedPassword = await bcrypt.hash(password, 12);

//   const result = await db.transaction(async (client) => {
//     const insert = await client.query(
//       `INSERT INTO users (email, password, first_name, last_name, role, active)
//        VALUES ($1, $2, $3, $4, $5, true)
//        RETURNING id, email, first_name, last_name, role, created_at`,
//       [email, hashedPassword, firstName, lastName, role]
//     );

//     const newUser = insert.rows[0];

//     // 🔥 log en base
//     await client.query(
//       `INSERT INTO logs (user_id, action, details)
//        VALUES ($1, $2, $3)`,
//       [
//         currentUser.id,
//         'CREATE_USER',
//         JSON.stringify({
//           createdUserId: newUser.id,
//           email: newUser.email
//         })
//       ]
//     );

//     return newUser;
//   });

//   logger.info('Utilisateur créé', {
//     userId: result.id,
//     createdBy: currentUser.id
//   });

//   return {
//     success: true,
//     message: 'Utilisateur créé',
//     user: {
//       id: result.id,
//       email: result.email,
//       firstName: result.first_name,
//       lastName: result.last_name,
//       role: result.role
//     }
//   };
// };

// // 🔄 REFRESH TOKEN
// const refresh = async (user) => {
//   logger.info('Refresh token', { userId: user.id });

//   const result = await db.query(
//     'SELECT * FROM users WHERE id = $1 AND active = true',
//     [user.id]
//   );

//   if (result.rows.length === 0) {
//     throw new Error('Utilisateur invalide');
//   }

//   const newToken = generateToken(result.rows[0]);

//   return {
//     success: true,
//     token: newToken
//   };
// };

// module.exports = {
//   login,
//   register,
//   refresh
// };



// // Description : Service AUTH (logique métier)

// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const db = require('../../config/database');
// const logger = require('../../config/logger');

// const generateToken = (user) => {
//   return jwt.sign(
//     {
//       id: user.id,
//       email: user.email,
//       role: user.role,  // user.role est maintenant une chaîne
//       firstName: user.first_name,
//       lastName: user.last_name
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: '1h' }
//   );
// };

// // 🔐 LOGIN
// const login = async ({ email, password, site }, ip) => {
//   logger.info('Tentative connexion', { ip });

//   // Requête avec jointure pour obtenir le nom du rôle
//   const result = await db.query(
//     `SELECT u.id, u.email, u.password, u.first_name, u.last_name, 
//             u.active, r.name as role_name
//      FROM users u
//      LEFT JOIN roles r ON u.role_id = r.id
//      WHERE u.email = $1 AND u.active = true`,
//     [email]
//   );

//   if (result.rows.length === 0) {
//     logger.warn('Email inexistant', { email, ip });
//     throw new Error('Email ou mot de passe incorrect');
//   }

//   const userData = result.rows[0];

//   const validPassword = await bcrypt.compare(password, userData.password);

//   if (!validPassword) {
//     logger.warn('Mot de passe incorrect', { userId: userData.id, ip });
//     throw new Error('Email ou mot de passe incorrect');
//   }

//   // Créer l'objet user avec role comme chaîne
//   const user = {
//     id: userData.id,
//     email: userData.email,
//     first_name: userData.first_name,
//     last_name: userData.last_name,
//     role: userData.role_name || 'utilisateur',  // Valeur par défaut si NULL
//     active: userData.active
//   };

//   const token = generateToken(user);

//   await db.query(
//     'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
//     [user.id]
//   );

//   logger.info('Connexion réussie', { userId: user.id });

//   return {
//     success: true,
//     message: 'Connexion réussie',
//     token,
//     user: {
//       id: user.id,
//       email: user.email,
//       role: user.role,  // Maintenant c'est une chaîne !
//       firstName: user.first_name,
//       lastName: user.last_name
//     }
//   };
// };

// // 👤 REGISTER
// const register = async (data, currentUser) => {
//   const { email, password, firstName, lastName, role_name } = data;

//   logger.info('Création utilisateur', {
//     email,
//     createdBy: currentUser.id
//   });

//   // Vérifier si l'email existe déjà
//   const existing = await db.query(
//     'SELECT id FROM users WHERE email = $1',
//     [email]
//   );

//   if (existing.rows.length > 0) {
//     logger.warn('Email déjà utilisé', { email });
//     throw new Error('Email déjà utilisé');
//   }

//   const hashedPassword = await bcrypt.hash(password, 12);

//   // Récupérer l'ID du rôle à partir du nom
//   let roleId = null;
//   if (role_name) {
//     const roleResult = await db.query(
//       'SELECT id FROM roles WHERE name = $1',
//       [role_name]
//     );
//     if (roleResult.rows.length > 0) {
//       roleId = roleResult.rows[0].id;
//     }
//   }

//   const result = await db.transaction(async (client) => {
//     const insert = await client.query(
//       `INSERT INTO users (email, password, first_name, last_name, role_id, active)
//        VALUES ($1, $2, $3, $4, $5, true)
//        RETURNING id, email, first_name, last_name, role_id, created_at`,
//       [email, hashedPassword, firstName, lastName, roleId]
//     );

//     const newUser = insert.rows[0];

//     // Log en base
//     await client.query(
//       `INSERT INTO logs (user_id, action, details)
//        VALUES ($1, $2, $3)`,
//       [
//         currentUser.id,
//         'CREATE_USER',
//         JSON.stringify({
//           createdUserId: newUser.id,
//           email: newUser.email
//         })
//       ]
//     );

//     return newUser;
//   });

//   // Récupérer le nom du rôle pour la réponse
//   let roleName = null;
//   if (result.role_id) {
//     const roleNameResult = await db.query(
//       'SELECT name FROM roles WHERE id = $1',
//       [result.role_id]
//     );
//     roleName = roleNameResult.rows[0]?.name;
//   }

//   logger.info('Utilisateur créé', {
//     userId: result.id,
//     createdBy: currentUser.id
//   });

//   return {
//     success: true,
//     message: 'Utilisateur créé',
//     user: {
//       id: result.id,
//       email: result.email,
//       firstName: result.first_name,
//       lastName: result.last_name,
//       role: roleName || 'utilisateur'
//     }
//   };
// };

// // 🔄 REFRESH TOKEN
// const refresh = async (user) => {
//   logger.info('Refresh token', { userId: user.id });

//   // Requête modifiée pour récupérer le rôle
//   const result = await db.query(
//     `SELECT u.id, u.email, u.first_name, u.last_name, 
//             u.active, r.name as role_name
//      FROM users u
//      LEFT JOIN roles r ON u.role_id = r.id
//      WHERE u.id = $1 AND u.active = true`,
//     [user.id]
//   );

//   if (result.rows.length === 0) {
//     throw new Error('Utilisateur invalide');
//   }

//   const userData = result.rows[0];
  
//   const userObj = {
//     id: userData.id,
//     email: userData.email,
//     first_name: userData.first_name,
//     last_name: userData.last_name,
//     role: userData.role_name || 'utilisateur'
//   };

//   const newToken = generateToken(userObj);

//   return {
//     success: true,
//     token: newToken
//   };
// };

// module.exports = {
//   login,
//   register,
//   refresh
// };

// Description : Service AUTH (logique métier)

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const logger = require('../../config/logger');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      site: user.site,  // Ajout du site dans le token
      firstName: user.first_name,
      lastName: user.last_name
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// 🔐 LOGIN
const login = async ({ email, password, site_name }, ip) => {
  logger.info('Tentative connexion', { email, site_name, ip });

  // Requête avec jointures pour obtenir le nom du rôle ET le site
  const result = await db.query(
    `SELECT u.id, u.email, u.password, u.first_name, u.last_name, 
            u.active, u.site_id,
            r.name as role_name,
            s.name as site_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     LEFT JOIN sites s ON u.site_id = s.id
     WHERE u.email = $1 AND u.active = true`,
    [email]
  );

  if (result.rows.length === 0) {
    logger.warn('Email inexistant', { email, ip });
    throw new Error('Email ou mot de passe incorrect');
  }

  const userData = result.rows[0];

  // 🔥 Vérifier le site si fourni
  if (site_name && userData.site_name !== site_name) {
    logger.warn('Site incorrect', { 
      email, 
      expectedSite: userData.site_name, 
      providedSite: site_name,
      ip 
    });
    throw new Error('Site de connexion incorrect');
  }

  const validPassword = await bcrypt.compare(password, userData.password);

  if (!validPassword) {
    logger.warn('Mot de passe incorrect', { userId: userData.id, ip });
    throw new Error('Email ou mot de passe incorrect');
  }

  // Créer l'objet user avec role et site comme chaînes
  const user = {
    id: userData.id,
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role_name || 'utilisateur',
    site: userData.site_name || null,  // Ajout du site
    active: userData.active
  };

  const token = generateToken(user);

  await db.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  logger.info('Connexion réussie', { userId: user.id, site: user.site });

  return {
    success: true,
    message: 'Connexion réussie',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      site: user.site,  // Ajout du site dans la réponse
      firstName: user.first_name,
      lastName: user.last_name
    }
  };
};

// 👤 REGISTER
const register = async (data, currentUser) => {
  const { email, password, firstName, lastName, role_name, site_name } = data;

  logger.info('Création utilisateur', {
    email,
    site_name,
    createdBy: currentUser.id
  });

  // Vérifier si l'email existe déjà
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    logger.warn('Email déjà utilisé', { email });
    throw new Error('Email déjà utilisé');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Récupérer l'ID du rôle à partir du nom
  let roleId = null;
  if (role_name) {
    const roleResult = await db.query(
      'SELECT id FROM roles WHERE name = $1',
      [role_name]
    );
    if (roleResult.rows.length > 0) {
      roleId = roleResult.rows[0].id;
    }
  }

  // Récupérer l'ID du site à partir du nom
  let siteId = null;
  if (site_name) {
    const siteResult = await db.query(
      'SELECT id FROM sites WHERE name = $1',
      [site_name]
    );
    if (siteResult.rows.length > 0) {
      siteId = siteResult.rows[0].id;
    } else {
      throw new Error(`Site "${site_name}" non trouvé`);
    }
  }

  const result = await db.transaction(async (client) => {
    const insert = await client.query(
      `INSERT INTO users (email, password, first_name, last_name, role_id, site_id, active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, email, first_name, last_name, role_id, site_id, created_at`,
      [email, hashedPassword, firstName, lastName, roleId, siteId]
    );

    const newUser = insert.rows[0];

    // Log en base
    await client.query(
      `INSERT INTO logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        currentUser.id,
        'CREATE_USER',
        JSON.stringify({
          createdUserId: newUser.id,
          email: newUser.email,
          site: site_name
        })
      ]
    );

    return newUser;
  });

  // Récupérer le nom du rôle et du site pour la réponse
  let roleName = null;
  if (result.role_id) {
    const roleNameResult = await db.query(
      'SELECT name FROM roles WHERE id = $1',
      [result.role_id]
    );
    roleName = roleNameResult.rows[0]?.name;
  }

  let siteName = null;
  if (result.site_id) {
    const siteNameResult = await db.query(
      'SELECT name FROM sites WHERE id = $1',
      [result.site_id]
    );
    siteName = siteNameResult.rows[0]?.name;
  }

  logger.info('Utilisateur créé', {
    userId: result.id,
    createdBy: currentUser.id,
    site: siteName
  });

  return {
    success: true,
    message: 'Utilisateur créé',
    user: {
      id: result.id,
      email: result.email,
      firstName: result.first_name,
      lastName: result.last_name,
      role: roleName || 'utilisateur',
      site: siteName || null
    }
  };
};

// 🔄 REFRESH TOKEN
const refresh = async (user) => {
  logger.info('Refresh token', { userId: user.id });

  // Requête modifiée pour récupérer le rôle et le site
  const result = await db.query(
    `SELECT u.id, u.email, u.first_name, u.last_name, 
            u.active,
            r.name as role_name,
            s.name as site_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     LEFT JOIN sites s ON u.site_id = s.id
     WHERE u.id = $1 AND u.active = true`,
    [user.id]
  );

  if (result.rows.length === 0) {
    throw new Error('Utilisateur invalide');
  }

  const userData = result.rows[0];
  
  const userObj = {
    id: userData.id,
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    role: userData.role_name || 'utilisateur',
    site: userData.site_name || null
  };

  const newToken = generateToken(userObj);

  return {
    success: true,
    token: newToken
  };
};

module.exports = {
  login,
  register,
  refresh
};