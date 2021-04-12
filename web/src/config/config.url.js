import config from '@/config/config.default'
export default {
    login: '/v1/authority/login',
    model: "/api/model",
    modelByPost: "/api/modelByPost",
    file: {
        preview: config.host+'/api/file/preview/',
        download: config.host+'/api/file/download/',
        upload: config.host+'/api/file/upload',
    },
    materielChildrenConserve:'/v1/materiel/children/conserve/',
    materielConserve:'/v1/materiel/conserve/',

    supplierConserve:'/v1/supplier/conserve/',
    supplierOrganUserConserve:'/v1/supplier/organ/conserve/',

    customerConserve:'/v1/customer/conserve/',
    customerUserConserve:'/v1/customer/user/conserve/',

    tenderPublishConserve:'/v1/tender/publish/conserve/',
    tenderPublishCancel:'/v1/tender/publish/cancel/',
}
