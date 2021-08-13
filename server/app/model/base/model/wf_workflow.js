'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idPage: {
      name: '所属页面',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_page',
    },
    code: {
      name: '流程编码',
      type: String,
    },
    name: {
      name: '流程名称',
      type: String,
    },
    version: {
      name: '版本号',
      type: String,
    },
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
