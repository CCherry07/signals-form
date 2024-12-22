import { createApp, createVNode } from 'vue';
import './style.css';
import App from './App.vue';
import { createForm } from "@rxform/vue"
import { Field, Component, normalizeSignal } from '@rxform/core';
import Form from "./components/From.vue"
import { Signal } from '@preact/signals-core';

@Component({
  id: "nickname",
  component: "input",
})
class Nickname extends Field {
  constructor() {
    super()
  }
}

@Component({
  id: "userinfo",
  component: "from",
  properties: [
    new Nickname()
  ]
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
  new UserInfo()
]
const { from, app } = createForm({
  graph,
  boolsConfig: bools,
  id: "from-vue",
  components: {
    form: Form
  }
})
createApp(createVNode(App, {
  from, app
})).mount('#app');
