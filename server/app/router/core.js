'use strict';

module.exports = app => {

  const { router, controller } = app;

  // 数据模型API
  router.get('/v1/model/:model', controller.coreModel.get);
  router.get('/v1/model/:model/:id', controller.coreModel.getById);
  router.post('/v1/model/:model', controller.coreModel.post);
  router.put('/v1/model/:model/:id', controller.coreModel.update);
  router.patch('/v1/model/:model/:id', controller.coreModel.update);
  router.delete('/v1/model/:model/:id', controller.coreModel.destroy);

  router.post('/v1/getByPost/:model', controller.coreModel.getByPost);
  router.post('/v1/getByAggregate/:model', controller.coreModel.getByAggregate);
  router.get('/v1/resolveFilter/:entity', controller.coreModel.getResolveFilter);

  // 认证系统API

  router.post('/v1/authority/login', controller.coreAuthority.login);
  router.post('/v1/authority/register', controller.coreAuthority.register);
  router.post('/v1/authority/changePwd', controller.coreAuthority.changePwd);
  // 权限系统API
  router.get('/v1/authority/application', controller.coreAuthority.getUserApplication);
  router.get('/v1/authority/menu', controller.coreAuthority.getUserMenu);
  router.get('/v1/authority/button', controller.coreAuthority.getUserButton);// 返回按钮权限(组织)
  router.get('/v1/authority/organ', controller.coreAuthority.getUserOrgan);
  router.get('/v1/authority/security', controller.coreAuthority.getUserSecurity);// 返回数据权限
  router.get('/v1/authority/params', controller.coreAuthority.getApplicationParams);


  // 文件系统API
  router.get('/v1/file/preview/:id', controller.coreFile.preview);
  router.get('/v1/file/download/:id', controller.coreFile.download);
  router.post('/v1/file/upload', controller.coreFile.upload);
  router.post('/v1/file/uploadByBase64', controller.coreFile.uploadByBase64);
  router.delete('/v1/file/remove/:id', controller.coreFile.remove);

  // 单据状态流程
  router.get('/v1/page/export/:page', controller.corePage.export);
  router.post('/v1/page/import/:page', controller.corePage.import);

  router.post('/v1/page/create/:page', controller.corePage.create);
  router.post('/v1/page/modify/:page/:id', controller.corePage.modify);
  router.post('/v1/page/remove/:page/:id', controller.corePage.remove);
  router.post('/v1/page/change/:page/:id', controller.corePage.change);
  router.post('/v1/page/submit/:page/:id', controller.corePage.submit);
  router.post('/v1/page/verify/:page/:id', controller.corePage.verify);
  router.post('/v1/page/abandon/:page/:id', controller.corePage.abandon);
  router.post('/v1/page/revoke/:page/:id', controller.corePage.revoke);
  router.post('/v1/page/close/:page/:id', controller.corePage.close);
  router.post('/v1/page/open/:page/:id', controller.corePage.open);
  /* workflow建模 */

  /* 获取 */
  router.get('/v1/workflow/design/members/', controller.coreWorkflowDesign.getWorkFlowMembers);
  /* 保存 */
  router.post('/v1/workflow/design/members/', controller.coreWorkflowDesign.saveWorkFlowMembers);
  /* 删除*/
  router.delete('/v1/workflow/design/members/', controller.coreWorkflowDesign.deleteWorkFlowAndMembers);
  /* 发布 */
  router.post('/v1/workflow/design/publish/', controller.coreWorkflowDesign.publishWorkflow);
  /* 查询流程状态 是否有滞留单据 */
  router.get('/v1/workflow/design/state/', controller.coreWorkflowDesign.workFlowHasBillIn);
  /* 另存 */
  router.post('/v1/workflow/design/save/', controller.coreWorkflowDesign.saveAsOtherWorkFlow);
  /* 获取翻译后的 节点成员*/
  router.post('/v1/workflow/design/owner/translate', controller.coreWorkflowDesign.translateNodeOwner);

  /* workflow解析 */

  router.post('/v1/workflow/enter', controller.coreWorkflow.workflowEnter);
  router.get('/v1/workflow/deleteTestWorkflowMember', controller.coreWorkflow.deleteTestWorkflowMember);
  router.get('/v1/workflow/member', controller.coreWorkflow.getWorkflowDesign);
  router.get('/v1/workflow/activeNodes', controller.coreWorkflow.getWorkflowActiveNodes);
  router.get('/v1/workflow/log', controller.coreWorkflow.getWorkflowLog);
  router.post('/v1/workflow/accept', controller.coreWorkflow.workflowVerify);
  router.post('/v1/workflow/reject', controller.coreWorkflow.workflowReject);
  router.post('/v1/workflow/again', controller.coreWorkflow.workflowAgain);
  router.post('/v1/workflow/changeSig', controller.coreWorkflow.workflowChangeSig);
  router.post('/v1/workflow/counterSig', controller.coreWorkflow.workflowCounterSig);
  router.post('/v1/workflow/buttons', controller.coreWorkflow.getWorkflowAuthButtons);
  router.post('/v1/workflow/pointUser', controller.coreWorkflow.getWorkflowPointUsers);

  router.get('/', controller.coreViews.index);
  router.get('/404', controller.coreViews.notfound);
  router.get('/swagger', controller.coreViews.swagger);
};
