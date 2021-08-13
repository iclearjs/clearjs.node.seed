'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idApplication: {
      name: 'idApplication',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_application',
    },
    code: {
      name: '事件编码',
      type: String,
    },
    name: {
      name: '事件名称',
      type: String,
    },
    description: {
      name: '事件描述',
      type: String,
    },
    type: {
      name: '事件类型',
      type: String,
    },
    template: {
      name: '模板',
      type: String,
    },
    idMenu: {
      name: '跳转页面',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_menu',
    },
    idEntity: {
      name: '数据来源',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_entity',
    },
    params: [ new app.mongoose.Schema({
      param: {
        name: '参数',
        type: String,
      },
      source: {
        name: '来源',
        type: String,
      },
      field: {
        name: '字段',
        type: String,
      },
    }) ],
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
