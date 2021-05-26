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
        type: {
            name: 'type',
            type: String
        },
        intro: {
            name: 'intro',
            type: String
        },
        dsCollection: {
            name: 'dsCollection',
            type: String
        },
        dsConfig: {
            name: 'dsConfig',
            type: Object,
            default: '{}'
        },
        order: {
            name: 'order',
            type: Number,
            default: '999'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, false, false, false);

    return app.mongooseDB.get('default').model(collection, schema, collection);

};