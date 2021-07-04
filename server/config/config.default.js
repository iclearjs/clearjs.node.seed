/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    /**
     * built-in config
     * @type {Egg.EggAppConfig}
     **/
    const config = exports = {};

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1618132067901_3453';

    // add your middleware config here
    config.middleware = [];

    // add your user config here
    const userConfig = {
        fileDir: require('path').join(appInfo.baseDir, 'files'),
    };

    config.multipart = {
        mode: 'file',
        fileSize: '50mb',
        fileExtensions: [
            '.pdf',
            '.txt',
            '.doc',
            '.docx',
            '.xls',
            '.xlsx',
            '.ppt',
            '.pptx',
        ],
    };

    config.io = {
        namespace: {
            '/': {
                connectionMiddleware: ['connection'],
                packetMiddleware: [],
            },
        },
    };

    config.security = {
        csrf: {
            enable: false,
        },
        domainWhiteList: ['*']
    };

    config.cors = {
        allowHeaders: ['context-type', 'content-type', 'X-Requested-With', 'x-csrf-token'],
        allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
        credentials: true,
    };

    config.static = {
        prefix: '/',
        dir: require('path').join(appInfo.baseDir, 'app/public'),
        dynamic: true,
        preload: true,
        buffer: false,
        maxFiles: 1000,
    };

    config.swaggerdoc = {
        dirScanner: './app/controller', // 配置自动扫描的控制器路径。
        apiInfo: {
            title: 'Clear.Admin.Node',  // 接口文档的标题。
            description: 'swagger-ui document.',   // 接口文档描述。
            version: '1.0.0',   // 接口文档版本。
        },
        schemes: ['http', 'https'], // 配置支持的协议。
        consumes: ['application/json'], // 指定处理请求的提交内容类型（Content-Type），例如application/json, text/html。
        produces: ['application/json'], // 指定返回的内容类型，仅当request请求头中的(Accept)类型中包含该指定类型才返回。
        enableSecurity: false,  // 是否启用授权，默认 false（不启用）。
        // enableValidate: true,    // 是否启用参数校验，默认 true（启用）。
        routerMap: true,    // 是否启用自动生成路由，默认 true (启用)。
        enable: true,   // 默认 true (启用)。
    };

    config.notfound = {
        pageUrl: '/404',
    };

    config.view = {
        defaultViewEngine: 'nunjucks',
        root: [require('path').join(appInfo.baseDir, 'app/views')].join(',')
    };

    config.io = {
        namespace: {
            '/': {
                connectionMiddleware: ['socketConnect'],
                packetMiddleware: [],
            },
        },
    };

    return {
        ...config,
        ...userConfig,
    };
};
