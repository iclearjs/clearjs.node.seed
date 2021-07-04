export default (Vue)=>{
    return {
        async getPageShareFilter(organ) {
            if (!organ) throw Error('func getPageShareFilter params organ must not undefined');
            organ = await Vue.prototype.$clear.model('org_organ').get({
                params: {
                    filter: typeof organ === 'object' && organ._id ? {_id: organ._id} : (/^[a-fA-F0-9]{24}$/.test(organ) ? {_id: organ} : {organCode: organ}),
                }
            }).then(res => res.records[0]);
            if (organ) {
                const groupOrgans = await Vue.prototype.$clear.model('org_organ').get({ params: {filter: {idOrgan: organ.idGroupOrgan}}}).then(res => res.records);
                return {$or: [{idOrgan: {$in: Vue.prototype.$helper.getTreeParentNode(groupOrgans, organ.p_id).split(',').filter(el => el !== ''&&el !== '0')}, isShare: true},{idOrgan: organ._id}]};
            }else{
                throw Error(`func getPageShareFilter params organ:${organ} is not find from database`)
            }
        }
    }
}