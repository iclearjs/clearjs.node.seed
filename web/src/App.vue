<template>
    <a-config-provider :locale="locale">
        <div id="app">
            <router-view/>
        </div>
    </a-config-provider>
</template>

<script>
    export default {
        name: 'App',
        data() {
            return {

            }
        },
        computed: {
            locale () {
                return this.$i18n.getLocaleMessage(this.$store.getters.lang).antLocale
            }
        }
    }
</script>

<style>
    #app {
        height: 100%;
    }
</style>
