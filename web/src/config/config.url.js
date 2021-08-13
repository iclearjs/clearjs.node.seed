import config from '@/config/config.default'
export default {
    login: '/core/authority/login',
    register: '/core/authority/register',
    changePwd: '/core/authority/changePwd',
    registerOrgan: '/core/authority/registerOrgan',
    registerByOrganUser: '/core/authority/registerByOrganUser',
    coreExport:(config.host?config.host:'')+ '/core/page/export/',
    file: {
        preview: (config.host?config.host:'')+'/core/file/preview/',
        download: (config.host?config.host:'')+'/core/file/download/',
        upload: (config.host?config.host:'')+'/core/file/upload',
    }
}
