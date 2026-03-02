/**
 * Safely render any value as JSX content
 * Prevents React error #31 by ensuring objects are never rendered directly
 */
export const safeRender = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    // If it's an object, convert to string representation
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object]';
    }
  }
  
  return String(value);
};

/**
 * Safely render activity or event data
 */
export const safeRenderActivity = (activity) => {
  if (!activity) return '';
  
  if (typeof activity === 'string') {
    return activity;
  }
  
  if (typeof activity === 'object') {
    // If it's an activity object, extract meaningful information
    if (activity.description) {
      return String(activity.description);
    }
    if (activity.title) {
      return String(activity.title);
    }
    if (activity.event) {
      return String(activity.event);
    }
    
    // Fallback to safe string representation
    return safeRender(activity);
  }
  
  return String(activity);
};

/**
 * Safely render event types
 */
export const safeRenderEvent = (event) => {
  if (!event) return '';
  
  if (typeof event === 'object') {
    // If event is an object, try to extract the event type
    if (event.event) {
      return String(event.event);
    }
    if (event.type) {
      return String(event.type);
    }
    
    // Fallback
    return '[Event Object]';
  }
  
  return String(event);
};