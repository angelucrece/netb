// modules/roles/role.controller.js
// Description : Controller pour gérer les rôles

// const RoleService = require('./RoleService');

// class RoleController {
//   static async getAll(req, res) {
//     try {
//       const roles = await RoleService.getAllRoles();
//       res.json(roles);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }

//   static async getById(req, res) {
//     try {
//       const role = await RoleService.getRoleById(req.params.id);
//       res.json(role);
//     } catch (err) {
//       res.status(404).json({ error: err.message });
//     }
//   }

//   static async create(req, res) {
//     try {
//       const role = await RoleService.createRole(req.body);
//       res.status(201).json(role);
//     } catch (err) {
//       res.status(400).json({ error: err.message });
//     }
//   }

//   static async update(req, res) {
//     try {
//       const updatedRole = await RoleService.updateRole(req.params.id, req.body);
//       res.json(updatedRole);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }

//   static async delete(req, res) {
//     try {
//       await RoleService.deleteRole(req.params.id);
//       res.json({ message: 'Role deleted successfully' });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }
// }

// module.exports = RoleController;

const RoleService = require('./RoleService');

/**
 * Controller = gestion des requêtes HTTP
 */
class RoleController {

  // GET /roles
  static async getAll(req, res) {
    try {
      const roles = await RoleService.getRoles();

      res.json({
        success: true,
        data: roles
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /roles/:id
  static async getById(req, res) {
    try {
      const role = await RoleService.getRoleById(req.params.id);

      res.json({
        success: true,
        data: role
      });

    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /roles
  static async create(req, res) {
    try {
      const role = await RoleService.createRole(req.body);

      res.status(201).json({
        success: true,
        data: role
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
}
    // PUT /roles/:id
  static async update(req, res) {
    try {
      const updatedRole = await RoleService.updateRole(req.params.id, req.body);

      res.json({
        success: true,
        data: updatedRole
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // DELETE /roles/:id
  static async delete(req, res) {
    try {
      await RoleService.deleteRole(req.params.id);

      res.json({
        success: true,
        message: 'Rôle supprimé avec succès'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = RoleController;