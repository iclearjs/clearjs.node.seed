'use strict';



module.exports = app => {
    const model = require('path').basename(__filename, '.js');

    const attributes = {
        idWorkflowMember: {
            type: app.mongoose.Schema.ObjectId,
            ref: 'wf_workflow_design',
        },
        ownerType: {
            type: String,
            enum:['USER','ROLE','DUTY']
        },
        idRole: {
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_role',
        },
        idDuty: {
            type: app.mongoose.Schema.ObjectId,
            ref: 'sys_duty',
        },
        idUser: {
            type: app.mongoose.Schema.ObjectId,
            ref: 'org_organ_user',
        },
        order: {
            name: '排序号',
            type: Number,
            default: 999,
        },
    };

    const schema = app.MongooseSchema(model, attributes);

    return app.mongooseDB.get('default').model(model, schema, model);
};
