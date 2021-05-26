'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idApplication: {
            name: 'idApplication',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_application'
        },
        idPage: {
            name: 'idPage',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_page'
        },
        idEntityList: {
            name: 'idEntityList',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_entity'
        },
        idEntityEdit: {
            name: 'idEntityEdit',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_entity'
        },
        p_id: {
            name: 'p_id',
            type: String,
            default: '0'
        },
        name: {
            name: 'name',
            type: String
        },
        location: {
            name: 'location',
            type: String,
            default: 'Layout'
        },
        type: {
            name: 'type',
            type: String,
            default: 'M'
        },
        icon: {
            name: 'icon',
            type: String,
            default: 'folder'
        },
        routeName: {
            name: 'routeName',
            type: String
        },
        routePath: {
            name: 'routePath',
            type: String
        },
        resolvePath: {
            name: 'resolvePath',
            type: String
        },
        meta: {
            name: 'meta',
            type: String
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