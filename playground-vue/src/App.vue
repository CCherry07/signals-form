<script setup lang="ts">

const props = defineProps<{
  app: any,
  form: any
}>()
console.log(props);

</script>

<template>
  <div>
    <component :is="props.app" :form="form" />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #9F1A8Faa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
