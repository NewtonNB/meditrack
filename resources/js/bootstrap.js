import axios from 'axios';
import { route } from 'ziggy-js';
import { Ziggy } from './ziggy';

// Attach globally; prefer the live Ziggy object if present
window.route = (name, params, absolute, config) =>
  route(name, params, absolute, config || window.Ziggy || Ziggy);

window.axios = axios;
