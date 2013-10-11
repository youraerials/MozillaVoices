

SimpletonesView = function() {

  console.log("creating simpletones view");

  this.key = "simpletones";
  this.controller = false;
  this.domContainer = false;
  
};

SimpletonesView.prototype.onDOMReady = function() {

  console.log("simpletones view delegate on DOM Ready");
  
  var _self = this;
  
  
  var rVal = 0 + Math.round(Math.random() * 150);
  var gVal = 0 + Math.round(Math.random() * 150);
  //var bVal = 50 + Math.round(Math.random() * 150);
  var bVal = 0 + Math.round(Math.random() * 150);
  
  dApplication.colorTone = "rgb("+rVal+","+gVal+","+bVal+")";
  
  $("#simple-tones").css({ background: dApplication.colorTone });
  
  
  $(".tone-bar")
    .bind("touchstart", function() {
      
      $(this).addClass("actv");
      
    })
    .bind("touchend", function() {
      
      $(this).removeClass("actv");
      
    });
  
    this.updateBars();
    var _self = this;
    $(window).bind('orientationchange', function() {
    
      _self.updateBars();
    
    });
    
};

SimpletonesView.prototype.updateBars = function() {

  var viewHeight = $(window).height();
  var barHeight = Math.ceil(viewHeight/6);
  
  $(".tone-bar").each(function(i) {
    
    
    $(this).css({
      position: "absolute",
      top: (barHeight * i),
      left: 0,
      height: barHeight      
    });
    
  });

};


SimpletonesView.prototype.onVisible = function() {
  
  setTimeout(function() {
    window.scrollTo(0, 1);
  }, 2500);
    
};

SimpletonesView.prototype.triggerSound = function(inEvent, inArgs) {

  var _self = this;
  
  var note = 1;
  
  if ( $(inEvent.target).hasClass("gen-tone-1") ) {
     note = 6;
  }
  else if ( $(inEvent.target).hasClass("gen-tone-2") ) {
     note = 5;
  }
  else if ( $(inEvent.target).hasClass("gen-tone-3") ) {
     note = 4;
  }
  else if ( $(inEvent.target).hasClass("gen-tone-4") ) {
     note = 3;
  }
  else if ( $(inEvent.target).hasClass("gen-tone-5") ) {
     note = 2;
  }
  else if ( $(inEvent.target).hasClass("gen-tone-6") ) {
     note = 1;
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

  var msg = '{ "clientID": "' + dApplication.clientID + '","type": "client-tone", "status": "ok", "message": "client-tone", "x": ' + x + ', "note": ' + note + ', "color": "'+dApplication.colorTone+'" }';
  
  
  if (SocketTransport.isOpen) {
  
    SocketTransport.socket.send(msg);
    
  }
  else {
    
    $.get(dApplication.fallbackServer+"/tone?msg="+msg, function(response) {
      
      console.log("BACK FROM GET");
      console.log(response);
      
    });
    
  }
  

};


