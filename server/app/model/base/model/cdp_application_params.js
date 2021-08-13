'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idApplication: {
      name: 'idApplication',
      type: app.mongoose.Schema.ObjectId,
    },
    code: {
      name: 'code',
      type: String,
    },
    name: {
      name: 'name',
      type: String,
    },
    type: {
      name: 'type',
      type: String,
    },
    defaultValue: {
      name: 'defaultValue',
      type: String,
    },
    range: {
      name: 'range',
      type: Array,
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
