import config from '@/config/config.default'
import Vue from 'vue'
import 'nprogress/nprogress.css'
import '@/components/global.less'

import VueCodemirror from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
Vue.use(VueCodemirror)

import '@/core/lazy_use/antd_use';
import VueCookies from 'vue-cookies'
import VueElectron from 'vue-electron'

if(config.platform==='web'){
    Vue.use(VueCookies)
}

if(config.platform==='electron'){
    Vue.use(VueElectron)
}

import VueStorage from 'vue-ls'
Vue.use(VueStorage, config.storageOptions);



