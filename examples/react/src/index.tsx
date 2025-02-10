import React, { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import Login from './demos/login';
import Edit from "./demos/edit";
import Validator from "./demos/validator";
import Boolless from './demos/boolless';
import Relation from './demos/relation';
function createElement(node: ReactNode){
  const el = document.createElement('div')
  el.style.marginBottom = '20px';
  createRoot(el).render(node);
  document.body.appendChild(el);
}

createElement(<Login />);
createElement(<Edit />);
createElement(<Validator />);
createElement(<Boolless />);
createElement(<Relation />);
