import { usePage } from '@inertiajs/react';
import { route as ziggyRoute } from 'ziggy-js';

export default function useRoute() {
  const { props } = usePage();

  // Get routes from Ziggy or use an empty object if not available
  const routes = props?.ziggy?.routes || {};

  // Create a route function that checks if the route exists before trying to generate it
  const route = (name, params = {}, absolute = true) => {
    try {
      // Check if the route exists
      if (routes[name]) {
        return ziggyRoute(name, params, absolute);
      }
      console.warn(`Route '${name}' is not defined.`);
      return '#';
    } catch (error) {
      console.error(`Error generating route '${name}':`, error);
      return '#';
    }
  };

  // Check if a route exists
  const routeExists = name => {
    return !!routes[name];
  };

  // Check if the current route matches the given route name
  const isCurrentRoute = name => {
    if (!routeExists(name)) return false;

    const currentPath = window.location.pathname;
    const routePath = route(name, {}, false);

    // Handle exact match
    if (currentPath === routePath) return true;

    // Handle parameterized routes
    const routeSegments = routePath.split('/').filter(Boolean);
    const currentSegments = currentPath.split('/').filter(Boolean);

    if (routeSegments.length !== currentSegments.length) return false;

    return routeSegments.every((segment, index) => {
      return segment.startsWith('{') || segment === currentSegments[index];
    });
  };

  return {
    route,
    routeExists,
    isCurrentRoute,
    current: props?.ziggy?.location || '/',
  };
}
