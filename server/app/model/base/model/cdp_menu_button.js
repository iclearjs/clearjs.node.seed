'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idMenu: {
            name: 'idMenu',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_menu'
        },
        name: {
            name: 'name',
            type: String
        },
        type: {
            name: 'type',
            type: String
        },
        action: {
            name: 'action',
            type: String,
            default: 'single'
        },
        group: {
            name: 'group',
            type: String,
            default: 'default'
        },
        icon: {
            name: 'icon',
            type: String
        },
        event: {
            name: 'event',
            type: String
        },
        location: {
            name: 'location',
            type: String,
            default: 'default'
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