<template>
    <a-modal :visible="visible" title="用户注册" centered :mask-closable="false" :closable="false" dialogClass="noDrag" @cancel="cancel" @ok="doRegister">
        <a-form-model ref="form" labelAlign="left" :model="form" :rules="rules" :label-col="{span: 4}" :wrapper-col="{span: 20}">
            <a-form-model-item label="手机号码" prop="userCode">
                <a-input v-model="form.userCode"/>
            </a-form-model-item>
            <!--                <a-form-model-item label="验证码">-->
            <!--                    <a-input-search v-model="form.sms" @search="">-->
            <!--                        <a-button slot="enterButton" type="primary">获取验证码</a-button>-->
            <!--                    </a-input-search>-->
            <!--                </a-form-model-item>-->
            <a-form-model-item label="姓名" prop="userName">
                <a-input v-model="form.userName"/>
            </a-form-model-item>
            <a-form-model-item label="密码" prop="userPwd">
                <a-input v-model="form.userPwd" type="password"/>
            </a-form-model-item>
            <a-form-model-item label="确认密码" prop="userPwd2">
                <a-input v-model="form.userPwd2" type="password"/>
            </a-form-model-item>
        </a-form-model>
    </a-modal>
</template>

<script>
    export default {
        name: "CRegister",
        props:{
            visible:{
                type:Boolean,
                default:false
            }
        },
        data(){
            const validatePass = (rule, value, callback) => {
                if (value === '') {
                    callback(new Error('请输入密码！'));
                } else {
                    if (this.form.userPwd2 !== '') {
                        this.$refs.form.validateField('userPwd2');
                    }
                    callback();
                }
            };
            const validatePass2 =(rule, value, callback) => {
                if (value === '') {
                    callback(new Error('请再次输入密码！'));
                } else if (value !== this.form.userPwd) {
                    callback(new Error("两次输入不一致!"));
                } else {
                    callback();
                }
            };
          return{
              form: {},
              rules: {
                  organName: [{required: true, message: '必填', trigger: 'change'}],
                  userCode: [{required: true, message: '请输入正确的手机号', trigger: 'change',pattern:/^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/}],
                  userName: [{required: true, message: '必填', trigger: 'change'}],
                  userPwd: [{required: true, validator: validatePass, trigger: 'change'}],
                  userPwd2: [{required: true, validator: validatePass2, trigger: 'change'}],
              }
          }
        },
        methods:{
            cancel(){
                this.$emit('update:visible', false);
            },
            doRegister(){
                this.$refs.form.validate(async (valid) => {
                    if (valid) {
                        this.$emit('doRegister',this.form);
                    }
                });
            }
        }
    }
</script>

<style scoped>

</style>