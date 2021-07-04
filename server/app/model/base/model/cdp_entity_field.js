'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idEntity: {
            name: 'idEntity',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_entity'
        },
        p_id: {
            name: '上级节点',
            type: String
        },
        name: {
            name: 'name',
            type: String
        },
        field: {
            name: 'field',
            type: String
        },
        type: {
            name: 'type',
            type: String
        },
        defaultValue: {
            name: 'defaultValue',
            type: String
        },
        refer: {
            name: 'refer',
            type: String
        },
        childType: {
            name: 'childType',
            type: String
        },
        childSeparate: {
            name: 'childSeparate',
            type: Boolean
        },
        order: {
            name: '排序',
            type: Number,
            default: 999
        },
        isAutoCode: {
            name: 'isAutoCode',
            type: Boolean
        },
        enums: {
            name: '枚举值域',
            type: Array
        },
    };

    const schema = app.MongooseSchema(collection, attributes, false, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};