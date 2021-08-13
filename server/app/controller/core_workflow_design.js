'use strict';
const Controller = require('egg').Controller;

class CoreWorkflowDesign extends Controller {
  constructor(ctx) {
    super(ctx);

  }

  /** 流程创建 发布**/

  /* 另存 */
  async saveAsOtherWorkFlow() {
    const { ctx } = this;
    const error = { code: '0' };
    const { nodes, edges, record } = ctx.request.body;

    if (!nodes || nodes.length === 0) {
      error.code = '10104';
      error.message = 'params nodes missing';
    }
    if (error.code === '0') {
      const { idApplication, idPage } = record;
      /* 判断 该表单 是否有启用的 流程*/
      const workflowIn = await ctx.model.WfWorkflow.countDocuments({ idApplication, idPage, __s: 1 });
      if (workflowIn > 0) {
        record.__s = 0;
        error.message = '该单据已存在启用中流程，发布流程置为停用状态.';
      }
      /* 发布 流程*/
      delete record._id;
      const workflow = await ctx.model.WfWorkflow.create(record);

      /* 存储节点 */
      for (const node of nodes) {
        delete node._id;
        node.memberType = 'node';
        node.version = record.version;
        let idWorkflowMember;
        await ctx.model.WfWorkflowDesign.create({ ...node, idWorkflow: workflow._id }).then(res => {
          idWorkflowMember = res._id;
        });
        if (node.owners && node.owners.length > 0) {
          await ctx.model.WfWorkflowDesignOwner.create(node.owners.map(item => {
            delete item._id;
            return { ...item, idWorkflowMember, idWorkflow: workflow._id };
          }));
        }
      }
      /* edge */
      await ctx.model.WfWorkflowDesign.create(edges.map(edge => {
        delete edge._id;
        return { ...edge, memberType: 'edge', idWorkflow: workflow._id };
      }));

    }
    ctx.body = error.code === '0' ? { error } : { error };
  }

  /* 判断 流程模型 是否存在单据滞留 */
  async workFlowHasBillIn() {
    const { ctx } = this;
    const error = { code: '0' };
    const { idWorkflow: _id } = ctx.request.query;

    if (!_id) {
      error.code = '10104';
      error.message = 'params idWorkflow missing';
    }
    let record;
    if (error.code === '0') {
      /* 判断 该表单 是否有启用的 流程*/
      record = await ctx.model.WfWorkflow.findOne({ _id }).lean();

      /**/
      const ActiveBill = await ctx.model.WfWorkflowActive.findOne({ idWorkflow: _id, __s: { $in: [ 1 ] } }).lean();
      record.state = ActiveBill ? 'in' : 'null';
      // record.bills = ActiveBill.map(row => row.billCode)


    }
    ctx.body = error.code === '0' ? { error, record } : { error };
  }

  /* 删除 */
  async deleteWorkFlowAndMembers() {
    const { ctx } = this;
    const error = { code: '0' };
    const { idWorkflow: _id } = ctx.request.query;

    if (!_id) {
      error.code = '10104';
      error.message = 'params idWorkflow missing';
    }


    const ActiveBill = await ctx.model.WfWorkflowActive.find({ idWorkflow: _id, __s: { $in: [ 1 ] } }).lean();

    if (ActiveBill && ActiveBill.length > 0) {
      error.code = '10104';
      error.message = ' has active bill in flow ';
    }

    let record;
    if (error.code === '0') {


      record = await ctx.model.WfWorkflow.findOne({ _id }).lean();
      const pageConfig = await ctx.service.corePage.getPageConfig(record.idPage).then(el => {
        return el ? el : {};
      }).catch(err => {
        if (err) {
          error.code = '500';
          error.message = '获取PageConfig失败' + err.message;
        }
      });

      const WorkflowBill = pageConfig && pageConfig.CtxModel ? pageConfig.CtxModel.findOne({ idWorkflow: record._id }) : null;

      if (WorkflowBill) {
        /* 逻辑删除 */
        await ctx.model.WfWorkflow.update({ _id }, { __r: 1 });
      } else {
        /* 直接 删除 */
        await ctx.model.WfWorkflow.remove({ _id });
        await ctx.model.WfWorkflowDesign.remove({ idWorkflow: _id });
        /**/
      }


    }
    ctx.body = error.code === '0' ? { error, record } : { error };
  }

  /* 发布*/
  async publishWorkflow() {
    const { ctx } = this;
    const error = { code: '0' };
    const { record } = ctx.request.body;
    const { idApplication, idPage } = record;
    if (!record._id) {
      error.code = '10104';
      error.message = 'params record missing';
    }
    if (!record.idApplication) {
      error.code = '10104';
      error.message = 'params idApplication in record missing';
    }
    if (!record.idPage) {
      error.code = '10104';
      error.message = 'params idPage in record missing';
    }
    const workflowIn = await ctx.model.WfWorkflow.findOne({ idApplication, idPage, __s: 1 });
    if (workflowIn) {
      error.code = '10104';
      error.message = `该单据已存在启用审批模板${workflowIn.code + ' ' + workflowIn.name}-${workflowIn.version}，请停用后再发布该流程。`;
    }
    let records;
    if (error.code === '0') {
      /* 删除 */
      records = await ctx.model.WfWorkflow.update({ _id: record._id }, { __s: 1 });
      /**/
    }
    ctx.body = error.code === '0' ? { error, records } : { error };
  }

  /** 零、 流程设计 **/

  /* 获取 某审批流的成员 （ 节点 条件 人员信息 ）*/
  async getWorkFlowMembers() {
    const { ctx } = this;
    const error = { code: '0' };
    const { idWorkflow } = ctx.request.query;
    if (!idWorkflow) {
      error.code = '10104';
      error.message = 'params idWorkflow missing';
    }
    let edges,
      nodes;
    if (error.code === '0') {
      nodes = await this.ctx.model.WfWorkflowDesign.aggregate([
        {
          $match: {
            idWorkflow: new this.ctx.app.mongoose.Types.ObjectId(idWorkflow),
            memberType: 'node',
          },
        },
        {
          $lookup: {
            from: 'wf_workflow_design_owner',
            localField: '_id',
            foreignField: 'idWorkflowMember',
            as: 'owners',
          },
        },
        // {
        //     $project:{
        //         'owners':{_id:-1,idWorkflowMember:-1,}
        //     }
        // }
      ]);
      edges = await ctx.model.WfWorkflowDesign.find({
        idWorkflow,
        memberType: 'edge',
      }).lean().then(res => res.map(item => {
        return { ...item, filter: item.filter ? item.filter : [] };
      }));
    }
    ctx.body = error.code === '0' ? { error, records: { nodes, edges } } : { error };
  }

  /* 审批流程 保存*/
  async saveWorkFlowMembers() {
    const { ctx } = this;
    const error = { code: '0' };
    const { nodes, edges, idWorkflow } = ctx.request.body;
    if (!idWorkflow) {
      error.code = '10104';
      error.message = 'params idWorkflow missing';
    }
    if (!nodes || nodes.length === 0) {
      error.code = '10104';
      error.message = 'params nodes missing';
    }
    if (error.code === '0') {
      await ctx.model.WfWorkflowDesign.remove({ idWorkflow });
      /* node */
      for (const node of nodes) {
        node.memberType = 'node';
        let idWorkflowMember;
        if (node._id) {
          idWorkflowMember = node._id;
          /* 处理 owner*/
          await ctx.model.WfWorkflowDesignOwner.remove({ idWorkflowMember });
        }
        await ctx.model.WfWorkflowDesign.create({ ...node, idWorkflow }).then(res => {
          idWorkflowMember = res._id;
        });
        if (node.owners && node.owners.length > 0) {
          await ctx.model.WfWorkflowDesignOwner.create(node.owners.map(item => {
            delete item._id;
            return { ...item, idWorkflowMember, idWorkflow };
          }));
        }
      }
      /* edge */
      await ctx.model.WfWorkflowDesign.create(edges.map(edge => {
        delete edge._id;
        return { ...edge, memberType: 'edge', idWorkflow };
      }));
    }
    ctx.body = error.code === '0' ? { error } : { error };
  }

  /* 翻译 流程审批 操作员信息*/
  async translateNodeOwner() {
    const { ctx } = this;
    const error = { code: '0' };
    const { owners } = ctx.request.body;
    if (!owners || !owners[0]) {
      error.code = '10104';
      error.message = 'params owners missing';
    }
    const records = [];
    if (error.code === '0') {
      const idUsers = owners.filter(item => item.ownerType === 'USER').map(row => row.idUser);
      const idRoles = owners.filter(item => item.ownerType === 'ROLE').map(row => row.idRole);
      const idDutys = owners.filter(item => item.ownerType === 'DUTY').map(row => row.idDuty);
      const users = (await ctx.model.SysUser.find({ _id: { $in: idUsers } }).lean()).map(res => {
        return { type: '人员', label: res.userName };
      });
      const roles = (await ctx.model.SysRole.find({ _id: { $in: idRoles } }).lean()).map(res => {
        return { type: '角色', label: res.roleCode + ' ' + res.roleName };
      });
      const dutys = (await ctx.model.SysDuty.find({ _id: { $in: idDutys } }).lean()).map(res => {
        return { type: '职责', label: res.dutyCode + ' ' + res.dutyName };
      });
      records.push(...users);
      records.push(...roles);
      records.push(...dutys);
    }
    ctx.body = error.code === '0' ? { error, records } : { error };
  }
}

module.exports = CoreWorkflowDesign;
