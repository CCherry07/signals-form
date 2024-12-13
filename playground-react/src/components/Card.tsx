import React, { ReactNode } from 'react';
interface Props {
  children: ReactNode,
  title: string,
}
export function Card(props: Props) {
  
  return <div>
    <h1>{props.title}</h1>
    {
      props.children
    }
    </div>;
}
