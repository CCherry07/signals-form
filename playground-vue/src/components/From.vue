<template>
  <div>
    <Form :style="style">
      <slot></slot>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { Form } from 'ant-design-vue';
defineOptions({
  inheritAttrs: false,
})
interface Props {
  style: any;
}
const props  = defineProps<Props>()

</script>
