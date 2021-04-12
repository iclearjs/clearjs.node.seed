<template>
    <div class="login">
        <div class="login-form" style="-webkit-app-region: no-drag">
            <a-card title="登录" :body-style="{padding:'24px 48px'}">
                <a slot="extra">没有账号,立即注册？</a>
                <a-form-model ref="loginForm" :model="form" :wrapper-col="wrapperCol" :rules="rules">
                    <a-form-model-item>
                        <a-input placeholder="用户名" v-model="form.userCode">
                            <a-icon slot="prefix" type="user" style="color: rgba(0,0,0,.25)"/>
                        </a-input>
                    </a-form-model-item>
                    <a-form-model-item>
                        <a-input type="password" placeholder="密码" v-model="form.userPwd" visibilityToggle>
                            <a-icon slot="prefix" type="lock" style="color: rgba(0,0,0,.25)"/>
                        </a-input>
                    </a-form-model-item>
                    <a-form-model-item>
                        <a-checkbox style="float: left" v-model="form.remember" @change="changeRemember">记住用户名
                        </a-checkbox>
                        <a href="" style="float: right">忘记密码？</a>
                    </a-form-model-item>
                    <a-form-model-item>
                        <a-button type="primary" @click="doLogin" block>立即登录</a-button>
                        <a-button v-if="$electron" type="danger" @click="$electron.remote.app.quit()" block>退出系统</a-button>
                    </a-form-model-item>
                    <div class="user-login-other">
                        <a>
                            <a-icon class="item-icon" type="alipay-circle"></a-icon>
                        </a>
                        <a>
                            <a-icon class="item-icon" type="taobao-circle"></a-icon>
                        </a>
                        <a>
                            <a-icon class="item-icon" type="weibo-circle"></a-icon>
                        </a>
                    </div>
                </a-form-model>
            </a-card>
        </div>
        <a-modal v-model="visible" :footer="null" :width="1024" :mask-closable="false" :closable="false" :body-style="{padding:0}">
            <a-card title="已加入组织" :bordered="false" :extra="user&&user.userName+',您好，欢迎使用'">
                <a-row v-if="organUsers.filter((item)=>{return item.userType==='Admin'|| item.userType==='User'}).length>0"
                       type="flex" justify="start">
                    <template v-for="organUser of organUsers">
                        <a-col span="4" style="padding: 0 10px 10px 0;min-width: 150px"
                               v-if="organUser.userType==='Admin'||organUser.userType==='User'" :key="organUser._id">
                            <a title="点击进入系统" style="color: #000000;" @click="goWelcome(organUser)">
                                <div style="text-align: center">
                                    <a-row style="margin-bottom: 12px">
                                        <a-avatar shape="square" :size="80" :src="organ"
                                                  v-if="organUser.userType==='Admin'||organUser.userType==='User'"/>
                                    </a-row>
                                    <a-row class="text">
                                        <a-tooltip placement="bottom" :title="organUser.idOrgan.organName">
                                            {{organUser.idOrgan.organName}}
                                        </a-tooltip>
                                    </a-row>
                                    <span style="color: #2D8cF0;font-size: 10px"
                                          v-if="organUser.userType==='Admin'">[超级管理员]</span>
                                    <span style="color: #2D8cF0;font-size: 10px"
                                          v-else-if="organUser.userType==='User'">[普通用户]</span>
                                </div>
                            </a>
                        </a-col>
                    </template>
                </a-row>
                <a-empty description="暂未加入任何企业" v-else/>
            </a-card>
            <a-card title="更多操作" :bordered="false">
                <a-row>
                    <a-col span="4" style="padding: 0 10px 10px 0;min-width: 150px">
                        <a @click="Logout()" style="color: #000000;">
                            <div style="text-align: center">
                                <a-row style="margin-bottom: 24px">
                                    <a-avatar shape="square" :size="80" icon="poweroff"
                                              style="background-color:#ed4014"/>
                                </a-row>
                                <a-row>退出系统</a-row>
                            </div>
                        </a>
                    </a-col>
                </a-row>
            </a-card>
        </a-modal>
        <div style="width:100%;text-align:center;font-size: 14px;bottom: 12px;position: fixed;">© 2015-{{new Date().getFullYear()}} <a href="https://www.emaiban.com">emaiban.com</a> 浙ICP备15005064号-2</div>
    </div>
</template>
<script>
    import {mapActions, mapGetters} from "vuex";
    export default {
        data() {
            return {
                visible: false,
                wrapperCol: {span: 24},
                form: {
                    userCode: '',
                    userPwd: '',
                    remember: this.$ls.get('USER_REMEMBER'),
                },
                rules: {
                    userCode: [{required: true, message: '必填', trigger: 'change'}],
                    userName: [{required: true, message: '必填', trigger: 'change'}],
                },
                organ: require('../assets/icon/organ.png'),
                organUsers: [],
            };
        },
        mounted() {
            // if (this.user) {
            //     this.getUserOrgans(this.user);
            //     this.visible = true;
            // }
        },
        computed:{
          ...mapGetters(['user']),
        },
        methods: {
            ...mapActions(['Logout','SetUser','SetToken','SetGroup','SetOrgan']),
            changeRemember(e) {
                this.$ls.set('USER_REMEMBER', e.target.checked);
            },
            async doLogin() {
                this.form.userCode = this.form.userCode.trim();
                this.form.userPwd = this.form.userPwd.trim();
                this.$refs.loginForm.validate(async (valid) => {
                    if (valid) {
                        if (this.form.remember) {
                            this.$ls.set('USER_CODE', this.form.userCode);
                        } else {
                            this.$ls.remove('USER_CODE');
                        }
                        const result = await this.$http.post(this.$url.login, this.form);
                        if (result.data.error.code === '0') {
                            this.SetUser(result.data.record);
                            await this.getUserOrgans(result.data.record._id);
                            this.visible = true
                        }
                    }
                });
            },
            async getUserOrgans(idUser) {
                this.organUsers = (await this.$clear.model('org_organ_user').get({
                    params: {
                        filter: {idUser},
                        populate: 'idOrgan'
                    }
                })).records;
            },
            goWelcome(organUser) {
                this.SetToken(organUser._id);
                this.SetGroup(organUser.idOrgan.idGroupOrgan)
                this.$router.push({name: 'welcome'})
            }
        }
    };
</script>

<style lang="less">
@import "~ant-design-vue/es/style/themes/default.less";

.login {
    width: 100%;
    height: 100%;
    background-image: url('../assets/backgroud/login.png');
    background-size: cover;
    background-position: center;

    &-form {
        position: absolute;
        right: 120px;
        top: 55%;
        transform: translateY(-60%);
        width: 450px;

        .form {
            padding: 0 20px;
        }
    }
}

.user-login-other {
    text-align: center;
    margin-top: 24px;
    line-height: 22px;

    .item-icon {
        font-size: 24px;
        color: rgba(0, 0, 0, 0.2);
        margin-left: 16px;
        vertical-align: middle;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
            color: @primary-color;
        }
    }
}

.text {
    display: inline-block;
    white-space: nowrap;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
