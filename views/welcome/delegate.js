
WelcomeView = function() {

  console.log("creating Welcome view, you should not see this twice!");

  this.key = "Welcome";
  this.controller = false;
  this.domContainer = false;
  
};

WelcomeView.prototype.onCreate = function() {

  console.log("Welcome view CREATED");

};

WelcomeView.prototype.onDOMReady = function() {

  console.log("welcome view dom ready");

  $(this.domContainer).bind("touchmove", function(inEvent) {
    
    inEvent.preventDefault();
    inEvent.stopPropagation();
    
    
  });
  
  $("#copy-2").bind(dApplication.animationEnd, function(inEvent) {
    
    console.log("COPY animation end, advancing");
    
    dApplication.views["welcome-msg"].hide();
    $("#globe").removeClass("right-pos");
    $(".info").removeClass("hidden-left");
    
    
  });


};  
  
  
WelcomeView.prototype.onBeforeVisible = function() {

  console.log("Welcome view delegate onBeforeVisible() called");
  
  // try to do some scroll trickery for safari on iOS
  //window.scrollTo(0, 1);
  
  

  
  
};

WelcomeView.prototype.onVisible = function() {

  console.log("Welcome view delegate onVisible() called");
  


};

WelcomeView.prototype.onBeforeInvisible = function() {

  console.log("Welcome view delegate onBeforeInvisible() called");

};

WelcomeView.prototype.onInvisible = function() {

  console.log("Welcome view delegate onInvisible() called");
  
  $("#display-toggle").show();
  
  $("#app-client-counter").show();
  


};

WelcomeView.prototype.show = function() {

  console.log("Welcome view delegate show() called");

};

WelcomeView.prototype.hide = function() {

  console.log("Welcome view delegate hide() called");

};

