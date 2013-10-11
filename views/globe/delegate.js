
GlobeView = function() {

  console.log("creating Globe view");

  this.key = "test";
  this.controller = false;
  this.domContainer = false;
  
};

GlobeView.prototype.onCreate = function() {

  console.log("Globe view CREATED");

};

GlobeView.prototype.onDOMReady = function() {


  console.log("Globe DOM READY");
    
  
  $("#world-container").bind("touchmove", function(inEvent) {
    
    inEvent.preventDefault();

  });
  
  $("#world-masker").bind("touchmove", function(inEvent) {
    
    inEvent.preventDefault();

  });
  
  $(".world").bind("touchmove", function(inEvent) {
    
    inEvent.preventDefault();

  });
  

  if ($("body").hasClass("safari")) {
    
    $("#moz-lockup").css({ top: $(window).height() + 65 });  
    
  }
  
  
  var nav = navigator.userAgent.toLowerCase();
  var rev = parseInt($.browser.version);
  
  
  // note that we're masking the globe with a canvas, just drawing that inline here:
  var maskCanvas = document.getElementById("alt-mask");
  var context = maskCanvas.getContext("2d");
  
  var centerX = 433;
  var centerY = 455;
  var radius = 378;
    
  var imageObj = new Image();
  imageObj.onload = function() {
  
    var pattern = context.createPattern(imageObj, 'repeat');

    context.rect(0, 0, maskCanvas.width, maskCanvas.height);
    context.fillStyle = pattern;
    context.fill();
    
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = 'white';
    context.fill();
    
  };
  
  imageObj.src = 'views/globe/new/bgSides.jpg';

};

  
GlobeView.prototype.onBeforeVisible = function() {

  console.log("Globe view delegate on before visible");
  
  if ($("body").hasClass("safari")) {
    
    $(".world-panel").each(function(i) {
      
      $(this).css({ webkitTransform: "translate3d(300px,0,0px) rotateY(" + (15 * i) + "deg)" });
      
    });
     
  }
  
};


GlobeView.prototype.onVisible = function() {

  console.log("Globe view delegate on visible");
  
  setTimeout(function() {
    window.scrollTo(0, 1);
  }, 4500);
  
  dApplication.canDisplayExternalTraffic = true;
  
  this.maxEmitterRemoteViews = 50; // sweet spot is probbaly about... 50-100?
  this.maxEmitterLocalViews = 20; // sweet spot is probbaly about... 15-20?
  
  if ($("body").hasClass("ff-mobile")) {
    console.log("slower renderer, trimming emitter values");
    this.maxEmitterRemoteViews = 5; 
    this.maxEmitterLocalViews = 5;
  }

  $("#info").show();
  $("#moz-lockup").show();
    
};

GlobeView.prototype.onBeforeInvisible = function() {

  console.log("Globe view delegate on before invisible");

};

GlobeView.prototype.onInvisible = function() {

  console.log("Globe view delegate on invisible");

};

GlobeView.prototype.show = function() {

  console.log("Globe view delegate on show");

};

GlobeView.prototype.hide = function() {

  console.log("Globe view delegate on hide");

};



GlobeView.prototype.triggerSound = function(inEvent, inArgs) {

  var _self = this;
  
  var totalCurrentViews = document.querySelectorAll(".bloom:not(.remote)"); 
  var maxEmitterViews = this.maxEmitterLocalViews; 
  
        
  if (totalCurrentViews.length && totalCurrentViews.length > maxEmitterViews) {
    
    // OR should we just block like so?
    return;
    
  }
  
  
  if (DcUtil.isTouch()) {
    var x = inEvent.originalEvent.touches[0].pageX;
    var y = inEvent.originalEvent.touches[0].pageY;
    
    
    
  }
  else {
    var x = inEvent.pageX;
    var y = inEvent.pageY;
  }
    
  var xWithOffset = x - $("#bloomers").offset().left;
  
  this.drawBloom(xWithOffset, y, false);
  
  //console.log("plotting, x: " + x + " y: " + y);
    
    // double check out socket status: 
  if (! SocketTransport.socket) {
    
    SocketTransport.openNewSocketCx();
    
  }
  
  if (SocketTransport.isOpen) {  // fallback to http?
  
    var msg = '{ "clientID": "' + dApplication.clientID + '","type": "tone", "status": "ok", "message": "tone", "x": ' + x + ', "y": ' + y + ' }';
    
    SocketTransport.socket.send(msg);
    
  }
  
  
};


GlobeView.prototype.drawBloom = function(inX, inY, inIsRemote) {

  var _self = this;
  
  var bloomClass = "bloom local";
  if (inIsRemote) bloomClass += "bloom remote";
  
  // remove old elements if we race: 

  if (inIsRemote) {
    var totalCurrentViews = document.querySelectorAll(".bloom.remote");
    var maxEmitterViews = this.maxEmitterRemoteViews;  
  }
  else {
    var totalCurrentViews = document.querySelectorAll(".bloom:not(.remote)"); 
    var maxEmitterViews = this.maxEmitterLocalViews; 
  }
        
  if (totalCurrentViews.length && totalCurrentViews.length > maxEmitterViews) {
    
    // should we just block like so?
    return;
        
  }
  
  
  console.log("drawing bloom at: " + inX + " and " + inY);
  
  var tonePercent =  Math.round( 100 * (inY / $(window).height()) );
  
  // trigger sound
  if      (tonePercent < 20) { AudioTransport.playSound(6); }
  else if (tonePercent < 35) { AudioTransport.playSound(5); }
  else if (tonePercent < 50) { AudioTransport.playSound(4); }
  else if (tonePercent < 65) { AudioTransport.playSound(3); }
  else if (tonePercent < 80) { AudioTransport.playSound(2); }
  else                { AudioTransport.playSound(1); }
  
  
  // now append the bloom: 
  var bContainer = "#bloomers";
   
  var newBloom = document.createElement("div");
  newBloom.innerHTML = '<div class="side side-1"></div><div class="side side-2"></div><div class="side side-3"></div><div class="side side-4"></div><div class="side side-5"></div><div class="side side-6"></div>';
  newBloom.className = bloomClass ;
  newBloom.style.top = inY + "px";
  newBloom.style.left = inX + "px"; 


  $(newBloom).bind(dApplication.animationEnd, function(inEvent) { 
    if ($(inEvent.target).hasClass("bloom")) $(this).remove();
  });

  document.querySelector(bContainer).appendChild(newBloom);
  
  newBloom.className += " bloom-transform-in";

  if (_gaq) _gaq.push(['_trackEvent', 'globe', 'click', 'click globe']);
  
  
};

var floodCounter1 = 0;
var floodCounter2 = 0;
var floodCounter3 = 0;
var floodCounter4 = 0;
var floodCounter5 = 0;
GlobeView.prototype.startFlood = function() {

  var _self = this;
  
  floodCounter1 = setInterval(function() {
  
    var tone = Math.ceil(Math.random() * 6);
  
    _self.drawClientBloom(0, tone, "rgba(255,0,0)", true);
  
  }, 10);
  
  floodCounter2 = setInterval(function() {
  
    var tone = Math.ceil(Math.random() * 6);
  
    _self.drawClientBloom(0, tone, "rgba(255,0,0)", true);
  
  }, 20);
  
  floodCounter3 = setInterval(function() {
  
    var tone = Math.ceil(Math.random() * 6);
  
    _self.drawClientBloom(0, tone, "rgba(255,0,0)", true);
  
  }, 30);
  
  floodCounter4 = setInterval(function() {
  
    var tone = Math.ceil(Math.random() * 6);
  
    _self.drawClientBloom(0, tone, "rgba(255,0,0)", true);
  
  }, 40);
  
  floodCounter5 = setInterval(function() {
  
    var tone = Math.ceil(Math.random() * 6);
  
    _self.drawClientBloom(0, tone, "rgba(255,0,0)", true);
  
  }, 50);
    

};

GlobeView.prototype.stopFlood = function() {

  if (floodCounter1) {
    clearInterval(floodCounter1);
    floodCounter1 = 0;
  }
  
  if (floodCounter2) {
    clearInterval(floodCounter2);
    floodCounter2 = 0;
  }
  
  if (floodCounter3) {
    clearInterval(floodCounter3);
    floodCounter3 = 0;
  }
  
  if (floodCounter4) {
    clearInterval(floodCounter4);
    floodCounter4 = 0;
  }
  
  if (floodCounter5) {
    clearInterval(floodCounter5);
    floodCounter5 = 0;
  }

};


GlobeView.prototype.drawClientBloom = function(inX, inTone, inColor) {
  
  //  prevent "fake" client mode windows on desktop from rendering tones.
  if (! $("body").hasClass("kiosk") ) {
    return;
  }

  var _self = this;
  
  var bloomClass = "bloom remote";
  maxEmitterViews = 20;

  var totalCurrentViews = document.querySelectorAll(".bloom");        
  if (totalCurrentViews.length && totalCurrentViews.length > maxEmitterViews) {
    
    var dif = totalCurrentViews.length - maxEmitterViews;
    
    for (var x=0; x<dif; x++) {
      
      console.log("removing old element");
      totalCurrentViews[x].parentNode.removeChild(totalCurrentViews[x]);
      
    }

    
  }
  
  AudioTransport.playSound(inTone);
    
  // now append the bloom: 
  var bContainer = "#bloomers";
 
  var toneY = (7 - inTone) * 120;
  var toneX = Math.round(Math.random() * 400) + 100;
  
  var newBloom = document.createElement("div");
  newBloom.innerHTML = '<div class="side side-1"></div><div class="side side-2"></div><div class="side side-3"></div><div class="side side-4"></div><div class="side side-5"></div><div class="side side-6"></div>';
  newBloom.className = bloomClass ;
  newBloom.style.top = toneY + "px";
  newBloom.style.left = toneX + "px";
  $(newBloom).find(".side").css({background: inColor});

  $(newBloom).bind(dApplication.animationEnd, function(inEvent) { 
    if ($(inEvent.target).hasClass("bloom")) $(this).remove();
  });

  document.querySelector(bContainer).appendChild(newBloom);
  
  newBloom.className += " bloom-transform-in";
  
}

