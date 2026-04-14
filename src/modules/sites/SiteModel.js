
// modules/Site/SiteModel.js
// Description : Modèle représentant la table "sites" (DB only)
class Site {
  // ===== Déclaration des attributs =====
    _id;
    _name;       // ex: admin, user
    _description;
    _created_at;
    _adress ;
    _city ;
    _postal_code ;
    _country ;
    _responsible_name ;
    _responsible_email ;
    _responsible_phone ;
    _type ;
    _updated_at ;

  // ===== Constructeur =====
  constructor({ id, name, description, created_at, adress, city, postal_code, country, responsible_name, responsible_email, responsible_phone, type, updated_at }) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._created_at = created_at;
    this._adress = adress;
    this._city = city;
    this._postal_code = postal_code;
    this._country = country;
    this._responsible_name = responsible_name;
    this._responsible_email = responsible_email;
    this._responsible_phone = responsible_phone;
    this._type = type;
    this._updated_at = updated_at || created_at; // date de dernière mise à jour (initialement égale à created_at)
  }

  // ===== Getters =====
  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  get createdAt() {
    return this._created_at;
  }

  // ===== Setters =====
  set name(value) {
    this._name = value;
  }

  set description(value) {
    this._description = value;
  }
}

module.exports = Site;