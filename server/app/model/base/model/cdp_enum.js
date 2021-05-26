'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idApplication: {
            name: 'idApplication',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_application'
        },
        code: {
            name: 'code',
            type: String
        },
        name: {
            name: 'name',
            type: String
        },
        range: {
            name: 'range',
            type: Array
        },
        order: {
            name: 'order',
            type: Number,
            default: '999'
        },
        code: {
            name: '编码',
            type: String
        },
        name: {
            name: '名称',
            type: String
        },
        order: {
            name: '排序',
            type: String
        },
    };

    const schema = app.MongooseSchema(collection, attributes, false, false, false);

    return app.mongooseDB.get('default').model(collection, schema, collection);

};