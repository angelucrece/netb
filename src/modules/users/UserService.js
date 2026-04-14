const bcrypt = require('bcryptjs');
//const db = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Service de gestion des utilisateurs
 * Encapsule la logique métier pour les opérations CRUD sur les utilisateurs
 */
// class UserService {
//   /**
//    * Récupère la liste des utilisateurs avec filtres
//    * @param {Object} filters - Filtres de recherche
//    * @param {string} filters.search - Texte de recherche (email, prénom, nom)
//    * @param {number} filters.page - Numéro de page
//    * @param {number} filters.limit - Nombre d'éléments par page
//    * @param {string} filters.role - Filtre par rôle (magasinier ou administrateur)
//    * @returns {Promise<Object>} Objet contenant les utilisateurs et la pagination
//    */
//   async listUsers(filters) {
//     try {
//       const { search = '', page = 1, limit = 20, role } = filters;
//       const offset = (page - 1) * limit;

//       logger.info('Récupération liste utilisateurs:', { 
//         search,
//         page,
//         limit,
//         role
//       });

//       // Construction de la requête avec filtres
//       let whereClause = 'WHERE active = true';
//       let params = [];
//       let paramIndex = 1;

//       // Filtre de recherche
//       if (search) {
//         whereClause += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
//         params.push(`%${search}%`);
//         paramIndex++;
//       }

//       // Filtre par rôle
//       if (role && ['magasinier', 'administrateur'].includes(role)) {
//         whereClause += ` AND role = $${paramIndex}`;
//         params.push(role);
//         paramIndex++;
//       }

//       // Requête principale
//       const query = `
//         SELECT 
//           id, email, first_name, last_name, role, active, 
//           created_at, last_login,
//           (SELECT COUNT(*) FROM movements WHERE user_id = users.id) as total_movements
//         FROM users
//         ${whereClause}
//         ORDER BY created_at DESC
//         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
//       `;

//       params.push(limit, offset);

//       // Requête pour le total
//       const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;

//       const [usersResult, countResult] = await Promise.all([
//         db.query(query, params),
//         db.query(countQuery, params.slice(0, -2))
//       ]);

//       const users = usersResult.rows;
//       const total = parseInt(countResult.rows[0].total);
//       const totalPages = Math.ceil(total / limit);

//       logger.debug('Utilisateurs récupérés:', { 
//         count: users.length, 
//         total,
//         page,
//         totalPages 
//       });

//       return {
//         success: true,
//         data: users,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           totalPages,
//           hasNext: page < totalPages,
//           hasPrev: page > 1
//         }
//       };

//     } catch (error) {
//       logger.error('Erreur récupération utilisateurs:', {
//         error: error.message,
//         stack: error.stack
//       });
//       throw error;
//     }
//   }

//   /**
//    * Récupère les détails complets d'un utilisateur
//    * @param {number} id - ID de l'utilisateur
//    * @returns {Promise<Object>} Détails de l'utilisateur et ses mouvements récents
//    */
//   async getUserById(id) {
//     try {
//       logger.info('Récupération détails utilisateur:', { userId: id });

//       const query = `
//         SELECT 
//           u.id, u.email, u.first_name, u.last_name, u.role, u.active, 
//           u.created_at, u.last_login,
//           COUNT(m.id) as total_movements,
//           COUNT(m.id) FILTER (WHERE m.type = 'entry') as total_entries,
//           COUNT(m.id) FILTER (WHERE m.type = 'exit') as total_exits,
//           COUNT(m.id) FILTER (WHERE m.status = 'pending') as pending_movements
//         FROM users u
//         LEFT JOIN movements m ON u.id = m.user_id
//         WHERE u.id = $1 AND u.active = true
//         GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.active, u.created_at, u.last_login
//       `;

//       const result = await db.query(query, [id]);

//       if (result.rows.length === 0) {
//         logger.warn('Utilisateur non trouvé:', { userId: id });
//         return { success: false, message: 'Utilisateur non trouvé' };
//       }

//       const user = result.rows[0];

//       // Récupération des mouvements récents de cet utilisateur
//       const recentMovementsQuery = `
//         SELECT 
//           m.id, m.type, m.quantity, m.status, m.date, m.motif,
//           p.name as product_name, p.barcode
//         FROM movements m
//         JOIN products p ON m.product_id = p.id
//         WHERE m.user_id = $1
//         ORDER BY m.date DESC
//         LIMIT 10
//       `;

//       const recentMovementsResult = await db.query(recentMovementsQuery, [id]);

//       logger.debug('Détails utilisateur récupérés:', { userId: id });

//       return {
//         success: true,
//         data: {
//           ...user,
//           total_movements: parseInt(user.total_movements),
//           total_entries: parseInt(user.total_entries),
//           total_exits: parseInt(user.total_exits),
//           pending_movements: parseInt(user.pending_movements),
//           recentMovements: recentMovementsResult.rows
//         }
//       };

//     } catch (error) {
//       logger.error('Erreur récupération utilisateur:', {
//         error: error.message,
//         userId: id,
//         stack: error.stack
//       });
//       throw error;
//     }
//   }

//   /**
//    * Met à jour les informations d'un utilisateur
//    * @param {number} userId - ID de l'utilisateur à modifier
//    * @param {Object} updateData - Données à mettre à jour
//    * @param {string} updateData.firstName - Prénom
//    * @param {string} updateData.lastName - Nom
//    * @param {string} updateData.role - Rôle
//    * @param {boolean} updateData.active - Statut actif
//    * @param {number} adminId - ID de l'administrateur effectuant la modification
//    * @returns {Promise<Object>} Utilisateur mis à jour
//    */
//   async updateUser(userId, updateData, adminId) {
//     try {
//       const { firstName, lastName, role, active } = updateData;

//       // Validation des données
//       if (!firstName || !lastName || !role) {
//         return {
//           success: false,
//           message: 'Prénom, nom et rôle sont requis'
//         };
//       }

//       if (!['magasinier', 'administrateur'].includes(role)) {
//         return {
//           success: false,
//           message: 'Rôle doit être magasinier ou administrateur'
//         };
//       }

//       logger.info('Modification utilisateur:', { 
//         userId,
//         adminId
//       });

//       // Vérification existence de l'utilisateur
//       const existingUser = await db.query(
//         'SELECT * FROM users WHERE id = $1 AND active = true',
//         [userId]
//       );

//       if (existingUser.rows.length === 0) {
//         return {
//           success: false,
//           message: 'Utilisateur non trouvé'
//         };
//       }

//       const oldUser = existingUser.rows[0];

//       // Empêcher l'auto-désactivation
//       if (parseInt(userId) === adminId && active === false) {
//         return {
//           success: false,
//           message: 'Vous ne pouvez pas désactiver votre propre compte'
//         };
//       }

//       // Transaction pour la modification
//       const result = await db.transaction(async (client) => {
//         // Mise à jour de l'utilisateur
//         const updateQuery = `
//           UPDATE users
//           SET first_name = $1, last_name = $2, role = $3, active = $4, updated_at = CURRENT_TIMESTAMP
//           WHERE id = $5
//           RETURNING id, email, first_name, last_name, role, active, updated_at
//         `;

//         const updateResult = await client.query(updateQuery, [
//           firstName.trim(),
//           lastName.trim(),
//           role,
//           active !== undefined ? active : true,
//           userId
//         ]);

//         const updatedUser = updateResult.rows[0];

//         // Log des changements
//         const changes = {};
//         if (oldUser.first_name !== firstName) changes.firstName = { old: oldUser.first_name, new: firstName };
//         if (oldUser.last_name !== lastName) changes.lastName = { old: oldUser.last_name, new: lastName };
//         if (oldUser.role !== role) changes.role = { old: oldUser.role, new: role };
//         if (oldUser.active !== (active !== undefined ? active : true)) changes.active = { old: oldUser.active, new: active };

//         await client.query(`
//           INSERT INTO logs (user_id, action, details)
//           VALUES ($1, $2, $3)
//         `, [
//           adminId,
//           'UPDATE_USER',
//           JSON.stringify({
//             targetUserId: userId,
//             changes
//           })
//         ]);

//         return updatedUser;
//       });

//       logger.info('Utilisateur modifié avec succès:', {
//         userId,
//         adminId
//       });

//       return {
//         success: true,
//         message: 'Utilisateur modifié avec succès',
//         data: result
//       };

//     } catch (error) {
//       logger.error('Erreur modification utilisateur:', {
//         error: error.message,
//         userId,
//         adminId: adminId,
//         stack: error.stack
//       });
//       throw error;
//     }
//   }

//   /**
//    * Désactive un utilisateur (soft delete)
//    * @param {number} userId - ID de l'utilisateur à désactiver
//    * @param {number} adminId - ID de l'administrateur effectuant la désactivation
//    * @returns {Promise<Object>} Objet de succès
//    */
//   async deactivateUser(userId, adminId) {
//     try {
//       logger.info('Désactivation utilisateur:', { 
//         userId,
//         adminId
//       });

//       // Empêcher l'auto-suppression
//       if (parseInt(userId) === adminId) {
//         return {
//           success: false,
//           message: 'Vous ne pouvez pas désactiver votre propre compte'
//         };
//       }

//       // Vérification existence et récupération des infos
//       const userResult = await db.query(
//         'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1 AND active = true',
//         [userId]
//       );

//       if (userResult.rows.length === 0) {
//         return {
//           success: false,
//           message: 'Utilisateur non trouvé'
//         };
//       }

//       const user = userResult.rows[0];

//       // Désactivation de l'utilisateur (soft delete)
//       await db.transaction(async (client) => {
//         // Marquer l'utilisateur comme inactif
//         await client.query(
//           'UPDATE users SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
//           [userId]
//         );

//         // Log de l'action
//         await client.query(`
//           INSERT INTO logs (user_id, action, details)
//           VALUES ($1, $2, $3)
//         `, [
//           adminId,
//           'DEACTIVATE_USER',
//           JSON.stringify({
//             targetUserId: userId,
//             email: user.email,
//             firstName: user.first_name,
//             lastName: user.last_name,
//             role: user.role
//           })
//         ]);
//       });

//       logger.info('Utilisateur désactivé avec succès:', {
//         userId,
//         email: user.email,
//         adminId
//       });

//       return {
//         success: true,
//         message: 'Utilisateur désactivé avec succès',
//         userData: user
//       };

//     } catch (error) {
//       logger.error('Erreur désactivation utilisateur:', {
//         error: error.message,
//         userId,
//         adminId: adminId,
//         stack: error.stack
//       });
//       throw error;
//     }
//   }

//   /**
//    * Récupère le profil de l'utilisateur connecté
//    * @param {number} userId - ID de l'utilisateur
//    * @returns {Promise<Object>} Profil de l'utilisateur avec statistiques
//    */
//   async getUserProfile(userId) {
//     try {
//       logger.info('Récupération profil utilisateur:', { userId });

//       const query = `
//         SELECT 
//           u.id, u.email, u.first_name, u.last_name, u.role, u.created_at, u.last_login,
//           COUNT(m.id) as total_movements,
//           COUNT(m.id) FILTER (WHERE m.type = 'entry') as total_entries,
//           COUNT(m.id) FILTER (WHERE m.type = 'exit') as total_exits,
//           COUNT(m.id) FILTER (WHERE m.status = 'pending') as pending_movements
//         FROM users u
//         LEFT JOIN movements m ON u.id = m.user_id
//         WHERE u.id = $1 AND u.active = true
//         GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.created_at, u.last_login
//       `;

//       const result = await db.query(query, [userId]);

//       if (result.rows.length === 0) {
//         return {
//           success: false,
//           message: 'Profil utilisateur non trouvé'
//         };
//       }

//       const profile = result.rows[0];

//       logger.debug('Profil utilisateur récupéré:', { userId });

//       return {
//         success: true,
//         data: {
//           ...profile,
//           total_movements: parseInt(profile.total_movements),
//           total_entries: parseInt(profile.total_entries),
//           total_exits: parseInt(profile.total_exits),
//           pending_movements: parseInt(profile.pending_movements)
//         }
//       };

//     } catch (error) {
//       logger.error('Erreur récupération profil:', {
//         error: error.message,
//         userId,
//         stack: error.stack
//       });
//       throw error;
//     }
//   }

//   /**
//    * Change le mot de passe de l'utilisateur
//    * @param {number} userId - ID de l'utilisateur
//    * @param {string} currentPassword - Mot de passe actuel
//    * @param {string} newPassword - Nouveau mot de passe
//    * @returns {Promise<Object>} Objet de succès
//    */
//   async changePassword(userId, currentPassword, newPassword) {
//     try {
//       logger.info('Changement mot de passe utilisateur:', { userId });

//       // Récupération du mot de passe actuel
//       const userResult = await db.query(
//         'SELECT password FROM users WHERE id = $1 AND active = true',
//         [userId]
//       );

//       if (userResult.rows.length === 0) {
//         return {
//           success: false,
//           message: 'Utilisateur non trouvé'
//         };
//       }

//       const user = userResult.rows[0];

//       // Vérification du mot de passe actuel
//       const isValidPassword = await bcrypt.compare(currentPassword, user.password);

//       if (!isValidPassword) {
//         logger.warn('Tentative changement mot de passe avec ancien incorrect:', { 
//           userId
//         });
//         return {
//           success: false,
//           message: 'Mot de passe actuel incorrect'
//         };
//       }

//       // Hashage du nouveau mot de passe
//       const saltRounds = 12;
//       const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

//       // Transaction pour mettre à jour le mot de passe
//       await db.transaction(async (client) => {
//         // Mise à jour du mot de passe
//         await client.query(
//           'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
//           [hashedNewPassword, userId]
//         );

//         // Log de l'action
//         await client.query(`
//           INSERT INTO logs (user_id, action, details)
//           VALUES ($1, $2, $3)
//         `, [
//           userId,
//           'CHANGE_PASSWORD',
//           JSON.stringify({
//             timestamp: new Date().toISOString()
//           })
//         ]);
//       });

//       logger.info('Mot de passe modifié avec succès:', { userId });

//       return {
//         success: true,
//         message: 'Mot de passe modifié avec succès'
//       };

//     } catch (error) {
//       logger.error('Erreur changement mot de passe:', {
//         error: error.message,
//         userId,
//         stack: error.stack
//       });
//       throw error;
//     }
//   }

//   /**
//    * Récupère les statistiques des utilisateurs
//    * @returns {Promise<Object>} Statistiques détaillées des utilisateurs
//    */
//   async getStats() {
//     try {
//       logger.info('Récupération statistiques utilisateurs');

//       const statsQuery = `
//         SELECT 
//           COUNT(*) as total_users,
//           COUNT(*) FILTER (WHERE role = 'administrateur') as admin_count,
//           COUNT(*) FILTER (WHERE role = 'magasinier') as magasinier_count,
//           COUNT(*) FILTER (WHERE active = true) as active_users,
//           COUNT(*) FILTER (WHERE active = false) as inactive_users,
//           COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '7 days') as active_week,
//           COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '30 days') as active_month
//         FROM users
//       `;

//       const result = await db.query(statsQuery);
//       const stats = result.rows[0];

//       logger.debug('Statistiques utilisateurs récupérées');

//       return {
//         success: true,
//         data: {
//           totalUsers: parseInt(stats.total_users),
//           adminCount: parseInt(stats.admin_count),
//           magasinierCount: parseInt(stats.magasinier_count),
//           activeUsers: parseInt(stats.active_users),
//           inactiveUsers: parseInt(stats.inactive_users),
//           activeThisWeek: parseInt(stats.active_week),
//           activeThisMonth: parseInt(stats.active_month)
//         }
//       };

//     } catch (error) {
//       logger.error('Erreur récupération statistiques utilisateurs:', {
//         error: error.message,
//         stack: error.stack
//       });
//       throw error;
//     }
//   }
// }

// module.exports = new UserService();


const UserRepository = require('./UserRepository');
const RoleService = require('../roles/RoleService');
const SiteService = require('../sites/siteService');
const db = require('../../config/database');
const User = require('./UserModel');
const Role = require('../roles/RoleModel');
const Site = require('../sites/siteModel');

/**
 * Service User = logique métier
 */
class UserService {

  // Liste des utilisateurs
  static async getUsers(filters) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;

    const rows = await UserRepository.findAll({
      ...filters,
      page,
      limit
    });

    return rows.map(row => new User({
      ...row,
      role: new Role({
        id: row.role_id,
        name: row.role_name,
        description: row.description
      }),
      site: new Site({
        id: row.site_id,
        name: row.site_name,
        description: row.site_description
      })
    }));
  }

  // Détail utilisateur
  static async getUserById(id) {
    const row = await UserRepository.findById(id);

    if (!row) throw new Error('USER_NOT_FOUND');

    return new User({
      ...row,
      role: new Role({
        id: row.role_id,
        name: row.role_name,
        description: row.description
      }),
       site: new Site({
        id: row.site_id,
        name: row.site_name,
        description: row.site_description
      })
    });
  }


    // Créer un nouvel utilisateur
  static async createUser(data) {
    const newUser = await UserRepository.create(data);
    return new User(newUser);
  }

  // Modifier utilisateur
  static async updateUser(id, data, adminId) {

    // Vérifier que le rôle existe
    await RoleService.getRoleById(data.roleId);
    // Vérifier que le site existe
    await SiteService.getSiteById(data.siteId);

    return await db.transaction(async (client) => {

      const updatedUser = await UserRepository.update(id, data, client);

      // Log
      await client.query(`
        INSERT INTO logs (user_id, action, details)
        VALUES ($1, $2, $3)
      `, [
        adminId,
        'UPDATE_USER',
        JSON.stringify({ targetUserId: id })
      ]);

      return updatedUser;
    });
  }

  // Désactiver utilisateur
  static async deactivateUser(id, adminId) {

    return await db.transaction(async (client) => {

      await UserRepository.deactivate(id, client);

      await client.query(`
        INSERT INTO logs (user_id, action, details)
        VALUES ($1, $2, $3)
      `, [
        adminId,
        'DEACTIVATE_USER',
        JSON.stringify({ targetUserId: id })
      ]);
    });
  }
}

module.exports = UserService;
