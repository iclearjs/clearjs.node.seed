'use strict';

module.exports = app => {

  const collection = require('path').basename(__filename, '.js');

  const attributes = {
    idNewsClass: {
      name: '新闻分类',
      type: app.mongoose.Schema.ObjectId,
      ref: 'org_news_class',
    },
    title: {
      name: '标题',
      type: String,
    },
    subTitle: {
      name: '副标题',
      type: String,
    },
    idCarousel: {
      name: '滚动大图',
      type: app.mongoose.Schema.ObjectId,
      ref: 'sys_file',
    },
    idThumb: {
      name: '缩略图',
      type: app.mongoose.Schema.ObjectId,
      ref: 'sys_file',
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
  };

  const schema = app.MongooseSchema(collection, attributes, true, true, false);

  return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};
