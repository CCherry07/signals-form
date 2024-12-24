<template>
  <div>
    <Form :style="style">
      <template v-for="(, name) in slots" :key="name">
        <slot :name="name"></slot>
      </template>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { Form } from 'ant-design-vue';
import { useSlots } from 'vue';
defineOptions({
  inheritAttrs: false,
})
interface Props {
  style: any;
}
const slots:Record<string,any> = useSlots()
defineProps<Props>()
</script>
