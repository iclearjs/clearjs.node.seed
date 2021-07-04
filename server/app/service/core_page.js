'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');

class CorePage extends Service {
    constructor(ctx) {
        super(ctx);
    }

    async getPageConfig(pageIdOrCode) {
        const { ctx } = this;
        const PageConfig = await ctx.model.CdpPage.findOne(/^[a-fA-F0-9]{24}$/.test(pageIdOrCode) ? { _id: pageIdOrCode } : { code: pageIdOrCode }).populate([ 'idEntityList', 'idEntityCard', 'idApplication' ]).lean();
        const PageModel = ctx.model[ctx.helper.humps.pascalize(PageConfig.idEntityCard.dsCollection)];
        let PageMiddleware = ctx.service.corePageMiddleware;
        if (fs.existsSync(path.join(ctx.app.baseDir, 'app/service', PageConfig.idApplication.keyword,'middleware', PageConfig.idEntityCard.dsCollection + '.js'))) {
            PageMiddleware = ctx.service[PageConfig.idApplication.keyword].page.middleware[ctx.helper.humps.camelize(PageConfig.code)];
        }
        let PageExchange = ctx.service.corePageExchange;
        if (fs.existsSync(path.join(ctx.app.baseDir, 'app/service', PageConfig.idApplication.keyword,'exchange', PageConfig.idEntityCard.dsCollection + '.js'))) {
            PageExchange = ctx.service[PageConfig.idApplication.keyword].page.exchange[ctx.helper.humps.camelize(PageConfig.code)];
        }
        return { PageConfig, PageModel, PageMiddleware, PageExchange };
    }

    async doExport(fields, records) {
        let excelRecords = [];
        const $project = {};
        const fieldsNameArray = [];
        for (const field of fields) {
            $project[field.field] = field;
            fieldsNameArray.push(field.name);
        }
        excelRecords = [ fieldsNameArray ];
        for (const record of records) {
            const recordDataArray = [];
            for (const key in $project) {
                function getValue(record, { field, widget, idEnum, referDisplay }) {
                    let res;
                    function getSelectOptionName(array, code) {
                        return array && Array.isArray(array) && array.filter(el => el.code === code || el.code === code.toString())[0] ? array.filter(el => el.code === code || el.code === code.toString())[0].name : code;
                    }
                    switch (widget) {
                        case 'Checkbox':
                            try {
                                res = eval('record.' + field);
                            } catch (e) {
                                res = '';
                            }
                            if (idEnum && idEnum.range && Array.isArray(res)) {
                                res = res.map(el => {
                                    return el !== void (0) ? getSelectOptionName(idEnum.range, el) : '';
                                });
                            } else {
                                res = res ? res : '';
                            }
                            break;
                        case 'Date':
                            try {
                                res = eval('record.' + field);
                            } catch (e) {
                                res = '';
                            }
                            res = res ? moment(res).format('YYYY-MM-DD ') : '';
                            break;
                        case 'Radio':
                            try {
                                res = eval('record.' + field);
                            } catch (e) {
                                res = '';
                            }
                            if (idEnum && idEnum.range && res !== void (0)) {
                                res = getSelectOptionName(idEnum.range, res);
                            } else {
                                res = res ? res : '';
                            }
                            break;
                        case 'CheckboxRefer':
                            try {
                                res = eval('record.' + field).map(el => el.idObject[referDisplay]).join(',');
                            } catch (e) {
                                res = '';
                            }
                            break;
                        default:
                            try {
                                res = eval('record.' + field);
                            } catch (e) {
                                res = '';
                            }
                            break;
                    }
                    return res;
                }
                recordDataArray.push(getValue(record, $project[key]));
            }
            excelRecords.push(recordDataArray);
        }
        return xlsx.build([{ name: 'sheet1', data: excelRecords }]);
    }

    async doImport(idPage, file, extend = {}) {
        const records = [],
            { ctx } = this;
        const pageConfig = await ctx.model.CdpPage.findOne(/^[a-fA-F0-9]{24}$/.test(idPage) ? { _id: idPage } : { code: idPage }).populate([ 'idEntityList' ]);
        const fields = await this.ctx.model.CdpPageWidget.find({
            idPage: pageConfig._id,
            listVisible: true,
            mode: 'listCard',
            readonly: false,
        }).sort({ order: 1 }).populate([ 'idEnum' ]);
        const PageModel = ctx.model[ctx.helper.humps.pascalize(pageConfig.idEntityList.dsCollection)];
        const FileData = xlsx.parse(file)[0].data;
        const rowNameFile = FileData[0].map(name => {
            return fields.filter(el => el.name === name).length > 0 ? fields.filter(el => el.name === name)[0] : {};
        });
        const translateRefField = async (idRefer, { key = null, values = [], idOrgan = '' }) => {
            const filter = { key: { $in: values }, ...idOrgan ? { idOrgan } : {} };
            const PageConfig = await ctx.model.CdpPage.findOne({ _id: idRefer }).lean();
            const PageModel = ctx.model[ctx.helper.humps.pascalize(PageConfig.idEntityList.dsCollection)];
            return await PageModel.find(filter).lean().then(el => {
                if (el.length > 0) {
                    return el.reduce((mapId, item) => {
                        return !mapId ? { [item[key]]: item._id } : { ...mapId, [item[key]]: item._id };
                    }, false);
                }
                return {};
            });
        };
        const translateMap = {};
        for (const i in FileData) {
            const data = {};
            if (i > 0) {
                for (const j in FileData[i]) {
                    const nameField = rowNameFile[j];
                    if (nameField && nameField.field) {
                        switch (nameField.widget) {
                            case 'RadioRefer':
                                if (Number(i) === 1) {
                                    translateMap[nameField.field] = await translateRefField(nameField.idRefer, { key: nameField.referDisplay, values: FileData.reduce((sum, item, index) => {
                                            if (Number(index) === 0) {
                                                return [];
                                            }
                                            return [ ...sum, item[j] ];
                                        }, false), idOrgan: extend.idOrgan });
                                }
                                if (translateMap[nameField.field] && translateMap[nameField.field][FileData[i][j]]) {
                                    data[nameField.field] = translateMap[nameField.field][FileData[i][j]];
                                }
                                break;
                            case 'CheckboxRefer':
                                break;
                            default:
                                data[nameField.field] = FileData[i][j];
                                break;
                        }
                    }
                }
                records.push({ ...extend, ...data });
            }
        }
        return await PageModel.post(records);
    }

    async doCreate(data, operateUser, pageIdOrCode) {
        const error = {
            code: '0',
        };
        const { ctx } = this;
        let records, ResBeforeMid, ResAfterMid = {};
        const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
        if (!data._id) {
            ResBeforeMid = await PageMiddleware.beforeCreate(data);
            ResBeforeMid.error.code !== '0' && (Object.assign(error, ResBeforeMid.error));
            error.code === '0' && (records = await PageModel.create(ResBeforeMid.data).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = '单据创建失败，请重试！';
                }
                console.info(e);
            }));
            error.code === '0' && (ResAfterMid = await PageMiddleware.afterCreate(records));
            (ResAfterMid && ResAfterMid.code !== '0') && (Object.assign(error, ResAfterMid));
            if (ResAfterMid.code === '0') {
                /* 单据创建完成 尝试记录当前单据 应用审批流 */
                if (PageConfig && PageConfig._id && PageConfig.isWorkflow) {
                    const workflow = await ctx.model.WfWorkflow.findOne({ __s: 1, idPage: PageConfig._id }).lean();
                    if (workflow && workflow._id) {
                        await ctx.service.workflow.enterWorkflow({
                            workId: records._id,
                            idWorkflow: workflow._id,
                        }, { isEnterWorkflow: false }).then(async res => {
                            if (res.error.code === '0') {
                                await PageModel.updateMany({ _id: records._id }, { idWorkflow: workflow._id });
                            }
                        });
                    }
                }
                // 进行数据推送
                await PageExchange.exchange(PageConfig._id,records.idOrgan,records._id,'CREATE');
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({ _id: records._id }).lean();
            }
        } else {
            error.code = '900';
            error.message = '数据存在非法ID，请刷新数据后重试！';
        }
        return error.code === '0' ? { error, records } : { error };
    }

    async doModify(data, operateUser, pageIdOrCode,platform) {
        const error = {
            code: '0',
        };
        const { ctx } = this;
        if (error.code === '0' && !data) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return { error };
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return { error };
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return { error };
        }
        let records, PageData, ResBeforeMid, ResAfterMid = {};
        if (error.code === '0') {
            const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({ _id: data._id }).lean();
            console.log(PageData);
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return { error };
            }
            if (PageData.__s !== 1) {
                error.code = '900';
                error.message = '当前数据状态不允许修改，请刷新数据后重试！';
                return { error };
            }
            if (PageData && PageData.sourceType === 1 && PageData.sourcePlatform !== platform) {
                error.code = '900';
                error.message = '此数据来源于外部平台，请在对应平台进行删改！';
                return { error };
            }
            delete data.updatedAt;
            data.updatedUser = operateUser;
            ResBeforeMid = await PageMiddleware.beforeModify(data);
            ResBeforeMid.error.code !== '0' && (Object.assign(error, ResBeforeMid.error));

            error.code === '0' && (records = await PageModel.updateMany({ _id: PageData._id }, ResBeforeMid.data).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = e.message;
                }
                console.info(e);
            }));
            error.code === '0' && (ResAfterMid = await PageMiddleware.afterModify(PageData._id));

            (ResAfterMid && ResAfterMid.code !== '0') && (Object.assign(error, ResAfterMid));
            // 数据交换 数据推送
            if (ResAfterMid.code === '0') {
                await PageExchange.exchange(PageConfig._id,PageData.idOrgan,PageData._id,'MODIFY');
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({ _id: PageData._id });
            }
        }

        return error.code === '0' ? { error, records } : { error };
    }

    async doRemove(_id, operateUser, pageIdOrCode, platform) {
        const error = {
            code: '0',
        };
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return { error };
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return { error };
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return { error };
        }
        let records,
            PageData,
            ResBeforeMid,
            ResAfterMid = {};

        if (error.code === '0') {
            const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({ _id }).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return { error };
            }
            if (PageData.__s !== 1) {
                error.code = '900';
                error.message = `当前数据状态无法进行删除操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return { error };
            }
            if (PageData && PageData.sourceType === 1 && PageData.sourcePlatform !== platform) {
                error.code = '900';
                error.message = '此数据来源于系统自动生成(外部平台)，请在对应上游单据（外部平台）进行删改！';
                return { error };
            }
            ResBeforeMid = await PageMiddleware.beforeRemove(PageData._id);

            ResBeforeMid.code !== '0' && (Object.assign(error, ResBeforeMid));

            error.code === '0' && (await PageModel.remove({ _id: PageData._id }).catch(e => {
                if (e) {
                    error.code = e.code;
                    error.message = e.message;
                }
                console.info(e);
            }));
            error.code === '0' && (ResAfterMid = await PageMiddleware.afterRemove(PageData));

            (ResAfterMid && ResAfterMid.code !== '0') && (Object.assign(error, ResAfterMid));

            // 进行数据推送
            if (ResAfterMid.code === '0') {
                await PageExchange.exchange(PageConfig._id,PageData.idOrgan,PageData._id,'REMOVE')
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && ResAfterMid.code === '0') {
                await this.ctx.service.coreEvent.push('REMOVE',PageData,{});
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = PageData;
            }
        }

        return error.code === '0' ? { error, records } : { error };
    }

    async doChange(data, operateUser, pageIdOrCode) {
        const error = {
            code: '0',
        };
        const { ctx } = this;
        if (error.code === '0' && !data) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return { error };
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return { error };
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return { error };
        }
        let records,
            PageData,
            ResBeforeMid,
            ResAfterMid = {};


        if (error.code === '0') {
            const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({ _id: data._id }).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return { error };
            }
            if (PageData.__s !== 3) {
                error.code = '900';
                error.message = `当前数据状态无法进行变更操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return { error };
            }
            ResBeforeMid = await PageMiddleware.beforeChange(data);

            if (ResBeforeMid.code !== '0') (Object.assign(error, ResBeforeMid));
            if (error.code === '0') {
                (records = await PageModel.updateMany({ _id: PageData._id }, data).catch(e => {
                    if (e) {
                        error.code = e.code;
                        error.message = e.message;
                    }
                    console.info(e);
                }));
                // // 保存变更历史
                await ctx.model[PageModel + 'History'].create(data.history);
            }
            if (error.code === '0') (ResAfterMid = await PageMiddleware.afterChange(data));
            if (ResAfterMid && ResAfterMid.code !== '0') Object.assign(error, ResAfterMid);
            if (ResAfterMid.code === '0') {
                await PageExchange.exchange(PageConfig._id,PageData.idOrgan,PageData._id,'CHANGE');
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({ _id: PageData._id });
            }
        }


        return error.code === '0' ? { error, records } : { error };
    }

    async doSubmit(_id, operateUser, pageIdOrCode) {
        const error = {
            code: '0',
        };
        const { ctx } = this;
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return { error };
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return { error };
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return { error };
        }
        let records, PageData, ResBeforeMid, ResAfterMid = {};
        if (error.code === '0') {
            const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({ _id }).lean();
            if (PageConfig.isWorkflow && PageData.idWorkflow) {
                const workflowActive = await ctx.model.WfWorkflowActive.findOne({
                    idWorkflow: PageData.idWorkflow,
                    workId: PageData._id,
                }).lean();
                if (workflowActive) {
                    const workflowResult = await ctx.service.workflow.enterWorkflow({
                        idWorkflow: PageData.idWorkflow,
                        workId: PageData._id,
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
                return { error };
            }
            if (PageData.__s !== 1) {
                error.code = '900';
                error.message = '当前数据已提交或审核，请刷新数据后重试！';
                return { error };
            }
            ResBeforeMid = await PageMiddleware.beforeSubmit(PageData._id);
            ResBeforeMid.code !== '0' && (Object.assign(error, ResBeforeMid));

            error.code === '0' && (records = await PageModel.updateMany({ _id: PageData._id }, {
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
            error.code === '0' && (ResAfterMid = await PageMiddleware.afterSubmit(PageData._id));

            (ResAfterMid && ResAfterMid.code !== '0') && (Object.assign(error, ResAfterMid));


            // 进行数据推送
            if (ResAfterMid.code === '0') {
                await PageExchange.exchange(PageConfig._id,PageData.idOrgan,PageData._id,'SUBMIT');
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && ResAfterMid.code === '0') {
                await this.ctx.service.coreEvent.push('SUBMIT',PageData,{});
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({ _id: PageData._id });
            }
        }


        return error.code === '0' ? { error, records } : { error };
    }

    async doRevoke(_id, operateUser, pageIdOrCode) {
        const error = {
            code: '0',
        };
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return { error };
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return { error };
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return { error };
        }
        let records,
            PageData,
            ResBeforeMid,
            ResAfterMid = {};

        if (error.code === '0') {
            const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({ _id }).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return { error };
            }
            if (PageData.__s !== 2) {
                error.code = '900';
                error.message = `当前数据状态无法进行撤回操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return { error };
            }
            ResBeforeMid = await PageMiddleware.beforeRevoke(PageData._id);

            ResBeforeMid.code !== '0' && (Object.assign(error, ResBeforeMid));

            error.code === '0' && (records = await PageModel.updateMany({ _id: PageData._id }, {
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
            error.code === '0' && (ResAfterMid = await PageMiddleware.afterRevoke(PageData._id));

            (ResAfterMid && ResAfterMid.code !== '0') && (Object.assign(error, ResAfterMid));


            // 进行数据推送
            if (ResAfterMid.code === '0') {
                await PageExchange.exchange(PageConfig._id,PageData.idOrgan,PageData._id,'REVOKE')
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && ResAfterMid.code === '0') {
                await this.ctx.service.coreEvent.push('REVOKE',PageData,{});
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({ _id: PageData._id });
            }
        }

        return error.code === '0' ? { error, records } : { error };
    }

    async doVerify(_id, operateUser, pageIdOrCode) {
        /**/
        const error = {
            code: '0',
        };
        const { ctx } = this;
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return { error };
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return { error };
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return { error };
        }
        let records,
            PageData,
            ResBeforeMid,
            ResAfterMid = {};

        if (error.code === '0') {
            const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({ _id }).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return { error };
            }
            if (PageData.__s !== 2) {
                error.code = '900';
                error.message = '当前数据已审核或撤回，请刷新数据后重试！';
                return { error };
            }
            ResBeforeMid = await PageMiddleware.beforeVerify(PageData._id);
            ResBeforeMid.code !== '0' && (Object.assign(error, ResBeforeMid));
            error.code === '0' && (
                records = await PageModel.updateMany({ _id: PageData._id }, {
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
            ResAfterMid = await PageMiddleware.afterVerify(PageData._id);

            ResAfterMid.code !== '0' && (Object.assign(error, ResAfterMid));

            if (ResAfterMid.code === '0') {
                // 结束审批流
                if (PageConfig.isWorkflow && PageData.idWorkflow) {
                    const workflowActive = await ctx.model.WfWorkflowActive.findOne({
                        idWorkflow: PageData.idWorkflow,
                        workId: PageData._id,
                    }).lean();
                    if (workflowActive.__s !== 2) {
                        await this.ctx.model.WfWorkflowActive.updateMany({ workId: PageData._id }, { __s: 2 });
                    }
                }
                // 进行数据推送
                await PageExchange.exchange(PageConfig._id,PageData.idOrgan,PageData._id,'VERIFY');

                // 进行消息推送
                if (PageData && PageData.createdUser) {
                    await this.ctx.service.coreEvent.push('VERIFY',PageData,{});
                }
            }

            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({ _id: PageData._id });
            }
        }
        return error.code === '0' ? { error, records } : { error };
    }

    async doAbandon(_id, operateUser, pageIdOrCode) {
        const error = {
            code: '0',
        };
        const { ctx } = this;
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return { error };
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return { error };
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return { error };
        }
        let records,
            PageData,
            ResBeforeMid,
            ResAfterMid = {};

        if (error.code === '0') {
            const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({ _id }).lean();
            if (PageConfig.isWorkflow) {
                const workflow = await ctx.model.WfWorkflow.findOne({ idPage: PageConfig._id, __s: 1 });
                if (workflow) {
                    const user = ctx.model.SysUser.findOne({ _id: operateUser }).lean();
                    await ctx.service.workflow.createWorkflowLog({
                        _id: PageData._id,
                        memo: '重新发起审批流',
                        description: `${user.userName}重新发起审批流`,
                    }, 'again');
                    const workflowResult = await ctx.service.workflow.enterWorkflow({
                        idWorkflow: workflow._id,
                        workId: PageData._id,
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
                return { error };
            }
            if (PageData.__s !== 3) {
                error.code = '900';
                error.message = `当前数据状态无法进行弃审操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return { error };
            }
            ResBeforeMid = await PageMiddleware.beforeAbandon(PageData._id);
            ResBeforeMid.code !== '0' && (Object.assign(error, ResBeforeMid));

            error.code === '0' && (records = await PageModel.updateMany({ _id: PageData._id }, {
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
            error.code === '0' && (ResAfterMid = await PageMiddleware.afterAbandon(PageData._id));

            (ResAfterMid && ResAfterMid.code !== '0') && (Object.assign(error, ResAfterMid));

            // 进行数据推送
            if (ResAfterMid.code === '0') {
                await PageExchange.exchange(PageConfig._id,PageData.idOrgan,PageData._id,'ABANDON')
            }
            // 进行消息推送
            if (PageData && PageData.createdUser && ResAfterMid.code === '0') {
                await this.ctx.service.coreEvent.push('ABANDON',PageData,{});
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({ _id: PageData._id });
            }
        }

        return error.code === '0' ? { error, records } : { error };
    }

    async doClose(_id, operateUser, pageIdOrCode) {
        const error = {
            code: '0',
        };
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return { error };
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return { error };
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return { error };
        }
        let records,
            PageData,
            ResBeforeMid,
            ResAfterMid = {};
        if (error.code === '0') {
            const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({ _id }).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return { error };
            }
            if (PageData.__s !== 3) {
                error.code = '900';
                error.message = `当前数据状态无法进行关闭操作，数据状态:${PageData.__s}，请刷新数据后重试！`;
                return { error };
            }
            if (PageData.__c === 0) {
                error.code = '900';
                error.message = '当前数据已关闭，请刷新数据！';
                return { error };
            }
            ResBeforeMid = await PageMiddleware.beforeClose(PageData._id);

            ResBeforeMid.code !== '0' && (Object.assign(error, ResBeforeMid));

            error.code === '0' && (records = await PageModel.updateMany({ _id: PageData._id }, {
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
            error.code === '0' && (ResAfterMid = await PageMiddleware.afterClose(PageData._id));

            (ResAfterMid && ResAfterMid.code !== '0') && (Object.assign(error, ResAfterMid));

            // 进行数据推送
            if (ResAfterMid.code === '0') {
                await PageExchange.exchange(PageConfig._id,PageData.idOrgan,PageData._id,'CLOSE')
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({ _id: PageData._id });
            }
        }


        return error.code === '0' ? { error, records } : { error };
    }

    async doOpen(_id, operateUser, pageIdOrCode) {
        const error = {
            code: '0',
        };
        if (error.code === '0' && !_id) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
            return { error };
        }
        if (error.code === '0' && !operateUser) {
            error.code = '904';
            error.message = '当前请求无用户信息，请登录后重试！';
            return { error };
        }
        if (error.code === '0' && !pageIdOrCode) {
            error.code = '904';
            error.message = '缺少page参数，请重试！';
            return { error };
        }
        let records,
            PageData,
            ResBeforeMid,
            ResAfterMid = {};

        if (error.code === '0') {
            const { PageConfig, PageModel, PageMiddleware, PageExchange} = await this.getPageConfig(pageIdOrCode);
            PageData = await PageModel.findOne({ _id }).lean();
            if (!PageData) {
                error.code = '900';
                error.message = '当前数据不存在，请刷新数据后重试！';
                return { error };
            }
            if (PageData.__c !== 0) {
                error.code = '900';
                error.message = `当前数据状态无法进行开启操作，数据状态:${PageData.__c}，请刷新数据后重试！`;
                return { error };
            }
            ResBeforeMid = await PageMiddleware.beforeOpen(PageData._id);

            ResBeforeMid.code !== '0' && (Object.assign(error, ResBeforeMid));

            error.code === '0' && (records = await PageModel.updateMany({ _id: PageData._id }, {
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
            error.code === '0' && (ResAfterMid = await PageMiddleware.afterOpen(PageData._id));

            (ResAfterMid && ResAfterMid.code !== '0') && (Object.assign(error, ResAfterMid));

            // 进行数据推送
            if (ResAfterMid.code === '0') {
                await PageExchange.exchange(PageConfig._id,PageData.idOrgan,PageData._id,'OPEN')
            }
            /* 重新获取数据 保证数据最新（后置操作更新信息） */
            if (error.code === '0') {
                records = await PageModel.findOne({ _id: PageData._id });
            }
        }

        return error.code === '0' ? { error, records } : { error };
    }

    async doCreateAndVerify(data, operateUser, pageIdOrCode) {
        const error = { code: '0' };
        let record = await this.doCreate({ data }, pageIdOrCode).then(res => {
            if (res.error.code !== '0') {
                error.code = res.error.code;
                error.message = res.error.message;
            } else {
                return res.records._id;
            }
        });
        if (record.__s === 1) {
            record = await this.doSubmit({ _id: record._id, operateUser }, pageIdOrCode).then(res => {
                if (res.error.code !== '0') {
                    error.code = res.error.code;
                    error.message = res.error.message;
                } else {
                    return res.records;
                }
            });
        }
        if (record.__s === 2) {
            await this.doVerify({ _id: record._id, operateUser }, pageIdOrCode).then(res => {
                if (res.error.code !== '0') {
                    error.code = res.error.code;
                    error.message = res.error.message;
                }
            });
        }
        return { error, record };
    }
}

module.exports = CorePage;
