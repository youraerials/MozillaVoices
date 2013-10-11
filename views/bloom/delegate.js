BloomView = function() {

  console.log("creating bloom view");

  this.key = "bloom";
  this.controller = false;
  this.domContainer = false;
  
};

BloomView.prototype.onBeforeVisible = function() {

  console.log("bloom view delegate on visible");
  
  var _self = this;
    
  var platformCodedAnimationEndEvent = PrefixFree.prefixProperty("animationEnd", true);
    
  platformCodedAnimationEndEvent = 
    platformCodedAnimationEndEvent.charAt(0).toLowerCase() + 
    platformCodedAnimationEndEvent.slice(1);

  
  if (platformCodedAnimationEndEvent.indexOf("oz") > -1) {
    
    platformCodedAnimationEndEvent = "animationend";  // moz seems to no longer support the old MozAnimationEnd
    
  }    
  

};

BloomView.prototype.onVisible = function() {
  
  console.log("DROPLET END");
  
  $(this.domContainer)
    .bind(dApplication.animationEnd, function(inEvent) { 
      
        
        //console.log("end"); 
        
        if ( 
          $(inEvent.target).hasClass("bloom") && 
          $(inEvent.target).hasClass("bloom-transform-in") ) 
        {
            $(this).remove();
        }
      
      
      })
    .addClass("bloom-transform-in");
  
  
    
};


