const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/ApiResponse');
const SiteService = require('./SiteService');

const getAll = asyncHandler(async (req, res) => {
  const sites = await SiteService.getSites(true);
  success(res, sites);
});

const getById = asyncHandler(async (req, res) => {
  const site = await SiteService.getSiteById(parseInt(req.params.id));
  success(res, site);
});

const create = asyncHandler(async (req, res) => {
  const site = await SiteService.createSite(req.body);
  created(res, site, 'Site créé avec succès');
});

const update = asyncHandler(async (req, res) => {
  const site = await SiteService.updateSite(parseInt(req.params.id), req.body);
  success(res, site, 'Site mis à jour');
});

const toggle = asyncHandler(async (req, res) => {
  const site = await SiteService.toggleSite(parseInt(req.params.id), req.body.active);
  success(res, site, `Site ${req.body.active ? 'activé' : 'désactivé'}`);
});

const remove = asyncHandler(async (req, res) => {
  await SiteService.deleteSite(parseInt(req.params.id));
  success(res, null, 'Site supprimé');
});

module.exports = { getAll, getById, create, update, toggle, remove };
