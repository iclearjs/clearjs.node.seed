'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    exchangeNumber: {
      name: '流水号',
      type: String,
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
    idApplication: {
      name: '来源应用',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_application',
    },
    idPage: {
      name: '数据页面',
      type: app.mongoose.Schema.ObjectId,
      ref: 'cdp_page',
    },
    event: {
      name: '交换时机',
      type: String,
    },
    url: {
      name: '交换接口',
      type: String,
    },
    checkUrl: {
      name: '校验接口接口',
      type: String,
    },
    key: {
      name: '交换数据编码',
      type: String,
    },
    request: {
      name: '交换参数',
      type: Object,
    },
    response: {
      name: '交换回调',
      type: Object,
    },
    memo: {
      name: '备注',
      type: String,
    },
    state: {
      name: '交换状态',
      type: Number,
      default: 1,
    },
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
