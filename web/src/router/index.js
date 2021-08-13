import Vue from 'vue'
import Router from 'vue-router'
import CLayout from '@/components/CLayout'
import NProgress from 'nprogress'

const originalPush = Router.prototype.push;
Router.prototype.push = function push(location, onResolve, onReject) {
    if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject);
    return originalPush.call(this, location).catch(err => err)
};

Vue.use(Router);

const router = new Router({
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/login')
        },
        {
            path: '/404',
            name: '404',
            component: {
                template: `<a-result status="404" title="404" sub-title="抱歉，您访问的页面不存在。"><template #extra><a-button type="primary" @click="handleToHome">返回首页</a-button></template></a-result>`,
                methods: {
                    handleToHome () {
                        this.$router.push({ name: 'dash' })
                    }
                }
            }
        },
    ]
});

router.loadDynamicRoutes=async (application)=>{
    if(!(Vue.prototype.$cookies?Vue.$cookies.get('ACCESS_TOKEN'):Vue.ls.get('ACCESS_TOKEN', undefined))){
        return;
    }
    const routes=(await Vue.prototype.$http.get('/core/authority/menu',{params:{application}})).data.records;
    router.getRoutes().filter(item=>item.name==='index').length<1&&router.addRoute({name: 'index', path: '/', component: CLayout, redirect : () => {return 'dash'}});
    router.getRoutes().filter(item=>item.name==='dash').length<1&& router.addRoute('index',{name: 'dash', path: '/dash', component: () => import('@/views/dash')});
    for (let route of routes) {
        if (route.routePath) {
            let meta = route.meta ? JSON.parse(route.meta) : {};
            switch (route.location) {
                case 'Layout':
                    router.getRoutes().filter(item=>item.name===route.routeName).length<1&& router.addRoute('index',{
                        name: route.routeName,
                        path: route.routePath,
                        component: () => import('@/'+route.resolvePath),
                        meta
                    });
                    break;
                case'Root':
                    router.getRoutes().filter(item=>item.name===route.routeName).length<1&& router.addRoute({
                        name: route.routeName,
                        path: route.routePath,
                        component: () => import('@/'+route.resolvePath),
                        meta
                    });
                    break;
                default:
                    break;
            }
        }
    }
    router.getRoutes().filter(item=>item.name==='other').length<1&&router.addRoute({name:'other',path: '*', redirect: '/404'});
}

router.beforeEach(async (to, from, next) => {
    NProgress.start();
    const  whitelist=['login','register']
    if(!(Vue.prototype.$cookies?Vue.$cookies.get('ACCESS_TOKEN'):Vue.ls.get('ACCESS_TOKEN', undefined))&&whitelist.indexOf(to.name)<0){
        router.replace({name: 'login'})
    }
    next();
});

router.afterEach((to, from) => {
    NProgress.done();
});

router.onReady(async () => {

});

export default router
