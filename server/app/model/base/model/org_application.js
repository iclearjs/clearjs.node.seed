'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idApplication: {
            name: 'idApplication',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_application'
        },
        license: {
            name: 'license',
            type: Date,
            default: '9999-12-31'
        },
        clientHost: {
            name: 'clientHost',
            type: String,
            default: 'https://cloud.emaiban.com'
        },
        serverHost: {
            name: 'serverHost',
            type: String,
            default: 'https://cloud.emaiban.com'
        },
        clientDevHost: {
            name: 'clientDevHost',
            type: String
        },
        serverDevHost: {
            name: 'serverDevHost',
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