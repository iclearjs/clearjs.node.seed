'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idPackage: {
      name: 'idPackage',
      type: String,
    },
    keyword: {
      name: 'keyword',
      type: String,
    },
    name: {
      name: 'name',
      type: String,
    },
    icon: {
      name: 'icon',
      type: String,
    },
    description: {
      name: 'description',
      type: String,
    },
    version: {
      name: 'version',
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
