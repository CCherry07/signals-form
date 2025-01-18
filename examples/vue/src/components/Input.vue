<script setup lang="ts">
import { Input, Form } from "ant-design-vue"
interface Props {
  errors: any;
  value: any
  label: string
  isDisabled: boolean
  type?: "Group" | "Search" | "TextArea" | "Password" | "OTP";
}
defineOptions({
  inheritAttrs: false,
})
defineProps<Props>()
const emits = defineEmits(["change", "focus", "blur"])
const handleChange = (e: any) => {
  emits("change", e.target.value)
}
</script>

<template>
  <Form.Item :label="label">
    <Input :value="value" :disabled="isDisabled" @change="handleChange"/>
  </Form.Item>
</template>
