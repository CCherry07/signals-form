import React from "react";

interface Props {
  from: any;
}
export function Submit(props: Props) {
  const { from } = props;
  const handleSubmit = (e: any) => {
    e.preventDefault();
    from.submit().then((res: any) => {
      console.log("form model", res);
    }).catch((err: any) => {
      console.log("form model", err);
    });
  };
  return <button type="submit" onClick={handleSubmit}>submit</button>;
}
