// Vercel Speed Insights initialization
// Based on @vercel/speed-insights v2.1.0
(function() {
  'use strict';
  
  // Initialize queue
  function initQueue() {
    if (window.si) return;
    window.si = function() {
      window.siq = window.siq || [];
      window.siq.push(arguments);
    };
  }
  
  // Check if we're in a browser
  function isBrowser() {
    return typeof window !== 'undefined';
  }
  
  // Detect environment
  function detectEnvironment() {
    try {
      const env = typeof process !== 'undefined' && process.env && process.env.NODE_ENV;
      if (env === 'development' || env === 'test') {
        return 'development';
      }
    } catch {
    }
    return 'production';
  }
  
  function isDevelopment() {
    return detectEnvironment() === 'development';
  }
  
  // Make URL absolute
  function makeAbsolute(url) {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') ? url : '/' + url;
  }
  
  // Get script source URL
  function getScriptSrc(props) {
    if (props.scriptSrc) {
      return makeAbsolute(props.scriptSrc);
    }
    if (isDevelopment()) {
      return 'https://va.vercel-scripts.com/v1/speed-insights/script.debug.js';
    }
    if (props.dsn) {
      return 'https://va.vercel-scripts.com/v1/speed-insights/script.js';
    }
    if (props.basePath) {
      return makeAbsolute(props.basePath + '/speed-insights/script.js');
    }
    return '/_vercel/speed-insights/script.js';
  }
  
  // Load and prepare props
  function loadProps(explicitProps) {
    var props = explicitProps || {};
    var dataset = {
      sdkn: '@vercel/speed-insights' + (props.framework ? '/' + props.framework : ''),
      sdkv: '2.1.0'
    };
    
    if (props.sampleRate) {
      dataset.sampleRate = props.sampleRate.toString();
    }
    if (props.route) {
      dataset.route = props.route;
    }
    if (typeof props.softNavs === 'boolean') {
      dataset.softNavs = String(props.softNavs);
    }
    if (isDevelopment() && props.debug === false) {
      dataset.debug = 'false';
    }
    if (props.dsn) {
      dataset.dsn = props.dsn;
    }
    if (props.endpoint) {
      dataset.endpoint = makeAbsolute(props.endpoint);
    } else if (props.basePath) {
      dataset.endpoint = makeAbsolute(props.basePath + '/speed-insights/vitals');
    }
    
    return {
      src: getScriptSrc(props),
      beforeSend: props.beforeSend,
      dataset: dataset
    };
  }
  
  // Main injection function
  function injectSpeedInsights(props) {
    props = props || {};
    
    if (!isBrowser() || props.route === null) return null;
    
    initQueue();
    
    var config = loadProps(props);
    var src = config.src;
    var beforeSend = config.beforeSend;
    var dataset = config.dataset;
    
    // Check if script already exists
    if (document.head.querySelector('script[src*="' + src + '"]')) return null;
    
    // Set beforeSend callback if provided
    if (beforeSend && window.si) {
      window.si('beforeSend', beforeSend);
    }
    
    // Create and configure script element
    var script = document.createElement('script');
    script.src = src;
    script.defer = true;
    
    // Set data attributes
    for (var key in dataset) {
      if (dataset.hasOwnProperty(key)) {
        script.dataset[key] = dataset[key];
      }
    }
    
    script.onerror = function() {
      console.log('[Vercel Speed Insights] Failed to load script from ' + src + '. Please check if any content blockers are enabled and try again.');
    };
    
    // Add script to page
    document.head.appendChild(script);
    
    return {
      setRoute: function(route) {
        script.dataset.route = route || undefined;
      }
    };
  }
  
  // Initialize Speed Insights
  injectSpeedInsights();
})();
