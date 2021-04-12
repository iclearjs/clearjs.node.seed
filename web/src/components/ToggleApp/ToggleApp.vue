<template>
    <span>
        <a-select style="width: 150px" :value="application" @change="onChange">
            <template v-for="app in applications">
                <a-select-option :value="app.idApplication._id" :key="app.idApplication._id">
                    <a-avatar shape="square" slot='avatar' size="small" :src="app.idApplication.icon?app.idApplication.icon:icon"/>
                    <span slot="title" style="margin-left: 12px">{{app.idApplication.name}}</span>
                </a-select-option>
            </template>
        </a-select>
    </span>
</template>

<script>
    import {mapActions, mapGetters, mapState} from "vuex";

    export default {
        name: "ToggleApp",
        data(){
            return {
                applications:[],
                icon: require('../../assets/icon/application.png'),
            }
        },
        computed:{
            ...mapGetters(['uid']),
            application(){
                return this.uid;
            }
        },
        created() {
            this.loadData();
        },
        methods:{
            ...mapActions(['ToggleApp']),
            async loadData() {
                this.applications=(await this.$http.get('/v1/authority/application')).data.records
            },
            async onChange(value){
                this.$ls.remove('MENU');
                await this.ToggleApp(value);
                location.assign("/")
            }
        }
    }
</script>

<style scoped>

</style>