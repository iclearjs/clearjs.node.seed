'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idPage: {
      name: 'idPage',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_page',
    },
    name: {
      name: 'name',
      type: String,
    },
    type: {
      name: 'type',
      type: String,
    },
    filter: {
      name: 'filter',
      type: Array,
    },
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
