import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import { Submit } from "./components/Submit";
import { Spin } from "antd";
interface Parops {
  app: ReactNode,
  form: any
}

import { deepSignal, effect } from "alien-deepsignals";

const user = deepSignal({
  update: 0,
  name: {
    first: "Thor",
    last: "Odinson",
  },
  email: "thor@marvel",
  site: "marvel.com",
  friends: [{ name: { first: "Super", last: "Man" } }],
});

effect(() => {
  console.log(user, "all");
});

setTimeout(() => {
  user.update = 1;
  user.name.last = "Snow"; // This should not trigger a rerender.
}, 1500);

setTimeout(() => {
  user.update = 2;
  user.name.first = "Jon";
}, 3000);

setTimeout(() => {
  user.update = 3;
  // @ts-ignore because it is created on the fly.
  user.age = "35";
}, 4500);

setTimeout(() => {
  user.update = 4;
  user.email = "jon@throne";
}, 6000);

setTimeout(() => {
  user.update = 5;
  user.site = "throne.com";
}, 7500);

setTimeout(() => {
  user.update = 6;
  user.friends[0].name.last = "Woman";
}, 9000);

setTimeout(() => {
  user.update = 7;
  user.friends.push({ name: { first: "Iron", last: "Man" } });
}, 10500);

setTimeout(() => {
  user.update = 8;
  user.friends = [{ name: { first: "Iron", last: "Man" } }];
}, 12000);

effect(() => {
  console.log("Number of friends: " + user.friends.length);
});

effect(() => {
  console.log(
    "Names of your friends: " +
      user.friends.map((friend) => friend.name.first).join(", ")
  );
});

export function App(props: Parops) {
  const [state, setState] = useState(false)
  const [submitting, setSubmitted] = useState(false)
  const [model, setModel] = useState({} as any)
  useEffect(() => {
    effect(() => {
      setState(props.form.isUpdating.value)
      setSubmitted(props.form.submiting.value)
    })
    effect(() => {
      setModel(props.form.model)
    })
  }, [])
  return <div style={{ display: "flex" }}>
    <div style={{ marginRight: "50px" }}>
      <div style={{ marginBottom: 20 }}>
        model: {JSON.stringify(model, null, 2)}
      </div>
      <Spin spinning={state || submitting}>
        {props.app}
        <Submit form={props.form} />
      </Spin>
    </div>
  </div>
}
