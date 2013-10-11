
TemplateView = function() {

  console.log("creating Template view, you should not see this twice!");

  this.key = "template";
  this.controller = false;
  this.domContainer = false;
  
};

TemplateView.prototype.onCreate = function() {

  console.log("Template view CREATED");

};

TemplateView.prototype.onDOMReady = function() {

  console.log("Template view DOM READY");
  
  // Put your dom bindings and other one-off things here!

};

TemplateView.prototype.onBeforeVisible = function() {

  console.log("Template view delegate onBeforeVisible() called");
  
};

TemplateView.prototype.onVisible = function() {

  console.log("Template view delegate onVisible() called");

};

TemplateView.prototype.onBeforeInvisible = function() {

  console.log("Template view delegate onBeforeInvisible() called");

};

TemplateView.prototype.onInvisible = function() {

  console.log("Template view delegate onInvisible() called");

};

TemplateView.prototype.show = function() {

  console.log("Template view delegate show() called");

};

TemplateView.prototype.hide = function() {

  console.log("Template view delegate hide() called");

};

