import { createApp, createVNode } from 'vue';
import App from './App.vue';
import { createForm } from "@rxform/vue"
import { Field, Component, normalizeSignal,Props } from '@rxform/core';
import Form from "./components/From.vue"
import { Signal } from '@preact/signals-core';
import Input from './components/Input.vue';

@Component({
  id: "nickname",
  component: "input",
  props: {
    title: "Nickname"
  }
})
class Nickname extends Field {
  constructor() {
    super()
  }
}

@Component({
  id: "userinfo",
  component: "form",
  properties: [
    Nickname
  ]
})
@Props({
  style: {
    width: "400px",
  }
})
class UserInfo extends Field {
  constructor() {
    super()
  }
}
type Model = Signal<{
  userinfo: Signal<{
    email: Signal<string>,
    password: Signal<number>,
    nickname: Signal<string>,
    residence: Signal<string[]>
    phone: Signal<number>,
    donation: Signal<number>,
  }>
}>
const bools = {
  isNickname: (model: Model) => normalizeSignal('userinfo.nickname', model).value === "cherry"
}
const graph = [
  UserInfo
]
const { form, app } = createForm({
  graph,
  boolsConfig: bools,
  id: "from-vue",
  components: {
    form: Form,
    input: Input
  }
})
createApp(createVNode(App, {
  form,
  app
})).mount('#app');
