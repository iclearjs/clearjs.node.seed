'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idPage: {
            name: 'idPage',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_page'
        },
        mode: {
            name: 'mode',
            type: String
        },
        p_id: {
            name: '上级节点',
            type: String,
            default: '0'
        },
        field: {
            name: 'field',
            type: String
        },
        name: {
            name: 'name',
            type: String
        },
        widget: {
            name: 'widget',
            type: String
        },
        listWidth: {
            name: 'listWidth',
            type: Number
        },
        cardWidth: {
            name: 'cardWidth',
            type: Number
        },
        listVisible: {
            name: 'listVisible',
            type: Boolean,
            default: 'true'
        },
        cardVisible: {
            name: 'cardVisible',
            type: Boolean,
            default: 'true'
        },
        readonly: {
            name: 'readonly',
            type: Boolean
        },
        required: {
            name: 'required',
            type: Boolean
        },
        virtual: {
            name: 'virtual',
            type: Boolean
        },
        idEnum: {
            name: 'idEnum',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_enum'
        },
        idRefer: {
            name: 'idRefer',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_page'
        },
        referStorage: {
            name: 'referStorage',
            type: String
        },
        referDisplay: {
            name: 'referDisplay',
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