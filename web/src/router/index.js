import Vue from 'vue'
import Router from 'vue-router'
import {BasicLayout} from '@/components/Layout'
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
            path: '/welcome',
            name: 'welcome',
            component: () => import('@/views/welcome')
        },
        {
            path: '/404',
            name: '404',
            component: () => import('@/views/exception/404')
        },
    ]
});

router.loadDynamicRoutes=async (application)=>{
    if(!(Vue.prototype.$cookies?Vue.$cookies.get('ACCESS_TOKEN'):Vue.ls.get('ACCESS_TOKEN', undefined))){
        return;
    }
    const routes=(await Vue.prototype.$http.get('/v1/authority/menu',{params:{application}})).data.records;
    const dynamicRoutes = [{
        path: '*', redirect: '/404'
    }];
    const layoutDynamicRoutes={
        path: '/',
        name: 'index',
        component: BasicLayout,
        redirect : () => {
            return 'dash'
        },
        children: [
            {
                path: '/dash',
                name: 'dash',
                component: () => import('@/views/dash')
            },
        ]
    };
    for (let route of routes) {
        if (route.routePath) {
            let meta = route.meta ? JSON.parse(route.meta) : {};
            switch (route.location) {
                case 'Layout':
                    layoutDynamicRoutes.children.push({
                        name: route.routeName,
                        path: route.routePath,
                        component: () => import('@/'+route.resolvePath),
                        meta
                    });
                    break;
                case'Root':
                    dynamicRoutes.push({
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
    dynamicRoutes.push(layoutDynamicRoutes);
    router.addRoutes(dynamicRoutes);
}

router.beforeEach(async (to, from, next) => {
    NProgress.start();
    const  whitelist=['login','register']
    console.log(Vue.prototype.$cookies?Vue.$cookies.get('ACCESS_TOKEN'):Vue.ls.get('ACCESS_TOKEN', undefined));
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
