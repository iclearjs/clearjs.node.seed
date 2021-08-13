'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    telephone: {
      name: '手机号',
      type: String,
    },
    response: {
      name: '回执',
      type: Object,
    },
    sendParams: {
      name: '发送配置',
      type: Object,
    },
    noticeStrDate: {
      name: '提醒消息频率控制字段',
      type: String,
    },
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
