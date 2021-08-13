'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idNewsClass: {
      name: '公告分类',
      type: app.mongoose.Schema.ObjectId,
      ref: 'org_notice_class',
    },
    title: {
      name: '标题',
      type: String,
    },
    content: {
      name: '内容',
      type: String,
    },
    order: {
      name: '排序',
      type: Number,
      default: 999,
    },
    idFiles: [ new app.mongoose.Schema({
      idFile: {
        name: '附件',
        type: app.mongoose.Schema.ObjectId,
        ref: 'sys_file',
      },
    }) ],
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
