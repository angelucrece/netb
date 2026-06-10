


const swaggerUi = require('swagger-ui-express');
const logger    = require('./logger');

const spec = {
  openapi: '3.0.0',
  info: { title: 'NethaStock API', version: '1.0.0', description: 'API gestion stock multi-sites' },
  servers: [{ url: 'http://localhost:4000', description: 'Dev local' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth' }, { name: 'Roles' }, { name: 'Sites' }, { name: 'Users' },
    { name: 'Categories' }, { name: 'Products' }, { name: 'Stocks' },
    { name: 'Movements' }, { name: 'Inventory' }, { name: 'Documents' },
    { name: 'Reports' }, { name: 'Notifications' }, { name: 'AuditLogs' },
  ],
  paths: {
    // AUTH
    '/api/v1/auth/login':   { post:  { tags:['Auth'], summary:'Login', security:[], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['email','password'], properties:{ email:{type:'string',example:'naelle@nethastock.com'}, password:{type:'string',example:'VotreMotDePasse'}, site_id:{type:'integer'} } } } } }, responses:{ 200:{description:'accessToken + refreshToken'}, 401:{description:'Identifiants incorrects'} } } },
    '/api/v1/auth/refresh': { post:  { tags:['Auth'], summary:'Refresh token', security:[], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['refreshToken'], properties:{ refreshToken:{type:'string'} } } } } }, responses:{ 200:{description:'Nouveau accessToken'} } } },
    '/api/v1/auth/logout':  { post:  { tags:['Auth'], summary:'Logout', responses:{ 200:{description:'OK'} } } },
    '/api/v1/auth/me':      { get:   { tags:['Auth'], summary:'Mon profil (token)', responses:{ 200:{description:'OK'} } } },

    // ROLES
    '/api/v1/roles':        { get: { tags:['Roles'], summary:'Liste des roles', responses:{ 200:{description:'OK'} } } },
    '/api/v1/roles/{id}':   { get: { tags:['Roles'], summary:'Detail role', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'}, 404:{description:'Not found'} } } },

    // SITES
    '/api/v1/sites': {
      get:  { tags:['Sites'], summary:'Liste sites actifs', security:[], responses:{ 200:{description:'OK'} } },
      post: { tags:['Sites'], summary:'Creer site (admin)', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['name','type'], properties:{ name:{type:'string'}, type:{type:'string',enum:['entrepot','magasin','depot','agence']}, city:{type:'string'}, country:{type:'string'}, responsible_name:{type:'string'}, responsible_email:{type:'string'}, responsible_phone:{type:'string'} } } } } }, responses:{ 201:{description:'Cree'} } },
    },
    '/api/v1/sites/{id}': {
      get:    { tags:['Sites'], summary:'Detail site', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } },
      put:    { tags:['Sites'], summary:'Modifier site (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object' } } } }, responses:{ 200:{description:'OK'} } },
      delete: { tags:['Sites'], summary:'Supprimer site (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'}, 409:{description:'Stock existant'} } },
    },
    '/api/v1/sites/{id}/toggle': { patch: { tags:['Sites'], summary:'Activer/desactiver (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['active'], properties:{ active:{type:'boolean'} } } } } }, responses:{ 200:{description:'OK'} } } },

    // USERS
    '/api/v1/users': {
      get:  { tags:['Users'], summary:'Liste utilisateurs (admin)', parameters:[{in:'query',name:'page',schema:{type:'integer'}},{in:'query',name:'limit',schema:{type:'integer'}},{in:'query',name:'role_id',schema:{type:'integer'}},{in:'query',name:'site_id',schema:{type:'integer'}},{in:'query',name:'active',schema:{type:'boolean'}}], responses:{ 200:{description:'OK'} } },
      post: { tags:['Users'], summary:'Creer utilisateur (admin)', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['email','password','first_name','last_name','role_id'], properties:{ email:{type:'string'}, password:{type:'string'}, first_name:{type:'string'}, last_name:{type:'string'}, role_id:{type:'integer'}, site_id:{type:'integer'} } } } } }, responses:{ 201:{description:'Cree'}, 409:{description:'Email duplique'} } },
    },
    '/api/v1/users/me':          { get:   { tags:['Users'], summary:'Mon profil', responses:{ 200:{description:'OK'} } } },
    '/api/v1/users/me/password': { patch: { tags:['Users'], summary:'Changer mon mot de passe', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['old_password','new_password'], properties:{ old_password:{type:'string'}, new_password:{type:'string'} } } } } }, responses:{ 200:{description:'OK'}, 400:{description:'Ancien mdp incorrect'} } } },
    '/api/v1/users/{id}': {
      get:    { tags:['Users'], summary:'Detail utilisateur (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } },
      put:    { tags:['Users'], summary:'Modifier utilisateur (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object' } } } }, responses:{ 200:{description:'OK'} } },
      delete: { tags:['Users'], summary:'Supprimer utilisateur (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } },
    },
    '/api/v1/users/{id}/toggle': { patch: { tags:['Users'], summary:'Activer/desactiver (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['active'], properties:{ active:{type:'boolean'} } } } } }, responses:{ 200:{description:'OK'} } } },

    // CATEGORIES
    '/api/v1/categories': {
      get:  { tags:['Categories'], summary:'Liste categories', parameters:[{in:'query',name:'site_id',schema:{type:'integer'}},{in:'query',name:'search',schema:{type:'string'}}], responses:{ 200:{description:'OK'} } },
      post: { tags:['Categories'], summary:'Creer categorie (admin)', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['name'], properties:{ name:{type:'string'}, description:{type:'string'}, site_id:{type:'integer'} } } } } }, responses:{ 201:{description:'Cree'}, 409:{description:'Nom duplique'} } },
    },
    '/api/v1/categories/{id}': {
      get:    { tags:['Categories'], summary:'Detail categorie', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } },
      put:    { tags:['Categories'], summary:'Modifier categorie (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object' } } } }, responses:{ 200:{description:'OK'} } },
      delete: { tags:['Categories'], summary:'Supprimer categorie (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'}, 409:{description:'Produits existants'} } },
    },

    // PRODUCTS
    '/api/v1/products': {
      get:  { tags:['Products'], summary:'Liste produits', parameters:[{in:'query',name:'q',schema:{type:'string'}},{in:'query',name:'category_id',schema:{type:'integer'}},{in:'query',name:'site_id',schema:{type:'integer'}},{in:'query',name:'alert',schema:{type:'boolean'}},{in:'query',name:'page',schema:{type:'integer'}},{in:'query',name:'limit',schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } },
      post: { tags:['Products'], summary:'Creer produit (admin) - multipart/form-data', requestBody:{ required:true, content:{ 'multipart/form-data':{ schema:{ type:'object', required:['name'], properties:{ name:{type:'string'}, unit:{type:'string',enum:['piece','kg','litre','metre','boite','carton']}, purchase_price:{type:'number'}, sale_price:{type:'number'}, category_id:{type:'integer'}, barcode:{type:'string'}, description:{type:'string'}, photo:{type:'string',format:'binary'} } } } } }, responses:{ 201:{description:'Cree'} } },
    },
    '/api/v1/products/alerts':         { get:   { tags:['Products'], summary:'Produits sous seuil', parameters:[{in:'query',name:'site_id',schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/products/scan/{barcode}': { get:   { tags:['Products'], summary:'Recherche par code-barres', parameters:[{in:'path',name:'barcode',required:true,schema:{type:'string'}}], responses:{ 200:{description:'OK'}, 404:{description:'Not found'} } } },
    '/api/v1/products/{id}': {
      get:    { tags:['Products'], summary:'Detail produit', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } },
      put:    { tags:['Products'], summary:'Modifier produit (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object' } } } }, responses:{ 200:{description:'OK'} } },
      delete: { tags:['Products'], summary:'Supprimer produit (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } },
    },
    '/api/v1/products/{id}/qrcode':   { get:   { tags:['Products'], summary:'QR Code base64', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/products/{id}/photo':    { patch: { tags:['Products'], summary:'Upload photo (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'multipart/form-data':{ schema:{ type:'object', properties:{ photo:{type:'string',format:'binary'} } } } } }, responses:{ 200:{description:'OK'} } } },
    '/api/v1/products/{id}/variants': { put:   { tags:['Products'], summary:'Gerer variantes (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['variants'], properties:{ variants:{ type:'array', items:{ type:'object', properties:{ type:{type:'string',enum:['taille','couleur','modele']}, value:{type:'string'}, sku_suffix:{type:'string'} } } } } } } } }, responses:{ 200:{description:'OK'} } } },

    // STOCKS
    '/api/v1/stocks':                      { get:  { tags:['Stocks'], summary:'Stock par site', parameters:[{in:'query',name:'site_id',schema:{type:'integer'}},{in:'query',name:'product_id',schema:{type:'integer'}},{in:'query',name:'alert',schema:{type:'boolean'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/stocks/{productId}/{siteId}': { get:  { tags:['Stocks'], summary:'Stock produit/site', parameters:[{in:'path',name:'productId',required:true,schema:{type:'integer'}},{in:'path',name:'siteId',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/stocks/transfer':             { post: { tags:['Stocks'], summary:'Transfert inter-sites', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['product_id','from_site_id','to_site_id','quantity'], properties:{ product_id:{type:'integer'}, from_site_id:{type:'integer'}, to_site_id:{type:'integer'}, quantity:{type:'integer'} } } } } }, responses:{ 200:{description:'OK'}, 400:{description:'Stock insuffisant'} } } },

    // MOVEMENTS
    '/api/v1/movements':                   { get:  { tags:['Movements'], summary:'Historique mouvements', parameters:[{in:'query',name:'type',schema:{type:'string',enum:['entry','exit','transfer','adjustment']}},{in:'query',name:'site_id',schema:{type:'integer'}},{in:'query',name:'status',schema:{type:'string',enum:['pending','validated','rejected']}},{in:'query',name:'date_from',schema:{type:'string',format:'date'}},{in:'query',name:'date_to',schema:{type:'string',format:'date'}},{in:'query',name:'page',schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/movements/pending':           { get:  { tags:['Movements'], summary:'File attente (admin)', parameters:[{in:'query',name:'site_id',schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/movements/{id}':              { get:  { tags:['Movements'], summary:'Detail mouvement', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/movements/in':                { post: { tags:['Movements'], summary:'Entree de stock', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['product_id','site_id','quantity'], properties:{ product_id:{type:'integer'}, site_id:{type:'integer'}, quantity:{type:'integer'}, motif:{type:'string'}, supplier:{type:'string'} } } } } }, responses:{ 201:{description:'Cree'} } } },
    '/api/v1/movements/out':               { post: { tags:['Movements'], summary:'Sortie de stock', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['product_id','site_id','quantity'], properties:{ product_id:{type:'integer'}, site_id:{type:'integer'}, quantity:{type:'integer'}, motif:{type:'string'} } } } } }, responses:{ 201:{description:'Cree'}, 400:{description:'Stock insuffisant'} } } },
    '/api/v1/movements/transfer':          { post: { tags:['Movements'], summary:'Transfert inter-sites (atomique)', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['from_site_id','to_site_id','items'], properties:{ from_site_id:{type:'integer'}, to_site_id:{type:'integer'}, items:{ type:'array', items:{ type:'object', properties:{ product_id:{type:'integer'}, quantity:{type:'integer'} } } }, motif:{type:'string'} } } } } }, responses:{ 201:{description:'OK'} } } },
    '/api/v1/movements/{id}/validate':     { patch: { tags:['Movements'], summary:'Valider mouvement (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/movements/{id}/reject':       { patch: { tags:['Movements'], summary:'Rejeter mouvement (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['rejection_reason'], properties:{ rejection_reason:{type:'string'} } } } } }, responses:{ 200:{description:'OK'} } } },

    // INVENTORY
    '/api/v1/inventory/sessions':                     { get:  { tags:['Inventory'], summary:'Liste sessions', parameters:[{in:'query',name:'site_id',schema:{type:'integer'}},{in:'query',name:'status',schema:{type:'string',enum:['in_progress','closed','validated']}}], responses:{ 200:{description:'OK'} } }, post: { tags:['Inventory'], summary:'Demarrer session', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['site_id','mode'], properties:{ site_id:{type:'integer'}, mode:{type:'string',enum:['complet','tournant']} } } } } }, responses:{ 201:{description:'Cree'}, 409:{description:'Session deja active'} } } },
    '/api/v1/inventory/sessions/active':              { get:  { tags:['Inventory'], summary:'Session en cours sur mon site', responses:{ 200:{description:'OK'}, 404:{description:'Aucune session'} } } },
    '/api/v1/inventory/sessions/{id}':                { get:  { tags:['Inventory'], summary:'Detail session + articles', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/inventory/sessions/{id}/items':          { post: { tags:['Inventory'], summary:'Saisir quantite comptee', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['product_id','counted_qty'], properties:{ product_id:{type:'integer'}, counted_qty:{type:'integer',minimum:0} } } } } }, responses:{ 201:{description:'OK'} } } },
    '/api/v1/inventory/sessions/{id}/items/{itemId}': { put:  { tags:['Inventory'], summary:'Corriger saisie', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}},{in:'path',name:'itemId',required:true,schema:{type:'integer'}}], requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['counted_qty'], properties:{ counted_qty:{type:'integer',minimum:0} } } } } }, responses:{ 200:{description:'OK'} } } },
    '/api/v1/inventory/sessions/{id}/gaps':           { get:  { tags:['Inventory'], summary:'Calculer ecarts', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/inventory/sessions/{id}/validate':       { post: { tags:['Inventory'], summary:'Valider + regulariser stock', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/inventory/sessions/{id}/close':          { post: { tags:['Inventory'], summary:'Fermer sans regulariser', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },

    // DOCUMENTS
    '/api/v1/documents': {
      get:  { tags:['Documents'], summary:'Liste documents', parameters:[{in:'query',name:'type',schema:{type:'string',enum:['reception','sortie','transfert']}},{in:'query',name:'site_id',schema:{type:'integer'}},{in:'query',name:'status',schema:{type:'string'}}], responses:{ 200:{description:'OK'} } },
      post: { tags:['Documents'], summary:'Creer document', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['type','site_id','items'], properties:{ type:{type:'string',enum:['reception','sortie','transfert']}, site_id:{type:'integer'}, destination_site_id:{type:'integer'}, reference:{type:'string'}, notes:{type:'string'}, items:{ type:'array', items:{ type:'object', properties:{ product_id:{type:'integer'}, quantity:{type:'integer'}, unit_price:{type:'number'} } } } } } } } }, responses:{ 201:{description:'Cree'} } },
    },
    '/api/v1/documents/{id}':          { get:  { tags:['Documents'], summary:'Detail document', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/documents/{id}/validate': { post: { tags:['Documents'], summary:'Valider document (admin/controller)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },

    // REPORTS
    '/api/v1/reports/dashboard':             { get: { tags:['Reports'], summary:'KPIs globaux', parameters:[{in:'query',name:'site_id',schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/reports/stock':                 { get: { tags:['Reports'], summary:'Etat stock par site', parameters:[{in:'query',name:'site_id',schema:{type:'integer'}},{in:'query',name:'category_id',schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/reports/movements':             { get: { tags:['Reports'], summary:'Rapport mouvements', parameters:[{in:'query',name:'site_id',schema:{type:'integer'}},{in:'query',name:'date_from',schema:{type:'string',format:'date'}},{in:'query',name:'date_to',schema:{type:'string',format:'date'}},{in:'query',name:'type',schema:{type:'string'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/reports/alerts':                { get: { tags:['Reports'], summary:'Articles critiques', parameters:[{in:'query',name:'site_id',schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/reports/sites/stock':           { get: { tags:['Reports'], summary:'Comparatif stocks par site', responses:{ 200:{description:'OK'} } } },
    '/api/v1/reports/inventory/{sessionId}': { get: { tags:['Reports'], summary:'Rapport session inventaire', parameters:[{in:'path',name:'sessionId',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/reports/export/stock':          { get: { tags:['Reports'], summary:'Export stock PDF/Excel', parameters:[{in:'query',name:'format',schema:{type:'string',enum:['excel','pdf']}},{in:'query',name:'site_id',schema:{type:'integer'}}], responses:{ 200:{description:'Fichier'} } } },
    '/api/v1/reports/export/movements':      { get: { tags:['Reports'], summary:'Export mouvements PDF/Excel', parameters:[{in:'query',name:'format',schema:{type:'string',enum:['excel','pdf']}},{in:'query',name:'date_from',schema:{type:'string',format:'date'}},{in:'query',name:'date_to',schema:{type:'string',format:'date'}}], responses:{ 200:{description:'Fichier'} } } },

    // NOTIFICATIONS
    '/api/v1/notifications':           { get:    { tags:['Notifications'], summary:'Mes notifications', parameters:[{in:'query',name:'read',schema:{type:'boolean'}},{in:'query',name:'page',schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/notifications/read-all':  { patch:  { tags:['Notifications'], summary:'Tout marquer comme lu', responses:{ 200:{description:'OK'} } } },
    '/api/v1/notifications/{id}/read': { patch:  { tags:['Notifications'], summary:'Marquer comme lu', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/notifications/fcm-token': { post:   { tags:['Notifications'], summary:'Enregistrer token FCM', requestBody:{ required:true, content:{ 'application/json':{ schema:{ type:'object', required:['fcm_token'], properties:{ fcm_token:{type:'string'} } } } } }, responses:{ 200:{description:'OK'} } } },
    '/api/v1/notifications/{id}':      { delete: { tags:['Notifications'], summary:'Supprimer notification', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'} } } },

    // AUDIT LOGS
    '/api/v1/audit-logs':         { get: { tags:['AuditLogs'], summary:'Liste logs (admin)', parameters:[{in:'query',name:'user_id',schema:{type:'integer'}},{in:'query',name:'action',schema:{type:'string',example:'PRODUCT'}},{in:'query',name:'entity_type',schema:{type:'string',enum:['product','user','category','movement','inventory_session','stock_document']}},{in:'query',name:'date_from',schema:{type:'string',format:'date'}},{in:'query',name:'date_to',schema:{type:'string',format:'date'}},{in:'query',name:'page',schema:{type:'integer'}},{in:'query',name:'limit',schema:{type:'integer',default:50}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/audit-logs/summary': { get: { tags:['AuditLogs'], summary:'Resume par type action (admin)', parameters:[{in:'query',name:'date_from',schema:{type:'string',format:'date'}},{in:'query',name:'date_to',schema:{type:'string',format:'date'}}], responses:{ 200:{description:'OK'} } } },
    '/api/v1/audit-logs/{id}':    { get: { tags:['AuditLogs'], summary:'Detail log (admin)', parameters:[{in:'path',name:'id',required:true,schema:{type:'integer'}}], responses:{ 200:{description:'OK'}, 404:{description:'Not found'} } } },
  },
};

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: 'NethaStock API Docs',
    swaggerOptions: { persistAuthorization: true },
  }));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(spec);
  });
  const count = Object.keys(spec.paths).length;
  logger.info(`[Swagger] Docs disponibles sur /api-docs (${count} endpoints)`);
}

module.exports = setupSwagger;