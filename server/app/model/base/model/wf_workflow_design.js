'use strict';



module.exports = app => {
    const model = require('path').basename(__filename, '.js');

    const attributes = {

        idWorkflow: {
            type: app.mongoose.Types.ObjectId,
            ref:'wf_workflow'
        },

        /* public*/
        id: {
            type: String
        },
        label: {
            type: String
        },
        description: {
            type: String
        },

        memberType: {
            type: String,
            enum:['node','edge']
        },

        nodeType: {
            type: String
        },



        /* node */

        /* G6 属性*/
        anchorPoints: {
            type: Array
        },
        x: {
            type: Number
        },
        y: {
            type: Number
        },
        type: {
            type: String
        },
        linkPoints: {
            type: Object
        },
        /* 流程 属性*/
        isSendMessage: {
            name:'是否发送系统通知',
            type: Boolean,
            default:false
        },
        isSendShortMessage: {
            name:'是否发送短信通知',
            type: Boolean,
            default:false
        },
        isAllowCounterSig: {
            name:'是否允许加签',
            type: Boolean,
            default:false
        },
        isAllowChangeSig: {
            name:'是否允许改签',
            type: Boolean,
            default:false
        },
        isAllowPointSig: {
            name:'是否允许指派',
            type: Boolean,
            default:false
        },
        preemptType:{
            name:'审核抢占模式',
            type: String,
            enum:['countersign','preempt'],
            default:'preempt'
        },
        countersignValue:{
            name:'会签阈值',
            type: Number,
        },
        rejectType: {
            name:'驳回处理方式',
            type: String,
            enum:['stop','next'],
            default:'stop'
        },
        mergeType: {
            name:'合并方式',
            type: String,
            enum:['or','and'],
            default:'or'
        },
        branchType: {
            name:'分支方式',
            type: String,
            enum:['or','and'],
            default:'or'
        },
        overdueDays: {
            name:'逾期天数',
            type: Number,
        },
        overdueNoticeDays: {
            name:'逾期提醒天数',
            type: Number,
        },

        /* edge */

        /* G6 属性*/
        source: {
            type: String
        },
        target: {
            type: String
        },
        /* 流程属性 */
        condType:{
            type:String,
            enum:['null','cond','other','defaultError','error'],
            default:'cond'
        },
        resultType:{
            name:'审批结果',
            type: String,
            enum:['NULL','YES','NO'],
            default:'YES'
        },
        filter: {
            name: '条件设置',
            type: Array,
            default:[]
        },
    };

    const schema = app.MongooseSchema(model, attributes);

    return app.mongooseDB.get('default').model(model, schema, model);
};
