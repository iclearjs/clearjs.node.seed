'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idMenu: {
      name: 'idMenu',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_menu',
    },
    name: {
      name: 'name',
      type: String,
    },
    type: {
      name: 'type',
      type: String,
    },
    action: {
      name: 'action',
      type: String,
    },
    group: {
      name: 'group',
      type: String,
      default: 'default',
    },
    icon: {
      name: 'icon',
      type: String,
    },
    event: {
      name: 'event',
      type: String,
    },
    location: {
      name: 'location',
      type: String,
      default: 'default',
    },
    order: {
      name: '排序',
      type: Number,
      default: 999,
    },
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
