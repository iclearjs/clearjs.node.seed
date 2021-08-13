'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    branchCode: {
      name: '部门编码',
      type: String,
    },
    branchName: {
      name: '部门名称',
      type: String,
    },
    p_id: {
      name: '上级部门',
      type: String,
      default: '0',
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
