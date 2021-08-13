<template>
    <div style="float: right;height: 100%;margin-right: 24px;">
        <avatar></avatar>
        <toggle-lang style="margin-left: 12px"></toggle-lang>
        <toggle-color style="margin-left: 12px"></toggle-color>
    </div>
</template>

<script>
    import Avatar from './components/avatar'
    import ToggleLang from "../ToggleLang";
    import {ToggleColor} from "../ToggleColor";

    export default {
        name: "GlobalHeader",
        components: {ToggleLang, ToggleColor, Avatar}
    }
</script>

<style scoped>

</style>
