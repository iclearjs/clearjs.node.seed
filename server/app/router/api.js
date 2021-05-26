'use strict';

module.exports = app => {

  const { router, controller } = app;

  // 数据模型API
  router.get('/api/model/:model', controller.api.model.get);
  router.get('/api/model/:model/:id', controller.api.model.getById);
  router.post('/api/model/:model', controller.api.model.post);
  router.put('/api/model/:model/:id', controller.api.model.update);
  router.patch('/api/model/:model/:id', controller.api.model.update);
  router.delete('/api/model/:model/:id', controller.api.model.destroy);
  router.post('/api/getByPost/:model', controller.api.model.getByPost);
  router.post('/api/getByAggregate/:model', controller.api.model.getByAggregate);

  // 认证系统API

  router.post('/api/authority/login', controller.api.authority.login);
  router.post('/api/authority/register', controller.api.authority.register);
  router.post('/api/authority/changePwd', controller.api.authority.changePwd);

  // 文件系统API
  router.get('/api/file/preview/:id', controller.api.file.preview);
  router.get('/api/file/download/:id', controller.api.file.download);
  router.post('/api/file/upload', controller.api.file.upload);
  router.post('/api/file/uploadByBase64', controller.api.file.uploadByBase64);
  router.delete('/api/file/remove/:id', controller.api.file.remove);

  // 单据状态流程
  router.get('/api/page/export/:page', controller.api.page.export);
  router.post('/api/page/import/:page', controller.api.page.import);

  router.post('/api/page/create/:page', controller.api.page.create);
  router.post('/api/page/modify/:page/:id', controller.api.page.modify);
  router.post('/api/page/change/:page/:id', controller.api.page.change);
  router.post('/api/page/submit/:page/:id', controller.api.page.submit);
  router.post('/api/page/verify/:page/:id', controller.api.page.verify);
  router.post('/api/page/abandon/:page/:id', controller.api.page.abandon);
  router.post('/api/page/revoke/:page/:id', controller.api.page.revoke);
  router.post('/api/page/close/:page/:id', controller.api.page.close);
  router.post('/api/page/open/:page/:id', controller.api.page.open);
  router.post('/api/page/remove/:page/:id', controller.api.page.remove);

  /* workflow建模 */

  /* 获取 */
  router.get('/workflow/design/members/', controller.api.workflow.design.getWorkFlowMembers);
  /* 保存 */
  router.post('/workflow/design/members/', controller.api.workflow.design.saveWorkFlowMembers);
  /* 删除*/
  router.delete('/workflow/design/members/', controller.api.workflow.design.deleteWorkFlowAndMembers);
  /* 发布 */
  router.post('/workflow/design/publish/', controller.api.workflow.design.publishWorkflow);
  /* 查询流程状态 是否有滞留单据 */
  router.get('/workflow/design/state/', controller.api.workflow.design.workFlowHasBillIn);
  /* 另存 */
  router.post('/workflow/design/save/', controller.api.workflow.design.saveAsOtherWorkFlow);
  /* 获取翻译后的 节点成员*/
  router.post('/workflow/design/owner/translate', controller.api.workflow.design.translateNodeOwner);

  /* workflow解析 */

  router.post('/workflow/action/enter', controller.api.workflow.action.workflowEnter);

  router.get('/workflow/action/deleteTestWorkflowMember', controller.api.workflow.action.deleteTestWorkflowMember);

  router.get('/workflow/action/member', controller.api.workflow.action.getWorkflowDesign);
  router.get('/workflow/action/activeNodes', controller.api.workflow.action.getWorkflowActiveNodes);
  router.get('/workflow/action/log', controller.api.workflow.action.getWorkflowLog);

  router.post('/workflow/action/accept', controller.api.workflow.action.workflowVerify);
  router.post('/workflow/action/reject', controller.api.workflow.action.workflowReject);
  router.post('/workflow/action/again', controller.api.workflow.action.workflowAgain);

  router.post('/workflow/action/changeSig', controller.api.workflow.action.workflowChangeSig);
  router.post('/workflow/action/counterSig', controller.api.workflow.action.workflowCounterSig);

  router.post('/workflow/action/buttons', controller.api.workflow.action.getWorkflowAuthButtons);
  router.post('/workflow/action/pointUser', controller.api.workflow.action.getWorkflowPointUsers);
  
};
