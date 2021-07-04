'use strict';

const Controller = require('egg').Controller;
const moment = require('moment');
const path = require('path');

class statistics extends Controller {
    constructor(ctx) {
        super(ctx);
        this.query = this.ctx.request.query;
        this.body = this.ctx.request.body;
        this.params = this.ctx.params;
    }
    async export() {
        const error = {
            code: '0',
        };
        const { ctx } = this;
        const { idPage, page, like, likeBy } = ctx.request.query;
        let { limit, order, skip, filter } = ctx.query;

        if (!idPage) {
            error.code = 10404;
            error.code = 'miss params idPage';
        }
        let pageConfig;
        let records = [],
            fields = [];
        if (error.code === '0') {
            pageConfig = await ctx.model.CdpPage.findOne(/^[a-fA-F0-9]{24}$/.test(idPage) ? { _id: idPage } : { code: idPage }).populate([ 'idEntityList' ]);
            fields = await this.ctx.model.CdpPageWidget.find({idPage: pageConfig._id, listVisible: true, mode: 'list'}).sort({ order: 1 }).populate([ 'idEnum' ]);
            const configPipeline = JSON.parse(pageConfig.listConfig.pipeline);
            let pipeline = [],
                prePipeline = [];
            for (const key in configPipeline) {
                if (configPipeline.hasOwnProperty(key)) {
                    if (configPipeline[key][0] && Object.keys(configPipeline[key][0])[0] && Object.keys(configPipeline[key][0])[0] === '$unwind') {
                        prePipeline = [ ...prePipeline, configPipeline[key][0] ];
                        pipeline = [ ...pipeline, ...configPipeline[key].splice(1, configPipeline[key].length - 1) ];
                    } else {
                        pipeline = [ ...pipeline, ...configPipeline[key] ];
                    }
                }
            }
            pipeline.unshift({ $match: ctx.helper.toObjectIDs(filter) });

            /* 若存在分页信息 */
            const likeFilter = {};
            if (like && likeBy) {
                likeFilter.$or = [];
                for (const key of likeBy.split(',')) {
                    likeFilter.$or.push({ [key]: new RegExp(like, 'i') });
                }
            }

            filter = ctx.helper.toAggregateFilters(await this.ctx.service.common._setUserAuthFilter(filter, pageConfig.idEntityList.dsCollection));

            Object.keys(filter).length > 0 && prePipeline.push({ $match: filter });
            Object.keys(likeFilter).length > 0 && prePipeline.push({ $match: likeFilter });

            records = await ctx.model[this.ctx.helper.humps.pascalize(pageConfig.idEntityList.dsCollection)].aggregate([ ...ctx.helper.toObjectIDs(prePipeline), ...ctx.service.common.getAggregatePaging({
                order,
                skip: page ? skip : 0,
                limit: page ? limit : 0,
            }), ...pipeline ]).option({ allowDiskUse: true })
                .catch(e => {
                    if (e) {
                        error.code = e.code;
                        error.message = e.message;
                    }
                    console.info(e);
                });
        }
        const buffer = ctx.service.corePage.doExport(fields, records);
        this.ctx.attachment(pageConfig.name + new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate() + ' -' + new Date().getTime() + '.xlsx');
        this.ctx.set('Content-Type', 'application/octet-stream');
        this.ctx.body = buffer;
    }

    async import() {
        const error = {
            code: '0',
        };
        const { ctx } = this;
        const { idPage, params = {}, idFile } = ctx.request.body;
        if (!idPage) {
            error.code = 10404;
            error.code = 'miss params idPage';
        }
        if (!idFile) {
            error.code = 10404;
            error.code = 'miss params idFile';
        }
        let records = [];
        if (error.code === '0') {
            const file = await ctx.model.SysFile.findOne({ _id: idFile });
            records = await this.ctx.service.corePage.doImport(idPage, path.join(this.ctx.app.config.fileDir, file.filePath), params);

        }
        this.ctx.body = error.code === '0' ? { records, error } : { error };
    }

    /* 单据操作 */

    async create() {
        const error = {
            code: '0',
        };
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        let records;
        if (error.code === '0') {
            await ctx.service.corePage.doCreate(body, body.createdUser, params.page).then(el => {
                if (el.error.code === '0') {
                    records = el.records;
                } else {
                    error.code = el.error.code;
                    error.message = el.error.message;
                }
            });
        }
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }
    async modify() {
        const error = {
            code: '0',
        };
        let records;
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        await ctx.service.corePage.doModify(body, body.operateUser, params.page).then(el => {
            if (el.error.code === '0') {
                records = el.records;
            } else {
                error.code = el.error.code;
                error.message = el.error.message;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }
    // 删除
    async remove() {
        const error = {
            code: '0',
        };
        let records;
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        await ctx.service.corePage.doRemove(params.id, body.operateUser, params.page).then(el => {
            if (el.error.code === '0') {
                records = el.records;
            } else {
                error.code = el.error.code;
                error.message = el.error.message;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

    async change() {
        const error = {
            code: '0',
        };
        let records;
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        await ctx.service.corePage.doChange(body, body.operateUser, params.page).then(el => {
            if (el.error.code === '0') {
                records = el.records;
            } else {
                error.code = el.error.code;
                error.message = el.error.message;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

    // 提交
    async submit() {
        const error = {
            code: '0',
        };
        let records;
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        await ctx.service.corePage.doSubmit(params.id, body.operateUser, params.page).then(el => {
            if (el.error.code === '0') {
                records = el.records;
            } else {
                error.code = el.error.code;
                error.message = el.error.message;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

    // 审核
    async verify() {
        const error = {
            code: '0',
        };
        let records;
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        await ctx.service.corePage.doVerify(params.id, body.operateUser, params.page).then(el => {
            if (el.error.code === '0') {
                records = el.records;
            } else {
                error.code = el.error.code;
                error.message = el.error.message;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

    // 弃审
    async abandon() {
        const error = {
            code: '0',
        };
        let records;
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        await ctx.service.corePage.doAbandon(params.id, body.operateUser, params.page).then(el => {
            if (el.error.code === '0') {
                records = el.records;
            } else {
                error.code = el.error.code;
                error.message = el.error.message;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

    // 撤回
    async revoke() {
        const error = {
            code: '0',
        };
        let records;
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        await ctx.service.corePage.doRevoke(params.id, body.operateUser, params.page).then(el => {
            if (el.error.code === '0') {
                records = el.records;
            } else {
                error.code = el.error.code;
                error.message = el.error.message;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

    // 关闭
    async close() {
        const error = {
            code: '0',
        };
        let records;
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        await ctx.service.corePage.doClose(params.id, body.operateUser, params.page).then(el => {
            if (el.error.code === '0') {
                records = el.records;
            } else {
                error.code = el.error.code;
                error.message = el.error.message;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

    // 开启
    async open() {
        const error = {
            code: '0',
        };
        let records;
        const { ctx }=this;
        const { params }=ctx;
        const { body } = ctx.request;
        await ctx.service.corePage.doOpen(params.id, body.operateUser, params.page).then(el => {
            if (el.error.code === '0') {
                records = el.records;
            } else {
                error.code = el.error.code;
                error.message = el.error.message;
            }
        });
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

}

module.exports = statistics;
