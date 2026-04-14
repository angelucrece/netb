// Contrôleur des utilisateurs pour la gestion des opérations liées aux utilisateurs
const bcrypt = require('bcryptjs');
const db = require('../../config/database');
const logger = require('../../config/logger');

/**
 * Classe UserController
 * Contient les méthodes pour gérer les utilisateurs :
 * - Récupération de la liste des utilisateurs
 * - Récupération d'un utilisateur par ID
 * - Mise à jour d'un utilisateur
 * - Désactivation d'un utilisateur
 * - Récupération du profil de l'utilisateur connecté
 * - Changement de mot de passe de l'utilisateur connecté
 * - Statistiques sur les utilisateurs
 */
// class UserController {
//     /**
//      * Récupère la liste des utilisateurs avec pagination, recherche et filtrage par rôle
//      */
//     static async getAllUsers(req, res) {
//         try {
//             const { search = '', page = 1, limit = 20, role } = req.query;
//             const offset = (page - 1) * limit;

//             logger.info('Récupération liste utilisateurs:', {
//                 adminId: req.user.id,
//                 search,
//                 page,
//                 limit,
//                 role
//             });

//             let whereClause = 'WHERE active = true';
//             let params = [];
//             let paramIndex = 1;
//             if (search) {
//                 whereClause += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
//                 params.push(`%${search}%`);
//                 paramIndex++;
//             }
//             if (role && ['magasinier', 'administrateur'].includes(role)) {
//                 whereClause += ` AND role = $${paramIndex}`;
//                 params.push(role);
//                 paramIndex++;
//             }
//             const query = `
//                 SELECT 
//                     id, email, first_name, last_name, role, active, 
//                     created_at, last_login,
//                     (SELECT COUNT(*) FROM movements WHERE user_id = users.id) as total_movements
//                 FROM users
//                 ${whereClause}
//                 ORDER BY created_at DESC
//                 LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
//             `;
//             params.push(limit, offset);
//             const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
//             const [usersResult, countResult] = await Promise.all([
//                 db.query(query, params),
//                 db.query(countQuery, params.slice(0, -2))
//             ]);
//             const users = usersResult.rows;
//             const total = parseInt(countResult.rows[0].total);
//             const totalPages = Math.ceil(total / limit);
//             logger.debug('Utilisateurs récupérés:', {
//                 count: users.length,
//                 total,
//                 page,
//                 totalPages
//             });
//             res.json({
//                 success: true,
//                 data: users,
//                 pagination: {
//                     page: parseInt(page),
//                     limit: parseInt(limit),
//                     total,
//                     totalPages,
//                     hasNext: page < totalPages,
//                     hasPrev: page > 1
//                 }
//             });
//         } catch (error) {
//             logger.error('Erreur récupération utilisateurs:', {
//                 error: error.message,
//                 adminId: req.user?.id,
//                 stack: error.stack
//             });
//             res.status(500).json({
//                 success: false,
//                 message: 'Erreur lors de la récupération des utilisateurs'
//             });
//         }
//     }

//     /**
//      * Récupère les détails d'un utilisateur par son ID
//      */
//     static async getUserById(req, res) {
//         try {
//             const { id } = req.params;
//             logger.info('Récupération détails utilisateur:', {
//                 userId: id,
//                 adminId: req.user.id
//             });
//             const query = `
//                 SELECT 
//                     u.id, u.email, u.first_name, u.last_name, u.role, u.active, 
//                     u.created_at, u.last_login,
//                     COUNT(m.id) as total_movements,
//                     COUNT(m.id) FILTER (WHERE m.type = 'entry') as total_entries,
//                     COUNT(m.id) FILTER (WHERE m.type = 'exit') as total_exits,
//                     COUNT(m.id) FILTER (WHERE m.status = 'pending') as pending_movements
//                 FROM users u
//                 LEFT JOIN movements m ON u.id = m.user_id
//                 WHERE u.id = $1 AND u.active = true
//                 GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.active, u.created_at, u.last_login
//             `;
//             const result = await db.query(query, [id]);
//             if (result.rows.length === 0) {
//                 logger.warn('Utilisateur non trouvé:', { userId: id, adminId: req.user.id });
//                 return res.status(404).json({
//                     success: false,
//                     message: 'Utilisateur non trouvé'
//                 });
//             }
//             const user = result.rows[0];
//             const recentMovementsQuery = `
//                 SELECT 
//                     m.id, m.type, m.quantity, m.status, m.date, m.motif,
//                     p.name as product_name, p.barcode
//                 FROM movements m
//                 JOIN products p ON m.product_id = p.id
//                 WHERE m.user_id = $1
//                 ORDER BY m.date DESC
//                 LIMIT 10
//             `;
//             const recentMovementsResult = await db.query(recentMovementsQuery, [id]);
//             logger.debug('Détails utilisateur récupérés:', { userId: id });
//             res.json({
//                 success: true,
//                 data: {
//                     ...user,
//                     total_movements: parseInt(user.total_movements),
//                     total_entries: parseInt(user.total_entries),
//                     total_exits: parseInt(user.total_exits),
//                     pending_movements: parseInt(user.pending_movements),
//                     recentMovements: recentMovementsResult.rows
//                 }
//             });
//         } catch (error) {
//             logger.error('Erreur récupération utilisateur:', {
//                 error: error.message,
//                 userId: req.params.id,
//                 adminId: req.user?.id,
//                 stack: error.stack
//             });
//             res.status(500).json({
//                 success: false,
//                 message: "Erreur lors de la récupération de l'utilisateur"
//             });
//         }
//     }

//     /**
//      * Met à jour les informations d'un utilisateur
//      */
//     static async updateUser(req, res) {
//         try {
//             const { id } = req.params;
//             const { firstName, lastName, role, active } = req.body;
//             if (!firstName || !lastName || !role) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Prénom, nom et rôle sont requis'
//                 });
//             }
//             if (!['magasinier', 'administrateur'].includes(role)) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Rôle doit être magasinier ou administrateur'
//                 });
//             }
//             logger.info('Modification utilisateur:', {
//                 userId: id,
//                 adminId: req.user.id
//             });
//             const existingUser = await db.query(
//                 'SELECT * FROM users WHERE id = $1 AND active = true',
//                 [id]
//             );
//             if (existingUser.rows.length === 0) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'Utilisateur non trouvé'
//                 });
//             }
//             const oldUser = existingUser.rows[0];
//             if (parseInt(id) === req.user.id && active === false) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Vous ne pouvez pas désactiver votre propre compte'
//                 });
//             }
//             const result = await db.transaction(async (client) => {
//                 const updateQuery = `
//                     UPDATE users
//                     SET first_name = $1, last_name = $2, role = $3, active = $4, updated_at = CURRENT_TIMESTAMP
//                     WHERE id = $5
//                     RETURNING id, email, first_name, last_name, role, active, updated_at
//                 `;
//                 const updateResult = await client.query(updateQuery, [
//                     firstName.trim(),
//                     lastName.trim(),
//                     role,
//                     active !== undefined ? active : true,
//                     id
//                 ]);
//                 const updatedUser = updateResult.rows[0];
//                 const changes = {};
//                 if (oldUser.first_name !== firstName) changes.firstName = { old: oldUser.first_name, new: firstName };
//                 if (oldUser.last_name !== lastName) changes.lastName = { old: oldUser.last_name, new: lastName };
//                 if (oldUser.role !== role) changes.role = { old: oldUser.role, new: role };
//                 if (oldUser.active !== (active !== undefined ? active : true)) changes.active = { old: oldUser.active, new: active };
//                 await client.query(`
//                     INSERT INTO logs (user_id, action, details)
//                     VALUES ($1, $2, $3)
//                 `, [
//                     req.user.id,
//                     'UPDATE_USER',
//                     JSON.stringify({
//                         targetUserId: id,
//                         changes
//                     })
//                 ]);
//                 return updatedUser;
//             });
//             logger.info('Utilisateur modifié avec succès:', {
//                 userId: id,
//                 adminId: req.user.id
//             });
//             req.io.to(`user_${id}`).emit('profileUpdated', {
//                 message: 'Votre profil a été mis à jour par un administrateur',
//                 changes: {
//                     firstName: result.first_name,
//                     lastName: result.last_name,
//                     role: result.role,
//                     active: result.active
//                 }
//             });
//             res.json({
//                 success: true,
//                 message: 'Utilisateur modifié avec succès',
//                 data: result
//             });
//         } catch (error) {
//             logger.error('Erreur modification utilisateur:', {
//                 error: error.message,
//                 userId: req.params.id,
//                 adminId: req.user?.id,
//                 stack: error.stack
//             });
//             res.status(500).json({
//                 success: false,
//                 message: "Erreur lors de la modification de l'utilisateur"
//             });
//         }
//     }

//     /**
//      * Désactive un utilisateur (soft delete)
//      */
//     static async deactivateUser(req, res) {
//         try {
//             const { id } = req.params;
//             logger.info('Désactivation utilisateur:', {
//                 userId: id,
//                 adminId: req.user.id
//             });
//             if (parseInt(id) === req.user.id) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Vous ne pouvez pas désactiver votre propre compte'
//                 });
//             }
//             const userResult = await db.query(
//                 'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1 AND active = true',
//                 [id]
//             );
//             if (userResult.rows.length === 0) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'Utilisateur non trouvé'
//                 });
//             }
//             const user = userResult.rows[0];
//             await db.transaction(async (client) => {
//                 await client.query(
//                     'UPDATE users SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
//                     [id]
//                 );
//                 await client.query(`
//                     INSERT INTO logs (user_id, action, details)
//                     VALUES ($1, $2, $3)
//                 `, [
//                     req.user.id,
//                     'DEACTIVATE_USER',
//                     JSON.stringify({
//                         targetUserId: id,
//                         email: user.email,
//                         firstName: user.first_name,
//                         lastName: user.last_name,
//                         role: user.role
//                     })
//                 ]);
//             });
//             logger.info('Utilisateur désactivé avec succès:', {
//                 userId: id,
//                 email: user.email,
//                 adminId: req.user.id
//             });
//             req.io.to(`user_${id}`).emit('accountDeactivated', {
//                 message: 'Votre compte a été désactivé par un administrateur'
//             });
//             res.json({
//                 success: true,
//                 message: 'Utilisateur désactivé avec succès'
//             });
//         } catch (error) {
//             logger.error('Erreur désactivation utilisateur:', {
//                 error: error.message,
//                 userId: req.params.id,
//                 adminId: req.user?.id,
//                 stack: error.stack
//             });
//             res.status(500).json({
//                 success: false,
//                 message: "Erreur lors de la désactivation de l'utilisateur"
//             });
//         }
//     }

//     /**
//      * Récupère le profil de l'utilisateur connecté
//      */
//     static async getMyProfile(req, res) {
//         try {
//             logger.info('Récupération profil utilisateur:', { userId: req.user.id });
//             const query = `
//                 SELECT 
//                     u.id, u.email, u.first_name, u.last_name, u.role, u.created_at, u.last_login,
//                     COUNT(m.id) as total_movements,
//                     COUNT(m.id) FILTER (WHERE m.type = 'entry') as total_entries,
//                     COUNT(m.id) FILTER (WHERE m.type = 'exit') as total_exits,
//                     COUNT(m.id) FILTER (WHERE m.status = 'pending') as pending_movements
//                 FROM users u
//                 LEFT JOIN movements m ON u.id = m.user_id
//                 WHERE u.id = $1 AND u.active = true
//                 GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.created_at, u.last_login
//             `;
//             const result = await db.query(query, [req.user.id]);
//             if (result.rows.length === 0) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'Profil utilisateur non trouvé'
//                 });
//             }
//             const profile = result.rows[0];
//             logger.debug('Profil utilisateur récupéré:', { userId: req.user.id });
//             res.json({
//                 success: true,
//                 data: {
//                     ...profile,
//                     total_movements: parseInt(profile.total_movements),
//                     total_entries: parseInt(profile.total_entries),
//                     total_exits: parseInt(profile.total_exits),
//                     pending_movements: parseInt(profile.pending_movements)
//                 }
//             });
//         } catch (error) {
//             logger.error('Erreur récupération profil:', {
//                 error: error.message,
//                 userId: req.user?.id,
//                 stack: error.stack
//             });
//             res.status(500).json({
//                 success: false,
//                 message: 'Erreur lors de la récupération du profil'
//             });
//         }
//     }

//     /**
//      * Permet à l'utilisateur connecté de changer son mot de passe
//      */
//     static async updateMyPassword(req, res) {
//         try {
//             const { currentPassword, newPassword } = req.body;
//             logger.info('Changement mot de passe utilisateur:', { userId: req.user.id });
//             const userResult = await db.query(
//                 'SELECT password FROM users WHERE id = $1 AND active = true',
//                 [req.user.id]
//             );
//             if (userResult.rows.length === 0) {
//                 return res.status(404).json({
//                     success: false,
//                     message: 'Utilisateur non trouvé'
//                 });
//             }
//             const user = userResult.rows[0];
//             const isValidPassword = await bcrypt.compare(currentPassword, user.password);
//             if (!isValidPassword) {
//                 logger.warn('Tentative changement mot de passe avec ancien incorrect:', {
//                     userId: req.user.id
//                 });
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Mot de passe actuel incorrect'
//                 });
//             }
//             const saltRounds = 12;
//             const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
//             await db.transaction(async (client) => {
//                 await client.query(
//                     'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
//                     [hashedNewPassword, req.user.id]
//                 );
//                 await client.query(`
//                     INSERT INTO logs (user_id, action, details)
//                     VALUES ($1, $2, $3)
//                 `, [
//                     req.user.id,
//                     'CHANGE_PASSWORD',
//                     JSON.stringify({
//                         timestamp: new Date().toISOString()
//                     })
//                 ]);
//             });
//             logger.info('Mot de passe modifié avec succès:', { userId: req.user.id });
//             res.json({
//                 success: true,
//                 message: 'Mot de passe modifié avec succès'
//             });
//         } catch (error) {
//             logger.error('Erreur changement mot de passe:', {
//                 error: error.message,
//                 userId: req.user?.id,
//                 stack: error.stack
//             });
//             res.status(500).json({
//                 success: false,
//                 message: 'Erreur lors du changement de mot de passe'
//             });
//         }
//     }

//     /**
//      * Récupère des statistiques globales sur les utilisateurs
//      */
//     static async getUserStats(req, res) {
//         try {
//             logger.info('Récupération statistiques utilisateurs:', { adminId: req.user.id });
//             const statsQuery = `
//                 SELECT 
//                     COUNT(*) as total_users,
//                     COUNT(*) FILTER (WHERE role = 'administrateur') as admin_count,
//                     COUNT(*) FILTER (WHERE role = 'magasinier') as magasinier_count,
//                     COUNT(*) FILTER (WHERE active = true) as active_users,
//                     COUNT(*) FILTER (WHERE active = false) as inactive_users,
//                     COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '7 days') as active_week,
//                     COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '30 days') as active_month
//                 FROM users
//             `;
//             const result = await db.query(statsQuery);
//             const stats = result.rows[0];
//             logger.debug('Statistiques utilisateurs récupérées');
//             res.json({
//                 success: true,
//                 data: {
//                     totalUsers: parseInt(stats.total_users),
//                     adminCount: parseInt(stats.admin_count),
//                     magasinierCount: parseInt(stats.magasinier_count),
//                     activeUsers: parseInt(stats.active_users),
//                     inactiveUsers: parseInt(stats.inactive_users),
//                     activeThisWeek: parseInt(stats.active_week),
//                     activeThisMonth: parseInt(stats.active_month)
//                 }
//             });
//         } catch (error) {
//             logger.error('Erreur récupération statistiques utilisateurs:', {
//                 error: error.message,
//                 adminId: req.user?.id,
//                 stack: error.stack
//             });
//             res.status(500).json({
//                 success: false,
//                 message: 'Erreur lors de la récupération des statistiques'
//             });
//         }
//     }
// }

// // Export des méthodes du contrôleur sous forme d'objet pour utilisation dans les routes
// module.exports = {
//     getAllUsers: UserController.getAllUsers,
//     getUserById: UserController.getUserById,
//     updateUser: UserController.updateUser,
//     deactivateUser: UserController.deactivateUser,
//     getMyProfile: UserController.getMyProfile,
//     updateMyPassword: UserController.updateMyPassword,
//     getUserStats: UserController.getUserStats
// };



const UserService = require('./UserService');

/**
 * Controller User
 */
class UserController {

  // GET /users
  static async getAll(req, res) {
    try {
      const users = await UserService.getUsers(req.query);

      // res.json({
      //   success: true,
      //   data: users
      // });
      res.json([{ id: 1, name: "Test User" }]);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /users/:id
  static async getById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }


    // POST /users
  static async create(req, res) {
    try {
      const user = await UserService.createUser(req.body);

      res.status(201).json({
        success: true,
        data: user
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
}

  // PUT /users/:id
  static async update(req, res) {
    try {
      const result = await UserService.updateUser(
        req.params.id,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /users/:id
  static async delete(req, res) {
    try {
      await UserService.deactivateUser(
        req.params.id,
        req.user?.id
      );

      res.json({
        success: true
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = UserController;