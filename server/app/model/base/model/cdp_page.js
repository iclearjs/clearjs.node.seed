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
        idEntityList: {
            name: 'idEntityList',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_entity'
        },
        idEntityCard: {
            name: 'idEntityCard',
            type: app.mongoose.Schema.ObjectId,
            ref: 'cdp_entity'
        },
        listConfig: {
            name: 'listConfig',
            type: Object,
            default: {
                "pipeline": {}
            }
        },
        formConfig: {
            name: 'formConfig',
            type: Object,
            default: {}
        },
        isWorkflow: {
            name: 'isWorkflow',
            type: Boolean
        },
        order: {
            name: '排序',
            type: Number,
            default: 999
        },
    };

    const schema = app.MongooseSchema(collection, attributes, false, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};