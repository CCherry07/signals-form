<script setup lang="ts">
import { Input, Form } from "ant-design-vue"
interface Props {
  errors: any;
  value: any
  onChange: any
  title: string
  isDisabled: boolean
  onBlur: Function
  onFocus: Function
  type?: "Group" | "Search" | "TextArea" | "Password" | "OTP";
}
const props = defineProps<Props>()
</script>

<template>
  <div>
    <Form.Item :label="title">
      <Input
        :value="value"
        :onInput="onChange"
        :disabled="isDisabled"
        :onBlur="onBlur"
        :onFocus="onFocus"
        :type="type"
      />
    </Form.Item>
  </div>
</template>
