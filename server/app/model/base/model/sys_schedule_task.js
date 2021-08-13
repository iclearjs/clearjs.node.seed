'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    takeEffectTime: {
      name: '触发时间',
      type: Date,
    },
    type: {
      name: 'type',
      type: String,
    },
    meta: {
      name: 'meta',
      type: Object,
      default: {},
    },
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
