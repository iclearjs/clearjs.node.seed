'use strict';
/**
 * @Controller Model
 */
const Controller = require('egg').Controller;
const mongodb=require('@clearjs/node').mongodb

class ModelCtrl extends Controller {
    constructor(ctx) {
        super(ctx);
    }

    /**
     * @summary 获取模型全部数据
     * @description 根据模型获取模型全部数据
     * @router get /v1/model/{model}
     * @request path string *model
     * @request query integer limit
     * @request query integer page
     * @request query string order
     * @request query object filter
     * @request query string like
     * @request query string likeBy
     * @request query string populate
     */

    async get() {
        const error = {code: '0'};
        const {ctx, service} = this;
        if (!ctx.params.model) {
            error.code = '999';
            error.message = 'params model is required！';
        }
        const collection=ctx.model[ctx.helper.humps.pascalize(ctx.params.model)];
        const query=ctx.GeneratorQuery(ctx.request.query);
        ctx.body = error.code === '0' ? {...await mongodb.doGet(collection,query)} : {error};
    }

    /**
     * @summary 获取模型单条数据
     * @description 根据模型模型单条数据
     * @router get /v1/model/{model}/{id}
     * @request path string *model
     * @request path string *id
     * @request query integer limit
     * @request query integer page
     * @request query string order
     * @request query object filter
     * @request query string like
     * @request query string likeBy
     * @request query string populate
     */

    async getById() {
        const error = {code: '0'};
        const {ctx, service} = this;
        if (!ctx.params.model) {
            error.code = '999';
            error.message = 'params model is required！';
        }
        const collection=ctx.model[ctx.helper.humps.pascalize(ctx.params.model)];
        const ids=ctx.params.id;
        const query=ctx.GeneratorQuery(ctx.request.query);
        ctx.body = error.code === '0' ? {...await mongodb.doGetById(collection,ids,query)} : {error};
    }

    /**
     * @summary 获取模型全部数据
     * @description 根据模型获取全部数据
     * @router post /v1/getByPost/{model}
     * @request path string *model
     * @request body QueryParams body
     */

    async getByPost() {
        const error = {code: '0'};
        const {ctx, service} = this;
        if (!ctx.params.model) {
            error.code = '999';
            error.message = 'params model is required！';
        }
        const collection=ctx.model[ctx.helper.humps.pascalize(ctx.params.model)];
        const query=ctx.GeneratorQuery(ctx.request.body);
        ctx.body = error.code === '0' ? {...await mongodb.doGet(collection,query)} : {error};
    }

    /**
     * @summary 保存模型数据
     * @description 保存模型数据
     * @router post /v1/model/{model}
     * @request path string *model
     */
    async post() {
        const error = {code: '0'};
        const {ctx, service} = this;
        if (!ctx.params.model) {
            error.code = '999';
            error.message = 'params model is required！';
        }
        const collection=ctx.model[ctx.helper.humps.pascalize(ctx.params.model)];
        const body=ctx.GeneratorQuery(ctx.request.body);
        ctx.body = error.code === '0' ? {...await mongodb.doPost(collection,body)} : {error};
    }

    /**
     * @summary 更新模型数据
     * @description 根据模型主键更新单条数据
     * @router patch /v1/model/{model}/{id}
     * @request path string *model
     * @request path string *id
     */
    async update() {
        const error = {code: '0'};
        const {ctx, service} = this;
        if (!ctx.params.model) {
            error.code = '999';
            error.message = 'params model is required！';
        }
        const collection=ctx.model[ctx.helper.humps.pascalize(ctx.params.model)];
        const ids=ctx.params.id;
        const body=ctx.GeneratorQuery(ctx.request.body);
        ctx.body = error.code === '0' ? {...await mongodb.doUpdate(collection,ids,body)} : {error};
    }

    /**
     * @summary 删除模型数据
     * @description 根据模型主键删除单条数据
     * @router delete /v1/model/{model}/{id}
     * @request path string *model
     * @request path string *id
     */

    async destroy() {
        const error = {code: '0'};
        const {ctx, service} = this;
        if (!ctx.params.model) {
            error.code = '999';
            error.message = 'params model is required！';
        }
        const collection=ctx.model[ctx.helper.humps.pascalize(ctx.params.model)];
        const ids=ctx.params.id;
        ctx.body = error.code === '0' ? {...await mongodb.doDestroy(collection,ids)} : {error};
    }

    /**
     * @summary 获取模型数据
     * @description 根据模型构造管道获取数据
     * @router post /v1/getByAggregate/{model}
     * @request path string *model
     * @request body QueryParams body
     */

    async getByAggregate() {
        const error = {code: '0'};
        const {ctx, service} = this;
        if (!ctx.params.model) {
            error.code = '999';
            error.message = 'params model is required！';
        }
        const collection=ctx.model[ctx.helper.humps.pascalize(ctx.params.model)];
        console.log(ctx.request.body);
        const body=ctx.GeneratorQuery(ctx.request.body);
        console.log(body);
        ctx.body = error.code === '0' ? {...await mongodb.doGetByAggregate(collection,body)} : {error};
    }

    /**
     * @summary 解析条件
     * @description 根据模型解析条件
     * @router post /v1/model/getResolveFilter/{entity}
     * @request path string *entity
     * @request query object filter
     */

    async getResolveFilter() {
        const error = {code: '0'};
        const {ctx, service} = this;
        if (!ctx.params.entity) {
            error.code = '999';
            error.message = 'params entity is required！';
        }
        ctx.body = error.code === '0' ? {...await mongodb.doResolveFilter(ctx.model,ctx.params.entity,ctx.GeneratorQuery(ctx.request.query).filter)} : {error};
    }
}

module.exports = ModelCtrl;
