/**
 * dclare 0.1
 * april, 2013
 * @author Aubrey Anderson
 * 
 * Copyright (c) 2013 Aubrey Anderson <http://aubreyanderson.com>
 * 
 * dclare is a simple, lightweight, way 
 * to do more with markup!
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var DclareApplication = function() {
  
  this.binder = new DclareDOMBinder(this);
  
  this.views = { };
  
  this.visibleViewKeys = ""; // a comma delim string of visible view keys, used for window.location.hash
  this.attributeBase = "data-d"; // override this in your application if you want a different "magic" attribute
  
  
  // common translation for transition and animation end events.  there's gotta be a better way!
  this.transitionEnd = PrefixFree.prefixProperty("transitionEnd", true);
  this.animationEnd = PrefixFree.prefixProperty("animationEnd", true);
    
  if (this.animationEnd.indexOf("oz") > -1) {
    
    // mozilla requires just "animationend"
    this.animationEnd = "animationend";
    this.transitionEnd = "transitionend";
      
  }
  else {
    
    this.animationEnd = this.animationEnd.charAt(0).toLowerCase() + this.animationEnd.slice(1);
    this.transitionEnd = this.transitionEnd.charAt(0).toLowerCase() + this.transitionEnd.slice(1);
    
  }

};


DclareApplication.prototype.start = function(inContainer) {
  
  var _self = this;
  
  //console.log("*********** START !!!!!!  ");
  
  if (inContainer) {
  
    if (typeof(inContainer) == "string") {
      this.domContainer = document.querySelector(inContainer);
    }
    else {
      this.domContainer = inContainer;
    }
    
  }
  else {
    
    // default to the first .dclare-container or body
    if (document.querySelector(".dclare-container")) {
      this.domContainer = document.querySelector(".dclare-container");  
    }
    else {
      this.domContainer = document.querySelector("body");  
    }
    
    
    
  }
  
  //console.log("application container set to:");
  //console.log(this.domContainer);
  
  
  // override initial views if we have something in the hash list
  // TBD we will want to indicate view in animation prefrerence there as well,
  if (window.location.hash.length) {
    
    var visibleViewKeys = window.location.hash.slice(1).split(",");
    
    $(visibleViewKeys).each(function() {
      
        _self.addView(this, true);
      
    });
      
  }
  else {
  
    this.binder.walk();

  }
  
  if (jQuery.migrateWarnings.length) {
    console.warn("we saw some jq migration warnings:");
    console.warn(jQuery.migrateWarnings);
  }
};



DclareApplication.prototype.addView = function(inViewKey, inShouldAnimateIn, inContainer, inShouldReplaceContainer, inCallback) {

  //console.log("adding new view: " + inViewKey);

  var _self = this;
  
  // instantiate and setup delegate if we can
  
  var delegateName = inViewKey.charAt(0).toUpperCase() + inViewKey.slice(1) + "View";
  var viewDelegate = null;
  if (window[delegateName]) {
    viewDelegate = new window[delegateName]();
  }
  else {
    console.warn(inViewKey + " has no associated view delagate, do you want to add a script tag?");
    console.warn("you'll need to create the " + delegateName + " view in the \"views\" folder and add the following");
    console.warn("to your page's HEAD tag");
    console.warn('<script src="views/'+inViewKey+'/delegate.js"></script>');
    console.warn('Here is some sample delegate code to get you going, paste this into views/'+inViewKey+'/delegate.js:');
    console.warn(delegateName + ' = function() {\n  this.key = "'+inViewKey+'";\n};\n\n'+delegateName+'.prototype.onVisible = function() {\n  //console.log("'+inViewKey+' view on before visible called!");\n};');
    
    //viewDelegate = this;
  
  }

  
  // TBD!  we need a simple convention for view keys
  // maybe it's just always the ID / query selector for the dom object?

  var newView = new DclareView(inViewKey, viewDelegate, this);
  
  if (inShouldReplaceContainer && inContainer) {
    newView.key = $(inContainer).attr("id");
    this.views[$(inContainer).attr("id")] = newView;
  }
  else {
    this.views[inViewKey] = newView;  
  }  
  
  
  // append the html and css
  // load the markup when we get the load callback from the CSS to avoid FOUC
  
  // TBD: test the HELL out of loadCSS
  // http://www.backalleycoder.com/2011/03/20/link-tag-css-stylesheet-load-event/
  
  
  // ALSO at the moment, we're wasting a lot of time expanding the keys in CSS, 
  // i bet we can just do it here and take the prefix-free listener out of the picure
  DcUtil.loadCSS("views/"+inViewKey+"/style.css", function() {
    
    //console.log("CSS IS LOADED");
  
    $.get("views/"+inViewKey+"/view.html", function(data) {
    
      
      // TBD
      // how to indicate that we want an alternate container
      // in the show view call, etc
      
      // data must start with a "<" as of jq 1.9, so strip all else: 
      if (data.indexOf("<") > 0) {
        data = data.substring(data.indexOf("<"), data.length);
        console.warn("HEY! removing content before the first tag in view: " + inViewKey);  
      }
      
      
      newView.domContainer = $(data);
      newView.domContainer.addClass("dc-invisible"); // do we need to do this?
      
      
      // VERY SIMPLE localization hooks
      // just hunting for data-d-localize="true" in the incoming block container
      // and swaping keys if / when we find them at the application level
      
      var region = "default";
      
      // TBD, look at app flag OR browser region to get "en-US" type fomat key
      // if dApplication.region
      // else get from browser localization
      // else region = "default"
    
      if (newView.domContainer.attr("data-d-localize")) {
      
        // we have a localizable view
        // go though hunting for data-d-localize-key="KEY" instances
        // look up KEY in dApplication.localStrings.region
        // and append the strings
        
        var localStr = dApplication.localStrings[region];
        
        //console.log("expanding content for localized view: " + inViewKey);
        //console.log("against localized strings");
        //console.log(localStr);
        
        $( newView.domContainer.find("[data-d-localize-key]") ).each(function() {
          
          //console.log("attempting to replace " + this);
          
          var key = $(this).attr("data-d-localize-key");
          var localVal = localStr[key];
          
          $(this).append(localVal);
          
        });
        
        
      }
      
      
      if (newView.delegate) newView.delegate.domContainer = newView.domContainer;
      
      if (inContainer && inShouldReplaceContainer) {
        
        //console.log("replacing container");
        
        var containerID = $(inContainer).attr("id");
        newView.domContainer.attr("id", containerID);
        
        $(inContainer).replaceWith(newView.domContainer);
        
        // bind any new declarative here
        var scopedQueryForView = "#"+containerID;
        
      }
      else if (inContainer) {
        //console.log("adding to custom container");
        $(inContainer).append(newView.domContainer);
      }
      else {
        //console.log("adding to default container");
        //console.log(_self.domContainer);
        
        $(_self.domContainer).append(newView.domContainer);
      
      }
      
      //_self.binder.walk(scopedQueryForView, newView.key);
      _self.binder.walk(newView.key);
      
      // and finally, we should be ready to deal with DOM things so
      // let our view controller know about that
      newView.onDOMReady();
      
      if (inShouldAnimateIn) {
        newView.show();
      }
      
      if (inCallback) {
        
        inCallback(newView);
        
      }
      
    });
    
    
  });
  
  
  /*
$("<link/>", {
     rel: "stylesheet",
     type: "text/css",
     href: "views/"+inViewKey+"/style.css"
  })
  .appendTo("head")
  .bind("load", function() {
  
    //console.log("CSS IS LOADED");
  
    $.get("views/"+inViewKey+"/view.html", function(data){
    
      
      // TBD
      // how to indicate that we want an alternate container
      // in the show view call, etc
    
      
      if (inContainer && inShouldReplaceContainer) {
        $(inContainer).replaceWith(data);
      }
      else if (inContainer) {
        $(inContainer).append(data);
      }
      else {
        $(_self.domContainer).append(data);
      }
      
      
      
      
      newView.domContainer = $("#"+newView.key);
      
      // bind any new declarative here
      var scopedQueryForView = "#"+newView.key;
      
      _self.binder.walk(scopedQueryForView, inViewKey);
      
      if (inShouldAnimateIn) {
        newView.show();
      }
      
    });
  
  
  })
*/
  
};


DclareApplication.prototype.removeView = function(inView) 
{

  //console.log("removing view: " + inView.key);
  
  this.views[inView.key] = null;
  
  inView.destroy();

};

DclareApplication.prototype.getView = function(inViewKey) {

  //console.log("finding view: " + inViewKey);
  
  
  if (this.views[inViewKey]) {
    return this.views[inViewKey];
  }
  else {
    
    console.error(inViewKey + " not found! did you reference a specific id?");
    
  }

};



DclareApplication.prototype.showView = function(inActionObject) 
{
  
  // show or load and show the view....

  // TBD: 
  // observe a flag for adding this view to the URL!!!


  if (this.views[inActionObject.key]) {

    this.views[inActionObject.key].show(inActionObject.params);  
    
  }
  else { // not loaded yet?  see if we can load it!
    
    //console.log(inActionObject.key + " not yet loaded, hold please, working on that....");
    
    this.addView(inActionObject.key, true);
  
    //this.throwError(inActionObject.key + " view not found, can't show!");
    
  }

};


var DclareView = function(inViewKey, inViewDelegate, inDApplication) {

  // TO DO
  // create empty default delegate when there is none specified
  if (inViewDelegate) { 
    this.delegate = inViewDelegate;
    this.delegate.controller = this;
  }
  
  
  this.key = inViewKey || "un-keyed-view";
  
  // do we need this?
  //this.domContainer = $("#"+this.key);
  
  this.isVisible = false;
  this.canAnimate = true;
  this.application = inDApplication;
  
  
  // TBD where is the ideal onCreate callback for delegates?
  // need to call only once, and after DOM elements are ready
  if (this.delegate && this.delegate.onCreate) this.delegate.onCreate();


};


DclareView.prototype.onDOMReady = function() {
    
  //console.log(this.key + "on DOM ready");
  
  if (this.delegate && this.delegate.onDOMReady) this.delegate.onDOMReady();
};
  
DclareView.prototype.onBeforeVisible = function() {
    
  //console.log(this.key + "on before visible");
  
  if (this.delegate && this.delegate.onBeforeVisible) this.delegate.onBeforeVisible();
};

  
DclareView.prototype.onVisible = function() {
    
  //console.log(this.key + " on visible");
  
  this.isVisible = true;
  
  if (this.delegate && this.delegate.onVisible) this.delegate.onVisible();
  
};

  
DclareView.prototype.onBeforeInvisible = function() {
    
  //console.log(this.key + " on before invisible");
  
  if (this.delegate && this.delegate.onBeforeInvisible) this.delegate.onBeforeInvisible();
  
};
  
DclareView.prototype.onInvisible = function() {
  
  //console.log(this.key + " on invisible");
  
  this.isVisible = false;
  
  if (this.delegate && this.delegate.onInvisible) this.delegate.onInvisible();
  
};
  
  
DclareView.prototype.show = function(inViewParams, inPreserveViewInURL) {
  
  var _self = this;
  
  //console.log(this);
  
  if (this.canAnimate) {
    
    this.canAnimate = false;
    
    //console.log(this.key + " show()");
    
    // set view params in delegate if we find them
    if (inViewParams && this.delegate) {
      this.delegate.params = inViewParams;
    }
    
    
    
    _self.onBeforeVisible();
    
    _self.domContainer.unbind(_self.application.animationEnd);
    this.domContainer.bind(_self.application.animationEnd, function(inEvent) {
      
      if (inEvent.target === _self.domContainer.get(0)) {
        
        // handle event here
        
        //console.log("container visible ANIMATION END!");
        _self.domContainer.unbind(_self.application.animationEnd);
        
        _self.domContainer.addClass("dc-visible");
        _self.domContainer.removeClass("dc-animate-in");
        _self.canAnimate = true;
        _self.onVisible();
        
      }
      
      
    });
    
    this.domContainer.addClass("dc-animate-in"); 
    this.domContainer.removeClass("dc-invisible");
    
    
    
    // if we have dclare-preserve flagged for this view
    // add #viewkey to the URL
    
    if (inPreserveViewInURL) {
      
      //console.log("CHECKING HASH ON SHOW: " + window.location.hash);    
      
      if (window.location.hash.length) {
      
        var visibleViewKeys = window.location.hash.slice(1).split(",");
      
        //if ($.inArray(this.key, visibleViewKeys) == -1) 
      
        // $.inArray() is failing here for some reason:
        
        var okToAdd = true;
        
        for (var i=0; i<visibleViewKeys.length; i++) {
          
          //console.log("comparing key |" + this.key + "| to |"+visibleViewKeys[i]+"|");
          if (this.key == visibleViewKeys[i]) {
            
            okToAdd = false;
            break;
          }
          
        }
        
        if (okToAdd) {
          visibleViewKeys.push(this.key);
        }
      
      
      }
      else {
        
        visibleViewKeys = [this.key];
      }
      
      window.location.hash = visibleViewKeys.toString();
      
    }
    
      
      
      
  }
  else { // this.canAnimate == false
      
    //console.log("blocking event, animation already in progress on this view");
      
  }
  
};


DclareView.prototype.hide = function(inViewParams) {
  
  var _self = this;
  
  if (this.canAnimate) {
    
    this.canAnimate = false;
  
  
    //console.log(this.key + " hide()");
    
    // set view params in delegate if we find them
    if (inViewParams) {
      this.delegate.params = inViewParams;
    }
    
    
    _self.onBeforeInvisible();
    
    _self.domContainer.unbind(_self.application.animationEnd);
    
    this.domContainer.bind(_self.application.animationEnd, function(inEvent) {
      
      if (inEvent.target === _self.domContainer.get(0)) {
        
        
        // handle event here
        _self.domContainer.addClass("dc-invisible");
          
        _self.domContainer.removeClass("dc-animate-out");
        _self.canAnimate = true;
        _self.onInvisible();
        
        //console.log("container invisible ANIMATION END!");
        _self.domContainer.unbind(_self.application.animationEnd);
        
        
        //console.log("*********** ANIMATION END FOR " + inEvent.target);
                
      }
      
    });
    
    this.domContainer.addClass("dc-animate-out");
    this.domContainer.removeClass("dc-visible");
    
    
    // remove #viewkey from the URL  
    // !TBD!
    
    /*
//console.log("REMOVING VIEW KEY FROM URL HASH");
    
    if (window.location.hash.length) {
    
      var visibleViewKeys = window.location.hash.slice(1).split(",");
            
      for (var i=0; i<visibleViewKeys.length; i++) {
        
        //console.log("comparing key |" + this.key + "| to |"+visibleViewKeys[i]+"|");
        if (this.key == visibleViewKeys[i]) {
          
          visibleViewKeys.splice(i, 1);
          break;
        }
        
      }

      window.location.hash = visibleViewKeys.toString();
    
    }
*/

  }
  else {
  
    //console.log("blocking event, animation already in progress on this view");
  
  }
  
};


DclareView.prototype.callFunction = function(inFunctionName, inArgs, inEvent) {
  
  // TBD: 
  // at the moment we are just supporting string args, comma delim
  // ultimately we should ALSO support {name: value, name, value} stye arg blocks 
  // from the markup
  
  if (this.delegate) {
    
    //console.log("we have a delegate, calling");
    ////console.log(inArgs);
        
    this.delegate[inFunctionName](inEvent, inArgs);
    
  }
  
};

DclareView.prototype.onBeforeDestroy = function() {
  
  // TBD: what cleanup do we want here at the controller level?
  if (this.delegate && this.delegate.onBeforeDestroy) {
    
    this.delegate.onBeforeDestroy();
    
  }
  
};

DclareView.prototype.destroy = function() {
  
  this.onBeforeDestroy();
  
  $(this.domContainer).remove();
  
};


var DclareDOMBinder = function(inDApplication) {
  
  var _self = this;
  var _dAppReference = inDApplication;
  
  this.walk = function(inViewKey) {
  
    if (inViewKey) {
      
      this.currentView = inViewKey;
      
    }
    else {
      
      this.currentView = false;
      
    }

    // !!!!
    // news flash, home slices!
    // dclare takes the data-d attribute name space, globally!

    // and yes, you can override it by implementing
    // _dAppReference.attributeBase
    // before app start()

    // look for declarative commands which haven't been bound and 
    // bind them (not like, one-ring style, this is a friendly thing, honest):
    var queryScope = "[" + _dAppReference.attributeBase + "]:not(.dc-bound)";

    //console.log("kicking off binder scoped to: " + queryScope);

    var selections = document.querySelectorAll(queryScope);

    //console.log("SELECTIONS");
    //console.log(selections);


    for (var q = selections.length-1; q > -1; q--) {

      var domObject = selections[q];

      //console.log("DOM OBJECT");
      //console.log(domObject);

      $(domObject).addClass("dc-bound");
      var att = $(domObject).attr("data-d");
      //console.log("processing dclare attr: " + att);

      // and just in case something crazy happened
      if (att) {

        _self.processAttribute(att, domObject);
      }
      else {

        console.error("something bad happened with your data-d attribute!");
        console.error("we selected an element which had it, and now that element doesn't have it.  here it is: ");
        console.error(domObject)

      }
    }
   
  };
  
  
  this.processAttribute = function(inAttributeString, inDOMObject) {

    //console.log("processing attr");
    //console.log(inAttributeString);
    //console.log(inDOMObject);

    /*
      parse the dclare string into bindings: 
      
      supported syntax: 

      data-d="(binding) keyword: params/args"
      data-d="(touchstart) addClass: classname / #selection"
      data-d="(touchstart) showView: viewname / arg1, arg2"

      ALSO NOTE that a data-d attribute can carry multiple commands
      demimited by the ";" character, so:

      data-d="(touchstart) showView: viewname / arg1, arg2; hideview: another"

      is valid. we process them in the order we find 'em which may matter in some cases

    */

    // first split the command string on ";" if it is present
    // there can be n number of commands in an attribute

    var commandStrings = inAttributeString.split(";");

    //console.log("command strings");
    //console.log(commandStrings);


    for (var i=0; i<commandStrings.length; i++) {


      // 1. split the command on :
      // 2. search left hand for ()
      // 3. look for keyword

      // TBD, can we convert this to one or two more efficient regexs or will that be as slow or slower?
      // e.g. indexOf appears to be about 2x faster than .match(): http://jsperf.com/regexp-vs-indexof
      // but we might be able to get a fancy regex here which will do all matching in one command
      // if only that crap didn't look like greek! ;-)

      var commandString = commandStrings[i].split(":");

      if (commandString.length && commandString.length > 1) {

        //console.log("processing command string");
        //console.log(commandString);

        var bindingString = commandString[0];
        var actionString = commandString[1];

        var actionObject = this.processAction(actionString, inDOMObject);

        this.processDclareDirective(bindingString, actionObject, inDOMObject, this.currentView);

      }
      else {
        this.throwError(inAttributeString, inDOMObject);
      }

    }

  };


  // dclare directives (at the moment anyway) are structured in this format: 
  // (special-instruction) thing-to-do: action-key / selector-or-params; with the ";" being optional if you only have one directive
  this.processDclareDirective = function(inDirectiveString, inActionObject, inDOMObject, inView) {
  
    //console.log("processing binding for: " + inDirectiveString);
    //console.log("in view instance: " + inView);
  
    var _self = this;
  
    if (inDirectiveString.length > 1) {
      
      var eventString = "click"; 
      var castStart = inDirectiveString.indexOf("(") + 1;
      var castEnd = inDirectiveString.indexOf(")");
      var action = inDirectiveString;
 
      // override to bind to specific event if we have one specified
      if ( castStart > -1 && castEnd > -1 ) {
        
        eventString = inDirectiveString.substring(castStart, castEnd);
        //console.log("overriding event string to: " + eventString);
        
        action = inDirectiveString.slice(castEnd+1);
      
      }
      
      // save the action into our actionObject
      inActionObject.action = DcUtil.stripWhiteSpace(action); // paranoia?
      //console.log("ACTION IS: |" + inActionObject.action + "|");


      // process non-bind actions (e.g. view expansion)
      if (inActionObject.action.toLowerCase() == "view") {
      
	  	  //console.log("*** Expanding view: " + inActionObject.key);
	  	
	  	  // check that the view isn't already loaded... bit of a hack here	    
	  	  //if (! $("#"+inActionObject.key).length) {
  	  	
  	  	  if (inActionObject.params && inActionObject.params[0] == "animate") {
    	  	  _dAppReference.addView(inActionObject.key, true, inDOMObject, true); 
    	  	} 
    	  	else {
    		    _dAppReference.addView(inActionObject.key, false, inDOMObject, true); 	
    	  	}
	  	  
	  	  //}
	  	  //else {
  	  	  
  	  	//  console.warn("attempting to process \"view\" directive, but already have the view loaded.");
  	  	//  console.warn("maybe double check this behavior is correct?");
  	  	//  console.warn("this can also happen if you are pre-loading views with a hash in the URL (e.g. #someview)");
  	  	  
	  	  //}
      
      }
      
      else { // bind to event	      
	  
  	  	// TBD: how to support UNBIND?
  	  	
  	  	// do some slight reality checking for touch devices: 
  	  	
  	  	if (DcUtil.isTouch()) {
    	  	
    	  	//console.log("we have a touch device!");
    	  	
  	  	}
  	  	else {
    	  	
    	  	if (eventString == "touchstart") {
      	  	
      	  	eventString = "mousedown";
      	  	
    	  	}
    	  	
    	  	// TBD add the rest!
    	  	
  	  	}
  	  	
  	  	
  	  	//console.log("!!!!!!!ATTEMPTING TO BIND EVENT");
  	  	//console.log(inView);
  	    $(inDOMObject).bind(eventString, function(inEvent) {
  	        
  	      // TBD: do we want to have params to preserve the bubble?
  	      inEvent.preventDefault();
  	      inEvent.stopPropagation();
  	      
  	      
  	      
  	      _self.handleBoundAction(inEvent, inActionObject, inDOMObject, inView);
  	          
  	    });    
      
      }
      
    }
    
    else {
      this.throwError(inDirectiveString, inDOMObject);
    }
  
  
  };
  
  this.processAction = function(inActionString, inDOMObject) {
  
    if (inActionString.length > 1) {
      
      var keyVals = inActionString.split("/");
      
      if(keyVals.length > 1) { // we have attribues to parse
        
        keyVals[1] = keyVals[1].split(",");
        
        // clean up for attribues, can contain any amount of white space
        for ( var i = 0; i < keyVals[1].length; i++ ) {
          keyVals[1][i] = DcUtil.stripWhiteSpace(keyVals[1][i]); 
        }
        
        
      }
      
      
      var ret = {

        key:  DcUtil.stripWhiteSpace(keyVals[0]),
        params: keyVals[1]
      };
      
      //console.log(ret);
      
      return(ret);
      
    }
    
    else {
    
      this.throwError(inActionString, inDOMObject);
      return({
        key: "none",
        params: []
      });
    
    }
    
  };
  
  this.handleBoundAction = function(inEvent, inActionObject, inOriginalDOMObject, inViewKey) {
  
    //console.log("DClare firing event for view " + inViewKey);
    //console.log(inActionObject);
    
    if (inActionObject.action.toLowerCase() == "call") {
      //console.log("triggering function CALL in delegate");
      
      if (inViewKey) {
        
        //console.log("We HAVE a view key, calling " + inActionObject.key);
        //console.log("CURRENT VIEW IS: " + inViewKey);
        
        _dAppReference.views[inViewKey].callFunction(inActionObject.key, inActionObject.params, inEvent);
        
      }
      else {
        
        //console.log("attempting to call function " + inActionObject.key + " in delegate, but no current view found");
        //console.log("trying the call in the application scope");
        
        
        if ( typeof(_dAppReference[inActionObject.key]) == "function")
        {
          
          _dAppReference[inActionObject.key]( inActionObject.params, inEvent );

        }
        else 
        {
          
          console.warn("exhausted tree looking for a function called " + inActionObject.key);
          
        }
        
      }
      
    }
    
    else if (inActionObject.action.toLowerCase() == "addclass") {
      //console.log("triggering addClass");
      
      // key is the class name
      // values are the selector(s)
      var selector = inActionObject.params + "";
      $(selector).addClass(inActionObject.key);
      
    }
    
    else if (inActionObject.action.toLowerCase() == "removeclass") {
      //console.log("triggering removeClass");
      
      var selector = inActionObject.params + "";
      $(selector).removeClass(inActionObject.key);
      
    }
    
    else if (inActionObject.action.toLowerCase() == "toggleclass") {
      //console.log("triggering toggleClass");
      
      var selector = inActionObject.params + "";
      $(selector).toggleClass(inActionObject.key);
      
    }
    
    // emit: [view name] / [how many], [position, e.g. "event"], [container, e.g. a CSS query selector or the keywork "target" meaning the event target, otherwise we'll just add to app container]
    //
    // TBD: support event location offset to container offset with param?
    
    else if (inActionObject.action.toLowerCase() == "emit") {
      
      //console.log("triggering EMIT");
      
      var viewsToEmit = 1;
      var maxEmitterViews = 0;
      var container = false;
      if (inActionObject.params[0]) {
        
        // param 1 can be a number or a range
        // when a range, e.g. 1-10 the minimum and maximum number 
        // of emitter elements is represented
        // in the above case, the 11th element will delete the 1st
        
        // you can also override the default emitter removal selector (just its class)
        // with a special selector in the params[3] slot 
        
        
        if (inActionObject.params[0].indexOf("-") > -1) {
          
          //console.log("emitter has an object range!");
          var emitRange = inActionObject.params[0].split("-");
          viewsToEmit = parseInt(emitRange[0]);
          maxEmitterViews = parseInt(emitRange[1]);
          
        }
        else {
          
          viewsToEmit = parseInt(inActionObject.params[0]);
          
        }
        
        
      }
      
      if (inActionObject.params[2]) {
        
        if (inActionObject.params[2] == "target") {
          container = inEvent.target;
        }
        else {
          container = document.querySelector(inActionObject.params[2]);
        }
        

      }
      else {
        container = document.querySelector(".dclare-container");
      }
      
      //console.log("********** generating " + viewsToEmit + " " + inActionObject.key + " views");
      for (var i = 0; i < viewsToEmit; i++) {
        
        if (maxEmitterViews) {
          
          if (inActionObject.params[3]) {
        
            var totalCurrentViews = document.querySelectorAll(inActionObject.params[3]);
          
          }
          else {
          
            var totalCurrentViews = document.querySelectorAll("."+inActionObject.key); 
          
          }
          
          
          if (totalCurrentViews.length && totalCurrentViews.length > maxEmitterViews) {
            
            var dif = totalCurrentViews.length - maxEmitterViews;
            
            for (var x=0; x<dif; x++) {
              
              //console.log("removing");
              
              totalCurrentViews[x].parentNode.removeChild(totalCurrentViews[x]);
              
            }
             
          }

          
        } // end if (maxEmitterViews)
        
        
        
      
        _dAppReference.addView(inActionObject.key, false, container, false, function(inView) {
          
          // handle specific generator params for view location, etc.
          if (inActionObject.params[1]) {
            
            if (inActionObject.params[1] == "event") { // locate the new view to the event location
              
              //console.log("matching emit location to event location");
              //console.log(inEvent)
              
              
              if (DcUtil.isTouch()) {
              
                var containerX = $(container).position().left;
                var containerY = $(container).position().top;
               
                var x = inEvent.originalEvent.touches[0].pageX - containerX;
                var y = inEvent.originalEvent.touches[0].pageY - containerY;
                
                //console.log("*** have we tracked container? " + containerX + " " + containerY);
                //console.log("*** FINAL " + x + " " + y);
                
                  
              }
              else {
                var containerX = $(container).position().left;
                var containerY = $(container).position().top;
                var x = inEvent.pageX - containerX;
                var y = inEvent.pageY - containerY;
                
                //console.log("*** have we tracked container? " + containerX + " " + containerY);
                //console.log("*** FINAL " + x + " " + y);
                
              }
              
              
              $(inView.domContainer).css({ left: x, top: y });
              
              inView.show();
              
            }
            
          }
          

          
          
        });
           
        
        
          
      }
      
      
    }
    
    // TBD: handle destroy which calls the objects cleanup method
    
    else if (inActionObject.action.toLowerCase() == "showview") {
      //console.log("triggering showView");
      
      _dAppReference.showView( inActionObject );
      
    }
    else if (inActionObject.action.toLowerCase() == "hideview") {
      //console.log("triggering hideView for " + inActionObject.key);
      
      if (_dAppReference.views[inActionObject.key]) {
      
        _dAppReference.views[inActionObject.key].hide(inActionObject.params);  
        
      }
      else {
      
        this.throwError(inActionObject.key + " view not found, can't hide! did you maybe not specify the view key as the element ID?");
        
      }
      
    }
    else if (inActionObject.action.toLowerCase() == "toggleview") {
      //console.log("triggering toggleView");
      
      if (_dAppReference.views[inActionObject.key]) {
      
        if ( _dAppReference.views[inActionObject.key].isVisible) {
          
          _dAppReference.views[inActionObject.key].hide(inActionObject.params);
          
        }
        else {
        
          _dAppReference.views[inActionObject.key].show(inActionObject.params);  
          
        }
          
        
      }
      else {
      
        //console.log(inActionObject.key + " view not found attempting to toggle");
        //console.log(inActionObject.key + " probably not yet loaded, hold please, working on that....");
        
        _dAppReference.addView(inActionObject.key, true);
        
      }
      
    }
    
    
  
  
  };
  
  
  this.throwError = function(inErrorString, inDOMObject) {
  
    console.warn("ERROR, Skipped DClare string was:");
    console.warn(inErrorString);
    if (inDOMObject) console.warn(inDOMObject);
    
  };
  
};


var DcUtil = 
{
  
  stripWhiteSpace: function(inString) {
    
    return jQuery.trim(inString);
    
  },
  
  isTouch: function() {
    return !!('ontouchstart' in window) || !!('onmsgesturechange' in window); // ie10 fallback
  },
  
  // or, var supportsTouch = 'ontouchstart' in window || 'onmsgesturechange' in window;
  
  
  // we run into this snag where some browsers don't support a load event for <link>
  // other option would just be to inject the css via ajax, but then we lose the expando
  // action from prefix-free...  what to do....
  
  cssCache: [],
  
  loadCSS: function(url, callback) {
    
    if (DcUtil.cssCache.indexOf(url) < 0) {
      
      //console.log(url + " not found in local cache, loading");
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;

      document.getElementsByTagName('head')[0].appendChild(link);
      DcUtil.cssCache.push(url);
      
      var img = document.createElement('img');
      
      img.onerror = function() {
        if(callback) callback();
      }
      
      img.src = url;
      
    }
    else {
      
      //console.log(url + " FOUND, calling back");
      if(callback) callback();
      
    }
    
  }
  
};