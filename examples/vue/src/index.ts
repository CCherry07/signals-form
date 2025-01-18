import { createApp, createVNode } from 'vue';
import { Field, Component, normalizeSignal, Props, Validator, Actions, Events, D , Signals } from '@rxform/core';
import { zodResolver } from "@rxform/resolvers"
import { createForm } from "@rxform/vue"
import { Signal } from 'alien-signals';

import App from './App.vue';
import Form from "./components/From.vue"
import Input from './components/Input.vue';
import { z } from 'zod';

@Component({
  id: "nickname", // 字段的id
  component: "input", // 组件的id，用于在组件库中查找组件
  properties:[], // 子字段的配置，用于组件的嵌套
  // disabled: D.use('ispassword'), // 当ispassword为true的时候，nickname为disabled状态
  // hidden: D.use('isNicknameHidden'), // 当isNicknameHidden为true的时候，nickname为隐藏状态
  recoverValueOnHidden: true, // 在隐藏的时候 value是否需要删除
  recoverValueOnShown: true // 在显示的时候 value是否需要恢复
})
@Validator({
  initiative: { // 组件事件触发的校验器
    all: [
      {
        engine: "zod", // 可以使用rxform的resolvers来校验，以及自定义的校验器
        updateOn: ['onChange', 'onBlur'], // onChange和onBlur事件会触发校验
        schema: z.string()
      }
    ]
  },
  signal: { // 可订阅的校验器
    all: [
      {
        fact: { // fact 为 订阅的响应式数据， 当fact发生变化的时候，会触发校验
          value: "$state.value",
          b: "$.userinfo.password"
        },
        schema: z.object({
          value: z.string(),
          b: z.string()
        })
      }
    ]
  }
})
@Actions({
  setDefaultValue(){
    return 1
  },
  onSubmitValue(data) { // 提交的时候，会触发的方法，返回的值会作为字段的最终值
    return data + "1"
  },
})
@Events({
  onChange(data) { // 字段的onChange事件触发的方法
    // if (D.and('isA','isB').evaluate(this.bools)) { // 可使用boolsConfig 来处理 大量的逻辑判断
    //   // TODO
    // }
    // this.abstractModel.setFieldProps("phone", { label: "phone number" }) // 可以使用abstractModel来处理其他字段的属性
    // this.abstractModel.setFieldValue("phone", 123) // 可以使用abstractModel来处理其他字段的属性,当然还有要其他的api 例如 errors 等
    this.value = data// 修改当前字段的值
  }
})
@Signals({ // 可订阅的字段的属性
  // 'userinfo.email'(){ // 可订阅的字段的属性,是一个函数，当字段的值发生变化的时候，会触发这个函数
  //   // TODO
  // }
})
class Nickname extends Field {
  constructor() {
    super()
  }
  // 以下为字段的生命周期

  onBeforeInit(): void {

  }
  onInit(): void {

  }
  onMounted(): void {

  }
  onUnmounted(): void {

  }
  onDestroy(): void {

  }
  onDisabled(state: boolean): void {

  }
  onHidden(state: boolean): void {

  }
}

@Component({
  id: "userinfo",
  component: "form",
  properties: [
    Nickname
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
  UserInfo
]
const { form, app } = createForm({
  defaultValidatorEngine: "zod",
  graph,
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
