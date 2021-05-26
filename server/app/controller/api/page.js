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
        const {ctx} = this;
        const {idPage, page, like, likeBy} = ctx.request.query;
        let {limit, order, skip, filter} = ctx.query;

        if (!idPage) {
            error.code = 10404;
            error.code = 'miss params pageConfig';
        }
        let pageConfig;
        let excelRecords = [];
        let records = [],fields=[];
        if (error.code === '0') {
            pageConfig = await ctx.model.CdpPage.findOne(/^[a-fA-F0-9]{24}$/.test(idPage) ? {_id: idPage} : {code: idPage}).populate(['idEntityList']);
            fields = await this.ctx.model.CdpPageWidget.find({
                idPage: pageConfig._id,
                listVisible: true,
                mode: 'list'
            }).sort({order: 1}).populate(['idEnum']);
            const configPipeline = JSON.parse(pageConfig.listConfig.pipeline);
            let pipeline = [], prePipeline = [];
            for (let key in configPipeline) {
                if (configPipeline.hasOwnProperty(key)) {
                    if (configPipeline[key][0] && Object.keys(configPipeline[key][0])[0] && Object.keys(configPipeline[key][0])[0] === '$unwind') {
                        prePipeline = [...prePipeline, configPipeline[key][0]];
                        pipeline = [...pipeline, ...configPipeline[key].splice(1, configPipeline[key].length - 1)];
                    } else {
                        pipeline = [...pipeline, ...configPipeline[key]];
                    }
                }
            }
            pipeline.unshift({$match: ctx.helper.toObjectIDs(filter)});

            /* 若存在分页信息 */
            let likeFilter = {};
            if (like && likeBy) {
                likeFilter.$or = [];
                for (const key of likeBy.split(',')) {
                    likeFilter.$or.push({[key]: new RegExp(like, 'i')});
                }
            }

            filter = ctx.helper.toAggregateFilters(await this.ctx.service.common._setUserAuthFilter(filter, pageConfig.idEntityList.dsCollection));
            Object.keys(filter).length > 0 && prePipeline.push({$match: filter});
            Object.keys(likeFilter).length > 0 && prePipeline.push({$match: likeFilter});

            records = await ctx.model[this.ctx.helper.humps.pascalize(pageConfig.idEntityList.dsCollection)].aggregate([...ctx.helper.toObjectIDs(prePipeline), ...ctx.service.mongodb.aggregate.getAggregatePaging({
                order,
                skip: page ? skip : 0,
                limit: page ? limit : 0
            }), ...pipeline]).option({allowDiskUse: true})
                .catch(e => {
                    if (e) {
                        error.code = e.code;
                        error.message = e.message;
                    }
                    console.info(e);
                });

        }
        const buffer  = this.doExport({
            title: pageConfig.name, fields
        }, records);
        this.ctx.attachment(pageConfig.name + new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate() + ' -' + new Date().getTime() + '.xlsx');
        this.ctx.set('Content-Type', 'application/octet-stream');
        this.ctx.body = buffer;
    }

    async import() {
        const error = {
            code: '0',
        };
        const {ctx} = this;
        const {idPage,params={},idFile} = ctx.request.body;
        if (!idPage) {
            error.code = 10404;
            error.code = 'miss params idPage';
        }
        if (!idFile) {
            error.code = 10404;
            error.code = 'miss params idFile';
        }
        let pageConfig;
        let records = [],fields=[];
        if (error.code === '0') {
            pageConfig = await ctx.model.CdpPage.findOne(/^[a-fA-F0-9]{24}$/.test(idPage) ? {_id: idPage} : {code: idPage}).populate(['idEntityList']);
            fields = await this.ctx.model.CdpPageWidget.find({
                idPage: pageConfig._id,
                listVisible: true,
                mode: 'listCard',
                readonly:false,
            }).sort({order: 1}).populate(['idEnum']);
            let file = await ctx.model.SysFile.findOne({_id:idFile});
            const FileData = xlsx.parse(path.join(this.ctx.app.config.fileDir, file.filePath))[0].data;
            let rowNameFile = FileData[0].map(name=>{
                return fields.filter(el=>el.name===name).length > 0?fields.filter(el=>el.name===name)[0]:{}
            });
            for(let i in FileData){
                let data = {};
                if(i>0){
                    for(let j in FileData[i]){
                        let nameField = rowNameFile[j];
                        nameField && nameField.field && (data[nameField.field] = FileData[i][j])
                    }
                    records.push({...params,...data})
                }
            }
            const CtxModel = ctx.model[ctx.helper.humps.pascalize(pageConfig.idEntityList.dsCollection)];
            CtxModel.post(records)
        }
        this.ctx.body = error.code === '0'?{records,error}:{error};
    }

    /* 单据操作 */

    async create() {
        const error = {
            code: '0',
        };
        const {body,params,ctx} = this;
        let records;
        // 回写请购单采购数量
        if (body._id) {
            error.code = '900';
            error.message = '数据存在非法ID，请刷新数据后重试！';
        }
        if(body.__s && body.__s !==1){
            error.code = '900';
            error.message = `数据存在非法标记 __s: ${body.__s}，请重新组装数据后重试！`;
        }
        if(body.__r && body.__s !==0){
            error.code = '900';
            error.message = `数据存在非法标记 __r: ${body.__r}，请重新组装数据后重试！`;
        }

        if(error.code === '0'){
            await this.ctx.service.page.doCreate({body},params.page).then(el=>{
                if(el.error.code === '0'){
                    records = el.records;
                }else{
                    error.code = el.error.code;
                    error.message = el.error.message
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
        const {body,params,ctx} = this;
        await ctx.service.page.doModify({body,operateUser:body.operateUser},params.page).then(el=>{
            if(el.error.code === '0'){
                records = el.records;
            }else{
                error.code = el.error.code;
                error.message = el.error.message
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
        const {body,params,ctx} = this;
        await ctx.service.page.doChange({body,operateUser:body.operateUser},params.page).then(el=>{
            if(el.error.code === '0'){
                records = el.records;
            }else{
                error.code = el.error.code;
                error.message = el.error.message
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
        const {body,params,ctx} = this;
        const {Page,CtxModel,BillLifeCycle} = await ctx.service.page.GetPageParams(params.page);
        const res = await CtxModel.findOne({_id: params.id}).lean();
        if (res) {
            await ctx.service.page.doSubmit({_id:res._id,operateUser:body.operateUser},params.page).then(el=>{
                if(el.error.code === '0'){
                    records = el.records;
                }else{
                    error.code = el.error.code;
                    error.message = el.error.message
                }
            });
        } else {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
        }
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
        const {body,params,ctx} = this;
        const {Page,CtxModel,BillLifeCycle} = await ctx.service.page.GetPageParams(params.page);
        const res = await CtxModel.findOne({_id: params.id}).lean();
        if (res) {
            await ctx.service.page.doVerify({_id:res._id,operateUser:body.operateUser},params.page).then(el=>{
                if(el.error.code === '0'){
                    records = el.records;
                }else{
                    error.code = el.error.code;
                    error.message = el.error.message
                }
            });
        } else {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
        }
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
        const {body,params,ctx} = this;
        const {Page,CtxModel,BillLifeCycle} = await ctx.service.page.GetPageParams(params.page);
        const res = await CtxModel.findOne({_id: params.id}).lean();
        if (res) {
            await ctx.service.page.doAbandon({_id:res._id,operateUser:body.operateUser},params.page).then(el=>{
                if(el.error.code === '0'){
                    records = el.records;
                }else{
                    error.code = el.error.code;
                    error.message = el.error.message
                }
            });
        } else {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
        }
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
        const {body,params,ctx} = this;
        const {Page,CtxModel,BillLifeCycle} = await ctx.service.page.GetPageParams(params.page);
        const res = await CtxModel.findOne({_id: params.id}).lean();
        if (res) {
            await ctx.service.page.doRevoke({_id:res._id,operateUser:body.operateUser},params.page).then(el=>{
                if(el.error.code === '0'){
                    records = el.records;
                }else{
                    error.code = el.error.code;
                    error.message = el.error.message
                }
            });
        } else {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
        }
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
        const {body,params,ctx} = this;
        const {Page,CtxModel,BillLifeCycle} = await ctx.service.page.GetPageParams(params.page);
        const res = await CtxModel.findOne({_id: params.id}).lean();
        if (!res) {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
        }
        if(res && res.sourceType===1){
            error.code = '900';
            error.message = '此数据来源于系统自动生成(外部平台)，请在对应上游单据（外部平台）进行删改！';
        }
        if (error.code === '0') {
            await ctx.service.page.doRemove({_id:res._id,operateUser:body.operateUser},params.page).then(el=>{
                if(el.error.code === '0'){
                    records = el.records;
                }else{
                    error.code = el.error.code;
                    error.message = el.error.message
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

    // 关闭
    async close() {
        const error = {
            code: '0',
        };
        let records;
        const {body,params,ctx} = this;
        const {Page,CtxModel,BillLifeCycle} = await ctx.service.page.GetPageParams(params.page);
        const res = await CtxModel.findOne({_id: params.id}).lean();
        if (res) {
            await ctx.service.page.doClose({_id:res._id,operateUser:body.operateUser},params.page).then(el=>{
                if(el.error.code === '0'){
                    records = el.records;
                }else{
                    error.code = el.error.code;
                    error.message = el.error.message
                }
            });
        } else {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
        }
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
        const {body,params,ctx} = this;
        const {Page,CtxModel,BillLifeCycle} = await ctx.service.page.GetPageParams(params.page);
        const res = await CtxModel.findOne({_id: params.id}).lean();
        if (res) {
            await ctx.service.page.doOpen({_id:res._id,operateUser:body.operateUser},params.page).then(el=>{
                if(el.error.code === '0'){
                    records = el.records;
                }else{
                    error.code = el.error.code;
                    error.message = el.error.message
                }
            });
        } else {
            error.code = '900';
            error.message = '当前数据不存在，请刷新数据后重试！';
        }
        this.ctx.body = error.code === '0' ? {
            error,
            records,
        } : {
            error,
        };
    }

}

module.exports = statistics;
