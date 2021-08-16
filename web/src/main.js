import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/'
import i18n from './i18n'
import moment from 'moment'

import './core/lazy_use'
import bootstrap from './core/bootstrap'
import url from './config/config.url'
import helper from './utils/helper'
import axios from  './utils/axios'
import clearUIVue from '@clearui/vue'
import {Icon} from "ant-design-vue";

Vue.use(clearUIVue,{store,i18n,axios})

Vue.prototype.$http = axios;
Vue.prototype.$url = url;
Vue.prototype.$moment = moment;
Vue.prototype.$helper = {...Vue.prototype.$helper,...helper(Vue)}

const CIcon = Icon.createFromIconfontCN({
  scriptUrl: 'https://at.alicdn.com/t/font_950760_30p8pd1te0k.js', // 在 iconfont.cn 上生成
});

Vue.component('c-icon',CIcon)


Vue.config.productionTip = false;

new Vue({
  router,
  store,
  i18n,
  created: bootstrap,
  render: h => h(App),
}).$mount('#app');
