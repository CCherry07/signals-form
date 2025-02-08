import { createApp, createVNode } from 'vue';
import { zodResolver } from "@formula/resolvers"
import { createForm } from "@formula/vue"

import App from './App.vue';
import Form from "./components/Form.vue"
import Input from './components/Input.vue';
import { defineField } from '@formula/core';

interface Model {
  nickname: string;
}
const bools = {
  isNickname: (model: Model) => model.nickname === "cherry",
}

const nickname = defineField().component({
  component: Input,
  id: "nickname",
}).props({
  label: "昵称"
}).build()

const useinfo =
  defineField()
    .component({
      component: Form,
      id: "useinfo",
    })
    .properties([
      nickname
    ]).build()

const { form, app } = createForm({
  defaultValidatorEngine: "zod",
  graph: [
    useinfo
  ],
  boolsConfig: bools,
  id: "from-vue",
  resolvers: {
    validator: {
      zod: zodResolver
    }
  },
  components: {
    form: Form,
    input: Input
  }
})
createApp(createVNode(App, {
  form,
  app
})).mount('#app');
