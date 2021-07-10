'use strict';

const Controller = require('egg').Controller;

class Bill extends Controller {
    constructor(ctx) {
        super(ctx);
    }

    async getUserWorkflowBill() {
        const {ctx, service} = this;
        const error = {code: '0'};
        const {idUser,idPage} = ctx.request.body;
        if (!idUser) {
            error.code = '100001';
            error.message = 'body params idPage notfound';
        }
        if (!idPage) {
            error.code = '100001';
            error.message = 'body params idPage notfound';
        }
        if (error.code === '0') {
            /* 根据用户查找 需其审核的单据 */
            const filterBillActive = await ctx.model.OrgWorkflowActiveEdges.find({idUser,idPage});
        }
        ctx.body = error.code === '0' ? {error,} : {error};
    }

    /** 一 、 前后端交互 api接口 **/
    async deleteTestWorkflowMember() {
        const {ctx} = this;
        let error = {code: '0'};
        let {workId} = ctx.request.query;
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        let record;
        if (error.code === '0') {
            await ctx.model.WfWorkflowActive.remove({workId});
            await ctx.model.WfWorkflowActiveNodes.remove({workId});
            await ctx.model.WfWorkflowActiveLog.remove({workId});
        }
        ctx.body = error.code === '0' ? {error, record} : {error};
    }

    async workflowEnter() {
        const {ctx} = this;
        let error = {code: '0'};
        let {idWorkflow, workId} = ctx.request.body;
        if (!idWorkflow) {
            error.code = '10104';
            error.message = 'params idWorkflow missing'
        }
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        let record;
        if (error.code === '0') {
            await ctx.service.coreWorkflow.enterWorkflow({idWorkflow, workId}).then(({error: err, record: rec}) => {
                error = err;
                record = rec;
                return rec
            })
        }
        ctx.body = error.code === '0' ? {error, record} : {error};
    }

    /* 重新发起审批流 */
    async workflowAgain() {
        const {ctx} = this;
        let error = {code: '0'};
        let {workId, idWorkflow, idUser} = ctx.request.body;
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        if (!idWorkflow) {
            error.code = '10104';
            error.message = 'params source missing'
        }
        let record;
        if (error.code === '0') {
            const user = await ctx.model.SysUser.findOne({_id:idUser});
            await ctx.service.coreWorkflow.createWorkflowLog({workId, memo: '重新发起审批流', description: `${user.userName}重新发起审批流`}, 'again',);
            await ctx.service.coreWorkflow.enterWorkflow({idWorkflow, workId}).then(({error: err, record: rec}) => {
                error = err;
                record = rec;
                return rec
            })
        }
        ctx.body = error.code === '0' ? {error, record} : {error};
    }

    async getWorkflowDesign() {
        const {ctx} = this;
        let error = {code: '0'};
        let {workId} = ctx.request.query;
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        let record;
        if (error.code === '0') {
            await ctx.service.coreWorkflow.getWorkflowDesignByWorkId(workId).then(({error: err, record: rec}) => {
                error = err;
                record = rec;
                return rec
            })
        }
        ctx.body = error.code === '0' ? {error, record} : {error};
    }

    async getWorkflowActiveNodes() {
        const {ctx} = this;
        let error = {code: '0'};
        let {workId} = ctx.request.query;
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        let records = [];
        if (error.code === '0') {
            records = await this.ctx.model.WfWorkflowActiveNodes.find({workId}).populate(['idWorkflowMember']).lean().then(records => {
                return records.map(item => {
                    return item.idWorkflowMember
                })
            });
            const edges = await this.ctx.model.WfWorkflowActiveLog.aggregate([
                {$match:{
                        workId,__s:{$ne:0},
                        source: {$in:records.map(el=>el.id)}}
                },
                {
                    $lookup:{
                        from:'wf_workflow_design',
                        localField:'idWorkflowMember',
                        foreignField:'_id',
                        as:'idWorkflowMember'
                    }
                },
                {
                    $unwind:{path:'$idWorkflowMember'}
                },
                {
                    $group:{
                        _id:{
                            idUser:"$idUser",
                            source:'$idWorkflowMember.source',
                        },
                        idWorkflowActiveEdge:{$first:'$_id'},
                        idWorkflowMember:{$first:'$idWorkflowMember'},
                        memo:{$first:'$memo'},
                        description:{$first:'$description'},
                        operationType:{$first:'$description'},
                    }
                },
                {
                    $addFields:{idUser:"$_id.idUser",}
                },
                {
                    $lookup:{
                        from:'sys_user',
                        localField:'idUser',
                        foreignField:'_id',
                        as:'idUser'
                    }
                },
                {
                    $unwind:{path:'$idUser'}
                },

                {
                    $replaceRoot:{ "newRoot" : { "$mergeObjects" : [ "$$ROOT", "$idWorkflowMember" ] } }
                }
            ]);
            records.forEach(el=>{
                el.records = edges.filter(edge=>edge.source === el.id)
            })
        }
        ctx.body = error.code === '0' ? {error, records} : {error};
    }

    // /core/workflow/log
    async getWorkflowLog() {
        const {ctx} = this;
        let error = {code: '0'};
        let {workId} = ctx.request.query;
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        let records;
        if (error.code === '0') {
            const {nodes, edges} = await ctx.service.coreWorkflow.getWorkflowDesignByWorkId(workId).then(r => r.record);
            records = await ctx.model.WfWorkflowActiveLog.find({workId,__s:{$ne:1},operationType:{$ne:'close'}}).sort('-operationAt').populate(['idUser']).lean();
            for (let row of records) {
                const sourceNode = row.source ? nodes.filter(item => item.id === row.source)[0] : {};
                const targetNode = row.target ? nodes.filter(item => item.id === row.target)[0] : {};
                row.sourceLabel = sourceNode.label;
                row.targetLabel = targetNode.label;
                row.preemptType = sourceNode.preemptType;
            }
        }
        ctx.body = error.code === '0' ? {error, records} : {error};
    }

    /* 根据审批节点 操作员 单据号 获取 审批权限按钮 */
    async getWorkflowAuthButtons() {
        const {ctx} = this;
        let error = {code: '0'};
        let {workId, source, idUser} = ctx.request.body;
        // pointSigUser
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        if (!source) {
            error.code = '10104';
            error.message = 'params source missing'
        }
        let records = [];
        if (error.code === '0') {
            /* 判断当前节点是否为 激活节点*/
            const activeEdges = await ctx.model.WfWorkflowActiveLog.find({workId,__s:1}).populate(['idUser', 'idWorkflowMember']).lean().then(records => {
                return records.map(item => {
                    return {
                        idWorkflowActiveEdge: item._id,
                        ...item, ...item.idWorkflowMember,
                        esKey: ctx.service.coreWorkflow.countSignKey({...item, id: item.idWorkflowMember.id})
                    }
                })
            });
            const activeNodes = await ctx.model.WfWorkflowActiveNodes.find({workId}).populate(['idWorkflowMember']).lean().then(records => {
                return records.map(item => {
                    return item.idWorkflowMember
                })
            });
            if (activeNodes.map(el => el.id).includes(source)) {
                /* 普通模式 */
                let edges = activeEdges.filter(item => item.source === source && idUser === item.idUser._id.toString());
                let node = activeNodes.filter(el => el.id === source)[0];
                if (edges.length > 0) {
                    records.push(...['accept', 'reject']);
                    if (node && node.isAllowCounterSig) {
                        records.push('counterSig');
                    }
                    if (node && node.isAllowChangeSig) {
                        records.push('changeSig');
                    }
                    if (node && node.isAllowPointSig) {
                        records.push('pointSig');
                    }
                }
            } else {
                error.code = '10104';
                error.message = '当前节点未激活,该节点已被审核或已关闭,请刷新后重试！'
            }

        }
        ctx.body = error.code === '0' ? {error, records} : {error};
    }

    /* 根据审批节点 操作员 单据号 获取 可指派人员（会签节点不可指派） */
    async getWorkflowPointUsers() {
        const {ctx} = this;
        let error = {code: '0'};
        let {workId, source, idUser} = ctx.request.body;
        // pointSigUser
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        if (!source) {
            error.code = '10104';
            error.message = 'params source missing'
        }
        let records = [];
        if (error.code === '0') {
            /* 判断当前节点是否为 激活节点*/
            const activeEdges = await ctx.model.WfWorkflowActiveLog.find({workId}).populate(['idWorkflowMember']).lean().then(records => {
                return records.map(item => {
                    return {
                        idWorkflowActiveEdge: item._id,
                        idUser: item.idUser,
                        ...item.idWorkflowMember
                    }
                })
            });
            let idActiveEdges = activeEdges.filter(item => item.source === source && idUser === item.idUser.toString()).map(el => el.target);
            const {nodes} = await ctx.service.coreWorkflow.getWorkflowDesignByWorkId(workId).then(r => r.record);
            nodes.filter(el => idActiveEdges.includes(el.id)).forEach(item => {
                if (item.preemptType !== 'countersign') {
                    records.push(...item.users)
                }
            })

        }
        ctx.body = error.code === '0' ? {error, records} : {error};
    }

    /* 审核通过 */
    async workflowVerify() {
        const {ctx} = this;
        let error = {code: '0'};
        const operationType = 'accept';
        let {workId, source, idUser, memo, pointSigUser} = ctx.request.body;
        // pointSigUser
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        if (!source) {
            error.code = '10104';
            error.message = 'params source missing'
        }
        let record;
        if (error.code === '0') {
            /* 判断当前节点是否为 激活节点*/
            const {activeNodes, activeEdges} = await ctx.service.coreWorkflow.getActiveWorkflowByWorkId(workId).then(res => {
                return res.error.code === '0' ? res.record : {activeEdges: [], activeNodes: []};
            });
            if (activeNodes.includes(source)) {
                /* 普通模式 */
                const result = await ctx.service.coreWorkflow.mainWorkflow({workId,operationNodeId:source, idUser, pointSigUser, memo, operationType})
            } else {
                error.code = '10104';
                error.message = '当前节点未激活,该节点已被审核或已关闭,请刷新后重试！'
            }

        }
        ctx.body = error.code === '0' ? {error, record} : {error};
    }

    /* 审核拒绝 */
    async workflowReject() {
        const {ctx} = this;
        let error = {code: '0'};
        const operationType = 'reject';
        let {workId, source, idUser, memo} = ctx.request.body;
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        if (!source) {
            error.code = '10104';
            error.message = 'params source missing'
        }
        let record;
        if (error.code === '0') {
            /* 判断当前节点是否为 激活节点*/
            const {activeNodes} = await ctx.service.coreWorkflow.getActiveWorkflowByWorkId(workId).then(res => {
                return res.error.code === '0' ? res.record : {activeEdges: [], activeNodes: []};
            });
            if (activeNodes.includes(source)) {
                await ctx.service.coreWorkflow.mainWorkflow({workId,operationNodeId: source, idUser, memo, operationType})
            } else {
                error.code = '10104';
                error.message = '当前节点未激活,该节点已被审核或已关闭,请刷新后重试！'
            }
        }
        ctx.body = error.code === '0' ? {error, record} : {error};
    }

    /* 加签 */
    async workflowCounterSig() {
        const {ctx} = this;
        let error = {code: '0'};
        let {workId, source, idUser, users, memo} = ctx.request.body;
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        if (!source) {
            error.code = '10104';
            error.message = 'params source missing'
        }
        let record;
        if (error.code === '0') {
            /* 判断当前节点是否为 激活节点*/
            const {activeNodes, activeEdges} = await ctx.service.coreWorkflow.getActiveWorkflowByWorkId(workId).then(res => {
                return res.error.code === '0' ? res.record : {activeEdges: [], activeNodes: []};
            });
            if (activeNodes.includes(source)) {
                const counterUsers = await ctx.model.SysUser.find({_id: {$in: users}}).lean().then(el => el.map(l => l.userName));
                const edges = activeEdges.filter(item => idUser === item.idUser._id.toString() && source === item.source);
                if (edges[0]) {
                    await ctx.service.coreWorkflow.createWorkflowLog({
                        source: edges[0].source,
                        idUser,
                        workId,
                        memo,
                        description: `${edges[0].idUser.userName}发起加签操作,该节点将添加审核人${counterUsers.join(',')}`
                    }, 'counterSig',);
                }
                for (let edge of edges) {
                    for (let user of users) {
                        if (!activeEdges.map(ae => ae.esKey).includes(ctx.service.coreWorkflow.countSignKey({
                            idUser: user,
                            workId,
                            id: edge.id
                        }))) {
                            delete edge._id;
                            await ctx.model.OrgWorkflowActiveEdges.create({
                                ...edge,
                                idUser: user,
                            })
                        }
                    }
                }
            } else {
                error.code = '10104';
                error.message = '当前节点未激活,该节点已被审核或已关闭,请刷新后重试！'
            }

        }
        ctx.body = error.code === '0' ? {error, record} : {error};
    }

    /* 改派 */
    async workflowChangeSig() {
        const {ctx} = this;
        let error = {code: '0'};
        let {workId, source, idUser, toUser, memo} = ctx.request.body;
        if (!workId) {
            error.code = '10104';
            error.message = 'params workId missing'
        }
        if (!source) {
            error.code = '10104';
            error.message = 'params source missing'
        }
        if (idUser === toUser) {
            error.code = '10104';
            error.message = 'params toUser ne idUser '
        }
        let record;
        if (error.code === '0') {
            const changeUser = await ctx.model.SysUser.findOne({_id: toUser});
            /* 判断当前节点是否为 激活节点*/
            const {activeNodes, activeEdges} = await ctx.service.coreWorkflow.getActiveWorkflowByWorkId(workId).then(res => {
                return res.error.code === '0' ? res.record : {activeEdges: [], activeNodes: []};
            });
            if (activeNodes.includes(source)) {
                const edges = activeEdges.filter(item => idUser === item.idUser._id.toString() && source === item.source);
                /* 改派数据*/
                for (let edge of edges) {
                    await ctx.service.coreWorkflow.closureActiveLog({
                        workId,
                        id:edge.id,
                        idUser,
                    }, {description: `${edge.idUser.userName}发起改派操作,该节点将由${changeUser.userName}继续审核`,operationType:'changeSig',operationAt:new Date()});
                    if (!activeEdges.map(ae => ae.esKey).includes(ctx.service.coreWorkflow.countSignKey({
                        idUser: toUser,
                        workId,
                        id: edge.id
                    }))) {
                        delete edge._id;
                        await ctx.model.WfWorkflowActiveLog.create({
                            ...edge,
                            idUser: toUser,__s:1,
                        })
                    }
                }
            } else {
                error.code = '10104';
                error.message = '当前节点未激活,该节点已被审核或已关闭,请刷新后重试！'
            }

        }
        ctx.body = error.code === '0' ? {error, record} : {error};
    }
}

module.exports = Bill;
