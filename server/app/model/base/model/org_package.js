'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idPackage: {
            name: 'idPackage',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_package'
        },
        clientHost: {
            name: 'clientHost',
            type: String
        },
        version: {
            name: 'String',
            type: String
        },
        order: {
            name: '排序号',
            type: Number,
            default: '999'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, true, false);

    return app.mongooseDB.get('default').model(collection, schema, collection);

};
