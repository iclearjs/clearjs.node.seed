'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        noticeClassCode: {
            name: '通知类型编码',
            type: String
        },
        noticeClassName: {
            name: '通知类型名称',
            type: String
        },
        memo: {
            name: '备注',
            type: String
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};