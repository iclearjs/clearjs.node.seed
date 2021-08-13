<template>
    <a-card title="登录" :body-style="{padding:'24px 48px'}">
        <a slot="extra" @click="doRegister">没有账号,立即注册？</a>
        <a-form-model ref="form" :model="form" :wrapper-col="{span: 24}" :rules="rules">
            <a-form-model-item prop="userCode">
                <a-input placeholder="手机号" v-model="form.userCode">
                    <a-icon slot="prefix" type="user" style="color: rgba(0,0,0,.25)"/>
                </a-input>
            </a-form-model-item>
            <a-form-model-item prop="userPwd">
                <a-input type="password" placeholder="密码" v-model="form.userPwd" visibilityToggle>
                    <a-icon slot="prefix" type="lock" style="color: rgba(0,0,0,.25)"/>
                </a-input>
            </a-form-model-item>
            <a-form-model-item>
                <a-checkbox style="float: left" v-model="form.remember" @change="changeRemember">记住用户名</a-checkbox>
                <a style="float: right" @click="doResetPwd">忘记密码？</a>
            </a-form-model-item>
            <a-form-model-item>
                <a-button type="primary" @click="doLogin" block>立即登录</a-button>
                <a-button v-if="$electron" type="danger" @click="$electron.remote.app.quit()" block>退出系统</a-button>
            </a-form-model-item>
            <div class="user-login-other" v-if="!$electron">
                <a><a-icon class="item-icon" type="windows"></a-icon></a>
                <a><a-icon class="item-icon" type="apple"></a-icon></a>
            </div>
        </a-form-model>
    </a-card>
</template>

<script>
export default {
    name: "CLogin",
    data() {
        return {
            form: {
                userCode: '',
                userPwd: '',
                remember: this.$ls.get('USER_REMEMBER'),
            },
            rules: {
                userCode: [{required: true, message: '请输入手机号', trigger: 'change'}],
                userPwd: [{required: true, message: '请输入密码', trigger: 'change'}],
            }
        }
    },
    mounted() {
        this.form.remember = !!this.$ls.get('USER_REMEMBER');
        this.form.userCode = this.form.remember?this.$ls.get('USER_CODE'):'';
    },
    methods:{
        changeRemember(e) {
            this.$ls.set('USER_REMEMBER', e.target.checked);
        },
        doLogin(){
            this.form.userCode = this.form.userCode.trim();
            this.form.userPwd = this.form.userPwd.trim();
            this.$refs.form.validate(async (valid) => {
                if (valid) {
                    if (this.form.remember) {
                        this.$ls.set('USER_CODE', this.form.userCode);
                    } else {
                        this.$ls.remove('USER_CODE');
                    }
                    this.$emit('doLogin', this.form);
                }
            });
        },
        doRegister(){
            this.$emit('register');
        },
        doResetPwd(){
            this.$emit('resetPwd');
        }
    }
}
</script>

<style scoped>

</style>