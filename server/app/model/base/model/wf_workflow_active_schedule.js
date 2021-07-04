'use strict';

module.exports = app => {

    const collection = require('path').basename(__filename, '.js');

    const attributes = {
        name: {
            name: 'name',
            type: String
        },
        description: {
            name: 'description',
            type: String
        },
        billCode: {
            name: 'billCode',
            type: String
        },
        type: {
            name: 'type',
            type: String
        },
        idWorkflow: {
            name: 'idWorkflow',
            type: app.mongoose.Schema.ObjectId,
            ref: 'wf_workflow'
        },
        idWorkflowMember: {
            name: 'idWorkflowMember',
            type: app.mongoose.Schema.ObjectId,
            ref: 'wf_workflow_design'
        },
        idUser: {
            name: 'idUser',
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_user'
        },
        overdueDay: {
            name: '审批截止日期',
            type: Date
        },
        takeEffectTime: {
            name: 'takeEffectTime',
            type: Date
        },
    };

    const schema = app.MongooseSchema(collection, attributes, true, false, false);

    return app.mongooseDB.get('default').model(collection, require('fs').existsSync(require('path').resolve(__dirname, '../middleware/' + collection + '.js')) ? require('../middleware/' + collection)(app, schema) : schema, collection);

};