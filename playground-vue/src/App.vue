<script setup lang="ts">

const props = defineProps<{
  app: any,
  form: any
}>()
console.log(props.form);

</script>

<template>
  <component :is="props.app"/>
</template>

<style scoped></style>
