<template>
    <a-modal :visible="visible" title="重置密码" centered :mask-closable="false" :closable="false" dialogClass="noDrag" @cancel="cancel" @ok="doResetPwd">
        <a-form-model ref="form" labelAlign="left" :model="form" :rules="rules" :label-col="{span: 4}" :wrapper-col="{span: 20}">
            <a-form-model-item label="手机号" prop="userCode">
                <a-input v-model="form.userCode"/>
            </a-form-model-item>
            <a-form-model-item label="原密码" prop="userPwd">
                <a-input v-model="form.userPwd" type="password"/>
            </a-form-model-item>
            <a-form-model-item label="密码" prop="userPwd">
                <a-input v-model="form.userPwdNew" type="password"/>
            </a-form-model-item>
            <a-form-model-item label="确认密码" prop="userPwdNewTwo">
                <a-input v-model="form.userPwdNewTwo" type="password"/>
            </a-form-model-item>
        </a-form-model>
    </a-modal>
</template>

<script>
import {mapGetters} from "vuex";

export default {
    name: "CResetPwd",
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
                if (this.form.userPwdNewTwo !== '') {
                    this.$refs.form.validateField('userPwdNewTwo');
                }
                callback();
            }
        };
        const validatePass2 =(rule, value, callback) => {
            if (value === '') {
                callback(new Error('请再次输入密码！'));
            } else if (value !== this.form.userPwdNew) {
                callback(new Error("两次输入不一致!"));
            } else {
                callback();
            }
        };
        return{
            form: {},
            rules: {
                userCode: [{required: true, message: '必填', trigger: 'change'}],
                userPwd: [{required: true, message: '必填', trigger: 'change'}],
                userPwdNew: [{required: true, validator: validatePass, trigger: 'change'}],
                userPwdNewTwo: [{required: true, validator: validatePass2, trigger: 'change'}],
            }
        }
    },
    computed: {
        ...mapGetters(['user']),
    },
    methods:{
        cancel(){
            this.$emit('update:visible', false);
        },
        doResetPwd(){
            this.$refs.form.validate(async (valid) => {
                if (valid) {
                    this.$emit('doResetPwd',this.form);
                }
            });
        }
    }
}
</script>

<style scoped>

</style>