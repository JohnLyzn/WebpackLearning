<template>
    <div class="main-body">
        {{message}}
    </div>
</template>
<script>
    export default {
        data() {
            return {
                message: 'Hello world!!!',
            };
        }
    }
</script>
<style lang="scss">
    .main-body {
        text-align: center;
    }
</style>