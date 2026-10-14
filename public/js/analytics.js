// Vercel Web Analytics initialization
// Using script injection for browser environments
(function() {
  'use strict';
  
  // Configuration
  var config = {
    mode: 'auto', // auto-detect environment
    debug: false
  };
  
  // Create the analytics queue
  window.va = window.va || function() {
    (window.vaq = window.vaq || []).push(arguments);
  };
  
  // Inject the Vercel analytics script
  var script = document.createElement('script');
  script.defer = true;
  script.src = 'https://va.vercel-scripts.com/v1/script.js';
  
  // Add script to page
  var firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
})();
