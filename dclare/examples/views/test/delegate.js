
TestView = function() {
  this.key = "test";
};


TestView.prototype.onDOMReady = function() {

  console.log("test view on DOM READY");

};

  
TestView.prototype.onBeforeVisible = function() {

  console.log("test view on before visible");

};

TestView.prototype.onVisible = function() {

  console.log("test view on visible");

};

TestView.prototype.onBeforeInvisible = function() {

  console.log("test view on before invisible");

};

TestView.prototype.onInvisible = function() {

  console.log("test view on invisible");

};

TestView.prototype.show = function() {

  console.log("test view on show");

};

TestView.prototype.hide = function() {

  console.log("test view on hide");

};










