'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        idDuty: {
            name: '职责id',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_duty'
        },
        idApplication: {
            name: '应用id',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_application'
        },
        idMenu: {
            name: '组件id',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_menu'
        },
        idMenuButton: {
            name: '组件按钮id',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_menu_button'
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