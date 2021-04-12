<template>
    <div class="welcome">
        <a-layout-header style="background:rgba(255,255,255,0.4) ">
            <img src="../assets/logo_white.png" height="60" width="200"/>
            <a-dropdown style="float: right">
                <a-icon type="user" style="margin-left: 24px;font-size:20px;line-height: 64px"/>
                <a-menu slot="overlay" @click="onDropdownClick">
                    <a-menu-item key="change">
                        <a-icon type="switcher" /> 切换企业
                    </a-menu-item>
                    <a-menu-item key="sApply">
                        <a-icon type="login" /> 入驻企业
                    </a-menu-item>
                    <a-menu-item key="logout">
                        <a-icon type="logout" /> 退出系统
                    </a-menu-item>
                </a-menu>
            </a-dropdown>
        </a-layout-header>
        <a-row style="max-width: 65%;top: 20%;margin:0 auto;min-height: 400px;">
            <a-col span="3" style="padding: 0 10px 10px 0;min-width: 150px" v-for=" app in applications" :key="app._id">
                <a @click="goApp(app)">
                    <a-card :style="{background:'rgba(255,255,255,0.7)' }">
                        <div style="text-align: center; margin: 18px 0">
                            <a-avatar style="margin-bottom: 6px" shape="square" :size="55" :src="app.idApplication.icon?app.idApplication.icon:icon"/>
                            <div>{{app.idApplication.name}}</div>
                        </div>
                    </a-card>
                </a>
            </a-col>
        </a-row>
        <div style="color:#fff;width:100%;text-align:center;font-size: 14px;bottom: 12px;position: fixed;">© 2015-{{new
            Date().getFullYear()}} <a
                    href="https://www.emaiban.com">emaiban.com</a> 浙ICP备15005064号-2
        </div>
    </div>
</template>

<script>
    import {mapActions, mapGetters} from 'vuex'
    export default {
        name: "welcome",
        data(){
          return {
              applications:[],
              icon: require('../assets/icon/application.png'),
          }
        },
        mounted() {
            this.loadData();
        },
        computed:{
          ...mapGetters(['user']),
        },
        methods: {
            ...mapActions(['ToggleApp','Logout']),
            onDropdownClick({key}) {
                switch (key) {
                    case 'change':
                        this.$cookies.remove('access_token');
                        this.$cookies.remove('access_organ');
                        this.$router.push({name: 'login'});
                        break;
                    case'logout':
                        this.Logout();
                        break;
                    case'sApply':
                        this.$router.push({name:'sApplyList'});
                        break;
                    default:
                        break;
                }
            },
            async loadData() {
                this.applications=(await this.$http.get('/v1/authority/application')).data.records
            },
            async goApp(app) {
                this.ToggleApp(app.idApplication._id);
                this.$router.push({name:'dash'})
            }
        }
    }
</script>

<style scoped>
    .welcome {
        width: 100%;
        height: 100%;
        background-image: url('../assets/backgroud/welcome.jpg');
        background-size: cover;
        background-position: center;
    }
</style>
