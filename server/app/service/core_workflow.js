'use strict';

const Service = require('egg').Service;

class BillService extends Service {
  constructor(ctx) {
    super(ctx);
  }

  /** 二、 流程流转 公用方法 **/

  /* main 流转 */
  /* 字段释义  { } 必有； [ ] 可有
        * 1. edge  { idBill, workId, idPage, idWorkflowMember, id, source, target, filter}  [idUser, memo]
        * 2. defEdge 包含所有 流模型字段
        * 3. node (for nodes) {workId, id, users <Array Object> ,...}
        * */

  /* 进入审批流 */
  async enterWorkflow({ workId, idWorkflow }, option = {}) {
    let error = { code: '0' };
    const isEnterWorkflow = option.isEnterWorkflow === void (0) ? true : option.isEnterWorkflow;
    if (!workId) {
      error.code = 'WF504';
    } else {
      workId = workId.toString();
    }
    let record;
    if (error.code === '0') {
      /* 查询该单据号 是否存在审批流 */
      record = await this.ctx.model.WfWorkflowActive.findOne({ workId, idWorkflow });
      if (record) {
        /* 删除 active 节点 */
        await this.ctx.model.WfWorkflowActiveLog.updateMany({ workId }, { __s: 0 });
        await this.ctx.model.WfWorkflowActiveNodes.remove({ workId });
        await this.createWorkflowLog({ workId, memo: '检测到单据已进入审批流，重置审批', description: '重新开始审批流' }, 'again');
      } else {
        record = await this.ctx.model.WfWorkflowActive.create({ workId, idWorkflow });
      }

      if (isEnterWorkflow) {
        /* 进入审批流 */
        const { nodes, edges, workflowParams } = await this.getWorkflowDesignByWorkId(workId).then(res => {
          if (res.error.code !== '0') {
            error = res.error;
          }
          return res.record;
        });
        const start = nodes.filter(res => res.nodeType === 'start')[0];
        const submit = nodes.filter(res => res.nodeType === 'submit')[0];
        const { _id, ...edge } = edges.filter(res => res.source === start.id && res.target === submit.id)[0];
        await this.ctx.model.WfWorkflowActiveNodes.create({
          idWorkflowMember: start._id,
          id: start.id,
          workId,
          label: start.label,
        });
        await this.ctx.model.WfWorkflowActiveLog.create({ idWorkflowMember: _id, ...edge, workId });
        const resultError = await this.mainWorkflow({ operationNodeId: start.id, memo: '审批开始', workId }, {
          nodes,
          edges,
          workflowParams,
        });
        if (resultError && resultError.code !== '0') {
          error.code = resultError.code;
          error.message = resultError.message;
        }
      }
    }
    return { error, record };
  }

  /* 流转 */

  /* 流程 处理 */

  async mainWorkflow(body, WorkflowDesign) {
    let error = { code: '0' };

    const { operationNodeId, idUser, workId, pointSigUser, memo, operationType = 'accept' } = body;
    if (!workId) {
      error.code = 'WF01';
      error.message = '无该 workId 信息,操作失败！';
      return error;
    }
    if (!operationNodeId) {
      error.code = 'WF01';
      error.message = '无该 operationNodeId 信息,操作失败！';
      return error;
    }
    /* 节点审核 */
    /* @params. operationNode operationType pointSigUser memo idUser workId*/
    /*
                *@Step1. operationNode action
                *@Step2. targetEdges
                *@step3. to targetNodes
                * */
    WorkflowDesign = WorkflowDesign ? WorkflowDesign : await this.getWorkflowDesignByWorkId(workId).then(res => {
      if (res.error.code !== '0') {
        error = res.error;
      }
      return res.record;
    });
    const { nodes, edges } = WorkflowDesign;
    const { activeEdges, activeNodes } = await this.getActiveWorkflowByWorkId(workId).then(res => {
      return res.error.code === '0' ? res.record : { activeEdges: [], activeNodes: [] };
    });
    if (activeNodes.filter(id => id === operationNodeId).length === 0) {
      error.code = 'WF01';
      error.message = '无该节点信息,操作失败！';
      return error;
    }
    const operationNode = nodes.filter(el => el.id === operationNodeId)[0];
    console.info('节点' + operationNode.label + '开始审批');
    /* start NodeOperation*/
    if (!idUser && ![ 'start', 'virtual', 'end' ].includes(operationNode.nodeType)) {
      error.code = 'WF01';
      error.message = '无操作人员信息,操作失败！';
      return error;
    }

    const getOperationEdges = function(activeEdges, operation) {
      let Edges = JSON.parse(JSON.stringify(activeEdges));
      /**
             * @return {string}
             */
      const ObjToID = function(val) {
        return typeof val === 'object' && val !== void (0) ? val._id.toString() : val.toString();
      };
      if (operation.sourceId) {
        Edges = Edges.filter(el => el.source === operation.sourceId);
      }

      if (operation.idUser) {
        Edges = Edges.filter(el => ObjToID(el.idUser) === ObjToID(operation.idUser));
      }
      // if(operation.operationType === 'reject'){
      //     Edges = activeEdges.filter(el=>el.idUser.resultType === 'NO')
      // }else{
      //     Edges = activeEdges.filter(el=>el.idUser.resultType === 'YES')
      // }
      return Edges;
    };
    const operationEdges = getOperationEdges(activeEdges, { idUser, operationType, sourceId: operationNode.id });
    if (operationEdges.length > 0) {
      let description = operationType === 'accept' ? '审核通过' : '审核驳回';
      if (pointSigUser) {
        const {
          User,
          pUser,
        } = await this.ctx.model.SysUser.find({ _id: { $in: [ pointSigUser, idUser ] } }).lean().then(el => {
          return {
            User: el.filter(r => r._id.toString() === idUser.toString())[0],
            pUser: el.filter(r => r._id.toString() === pointSigUser.toString())[0],
          };
        });
        description = `${User.userName}发起指派操作,指定下级节点由${pUser.userName}审核`;
      }
      await this.closureActiveLog({ _id: { $in: operationEdges.map(el => el.idWorkflowActiveEdge) }, workId }, {
        memo,
        description,
        operationType,
        operationAt: new Date(),
      }).catch(e => {
        if (e) {
          console.info(e);
          error.code = 'WF500';
          error.message = '活动（激活）节点删除失败！';
        }
      });
    } else {
      error.code = 'WF01';
      error.message = '无可操作路径信息,操作失败！';
      return error;
    }

    if (operationNode.preemptType === 'countersign') {
      const countersignValue = operationNode.countersignValue / 100;
      /* 获取所有会签 数据 */
      const logs = await this.ctx.model.WfWorkflowActiveLog.find({
        source: operationNode.id, workId,
        __s: { $in: [ 1, 2 ] },
      });
      const acceptRecords = [ ...new Set(logs.filter(el => el.__s === 2 && el.operationType === 'accept').map(item => item.idUser.toString())) ];
      const rejectRecords = [ ...new Set(logs.filter(el => el.__s === 2 && el.operationType === 'reject').map(item => item.idUser.toString())) ];
      const nDoRecords = [ ...new Set(logs.filter(el => el.__s === 1 && el.operationType === void (0)).map(item => item.idUser.toString())) ];
      const count = acceptRecords.length + rejectRecords.length + nDoRecords.length;
      console.info('会签进度', `${acceptRecords.length}/${rejectRecords.length}/${count}`, countersignValue);
      if (acceptRecords.length / count >= countersignValue) {
        /* 会签通过 删除 会签记录 */
        await this.createWorkflowLog({
          workId,
          source: operationEdges[0].source,
          target: operationEdges[0].target,
          description: '会签阈值达到，进入下一节点。',
        }).then(e => {
          if (e.code !== '0') {
            error = e;
          }
        });
      } else if (rejectRecords.length / count > 1 - countersignValue) {
        /* 会签驳回  sourceNode.users.length*/
        if (operationNode.rejectType !== 'next') {
          await this.createWorkflowLog({
            workId,
            source: operationNode._id,
            description: '会签无法达到阈值，自动进行驳回操作,节点审批终止。',
          }).then(e => {
            if (e.code !== '0') {
              error = e;
            }
          });
        } else {
          await this.createWorkflowLog({
            workId,
            source: operationNode._id,
            description: '会签无法达到阈值，自动进行驳回操作,进入驳回节点。',
          }).then(e => {
            if (e.code !== '0') {
              error = e;
            }
          });
        }
      } else {
        return error;
      }
    }
    /* 节点审批结束 */
    /* 清除 当前路径上其他人员的审批 任务 */
    await this.closureActiveLog({
      source: operationNode.id,
      __s: 1,
      workId,
      idUser: { $ne: idUser },
    }, { operationAt: new Date() });

    /* 关闭节点 */
    await this.removeActivesNodeById({ workId, id: operationNode.id }).then(e => {
      if (e.code !== '0') {
        error = e;
      }
    });

    /* 判断 并 进入下级节点 */
    if (operationType === 'reject' && operationEdges.filter(el => el.resultType === 'NO').length === 0) {
      if (await this.ctx.model.WfWorkflowActiveLog.find({ workId, __s: 1 }).length === 0) {
        await this.endWorkflow(workId, { node: operationNode.id }, 'reject');
      }
      return error;
    }

    const enterWorkNode = async (workNodeParams, WorkflowDesign) => {
      const { workId, pointSigUser, isSendMessage, _id: idWorkflowMember, sourceNode, id } = workNodeParams;
      let error = { code: '0' };
      const node = WorkflowDesign.nodes.filter(item => item.id === id)[0];
      console.info('进入节点', node.label);

      if (isSendMessage) {
        await this.sendMessage({ workId, users: node.users, isSendShortMessage: node.isSendShortMessage });
      }
      const { activeNodes } = await this.getActiveWorkflowByWorkId(workId).then(res => {
        return res.error.code === '0' ? res.record : { activeEdges: [], activeNodes: [] };
      });

      /* 判断进入节点的属性 合并类型*/
      if (node.mergeType === 'and') {
        /* 判断是否 所有上级（满足条件）都已进行审核 */
        const getParentNodes = ({ nodes, edges }, node) => {
          const result = [];
          for (const edge of edges) {
            if (edge.target === node && edge.resultType !== 'NO') {
              const source = nodes.filter(item => item.id === edge.source);
              if (source && source[0] && source[0].nodeType !== 'start') {
                result.push(source[0]);
                result.push(...getParentNodes({ nodes, edges }, edge.source));
              } else if (source && source[0]) {
                result.push(source[0]);
              }
            }
          }
          /* 去重 */
          return [ ...new Set(result.map(r => r.id)) ].map(id => {
            return result.filter(r => r.id === id)[0];
          });
        };
        const parent = getParentNodes({ nodes, edges }, node.id);
        const sourceEdges = parent.filter(item => activeNodes.includes(item.id));
        if (sourceEdges.length > 0) {
          console.info('等待其余节点审核完成');
          return error;
        }
      } else if (node.mergeType === 'or') {
        /* 关闭其余父节点*/
        const otherTargetEdges = edges.filter(row => row.source !== sourceNode.id && row.target === node.id).map(item => item.source);
        for (const ed of otherTargetEdges) {
          await this.removeActivesNodeById({ workId, id: ed }).then(e => {
            if (e.code !== '0') {
              error = e;
            }
          });
        }
      }
      if (node.users && node.users.length === 0 && ![ 'end', 'virtual' ].includes(node.nodeType)) {
        return { code: 'WF404', message: '节点审批人员不存在。' };
      }
      if (!activeNodes.includes(id)) {
        await this.ctx.model.WfWorkflowActiveNodes.create({ idWorkflowMember, workId, label: node.label });
      }
      /* 新节点激活 => 路径激活 */
      const allowEdges = await this.judgeAllowCond({
        workId,
        source: id,
        pointSigUser,
      }, WorkflowDesign).then(res => {
        if (res.error.code !== '0') {
          error = res.error;
        }
        return res.records;
      });
      const rejectEdges = await this.judgeAllowCond({
        workId,
        source: id,
        pointSigUser,
        operationType: 'reject',
      }, WorkflowDesign).then(res => {
        if (res.error.code !== '0') {
          error = res.error;
        }
        return res.records;
      });
      console.info(`节点${node.label}通过条件${allowEdges.length}驳回条件${rejectEdges.length}`);
      if (node.branchType === 'or') {
        if (allowEdges[0]) {
          const ers = await this.generateActivesLogById({
            ...allowEdges[0],
            workId,
            pointSigUser,
          }, WorkflowDesign);
        }
        if (rejectEdges && rejectEdges[0]) {
          await this.generateActivesLogById({ ...rejectEdges[0], workId, pointSigUser }, WorkflowDesign);
        }
      } else {
        for (const item of allowEdges) {
          const ers = await this.generateActivesLogById({ ...item, workId, pointSigUser }, WorkflowDesign);
        }
        if (rejectEdges && rejectEdges[0]) {
          for (const item of rejectEdges) {
            await this.generateActivesLogById({ ...item, workId, pointSigUser }, WorkflowDesign);
          }
        }
      }
      if (error.code === '0') {
        await this.createWorkflowLog({
          workId,
          source: sourceNode.id,
          target: node.id,
          memo: '进入下级',
          description: `节点${sourceNode.label}审批完成，进入下级节点:${node.label}`,
        }).then(e => {

          if (e.code !== '0') {
            error = e;
          }
        });
      } else {
        await this.createWorkflowLog({
          workId,
          source: sourceNode.id,
          target: node.id,
          memo: '进入下级节点发生异常',
          description: `节点${sourceNode.label}审批完成，进入下级节点:${node.label}时发生异常，${error.message}`,
        }).then(e => {
          if (e.code !== '0') {
            error = e;
          }
        });
      }
      console.info(`根据节点类型判断 是否自动流转:${node.nodeType}${[ 'virtual', 'end' ].includes(node.nodeType) ? '是' : '否'}`);
      if ([ 'virtual', 'end', 'start' ].includes(node.nodeType)) {
        /* node.nodeType */
        if (node.nodeType === 'end') {
          error = await this.endWorkflow(workId, { node: node.id });
        }
        await this.mainWorkflow({ operationNodeId: node.id, workId, memo }, WorkflowDesign).then(e => {
          if (e.code !== '0') {
            error = e;
          }
        });
      }
      return error;
    };

    for (const edge of operationEdges) {
      const toNode = nodes.filter(el => el.id === edge.target)[0];
      if (operationType === 'accept' && edge.resultType === 'NO') {
        continue;
      }
      if (operationType === 'reject' && edge.resultType === 'YES') {
        continue;
      }
      error = await enterWorkNode({ ...toNode, workId, pointSigUser, sourceNode: operationNode }, WorkflowDesign);
    }
    /* end NodeOperation*/

    /* 激活该节点 */
    return error;
  }


  /* 流程条件判断 */
  async judgeAllowCond({ workId, source, operationType = 'accept' }, WorkflowDesign) {
    let error = { code: '0' };
    const records = [];
    const {
      nodes,
      edges,
      workflowParams,
    } = WorkflowDesign ? WorkflowDesign : await this.getWorkflowDesignByWorkId(workId).then(res => {
      if (res.error.code !== '0') {
        error = res.error;
      }
      return res.record;
    });

    const confEdges = edges.filter(ed => ed.source === source && ed.resultType === (operationType === 'accept' ? 'YES' : 'NO') && [ 'cond', 'null' ].includes(ed.condType)).sort(function(a, b) {
      return a.order - b.order;
    });
    const otherEdges = edges.filter(ed => ed.source === source && ed.resultType === (operationType === 'accept' ? 'YES' : 'NO') && ed.condType === 'other').sort(function(a, b) {
      return a.order - b.order;
    });

    /* 条件 */
    if (confEdges.length > 0) {
      function resolveFilter(filter) {
        let queryJson = filter.length > 1 ? { $or: [] } : {};
        for (const child of filter) {
          const JsonOR = { $and: [] };
          for (const c of child) {
            if (c.value === '') {
              c.value = null;
            }
            const Json = {};
            if (c.symbol === '$in' || c.symbol === '$nin') {
              Json[c.key] = { [c.symbol]: c.value };
            } else if (c.symbol === '$regex') { // 包含
              for (const r of c.value) {
                Json.$or.push({ [c.key]: { [c.symbol]: r, $options: 'is' } });
              }
            } else if (c.symbol === '$nregex') { // 不包含
              for (const r of c.value) {
                Json.$and.push({ [c.key]: { $regex: '^((?!' + r + ').)*$', $options: 'is' } });
              }
            } else if (c.symbol === '$sregex') { // 左包含
              for (const r of c.value) {
                Json.$or.push({ [c.key]: { $regex: '^(' + r + ')', $options: 'is' } });
              }
            } else if (c.symbol === '$eregex') { // 右包含
              for (const r of c.value) {
                Json.$or.push({ [c.key]: { $regex: '(' + r + ')$', $options: 'is' } });
              }
            } else if (c.symbol === '$snregex') { // 左不包含
              for (const r of c.value) {
                Json.$and.push({ [c.key]: { $regex: '^(?!' + r + ')', $options: 'is' } });
              }

            } else if (c.symbol === '$enregex') { // 右不包含
              for (const r of c.value) {
                Json.$and.push({ [c.key]: { $regex: '(?<!' + r + ')$', $options: 'is' } });
              }
            } else {
              Json[c.key] = { [c.symbol]: c.value };
            }
            JsonOR.$and.push(Json);
          }
          if (filter.length > 1) {
            queryJson.$or.push(JsonOR);
          } else {
            queryJson = JsonOR;
          }
        }
        return queryJson;
      }

      const pageConfig = await this.ctx.model.CdpPage.findOne(/^[a-fA-F0-9]{24}$/.test(workflowParams.idPage) ? { _id: workflowParams.idPage } : { code: workflowParams.idPage }).populate([ 'idEntityList' ]);
      // code
      /* pageConfig.idEntityList.code */
      for (const edge of confEdges) {
        let res;
        /* 判断 条件是否 满足 edge.filter*/

        res = await this.ctx.model[this.ctx.helper.humps.pascalize(pageConfig.idEntityList.code)].findOne({ $and: [ resolveFilter(edge.filter), { _id: workId }] });

        /* count */
        // switch (edge.idPage.dsType) {
        //     case 'interface':
        //         if (!edge.idPage.dsConfig.check) {
        //            接口请求失败方法未知,无法发起请求！
        //             break;
        //         }
        //         params = edge.idPage.dsConfig.check.method === 'post' ? {filter:edge.filter} : {
        //             params: {filter:edge.filter}
        //         };
        //         data = await http[edge.idPage.dsConfig.check.method](edge.idPage.dsConfig.check.url, params).then(res => res.data.count);
        //         break;
        //     case 'mongodb':
        //         data = await http.post('/api/getByAggregate/' + edge.idPage.table, {
        //             filter:edge.filter,
        //             pipeline: JSON.parse(edge.idPage.dsConfig.pipeline)
        //         }).then(res => res.data.count);
        //         break;
        //     default:
        //         break;
        // }
        res && records.push(edge);
      }
    }
    /* 否则 */
    if (records.length === 0 && otherEdges.length > 0) {
      records.push(...otherEdges);
    }
    /* 条件判断 逻辑*/
    return { error, records };
  }

  /* 会签 key */
  countSignKey({ idUser, id, workId }) {
    const keyUser = typeof idUser === 'object' ? idUser._id : idUser;
    return idUser ? workId + 'bill' + keyUser + 'cts' + id : '';
  }

  /* 创建审批 记录*/
  /* must params field ;@workId: 审批单据号 ;@source: 上级节点id;@operationType: 操作类型; */

  /* other field @description: 描述; @idUser:审核人; @pointSigUser:指派人; @memo:备注;@id: 连线id;@target: 下级节点id */
  async createWorkflowLog(log) {
    const error = { code: '0' };
    delete log.operationType;
    if (!log.workId) {
      error.code = 'WF401';
      error.message = 'func createWorkflowLog 审批流转确少必要参数:workId';
    }
    let record;
    /* 创建记录 */
    if (error.code === '0') {
      delete log._id;
      delete log.createdAt;
      log.operationAt = new Date();
      record = await this.ctx.model.WfWorkflowActiveLog.create({ ...log, __s: 2 }).catch(e => {
        if (e) {
          console.info(e);
          error.code = 'WF500';
          error.message = '审批记录创建失败';
        }
      });
    }

    return error;
  }

  async closureActiveLog(filter, updateParams = {}) {
    const error = { code: '0' };
    const { operationType = 'close', ...params } = updateParams;
    if (!filter.workId) {
      error.code = 'WF401';
      error.message = 'func closureActiveLog  审批流转确少必要参数:workId';
    }
    let records;
    /* 创建记录 */
    if (error.code === '0') {
      records = await this.ctx.model.WfWorkflowActiveLog.find({ ...filter, __s: 1 });
      this.removeOverdueDaysList({
        idWorkflowMember: records.map(el => el.idWorkflowMember),
        workId: filter.workId,
      });
      await this.ctx.model.WfWorkflowActiveLog.updateMany({ ...filter, __s: 1 }, {
        ...params,
        __s: 2,
        operationType,
      }).catch(e => {
        if (e) {
          console.info(e);
          error.code = 'WF500';
          error.message = '审批记录创建失败';
        }
      });
    }
    return { error, records };
  }

  async generateActivesLogById(row, WorkflowDesign) {
    let error = { code: '0' };
    const { workId, id, pointSigUser } = row;
    /* pointSigUser < String > 指派审批人员 */

    const {
      nodes,
      edges,
    } = WorkflowDesign ? WorkflowDesign : await this.getWorkflowDesignByWorkId(workId).then(res => {
      if (res.error.code !== '0') {
        error = res.error;
      }
      return res.record;
    });
    const { _id: idWorkflowMember, ...edge } = edges.filter(item => item.id === id)[0];
    if (!edge) {
      return { error };
    }
    const node = nodes.filter(item => item.id === edge.source)[0];
    if (error.code === '0') {
      const { activeEdges } = await this.getActiveWorkflowByWorkId(workId).then(res => {
        return res.error.code === '0' ? res.record : { activeEdges: [], activeNodes: [] };
      });
      /* */
      /* 指派审批 */
      if (pointSigUser) {
        node.users = [{ _id: pointSigUser }];
      }
      if (edge && node && node.users) {
        /* 通知待审核人员 */
        await this.pushApprovalMessage({ workId, userIds: node.users, event: 'WORKFLOW_WAIT' });
        for (const user of node.users) {
          if (!activeEdges.map(ae => ae.esKey).includes(this.countSignKey({
            idUser: user._id,
            workId,
            id: edge.id,
          }))) {
            await this.ctx.model.WfWorkflowActiveLog.create({
              ...edge,
              idWorkflowMember,
              idUser: user._id,
              workId,
              id,
            });
            /* 逾期提醒与弃审队列 */
            await this.pushOverdueDaysList(row, [ user ], WorkflowDesign);
          }
        }

      }

      if (node.nodeType === 'virtual') {
        await this.ctx.model.WfWorkflowActiveLog.create({
          ...edge,
          idWorkflowMember,
          workId,
          id,
        });
      }
    }

    return { error };
  }

  async removeActivesNodeById({ workId, id }) {
    const error = { code: '0' };
    if (!workId) {
      error.code = 'WF401';
      error.message = 'removeActivesNodeById 参数不存在: workId';
    }
    if (!id) {
      error.code = 'WF402';
      error.message = '参数不存在: source';
    }
    if (error.code === '0') {
      const Active = await this.ctx.model.WfWorkflowActiveNodes.aggregate([
        {
          $match: {
            workId: workId.toString(),
          },
        },
        {
          $lookup: {
            from: 'wf_workflow_design',
            localField: 'idWorkflowMember',
            foreignField: '_id',
            as: 'idWorkflowMember',
          },
        },
        {
          $unwind: {
            path: '$idWorkflowMember', preserveNullAndEmptyArrays: false,
          },
        },
        {
          $match: {
            'idWorkflowMember.id': id,
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);
      if (Active && Active[0]) {
        await this.ctx.model.WfWorkflowActiveNodes.remove({ _id: Active[0]._id }).catch(e => {
          if (e) {
            console.info(e);
            error.code = 'WF500';
            error.message = '审批活动路径删除失败';
          }
        });
        // await  this.closureActiveLog({source:id,workId})
      }
    }
    return error;
  }

  async pushOverdueDaysList(edge, users, WorkflowDesign) {
    let error = { code: '0' };
    const { workId, idPage } = edge;
    const {
      nodes,
      edges,
    } = WorkflowDesign ? WorkflowDesign : await this.getWorkflowDesignByWorkId(workId).then(res => {
      if (res.error.code !== '0') {
        error = res.error;
      }
      return res.record;
    });
    const { overdueNoticeDays, overdueDays } = nodes.filter(item => item.id === edge.target)[0];
    if (!workId) {
      return { error };
    }
    if (error.code === '0') {
      const overdue = users.map(user => {
        return {
          ...edge,
          idUser: user._id,
          idWorkflowMember: edge._id,
          type: 'overdue',
          takeEffectTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 * (overdueDays || 10)),
          overdueDay: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) * (overdueDays - overdueNoticeDays || 6),
        };
      });

      const overdueNotice = users.map(user => {
        return {
          ...edge,
          idUser: user._id,
          idWorkflowMember: edge._id,
          type: 'overdueNotice',
          takeEffectTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) * (overdueDays - overdueNoticeDays || 6),
        };

      });
      await this.ctx.model.WfWorkflowActiveSchedule.create([ ...overdue, ...overdueNotice ].map(row => {
        delete row._id;
        return row;
      }));
    }

    return { error };
  }

  async pushApprovalMessage({ workId, userIds = [], event = 'WORKFLOW_WAIT' }, PageParams) {
    const error = { code: '0' };
    if (!PageParams) {
      const idPage = await this.ctx.model.WfWorkflowActive.findOne({ workId }).deepPopulate([ 'idWorkflow' ]).lean()
        .then(el => (el ? el.idWorkflow.idPage : ''));
      PageParams = await this.ctx.service.corePage.getPageConfig(idPage);
    }
    if (error.code === '0' && PageParams && PageParams.PageModel) {
      const bill = await PageParams.PageModel.findOne({ _id: workId }).lean();
      // const users = await this.ctx.model.OrgOrganUser.find({idUser:{$in:userIds},idOrgan:bill.idOrgan}).lean().then(el=>el.length>0?el.map(r=>r._id):[]);
      /** @pushMessage WORKFLOW_WAIT 待审批单据 */
      /** @pushMessage WORKFLOW_END 单据审批完成 */
      /** @pushMessage WORKFLOW_OVERDUE 逾期提醒 */
      switch (event) {
        case 'WORKFLOW_END':
          userIds = bill.createdUser;
          break;
        default:break;
      }
      await this.ctx.service.coreEvent.push(event, {
        ...bill,
        page: PageParams.PageConfig,
        workId,
      }, {}, userIds);

    } else {
      error.code = '504';
      error.message = '审批单据未知,缺失审批参数：page';
    }

    return error;
  }

  async removeOverdueDaysList(filter) {
    const error = { code: '0' };
    const { workId, idWorkflowMember } = filter;
    if (!workId) {
      return { error };
    }
    if (!idWorkflowMember) {
      return { error };
    }
    filter.idWorkflowMember = Array.isArray(filter.idWorkflowMember) ? { $in: filter.idWorkflowMember } : filter.idWorkflowMember;

    if (error.code === '0') {
      await this.ctx.model.WfWorkflowActiveSchedule.updateMany(filter, { __s: 0 });
    }

    return { error };
  }

  /* 获取审批流  */
  async getWorkflowDesignByWorkId(workId) {
    const error = { code: '0' };
    if (!workId) {
      error.code = 'WF401';
    }
    const record = { edges: [], nodes: [] };
    const { idWorkflow } = await this.ctx.model.WfWorkflowActive.findOne({ workId }).then(res => (res ? res : {}));

    if (!idWorkflow) {
      error.code = 'WF404';
    }
    if (error.code === '0') {
      /* 可在此控制 流程版本 */
      record.nodes = await this.ctx.model.WfWorkflowDesign.aggregate([
        {
          $match: {
            idWorkflow: this.ctx.service.coreHelper.toObjectID(idWorkflow),
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

      record.workflowParams = await this.ctx.model.WfWorkflow.findOne({ _id: idWorkflow });

      for (const node of record.nodes) {
        node.workId = workId;
        /* 人员数据 */
        node.users = [];
        if (node.owners && node.owners.length > 0) {
          const idRoles = await this.ctx.model.SysRoleDuty.find({ idDuty: { $in: node.owners.filter(item => item.ownerType === 'DUTY').map(row => row.idDuty) } }).then(res => {
            return res.map(item => item.idRole);
          });
          idRoles.push(...node.owners.filter(item => item.ownerType === 'ROLE').map(row => row.idRole));
          const idUsers = await this.ctx.model.SysUserRole.find({ idRole: idRoles }).lean();
          idUsers.push(...node.owners.filter(item => item.ownerType === 'USER').map(row => row.idUser));
          node.users = await this.ctx.model.SysUser.find({ _id: { $in: idUsers } }).lean();
        }
      }
      record.edges = await this.ctx.model.WfWorkflowDesign.find({
        idWorkflow,
        memberType: 'edge',
      }).lean().then(res => res.map(item => {
        return { ...item, workId };
      }
      ));
    }
    return { error, record };
  }

  /* 获取 激活节点 、路径*/
  async getActiveWorkflowByWorkId(workId) {
    const error = { code: '0' };
    if (!workId) {
      error.code = 'WF401';
    }
    const record = { activeEdges: [], activeNodes: [] };
    if (error.code === '0') {

      record.activeEdges = await this.ctx.model.WfWorkflowActiveLog.find({
        workId,
        __s: 1,
      }).populate([ 'idUser', 'idWorkflowMember' ]).lean()
        .then(records => {
          return records.map(item => {
            return {
              idWorkflowActiveEdge: item._id,
              ...item, ...item.idWorkflowMember,
              esKey: this.countSignKey({ ...item, id: item.idWorkflowMember.id }),
            };
          });
        });
      record.activeNodes = await this.ctx.model.WfWorkflowActiveNodes.find({ workId }).populate([ 'idWorkflowMember' ]).lean()
        .then(records => {
          return records.map(item => {
            return item.idWorkflowMember.id;
          });
        });
    }
    return { error, record };
  }

  /* 审批完成 关闭审批流 */
  async endWorkflow(workId, { node, closeMemo }, operationType = 'end') {
    let error = { code: '0' };
    console.info('审批结束 更新单据状态', operationType);
    await this.ctx.model.WfWorkflowActiveLog.create({
      source: node,
      workId,
      operationType,
      memo: closeMemo ? closeMemo : (operationType === 'end' ? '流程结束' : '流程关闭'),
      __s: 2,
    }).catch(e => {
      if (e) {
        console.info(e);
        error.code = 'WF500';
        error.message = '审批记录创建失败';
      }
    });
    await this.ctx.model.WfWorkflowActiveNodes.remove({ workId });
    await this.closureActiveLog({ workId, __s: 1 });
    await this.ctx.model.WfWorkflowActive.update({ workId }, { __s: operationType === 'end' ? 2 : 0 });

    // 单据处理
    if (operationType === 'end') {
      const { idWorkflow: workflow } = await this.ctx.model.WfWorkflowActive.findOne({
        workId,
        __s: 2,
      }).deepPopulate([ 'idWorkflow' ]).lean();
      const operateUser = await this.ctx.model.WfWorkflowActiveLog.findOne({
        workId,
        idUser: { $exists: true },
        $and: [{ operationType: { $exists: true } }, { operationType: { $nin: [ 'close' ] } }],
        __s: 2,
      }).sort('-operationAt').then(el => {
        return el.idUser;
      });
      const { PageModel, PageConfig } = await this.ctx.service.corePage.getPageConfig(workflow.idPage);
      const bill = await PageModel.find({ _id: workId });
      if (bill && bill.length === 1) {
        switch (bill[0].__s) {
          case 2:
            error = (await this.ctx.service.corePage.doVerify(bill[0]._id, operateUser, workflow.idPage)).error;
            await this.pushApprovalMessage({ workId, userIds: [], event: 'WORKFLOW_END' }, {
              PageModel,
              PageConfig,
            });
            break;
          case 3:
            error.code = '0';
            error.message = '单据已审核,请勿重复操作。';
            break;
          default:
            error.code = 'WF500';
            error.message = '单据状态验证失败，无法进行审批,单据状态:' + bill[0].__s;
            break;
        }
      } else {
        error.code = 'WF500';
        error.message = '审批失败,' + bill ? '单据不存在。' : '存在多条单据。';
      }
    }
    console.info('审批结束 ', error);
    return error;
  }

  async sendMessage({ workId, users, isSendShortMessage }) {
    /* workId <String>; users <Array Object>; isSendShortMessage <Boolean> */
  }
}

module.exports = BillService;
