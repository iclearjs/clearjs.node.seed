'use strict';



module.exports = app => {
    const model = require('path').basename(__filename, '.js');

    const attributes = {
        name: {
            type: String
        },
        description: {
            type: String,
        },
        billCode: {
            type: String,
        },
        type:{
            type:String,
            enum:['overdue','overdueNotice']
        },
        meta:{
            type:{}
        },
        idWorkflow:{
            type:app.mongoose.Types.ObjectId,
            ref:'wf_workflow'
        },
        idWorkflowMember:{
            type:app.mongoose.Types.ObjectId,
            ref:'wf_workflow_design'
        },
        idUser:{
            type:app.mongoose.Types.ObjectId,
            ref:'sys_user'
        },
        overdueDay:{
            type:Date,
            name:'审批截止日期',
        },
        takeEffectTime:{
            type:Date
        }
    };

    const schema = app.MongooseSchema(model, attributes);

    return app.mongooseDB.get('default').model(model, schema, model);
};
