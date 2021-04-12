import axios from "axios/index";
import NProgress from 'nprogress'
import Vue from 'vue'
import config from '@/config/config.default'
import store from "../store";


axios.defaults.baseURL=config.host;

axios.defaults.withCredentials = true;

axios.defaults.xsrfHeaderName = 'x-csrf-token';

axios.defaults.xsrfCookieName = 'csrfToken';

axios.interceptors.request.use((config) => {

    NProgress.start();

    if(Vue.prototype.$cookies?Vue.$cookies.get('ACCESS_TOKEN'):Vue.ls.get('ACCESS_TOKEN', undefined)){
        if(!config.params){
            config.params={};
        }
        switch (config.method) {
            case "get"||'GET':
                config.params['access_token']=Vue.prototype.$cookies?Vue.$cookies.get('ACCESS_TOKEN'):Vue.ls.get('ACCESS_TOKEN', undefined);
                break;
            default:
                break;
        }
    }

    return config;

}, (error) => {

    return Promise.reject(error);

});

axios.interceptors.response.use((response) => {

    NProgress.done();

    if (response.data.error.code !== '0') {
        Vue.prototype.$notification.error({
            message: response.data.error.code,
            description: response.data.error.message
        });
    }

    return response;

}, (error) => {

    NProgress.done();

    Vue.prototype.$notification.error({
        message: 'error',
        description: error.toString()
    });

    return Promise.reject(error);

});

export default axios;
