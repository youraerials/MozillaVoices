var dApplication;

$(function() {
  
  
  dApplication = new DclareApplication("test app");
  
  // pre-init all views and delegates:
  // dApplication.addView(test, true); 
  
  var appContainer = document.querySelector("#my-app-container");
  dApplication.start(appContainer);
  
  
  // for custom global functions, add them to your application instance here:
  
  dApplication.testTransitionEnd = function() {
    
    $("#transition-tester")
      .bind(dApplication.transitionEnd);
    
  };
  
  dApplication.testAnimationEnd = function() {
    
    console.warn("!!!!testing animation end");
    
  };
  
  
});






