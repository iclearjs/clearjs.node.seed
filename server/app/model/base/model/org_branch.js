'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        branchCode: {
            name: '部门编码',
            type: String
        },
        branchName: {
            name: '部门名称',
            type: String
        },
        p_id: {
            name: '上级部门',
            type: String
        },
        order: {
            name: '排序号',
            type: Number
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, true, false);

    return app.mongooseDB.get('default').model(collection, schema, collection);

};