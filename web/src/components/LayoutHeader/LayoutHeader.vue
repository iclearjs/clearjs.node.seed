<template>
    <div style="float: right;height: 100%;margin-right: 24px;">
        <layout-avatar></layout-avatar>
        <toggle-lang style="margin-left: 12px"></toggle-lang>
        <toggle-color style="margin-left: 12px"></toggle-color>
    </div>
</template>

<script>
    import LayoutAvatar from '../LayoutAvatar/LayoutAvatar'
    import ToggleLang from "../ToggleLang";
    import {ToggleColor} from "../ToggleColor";

    export default {
        name: "GlobalHeader",
        components: {ToggleLang, ToggleColor, LayoutAvatar}
    }
</script>

<style scoped>

</style>
