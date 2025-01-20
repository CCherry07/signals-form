import { createRoot } from "react-dom/client";
import { effect } from "@preact/signals-react";
import { deepSignal } from "deepsignal/react";

const user = deepSignal({
  update: 0,
  name: {
    first: "Thor",
    last: "Odinson"
  },
  email: "thor@marvel",
  site: "marvel.com",
  friends: [{ name: { first: "Super", last: "Man" } }]
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

let renders = 0;

const App = () => {
  const { site } = user;
  return (
    <div>
      <small>
        renders: {++renders}, update: {user.$update}
      </small>
      <hr />
      <div>Name: {user.name.$first}</div>
      {/* @ts-ignore because it was created on the fly */}
      <div>Age: {user.$age}</div>
      {/* It works, but triggers a component rerender */}
      <div>Email: {user.email}</div>
      {/* It works, but triggers a component rerender */}
      <div>Site: {site}</div>
      {/* Iterate over arrays */}
      <div>Friends:</div>
      <ul>
        {/* Updating the array triggers a component rerender */}
        {user.friends.map((friend) => (
          <li key={friend.name.last}>
            {/* But updating internals does not */}
            {friend.name.$first} {friend.name.$last}
          </li>
        ))}
      </ul>
    </div>
  );
};

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);
root.render(<App />);
