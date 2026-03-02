import '../css/app.css';
import './bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Ziggy } from './ziggy';

// Initialize Ziggy
window.Ziggy = Ziggy;

const appName = import.meta.env.VITE_APP_NAME || 'MediTrack';

createInertiaApp({
  title: title => `${title} - ${appName}`,
  resolve: name =>
    resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);

    // Merge server-side Ziggy with client-side
    if (props.initialPage.props.ziggy) {
      Ziggy.url = props.initialPage.props.ziggy.url;
      Ziggy.query = props.initialPage.props.ziggy.query;
      Ziggy.location = props.initialPage.props.ziggy.location;
      Ziggy.routes = { ...Ziggy.routes, ...props.initialPage.props.ziggy.routes };
    }

    root.render(<App {...props} />);
  },
  progress: {
    color: '#4B5563',
  },
});
