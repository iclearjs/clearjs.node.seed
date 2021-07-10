'use strict';

module.exports = app => {

  const { router, controller } = app;

  // 数据模型API
  router.get('/core/model/:model', controller.coreModel.get);
  router.get('/core/model/:model/:id', controller.coreModel.getById);
  router.post('/core/model/:model', controller.coreModel.post);
  router.put('/core/model/:model/:id', controller.coreModel.update);
  router.patch('/core/model/:model/:id', controller.coreModel.update);
  router.delete('/core/model/:model/:id', controller.coreModel.destroy);

  router.post('/core/getByPost/:model', controller.coreModel.getByPost);
  router.post('/core/getByAggregate/:model', controller.coreModel.getByAggregate);
  router.get('/core/resolveFilter/:entity', controller.coreModel.getResolveFilter);

  // 认证系统API

  router.post('/core/authority/login', controller.coreAuthority.login);
  router.post('/core/authority/register', controller.coreAuthority.register);
  router.post('/core/authority/changePwd', controller.coreAuthority.changePwd);
  // 权限系统API
  router.get('/core/authority/application', controller.coreAuthority.getUserApplication);
  router.get('/core/authority/menu', controller.coreAuthority.getUserMenu);
  router.get('/core/authority/button', controller.coreAuthority.getUserButton);// 返回按钮权限(组织)
  router.get('/core/authority/organ', controller.coreAuthority.getUserOrgan);
  router.get('/core/authority/security', controller.coreAuthority.getUserSecurity);// 返回数据权限
  router.get('/core/authority/params', controller.coreAuthority.getApplicationParams);


  // 文件系统API
  router.get('/core/file/preview/:id', controller.coreFile.preview);
  router.get('/core/file/download/:id', controller.coreFile.download);
  router.post('/core/file/upload', controller.coreFile.upload);
  router.delete('/core/file/remove/:id', controller.coreFile.remove);

  // 单据状态流程
  router.get('/core/page/export/:page', controller.corePage.export);
  router.post('/core/page/import/:page', controller.corePage.import);

  router.post('/core/page/create/:page', controller.corePage.create);
  router.post('/core/page/modify/:page/:id', controller.corePage.modify);
  router.post('/core/page/remove/:page/:id', controller.corePage.remove);
  router.post('/core/page/change/:page/:id', controller.corePage.change);
  router.post('/core/page/submit/:page/:id', controller.corePage.submit);
  router.post('/core/page/verify/:page/:id', controller.corePage.verify);
  router.post('/core/page/abandon/:page/:id', controller.corePage.abandon);
  router.post('/core/page/revoke/:page/:id', controller.corePage.revoke);
  router.post('/core/page/close/:page/:id', controller.corePage.close);
  router.post('/core/page/open/:page/:id', controller.corePage.open);
  /* workflow建模 */

  /* 获取 */
  router.get('/core/workflow/design/members/', controller.coreWorkflowDesign.getWorkFlowMembers);
  /* 保存 */
  router.post('/core/workflow/design/members/', controller.coreWorkflowDesign.saveWorkFlowMembers);
  /* 删除*/
  router.delete('/core/workflow/design/members/', controller.coreWorkflowDesign.deleteWorkFlowAndMembers);
  /* 发布 */
  router.post('/core/workflow/design/publish/', controller.coreWorkflowDesign.publishWorkflow);
  /* 查询流程状态 是否有滞留单据 */
  router.get('/core/workflow/design/state/', controller.coreWorkflowDesign.workFlowHasBillIn);
  /* 另存 */
  router.post('/core/workflow/design/save/', controller.coreWorkflowDesign.saveAsOtherWorkFlow);
  /* 获取翻译后的 节点成员*/
  router.post('/core/workflow/design/owner/translate', controller.coreWorkflowDesign.translateNodeOwner);

  /* workflow解析 */

  router.post('/core/workflow/enter', controller.coreWorkflow.workflowEnter);
  router.get('/core/workflow/deleteTestWorkflowMember', controller.coreWorkflow.deleteTestWorkflowMember);
  router.get('/core/workflow/member', controller.coreWorkflow.getWorkflowDesign);
  router.get('/core/workflow/activeNodes', controller.coreWorkflow.getWorkflowActiveNodes);
  router.get('/core/workflow/log', controller.coreWorkflow.getWorkflowLog);
  router.post('/core/workflow/accept', controller.coreWorkflow.workflowVerify);
  router.post('/core/workflow/reject', controller.coreWorkflow.workflowReject);
  router.post('/core/workflow/again', controller.coreWorkflow.workflowAgain);
  router.post('/core/workflow/changeSig', controller.coreWorkflow.workflowChangeSig);
  router.post('/core/workflow/counterSig', controller.coreWorkflow.workflowCounterSig);
  router.post('/core/workflow/buttons', controller.coreWorkflow.getWorkflowAuthButtons);
  router.post('/core/workflow/pointUser', controller.coreWorkflow.getWorkflowPointUsers);

  router.get('/', controller.coreViews.index);
  router.get('/404', controller.coreViews.notfound);
  router.get('/swagger', controller.coreViews.swagger);
};
