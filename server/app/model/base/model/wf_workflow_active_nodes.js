'use strict';



module.exports = app => {
    const model = require('path').basename(__filename, '.js');
    let workflowKey = {
        workId:{
            type: String,
        },
    };
    const attributes = {
        ...workflowKey,
        label: {
            type: String
        },
        idWorkflowMember: {
            type: app.mongoose.Types.ObjectId,
            ref:'wf_workflow_design'
        },

        /* 状态 __s: 1、进入节点 2、操作中（会签、改派、）*/
    };

    const schema = app.MongooseSchema(model, attributes);

    return app.mongooseDB.get('default').model(model, schema, model);
};
