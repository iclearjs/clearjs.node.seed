'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');

class BillService extends Service {
    constructor(ctx) {
        super(ctx);
    }

    async GetPageConfig(pageIdOrCode) {
        const {ctx} = this;
        let PageConfig = await ctx.model.CdpPage.findOne(/^[a-fA-F0-9]{24}$/.test(pageIdOrCode) ? {_id: pageIdOrCode} : {code: pageIdOrCode}).populate(['idEntityList', 'idEntityCard', 'idApplication']).lean();
        const PageModel = ctx.model[ctx.helper.humps.pascalize(PageConfig.idEntityList.dsCollection)];
        let PageMiddleware = ctx.service.pageMiddleware;
        if (fs.existsSync(path.join(ctx.app.baseDir, 'app/service', PageConfig.idApplication.keyword, PageConfig.idEntityList.dsCollection + '.js'))) {
            PageMiddleware = ctx.service[PageConfig.idApplication.keyword].pageMiddleware[ctx.helper.humps.camelize(PageConfig.code)];
        }
        return {PageConfig, PageModel, PageMiddleware}
    }

    /* 数据交换 @PageData:单据详情; @event：操作事件;@operateUser：操作员 @params：page参数 */
    async doExchange({PageData, event, operateUser}, pageParam) {
        const {ctx} = this;
        const EXCHANGE_SERVICE = ctx.service.PageData.exchange[ctx.helper.humps.camelize(pageParam.PageConfig.code)] ? ctx.service.PageData.exchange[ctx.helper.humps.camelize(pageParam.PageConfig.code)] : ctx.service.PageData.baseExchange;
        /* 仅等待数据处理完成，交换请求发起。即不等待至 交换接口回调 */
        return (await EXCHANGE_SERVICE.exchange({_id: PageData._id, idOrgan: PageData.idOrgan, event, operateUser}, pageParam))
    }

    /* 数据交换 @PageData:单据详情; @event：操作事件;@operateUser：操作员 @params：page参数 */
    async doMessagePush({PageData, event, operateUser}, PageConfig) {
        // 翻译单据的操作员、创建人
        const data = JSON.parse(JSON.stringify(PageData));
        const {ctx} = this, {createdUser, idOrgan, billCode} = data;
        if (!createdUser || !operateUser) {
            console.error('审批推送无操作人员', {createdUser, operateUser});
            return
        }
        const userMap = await ctx.model.ViewSysUserOrgan.find({_id: {$in: [createdUser, operateUser]}}).lean().then(el => {
            let UserOrganMap = {};
            el.forEach(el => {
                UserOrganMap[el._id.toString()] = {userName: el.userName, userCode: el.userCode, ...el.organUserMap}
            });
            return UserOrganMap
        });
        const createdUserName = userMap[createdUser] ? (userMap[createdUser][idOrgan] ? userMap[createdUser][idOrgan].name : userMap[createdUser].userName) : '';
        const operateUserName = userMap[operateUser] ? (userMap[operateUser][idOrgan] ? userMap[operateUser][idOrgan].name : userMap[operateUser].userName) : '';
        // 固定推送 操作员 不等于 单据创建人时 推送
        if (createdUser && operateUser && operateUser !== createdUser) {
            /*@pushMessage VERIFY*/
            await this.ctx.service.msg.push.pushMessage(event, {...data, operateUserName, createdUserName}, PageConfig);
        } else {
            console.error(`单据号${billCode},事件${event},创建人${createdUser}:${createdUserName},操作人${operateUser}:${operateUserName}`)
        }
    }

    doExport({title, fields}, records) {
        let excelRecords = [];
        const $project = {};
        const fieldsNameArray = [];
        for (const field of fields) {
            $project[field.field] = field;
            fieldsNameArray.push(field.name);
        }
        excelRecords = [fieldsNameArray];
        for (const record of records) {
            const recordDataArray = [];
            for (const key in $project) {
                function getValue(record, {field, widget, idEnum,referDisplay}) {
                    let res;
                    function getSelectOptionName(array, code) {
                        return array && Array.isArray(array) && array.filter(el => el.code === code || el.code === code.toString())[0] ? array.filter(el => el.code === code || el.code === code.toString())[0].name : code
                    }
                    switch (widget) {
                        case 'Checkbox':
                            try {
                                res = eval('record.' + field)
                            } catch (e) {
                                res = ''
                            }
                            if (idEnum && idEnum.range && Array.isArray(res)) {
                                res = res.map(el => {
                                    return el!==void(0)? getSelectOptionName(idEnum.range, el):''
                                })
                            } else {
                                res = res ? res : ''
                            }
                            break;
                        case 'Date':
                            try {
                                res = eval('record.' + field)
                            } catch (e) {
                                res = ''
                            }
                            res = res?moment(res).format('YYYY-MM-DD '):'';
                            break;
                        case 'Radio':
                            try {
                                res = eval('record.' + field)
                            } catch (e) {
                                res = ''
                            }
                            if (idEnum && idEnum.range && res !== void(0)) {
                                res = getSelectOptionName(idEnum.range, res)
                            } else {
                                res = res ? res : ''
                            }
                            break;
                        case 'CheckboxRefer':
                            try {
                                res = eval('record.' + field).map(el => el.idObject[referDisplay]).join(',')
                            } catch (e) {
                                res = ''
                            }
                            break;
                        default:
                            try {
                                res = eval('record.' + field)
                            } catch (e) {
                                res = ''
                            }
                            break
                    }
                    return res
                }
                recordDataArray.push(getValue(record, $project[key]));
            }
            excelRecords.push(recordDataArray);
        }
        this.ctx.attachment(title + new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate() + ' -' + new Date().getTime() + '.xlsx');
        this.ctx.set('Content-Type', 'application/octet-stream');
        return xlsx.build([{name: 'sheet1', data: excelRecords}]);
    }
    
    async doCreate({body}, pageIdOrCode) {
        const error = {
            code: '0',
        };
        const {ctx} = this;
        let records, BeforeMiddleware, AfterMiddleware = {};
        const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
        if (!body._id) {
            BeforeMiddleware = await PageMiddleware.beforeCreate(body);
            BeforeMiddleware.error.code !== '0' && (Object.assign(error, BeforeMiddleware.error));
            error.code === '0' && (records = await PageModel.create(BeforeMiddleware.data).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = '单据创建失败，请重试！';
                }
                console.info(e);
            }));
            error.code === '0' && (AfterMiddleware = await PageMiddleware.afterCreate(records));
            (AfterMiddleware && AfterMiddleware.code !== '0') && (Object.assign(error, AfterMiddleware));
            if (AfterMiddleware.code === '0') {
                /* 单据创建完成 尝试记录当前单据 应用审批流 */
                if (PageConfig && PageConfig._id && PageConfig.isWorkflow) {
                    const workflow = await ctx.model.WfWorkflow.findOne({__s: 1, idPage: PageConfig._id}).lean();
                    if (workflow && workflow._id) {
                        await ctx.service.workflow.enterWorkflow({
                            workId: records._id,
                            idWorkflow: workflow._id
                        }, {isEnterWorkflow: false}).then(async res => {
                            if (res.error.code === '0') {
                                await PageModel.updateMany({_id: records._id}, {idWorkflow: workflow._id});
                            }
                        })
                    }
                }
                // 进行数据推送
                await this.doExchange({PageData: records, event: 'CREATE', operateUser: body.createdUser}, {
                    PageConfig,
                    PageModel
                })
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({_id: records._id}).lean()
            }
        } else {
            error.code = '900';
            error.message = '数据存在非法ID，请刷新数据后重试！';
        }
        return error.code === '0' ? {error, records} : {error}
    }

    async doModify({body, operateUser}, pageIdOrCode, platform) {
        const error = {
            code: '0',
        };
        const {ctx} = this;
        if (error.code === '0' && !body) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return {error}
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return {error}
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return {error}
        }
        let records, PageData, BeforeMiddleware, AfterMiddleware = {};
        if (error.code === '0') {
            const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({_id: body._id}).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return {error}
            }
            if (PageData.__s !== 1) {
                error.code = '900';
                error.message = '当前数据状态不允许修改，请刷新数据后重试！';
                return {error}
            }
            if (PageData && PageData.sourceType === 1 && PageData.sourcePlatform !== sourcePlatform) {
                error.code = '900';
                error.message = '此数据来源于外部平台，请在对应平台进行删改！';
                return {error}
            }
            delete body.updatedAt;
            body.updatedUser = operateUser;
            BeforeMiddleware = await PageMiddleware.beforeModify(body);
            BeforeMiddleware.error.code !== '0' && (Object.assign(error, BeforeMiddleware.error));

            error.code === '0' && (records = await PageModel.updateMany({_id: PageData._id}, BeforeMiddleware.data).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = e.message;
                }
                console.info(e);
            }));
            error.code === '0' && (AfterMiddleware = await PageMiddleware.afterModify(PageData._id));

            (AfterMiddleware && AfterMiddleware.code !== '0') && (Object.assign(error, AfterMiddleware));
            // 数据交换 数据推送
            if (AfterMiddleware.code === '0') {
                await this.doMessagePush({PageData, event: 'MODIFY', operateUser}, PageConfig);
                await this.doExchange({PageData, event: 'MODIFY', operateUser}, {PageConfig, PageModel})
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({_id: PageData._id})
            }
        }

        return error.code === '0' ? {error, records} : {error}
    }

    async doChange({body, operateUser}, pageIdOrCode) {
        const error = {
            code: '0',
        };
        const {ctx} = this;
        if (error.code === '0' && !body) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return {error}
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return {error}
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return {error}
        }
        let records, PageData, BeforeMiddleware, AfterMiddleware = {};


        if (error.code === '0') {
            const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({_id: body._id}).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return {error}
            }
            if (PageData.__s !== 3) {
                error.code = '900';
                error.message = `当前数据状态无法进行变更操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return {error}
            }
            BeforeMiddleware = await PageMiddleware.beforeChange(body);

            if (BeforeMiddleware.code !== '0') (Object.assign(error, BeforeMiddleware));
            if (error.code === '0') {
                (records = await PageModel.updateMany({_id: PageData._id}, body).catch(e => {
                    if (e) {
                        error.code = e.code;
                        error.message = e.message;
                    }
                    console.info(e);
                }));
                // // 保存变更历史
                await ctx.model[PageModel + 'History'].create(body.history);
            }
            if (error.code === '0') (AfterMiddleware = await PageMiddleware.afterChange(body));
            if (AfterMiddleware && AfterMiddleware.code !== '0') Object.assign(error, AfterMiddleware);
            if (AfterMiddleware.code === '0') {
                // 数据交换
                await this.doExchange({PageData, event: 'CHANGE', operateUser}, {PageConfig, PageModel});
                // 进行数据推送
                await this.doMessagePush({PageData, event: 'CHANGE', operateUser}, PageConfig)
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({_id: PageData._id})
            }
        }


        return error.code === '0' ? {error, records} : {error}
    }

    async doVerify({_id, operateUser}, pageIdOrCode) {
        /**/
        const error = {
            code: '0',
        };
        const {ctx} = this;
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return {error}
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return {error}
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return {error}
        }
        let records, PageData, BeforeMiddleware, AfterMiddleware = {};

        if (error.code === '0') {
            const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({_id}).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return {error}
            }
            if (PageData.__s !== 2) {
                error.code = '900';
                error.message = '当前数据已审核或撤回，请刷新数据后重试！';
                return {error}
            }
            BeforeMiddleware = await PageMiddleware.beforeVerify(PageData._id);
            BeforeMiddleware.code !== '0' && (Object.assign(error, BeforeMiddleware));
            error.code === '0' && (
                records = await PageModel.updateMany({_id: PageData._id}, {
                    __s: 3,
                    verifyAt: new Date(),
                    verifyUser: operateUser,
                }).catch(e => {
                    if (e) {
                        error.code = e.code;
                        error.message = e.message;
                    }
                    console.info(e);
                })
            );
            AfterMiddleware = await PageMiddleware.afterVerify(PageData._id);

            AfterMiddleware.code !== '0' && (Object.assign(error, AfterMiddleware));

            if (AfterMiddleware.code === '0') {
                // 结束审批流
                if (PageConfig.isWorkflow && PageData.idWorkflow) {
                    const workflowActive = await ctx.model.WfWorkflowActive.findOne({
                        idWorkflow: PageData.idWorkflow,
                        workId: PageData._id
                    }).lean();
                    if (workflowActive.__s !== 2) {
                        await this.ctx.model.WfWorkflowActive.updateMany({workId: PageData._id}, {__s: 2});
                    }
                }
                // 进行数据推送
                await this.doExchange({PageData, event: 'VERIFY', operateUser}, {PageConfig, PageModel});

                // 进行消息推送
                if (PageData && PageData.createdUser) {
                    await this.doMessagePush({PageData, event: 'VERIFY', operateUser}, PageConfig)
                }
            }

            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({_id: PageData._id})
            }
        }
        return error.code === '0' ? {error, records} : {error}
    }

    async doSubmit({_id, operateUser}, pageIdOrCode) {
        const error = {
            code: '0',
        };
        const {ctx} = this;
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return {error}
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return {error}
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return {error}
        }
        let records, PageData, BeforeMiddleware, AfterMiddleware = {};


        if (error.code === '0') {
            const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({_id}).lean();
            if (PageConfig.isWorkflow && PageData.idWorkflow) {
                const workflowActive = await ctx.model.WfWorkflowActive.findOne({
                    idWorkflow: PageData.idWorkflow,
                    workId: PageData._id
                }).lean();
                if (workflowActive) {
                    let workflowResult = await ctx.service.workflow.enterWorkflow({
                        idWorkflow: PageData.idWorkflow,
                        workId: PageData._id
                    });
                    if (workflowResult.error.code !== '0') {
                        error.code = '900';
                        error.message = '单据进入审批流失败，请刷新数据后重试！';
                    }
                }
            }
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return {error}
            }
            if (PageData.__s !== 1) {
                error.code = '900';
                error.message = '当前数据已提交或审核，请刷新数据后重试！';
                return {error}
            }
            BeforeMiddleware = await PageMiddleware.beforeSubmit(PageData._id);
            BeforeMiddleware.code !== '0' && (Object.assign(error, BeforeMiddleware));

            error.code === '0' && (records = await PageModel.updateMany({_id: PageData._id}, {
                __s: 2,
                submitAt: new Date(),
                submitUser: operateUser,
            }).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = e.message;
                }
                console.info(e);
            }));
            error.code === '0' && (AfterMiddleware = await PageMiddleware.afterSubmit(PageData._id));

            (AfterMiddleware && AfterMiddleware.code !== '0') && (Object.assign(error, AfterMiddleware));


            // 进行数据推送
            if (AfterMiddleware.code === '0') {
                await this.doExchange({PageData, event: 'SUBMIT', operateUser}, {PageConfig, PageModel})
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && AfterMiddleware.code === '0') {
                await this.doMessagePush({PageData, event: 'SUBMIT', operateUser}, PageConfig)
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({_id: PageData._id})
            }
        }


        return error.code === '0' ? {error, records} : {error}
    }

    async doAbandon({_id, operateUser}, pageIdOrCode) {
        const error = {
            code: '0',
        };
        const {ctx} = this;
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return {error}
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return {error}
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return {error}
        }
        let records, PageData, BeforeMiddleware, AfterMiddleware = {};

        if (error.code === '0') {
            const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({_id}).lean();
            if (PageConfig.isWorkflow) {
                const workflow = await ctx.model.WfWorkflow.findOne({idPage: PageConfig._id, __s: 1});
                if (workflow) {
                    const user = ctx.model.SysUser.findOne({_id: operateUser}).lean();
                    await ctx.service.workflow.createWorkflowLog({
                        _id: PageData._id,
                        memo: '重新发起审批流',
                        description: `${user.userName}重新发起审批流`
                    }, 'again');
                    let workflowResult = await ctx.service.workflow.enterWorkflow({
                        idWorkflow: workflow._id,
                        workId: PageData._id
                    });
                    if (workflowResult.error.code !== '0') {
                        error.code = '900';
                        error.message = '单据重新进入审批流失败，请刷新数据后重试！';
                    }
                }
            }
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return {error}
            }
            if (PageData.__s !== 3) {
                error.code = '900';
                error.message = `当前数据状态无法进行弃审操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return {error}
            }
            BeforeMiddleware = await PageMiddleware.beforeAbandon(PageData._id);
            BeforeMiddleware.code !== '0' && (Object.assign(error, BeforeMiddleware));

            error.code === '0' && (records = await PageModel.updateMany({_id: PageData._id}, {
                __s: 2,
                abandonAt: new Date(),
                abandonUser: operateUser,
            }).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = e.message;
                }
                console.info(e);
            }));
            error.code === '0' && (AfterMiddleware = await PageMiddleware.afterAbandon(PageData._id));

            (AfterMiddleware && AfterMiddleware.code !== '0') && (Object.assign(error, AfterMiddleware));

            // 进行数据推送
            if (AfterMiddleware.code === '0') {
                await this.doExchange({PageData, event: 'ABANDON', operateUser}, {PageConfig, PageModel})
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && AfterMiddleware.code === '0') {
                await this.doMessagePush({PageData, event: 'ABANDON', operateUser}, PageConfig)
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({_id: PageData._id})
            }
        }

        return error.code === '0' ? {error, records} : {error}
    }

    async doRevoke({_id, operateUser}, pageIdOrCode) {
        const error = {
            code: '0',
        };
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return {error}
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return {error}
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return {error}
        }
        let records, PageData, BeforeMiddleware, AfterMiddleware = {};

        if (error.code === '0') {
            const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({_id}).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return {error}
            }
            if (PageData.__s !== 2) {
                error.code = '900';
                error.message = `当前数据状态无法进行撤回操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return {error}
            }
            BeforeMiddleware = await PageMiddleware.beforeRevoke(PageData._id);

            BeforeMiddleware.code !== '0' && (Object.assign(error, BeforeMiddleware));

            error.code === '0' && (records = await PageModel.updateMany({_id: PageData._id}, {
                __s: 1,
                revokeAt: new Date(),
                revokeUser: operateUser,
            }).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = e.message;
                }
                console.info(e);
            }));
            error.code === '0' && (AfterMiddleware = await PageMiddleware.afterRevoke(PageData._id));

            (AfterMiddleware && AfterMiddleware.code !== '0') && (Object.assign(error, AfterMiddleware));


            // 进行数据推送
            if (AfterMiddleware.code === '0') {
                await this.doExchange({PageData, event: 'REVOKE', operateUser}, {PageConfig, PageModel})
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && AfterMiddleware.code === '0') {
                await this.doMessagePush({PageData, event: 'REVOKE', operateUser}, PageConfig)
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({_id: PageData._id})
            }
        }

        return error.code === '0' ? {error, records} : {error}
    }

    async doClose({_id, operateUser}, pageIdOrCode) {
        const error = {
            code: '0',
        };
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return {error}
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return {error}
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return {error}
        }
        let records, PageData, BeforeMiddleware, AfterMiddleware = {};
        if (error.code === '0') {
            const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({_id}).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return {error}
            }
            if (PageData.__s !== 3) {
                error.code = '900';
                error.message = `当前数据状态无法进行关闭操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return {error}
            }
            if (PageData.__c === 0) {
                error.code = '900';
                error.message = `当前数据已关闭，请刷新数据！`;
                return {error}
            }
            BeforeMiddleware = await PageMiddleware.beforeClose(PageData._id);

            BeforeMiddleware.code !== '0' && (Object.assign(error, BeforeMiddleware));

            error.code === '0' && (records = await PageModel.updateMany({_id: PageData._id}, {
                __c: 0,
                closeAt: new Date(),
                closeUser: operateUser,
            }).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = e.message;
                }
                console.info(e);
            }));
            error.code === '0' && (AfterMiddleware = await PageMiddleware.afterClose(PageData._id));

            (AfterMiddleware && AfterMiddleware.code !== '0') && (Object.assign(error, AfterMiddleware));

            // 进行数据推送
            if (AfterMiddleware.code === '0') {
                await this.doExchange({PageData, event: 'CLOSE', operateUser}, {PageConfig, PageModel})
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && AfterMiddleware.code === '0') {
                await this.doMessagePush({PageData, event: 'CLOSE', operateUser}, PageConfig)
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({_id: PageData._id})
            }
        }


        return error.code === '0' ? {error, records} : {error}
    }

    async doOpen({_id, operateUser}, pageIdOrCode) {
        const error = {
            code: '0',
        };
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return {error}
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return {error}
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return {error}
        }
        let records, PageData, BeforeMiddleware, AfterMiddleware = {};

        if (error.code === '0') {
            const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({_id}).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return {error}
            }
            if (PageData.__c !== 0) {
                error.code = '900';
                error.message = `当前数据状态无法进行开启操作，数据状态:${PageData.__c}，请刷新数据后重试！`;
                return {error}
            }
            BeforeMiddleware = await PageMiddleware.beforeOpen(PageData._id);

            BeforeMiddleware.code !== '0' && (Object.assign(error, BeforeMiddleware));

            error.code === '0' && (records = await PageModel.updateMany({_id: PageData._id}, {
                __c: 1,
                openAt: new Date(),
                openUser: operateUser,
            }).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = e.message;
                }
                console.info(e);
            }));
            error.code === '0' && (AfterMiddleware = await PageMiddleware.afterOpen(PageData._id));

            (AfterMiddleware && AfterMiddleware.code !== '0') && (Object.assign(error, AfterMiddleware));


            // 进行数据推送
            if (AfterMiddleware.code === '0') {
                await this.doExchange({PageData, event: 'OPEN', operateUser}, {PageConfig, PageModel})
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && AfterMiddleware.code === '0') {
                await this.doMessagePush({PageData, event: 'OPEN', operateUser}, PageConfig)
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({_id: PageData._id})
            }
        }

        return error.code === '0' ? {error, records} : {error}
    }

    async doRemove({_id, operateUser}, pageIdOrCode, platform) {
        const error = {
            code: '0',
        };
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return {error}
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return {error}
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return {error}
        }
        let records, PageData, BeforeMiddleware, AfterMiddleware = {};

        if (error.code === '0') {
            const {PageConfig, PageModel, PageMiddleware} = await this.GetPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({_id}).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return {error}
            }
            if (PageData.__s !== 1) {
                error.code = '900';
                error.message = `当前数据状态无法进行删除操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return {error}
            }
            if (PageData && PageData.sourceType === 1 && PageData.sourcePlatform !== platform) {
                error.code = '900';
                error.message = '此数据来源于系统自动生成(外部平台)，请在对应上游单据（外部平台）进行删改！';
                return {error}
            }
            BeforeMiddleware = await PageMiddleware.beforeRemove(PageData._id);

            BeforeMiddleware.code !== '0' && (Object.assign(error, BeforeMiddleware));

            error.code === '0' && (await PageModel.remove({_id: PageData._id}).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = e.message;
                }
                console.info(e);
            }));
            error.code === '0' && (AfterMiddleware = await PageMiddleware.afterRemove(PageData));

            (AfterMiddleware && AfterMiddleware.code !== '0') && (Object.assign(error, AfterMiddleware));

            // 进行数据推送
            if (AfterMiddleware.code === '0') {
                await this.doExchange({PageData, event: 'REMOVE', operateUser}, {PageConfig, PageModel})
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && AfterMiddleware.code === '0') {
                await this.doMessagePush({PageData, event: 'REMOVE', operateUser}, PageConfig)
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = PageData
            }
        }

        return error.code === '0' ? {error, records} : {error}
    }

    async doCreateAndVerify({body, operateUser}, pageIdOrCode)  {
        let error = {code: '0'};
        let record = await this.doCreate({body}, pageIdOrCode).then(res => {
            if (res.error.code !== '0') {
                error.code = res.error.code;
                error.message = res.error.message;
            } else {
                return res.records._id
            }
        });
        if (record.__s === 1) {
            record = await this.doSubmit({_id: record._id, operateUser: operateUser}, pageIdOrCode).then(res => {
                if (res.error.code !== '0') {
                    error.code = res.error.code;
                    error.message = res.error.message;
                } else {
                    return res.records
                }
            });
        }
        if (record.__s === 2) {
            await this.doVerify({_id: record._id, operateUser: operateUser}, pageIdOrCode).then(res => {
                if (res.error.code !== '0') {
                    error.code = res.error.code;
                    error.message = res.error.message;
                }
            })
        }
        return {error, record: record};
    }

}

module.exports = BillService;
