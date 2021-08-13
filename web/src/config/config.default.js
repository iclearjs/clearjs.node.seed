/**
 * 项目默认配置项
 * primaryColor - 默认主题色, 如果修改颜色不生效，请清理 localStorage
 * storageOptions: {} - Vue-ls 插件配置项 (localStorage/sessionStorage)
 */

export default {
    host:'http://127.0.0.1:7001',
    module:'5e7707ae39fb132348423bdc',
    primaryColor: '#1890FF', // primary color of ant design
    layout:'left',
    platform:'web',
    multiTab:true,
    lang:'zh-CN',
    storageOptions: {
        namespace: 'CLEAR_', // key prefix
        name: 'ls', // name variable Vue.[ls] or this.[$ls],
        storage: 'local' // storage name session, local, memory
    }// vue-ls options
}
