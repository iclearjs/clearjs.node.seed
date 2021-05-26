'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        organCode: {
            name: '组织编码',
            type: String
        },
        organName: {
            name: '组织名称',
            type: String
        },
        p_id: {
            name: '上级组织',
            type: String,
            default: '0'
        },
        order: {
            name: '排序号',
            type: Number
        },
        idGroupOrgan: {
            name: '集团组织',
            type: app.mongoose.Schema.ObjectId,
            ref: 'org_organ'
        },
    };

    const schema = app.MongooseSchema(collection, attributes, false, true, false);

    return app.mongooseDB.get('default').model(collection, schema, collection);

};