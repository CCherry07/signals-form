<template>
  <div>
    <Form>
      {{ props.children  }}
    </Form>
  </div>
</template>

<script setup lang="ts">
import { Form } from 'ant-design-vue';
const props  = defineProps<{
  style: any,
  children: any
}>()
</script>
