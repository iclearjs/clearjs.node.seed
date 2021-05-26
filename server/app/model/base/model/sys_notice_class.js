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

    const schema = app.MongooseSchema(collection, attributes, true, true, false);

    return app.mongooseDB.get('default').model(collection, schema, collection);

};