'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idApplication: {
      name: 'idApplication',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_application',
    },
    idPage: {
      name: 'idPage',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_page',
    },
    controlType: {
      name: 'controlType',
      type: String,
    },
    p_id: {
      name: 'p_id',
      type: String,
      default: '0',
    },
    name: {
      name: 'name',
      type: String,
    },
    location: {
      name: 'location',
      type: String,
    },
    type: {
      name: 'type',
      type: String,
    },
    icon: {
      name: 'icon',
      type: String,
    },
    routeName: {
      name: 'routeName',
      type: String,
    },
    routePath: {
      name: 'routePath',
      type: String,
    },
    resolvePath: {
      name: 'resolvePath',
      type: String,
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
