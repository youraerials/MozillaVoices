var dApplication;

$(function() {

  // some strong-arming for platform quirks.
  var navi = navigator.userAgent.toLowerCase();  
  if (navi.indexOf("android") > -1) { $("body").addClass("android"); }
  if (navi.indexOf("firefox") > -1 && navi.indexOf("android") > -1) { $("body").addClass("ff"); }
  if (navi.indexOf("safari") > -1 && navi.indexOf("chrome") == -1) { $("body").addClass("safari"); }
  
  dApplication = new DclareApplication("Next Billion Voices");
  
  dApplication.start();
  
  dApplication.socketServer = "ws://toneserver.bunnyandboar.com";
  dApplication.fallbackServer = "http://mozillavoices.com";
  
  dApplication.canDisplayExternalTraffic = false;
  dApplication.clientCount = 0;

  
  // switches for KIOSK + Client support
  var forceClient = (window.location.search.indexOf("forceclient") > 0) ? true : false;
  
  if (navi.indexOf("mobile") > -1 || forceClient) {
    $("body").addClass("client");
    dApplication.canDisplayExternalTraffic = false; // turn off incoming sounds....
  }
  else {
    $("body").addClass("kiosk");
  }
  
  
    
  // for localization support
  // just add the strings you need to dApplication.localStrings
  // be sure you have a "default" block to fall back on!
  dApplication.localStrings = {
  
    "default": {
    
      title: "",
      footer1: "Portions of this content are &copy;1998-2013",
      footer2: "by individual mozilla.org contributors. Content available under a Creative Commons license.",
      textNext: "",
      textBillion: "Mozilla",
      textVoices: "Voices",
      copy1: "Together we are building the Internet that the world needs and deserves.",
      copy2: "Hear what it sounds like when a global community works together for a common cause.",
      
      copy10: "In the coming years, a billion new voices will come online.",
      copy20: "They'll join the ongoing conversation in new ways and from new places",
      copy3: "And participate thanks to the common language of the Web.",
      copy4: "To join in, touch the screen or click to add your mark.",
      copy5: "You'll be able to watch as others do the same around the world.",
      copy6: "See how the power of mobile can connect us all.",
      infoVoices: "VOICES",
      infoConnectedNow: "connected now",
      infoMostVocal: "Most Vocal Regions",
      infoInfoHeader: "What is this?",
      infoInfoCopy: "Mozilla is a global community with a common cause: to build the Internet that the world needs and deserves.  An Internet that serves the individual above all else. Only Mozilla can, and will, do this.  We are champions of a Web where people can know more, do more, and do better.<p>To see how you've helped build this Web, go to mozillavoices.com with a desktop browser.  Your contributions will be in the same color as the colors on your mobile browser."
    }
  
  };
  
  
  var region = "default";
  var localStr = dApplication.localStrings[region];
  
  // run some top-level localization to populate anyting we might have loaded with us in index.html
  $("[data-d-localize-key]").each(function() {
          
    console.log("attempting to replace " + this);
          
    var key = $(this).attr("data-d-localize-key");
    var localVal = localStr[key];
    
    $(this).append(localVal);
    
  });
  
    
  $("#loader-stage").bind("touchmove", function(inEvent) {
    
    inEvent.preventDefault();
    inEvent.stopPropagation();

  });
  
  
  $(".no-touchmove").live("touchmove", function(inEvent) {
    
    inEvent.preventDefault();
    //inEvent.stopPropagation();

  });
  
  
  // "KIOSK" mode logistics  
  if (window.location.search.indexOf("kiosk") > 0) {
        
    dApplication.clientID = "kiosk";
    $("body").addClass("kiosk");
    
  }
  else {
    
    dApplication.clientID = NBVUtil.generateID();
  
  }

  // delaying init for socket and web audio, mobile likes this
  setTimeout(function() {
  
    // see if we can kick off web audio!
    AudioTransport.initWebAudio();

    // ok, we should be up and running, open the socket
    SocketTransport.openNewSocketCx();
  
  }, 1200);
  
  
}); // you're all clear, kid, now let's blow this thing and go home!




var SocketTransport = {

  socket: false,
  isOpen: false,
  openNewSocketCx: function() {
        
    //open.disabled = true;
    try {
      SocketTransport.socket = new WebSocket(dApplication.socketServer, "tone-protocol");
    }
    catch(er) {
      
      console.log("can't create socket, looks like we are offline :-/");
      
      SocketTransport.socket = false;
    }
    
    
    var nav = navigator.userAgent.toLowerCase();
    var clientType = (nav.indexOf("mobile") > -1) ? "client" : "kiosk";
    
    if (SocketTransport.socket) {
      
      SocketTransport.socket.addEventListener("open", function(event) {
      
        SocketTransport.isOpen = true;
        
        $("#status").empty().append("Connected");
        
        // say hi to the server!
        var msg = '{ "clientID": "' + dApplication.clientID + '", "clientType":"'+clientType+'", "type": "hello", "status": "ok", "message": "hello", "x": 0, "y": 0 }';
        SocketTransport.socket.send(msg);
        
      });
  
  
      //! Handle messages received from the server
      // we don't / can't know when these will come in, so we just play defense
      // note that the messages coming in are USUALLY answers to calls we have 
      // made to the server, but not always, sometimes the server will just push us info
      // 
      // because the websocket api is all async, the handler and requestor are decoupled
      // making the code a lot harder to read and understand.  let's consider fixing this 
      // at some point, super friends! (yes, i know it's 'by design')
      //
      SocketTransport.socket.addEventListener("message", function(event) {
        //message.textContent = "Server Says: " + event.data;
        
        var returnMessage = $.parseJSON(event.data);
        SocketTransport.processMessage(returnMessage);
        
      });
  
      // check for / handle errors 
      SocketTransport.socket.addEventListener("error", function(event) {
        //message.textContent = "Error: " + event;
        //$("#status").empty().append("Error - " + event);
        console.log("there was a socket error: ");
        console.log(event)
        
        SocketTransport.isOpen = false;
        
      });
  
      SocketTransport.socket.addEventListener("close", function(event) {
        SocketTransport.socket = false;
        SocketTransport.isOpen = false;
        $("#status").empty().append("Not Connected");
        
      });
    
    } // end if SocketTransport.socket sanity check
    
  },
  
  // we have received a socket message, let's have a look at it...
  // inMessage.type is the "opcode" here, such as it is
  processMessage: function(inMessage) {
  
    // a sound!  someone has played a sound, let's play it, too  
    if ( inMessage.type == "tone" &&
         dApplication.canDisplayExternalTraffic &&   
         inMessage.clientID != dApplication.clientID ) {
    
      dApplication.getView("globe").delegate.drawBloom(inMessage.x, inMessage.y, true);
      
    }
    
    else if ( inMessage.type == "client-tone" &&
         dApplication.canDisplayExternalTraffic &&   
         inMessage.clientID != dApplication.clientID ) {
    
      console.log(inMessage)
    
      dApplication.getView("globe").delegate.drawClientBloom(inMessage.x, inMessage.note, inMessage.color);
      
    }
    
    
    
    // the user would like update us about how many current users there are
    else if (inMessage.type == "usercount") {
      
      console.log("user count received!");
      console.log(inMessage);
     
      $("#user-count").empty().append(
        NBVUtil.numForm(inMessage.payload)
      );
      
    }
    
    
    // the server is politely telling us how many tones have been played so far
    else if (inMessage.type == "tonecount") {
      
      console.log("tonecount received!");
      console.log(inMessage);
      
      $("#voice-count").empty().append( NBVUtil.numForm(inMessage.count) );
       
    }
    
    
    // a return message structure with all application statistics in one handy package
    else if (inMessage.type == "appstats") {
      
      //console.log("appstats received!");
      //console.log(inMessage);
      
      // TBD count countries, etc
      
      $("#most-active-city").empty().append(inMessage.stats[0].city);
      
      $("#country-scroller")
        .empty()
        .css({ width: ((inMessage.stats.length) * 220) });
      
      var foundCountries = new Array(); // backpeddaling here so we don't have to change 
                                        // the server query.  we should fix it there when 
                                        // not on cray cray deadline
      
      $(inMessage.stats).each(function(inCount) {
        
        if ( foundCountries.indexOf(this.country_name) > -1 ) {
          
          console.log("COUNTRY already displayed");
          
        }
        else {
                  
          foundCountries.push(this.country_name);
          
          if (this.city.length < 2) {
            this.city = "";
          }
          else {
            //this.city = "(" + this.city + ")";
            this.city = ""; // we're suppressing the city for now....
          }
               
          $("#country-scroller").append("<div class='country-block'><div class='country-image' style='background-image: url(views/info/images/countries/" + NBVUtil.countryImageMap[this.country_code] + ");'></div><div class='country-info'>" + this.country_name + "</div></div>");
  
        }
        
      });
      
      $("#country-scroller").css({ width: ((foundCountries.length) * 220) });
      
      
    }
    
    
    // a client has come on or dropped off, let's update our count
    else if (inMessage.type == "clientcount") {
      
      dApplication.clientCount = inMessage.clients;
      $(".client-dot.real").remove();
      
      var container = $("#app-client-counter");
      for (var n=0; n<dApplication.clientCount; n++){
        container.append("<span class='client-dot real'>");
      }
      
    }
    
    
  }, // end incoming socket message handler
  
  
  // ping the server and ask how many recorded tones we have
  getToneCount: function() {
    
    console.log("getting tone count, socket status: " + SocketTransport.isOpen);
    
    if (SocketTransport.isOpen) {      
       
       var msg = '{ "clientID": "' + dApplication.clientID + '","type": "tonecount", "status": "ok", "message": "tonecount", "x": 0, "y": 0 }';
       
        SocketTransport.socket.send(msg); 
       
    }
    
    
  },
  
  
  // utility call for general app stats to fill the info box
  getAppStats: function() {
    
    if (SocketTransport.isOpen) {      
       
       var msg = '{ "clientID": "' + dApplication.clientID + '","type": "appstats", "status": "ok", "message": "appstats", "x": 0, "y": 0 }';
       
        SocketTransport.socket.send(msg); 
       
    }
    
  },


  // how many people are on this ride, anyway?
  getUserCount: function() {
      
    if (SocketTransport.isOpen) {      
       
       var msg = '{ "clientID": "' + dApplication.clientID + '","type": "usercount", "status": "ok", "message": "usercount", "x": 0, "y": 0 }';
       
        SocketTransport.socket.send(msg); 
       
    }
    
  },
  
  
  ccLookup: function() {

    if (SocketTransport.isOpen) {
  
      var ip = NBVUtil.generateRandomIPAddress();
      
      var msg = '{ "clientID": "' + dApplication.clientID + '","type": "countrycode", "status": "ok", "message": "'+ip+'", "x": 0, "y": 0 }';
       
      SocketTransport.socket.send(msg); 
   
    }
    
  }
  
};


var NBVUtil = {
  
  // !TBD: format numbers with . for other countries
  numForm: function(inNum) {
    inNum += "";
    return inNum.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
  },
  
  generateID: function() {
  
    // always start with a letter (for DOM friendlyness)
    var idstr=String.fromCharCode(Math.floor((Math.random()*25)+65));
    do {                
        // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
        var ascicode=Math.floor((Math.random()*42)+48);
        if (ascicode<58 || ascicode>64){
            // exclude all chars between : (58) and @ (64)
            idstr+=String.fromCharCode(ascicode);    
        }                
    } while (idstr.length<5);

    return (idstr + new Date().getTime());
  
  },
  
  generateRandomIPAddress: function() {
  
    var ip1 = Math.round(Math.random() * 255);
    var ip2 = Math.floor(Math.random() * 256);
    var ip3 = Math.round(Math.random() * 255);
    var ip4 = Math.round(Math.random() * 255);
    
    return "5." + ip2 + ".128." + ip4;
    //return "202.62.118." + ip4;
    //return "2.148.0." + ip4;
    
  },
  
  missedMatches: [ 'Antigua_and_Barbuda.png',
    'Austrialia.png',
    'Bahamas.png',
    'Bonaire.png',
    'Burundia.png',
    'Canary_Islands.png',
    'Cote_dIvoire.png',
    'Curaçao.png',
    'Czechia.png',
    'Democratic_Republic_of_the_Congo.png',
    'Dijbouti.png',
    'Equitorial_Guinea.png',
    'Jamacia.png',
    'Laos.png',
    'Macedonia.png',
    'Madeira.png',
    'Moldovia.png',
    'Montenegro.png',
    'Montserrat.png',
    'Nigera.png',
    'North_Korea.png',
    'Republic_of_the_Congo.png',
    'Reunion.png',
    'Rwanada.png',
    'Saba.png',
    'Saint_Barthelemy.png',
    'Saint_Kitts_and_Nevis.png',
    'Saint_Pierre_Miquelon.png',
    'Saint_Vinvent_and_the_Grenadines.png',
    'Sao_Tome_and_Principe.png',
    'Serbia.png',
    'Sint_Eustratius.png',
    'Sint_Maarten.png',
    'South_Sudan.png',
    'Tahiti_and_Moorea_Islands.png',
    'Trinidad_and_Tobago.png',
    'Turks_and_Caicos_Islands.png',
    'Vietnam.png' 
  ],
  
  countryCodes: {
    "AD":"Andorra", "AE":"United Arab Emirates", "AF":"Afghanistan", "AG":"Antigua &amp; Barbuda", 
    "AI":"Anguilla", "AL":"Albania", "AM":"Armenia", "AN":"Netherlands Antilles", "AO":"Angola", 
    "AQ":"Antarctica", "AR":"Argentina", "AS":"American Samoa", "AT":"Austria", "AU":"Australia", 
    "AW":"Aruba", "AZ":"Azerbaijan", "BA":"Bosnia and Herzegovina", "BB":"Barbados", "BD":"Bangladesh", 
    "BE":"Belgium", "BF":"Burkina Faso", "BG":"Bulgaria", "BH":"Bahrain", "BI":"Burundi", "BJ":"Benin", 
    "BM":"Bermuda", "BN":"Brunei Darussalam", "BO":"Bolivia", "BR":"Brazil", "BS":"Bahama", "BT":"Bhutan", 
    "BU":"Burma", "BV":"Bouvet Island", "BW":"Botswana", "BY":"Belarus", "BZ":"Belize", "CA":"Canada", 
    "CC":"Cocos (Keeling) Islands", "CF":"Central African Republic", "CG":"Congo", "CH":"Switzerland", 
    "CI":"Côte D'ivoire", "CK":"Cook Iislands", "CL":"Chile", "CM":"Cameroon", "CN":"China", "CO":"Colombia", 
    "CR":"Costa Rica", "CS":"Czechoslovakia", "CU":"Cuba", "CV":"Cape Verde", "CX":"Christmas Island", 
    "CY":"Cyprus", "CZ":"Czech Republic", "DD":"Germany", "DE":"Germany", "DJ":"Djibouti", "DK":"Denmark", 
    "DM":"Dominica", "DO":"Dominican Republic", "DZ":"Algeria", "EC":"Ecuador", "EE":"Estonia", "EG":"Egypt", 
    "EH":"Western Sahara", "ER":"Eritrea", "ES":"Spain", "ET":"Ethiopia", "FI":"Finland", "FJ":"Fiji", 
    "FK":"Falkland Islands", "FM":"Micronesia", "FO":"Faroe Islands", "FR":"France", "FX":"France,Metropolitan", 
    "GA":"Gabon", "GB":"United Kingdom", "GD":"Grenada", "GE":"Georgia", "GF":"French Guiana", "GH":"Ghana", 
    "GI":"Gibraltar", "GL":"Greenland", "GM":"Gambia", "GN":"Guinea", "GP":"Guadeloupe", "GQ":"Equatorial Guinea",
    "GR":"Greece", "GS":"South Georgia and the South Sandwich Islands", "GT":"Guatemala", "GU":"Guam", 
    "GW":"Guinea-Bissau", "GY":"Guyana", "HK":"Hong Kong", "HM":"Heard &amp; McDonald Islands", "HN":"Honduras", 
    "HR":"Croatia", "HT":"Haiti", "HU":"Hungary", "ID":"Indonesia", "IE":"Ireland", "IL":"Israel", "IN":"India", 
    "IO":"British Indian Ocean Territory", "IQ":"Iraq", "IR":"Islamic Republic of Iran", "IS":"Iceland", 
    "IT":"Italy", "JM":"Jamaica", "JO":"Jordan", "JP":"Japan", "KE":"Kenya", "KG":"Kyrgyzstan", "KH":"Cambodia", 
    "KI":"Kiribati", "KM":"Comoros", "KN":"St. Kitts and Nevis", "KP":"Democratic People's Republic of Korea", 
    "KR":"South Korea", "KW":"Kuwait", "KY":"Cayman Islands", "KZ":"Kazakhstan", "LA":"Lao People's Democratic Republic", 
    "LB":"Lebanon", "LC":"Saint Lucia", "LI":"Liechtenstein", "LK":"Sri Lanka", "LR":"Liberia", "LS":"Lesotho", 
    "LT":"Lithuania", "LU":"Luxembourg", "LV":"Latvia", "LY":"Libyan Arab Jamahiriya", "MA":"Morocco", 
    "MC":"Monaco", "MD":"Moldova", "MG":"Madagascar", "MH":"Marshall Islands", "ML":"Mali", "MM":"Myanmar", 
    "MN":"Mongolia", "MO":"Macau", "MP":"Northern Mariana Islands", "MQ":"Martinique", "MR":"Mauritania", 
    "MS":"Monserrat", "MT":"Malta", "MU":"Mauritius", "MV":"Maldives", "MW":"Malawi", "MX":"Mexico", 
    "MY":"Malaysia", "MZ":"Mozambique", "NA":"Nambia", "NC":"New Caledonia", "NE":"Niger", "NF":"Norfolk Island", 
    "NG":"Nigeria", "NI":"Nicaragua", "NL":"Netherlands", "NO":"Norway", "NP":"Nepal", "NR":"Nauru", 
    "NT":"Neutral Zone (no longer exists)", "NU":"Niue", "NZ":"New Zealand", "OM":"Oman", "PA":"Panama", 
    "PE":"Peru", "PF":"French Polynesia", "PG":"Papua New Guinea", "PH":"Philippines", "PK":"Pakistan", 
    "PL":"Poland", "PM":"St. Pierre &amp; Miquelon", "PN":"Pitcairn", "PR":"Puerto Rico", "PT":"Portugal", 
    "PW":"Palau", "PY":"Paraguay", "QA":"Qatar", "RE":"Réunion", "RO":"Romania", "RU":"Russian Federation", 
    "RW":"Rwanda", "SA":"Saudi Arabia", "SB":"Solomon Islands", "SC":"Seychelles", "SD":"Sudan", "SE":"Sweden", 
    "SG":"Singapore", "SH":"St. Helena", "SI":"Slovenia", "SJ":"Svalbard &amp; Jan Mayen Islands", "SK":"Slovakia", 
    "SL":"Sierra Leone", "SM":"San Marino", "SN":"Senegal", "SO":"Somalia", "SR":"Suriname", 
    "ST":"Sao Tome &amp; Principe", "SU":"Union of Soviet Socialist Republics (no longer exi", "SV":"El Salvador", 
    "SY":"Syrian Arab Republic", "SZ":"Swaziland", "TC":"Turks &amp; Caicos Islands", "TD":"Chad", 
    "TF":"French Southern Territories", "TG":"Togo", "TH":"Thailand", "TJ":"Tajikistan", "TK":"Tokelau", 
    "TM":"Turkmenistan", "TN":"Tunisia", "TO":"Tonga", "TP":"East Timor", "TR":"Turkey", 
    "TT":"Trinidad &amp; Tobago", "TV":"Tuvalu", "TW":"Taiwan", 
    "TZ":"United Republic of Tanzania", "UA":"Ukraine", "UG":"Uganda", "UM":"United States Minor Outlying Islands", 
    "US":"United States of America", "UY":"Uruguay", "UZ":"Uzbekistan", "VA":"Vatican City State", 
    "VC":"St. Vincent &amp; the Grenadines", "VE":"Venezuela", "VG":"British Virgin Islands", 
    "VI":"United States Virgin Islands", "VN":"Viet Nam", "VU":"Vanuatu", "WF":"Wallis &amp; Futuna Islands", 
    "WS":"Samoa", "YD":"Democratic Yemen (no longer exists)", "YE":"Yemen", "YT":"Mayotte", "YU":"Yugoslavia", 
    "ZA":"South Africa", "ZM":"Zambia", "ZR":"Zaire", "ZW":"Zimbabwe", "ZZ":"Unknown"
  },
  
  countryImageMap: {"AF":"Afghanistan.png","AL":"Albania.png","DZ":"Algeria.png","AS":"Samoa.png","AD":"Andorra.png","AO":"Angola.png","AI":"Anguilla.png","AR":"Argentina.png","AM":"Armenia.png","AW":"Aruba.png","AT":"Austria.png","AZ":"Azerbaijan.png","BH":"Bahrain.png","BD":"Bangladesh.png","BB":"Barbados.png","BY":"Belarus.png","BE":"Belgium.png","BZ":"Belize.png","BJ":"Benin.png","BM":"Bermuda.png","BT":"Bhutan.png","BO":"Bolivia.png","BA":"Bosnia_and_Herzegovina.png","BW":"Botswana.png","BR":"Brazil.png","VG":"Virgin_Islands.png","BN":"Brunei.png","BG":"Bulgaria.png","BF":"Burkina_Faso.png","KH":"Cambodia.png","CM":"Cameroon.png","CA":"Canada.png","CV":"Cape_Verde.png","KY":"Cayman_Islands.png","CF":"Central_African_Republic.png","TD":"Chad.png","CL":"Chile.png","CN":"China.png","TW":"Taiwan.png","CO":"Colombia.png","KM":"Comoros.png","CR":"Costa_Rica.png","HR":"Croatia.png","CU":"Cuba.png","CY":"Cyprus.png","CZ":"Czechia.png","DK":"Denmark.png","DM":"Dominica.png","DO":"Dominican_Republic.png","TP":"East_Timor.png","EC":"Ecuador.png","EG":"Egypt.png","SV":"El_Salvador.png","ER":"Eritrea.png","EE":"Estonia.png","ET":"Ethiopia.png","FK":"Falkland_Islands.png","FO":"Faroe_Islands.png","FJ":"Fiji.png","FI":"Finland.png","FR":"France.png","FX":"France.png","GF":"French_Guiana.png","GA":"Gabon.png","GM":"Gambia.png","GE":"Georgia.png","GS":"Georgia.png","DD":"Germany.png","DE":"Germany.png","GH":"Ghana.png","GR":"Greece.png","GL":"Greenland.png","GD":"Grenada.png","GP":"Guadeloupe.png","GU":"Guam.png","GW":"Guinea.png","GN":"Guinea.png","GQ":"Guinea.png","PG":"Papua_New_Guinea.png","GY":"Guyana.png","HT":"Haiti.png","HN":"Honduras.png","HU":"Hungary.png","IS":"Iceland.png","IN":"India.png","IO":"India.png","IR":"Iran.png","IQ":"Iraq.png","IE":"Ireland.png","IL":"Israel.png","IT":"Italy.png","JP":"Japan.png","JO":"Jordan.png","KZ":"Kazakhstan.png","KE":"Kenya.png","KW":"Kuwait.png","KG":"Kyrgyzstan.png","LV":"Latvia.png","LB":"Lebanon.png","LS":"Lesotho.png","LR":"Liberia.png","LY":"Libya.png","LI":"Liechtenstein.png","LT":"Lithuania.png","LU":"Luxembourg.png","MG":"Madagascar.png","MW":"Malawi.png","MY":"Malaysia.png","MV":"Maldives.png","ML":"Mali.png","SO":"Somalia.png","MT":"Malta.png","MQ":"Martinique.png","MU":"Mauritius.png","MX":"Mexico.png","MC":"Monaco.png","MN":"Mongolia.png","MA":"Morocco.png","MZ":"Mozambique.png","MM":"Myanmar.png","NA":"Nambia.png","NR":"Nauru.png","NP":"Nepal.png","AN":"Netherlands.png","NL":"Netherlands.png","NC":"New_Caledonia.png","NZ":"New_Zealand.png","NI":"Nicaragua.png","NE":"Niger.png","NG":"Niger.png","NU":"Niue.png","NO":"Norway.png","OM":"Oman.png","RO":"Romania.png","PK":"Pakistan.png","PW":"Palau.png","PA":"Panama.png","PY":"Paraguay.png","PE":"Peru.png","PH":"Philippines.png","PL":"Poland.png","PT":"Portugal.png","PR":"Puerto_Rico.png","QA":"Qatar.png","RU":"Russia.png","LC":"Saint_Lucia.png","WS":"Samoa.png","SM":"San_Marino.png","SA":"Saudi_Arabia.png","SN":"Senegal.png","SC":"Seychelles.png","SL":"Sierra_Leone.png","SG":"Singapore.png","CS":"Slovakia.png","SK":"Slovakia.png","SI":"Slovenia.png","SB":"Solomon_Island.png","ZA":"South_Africa.png","KR":"South_Korea.png","ES":"Spain.png","LK":"Sri_Lanka.png","SD":"Sudan.png","SR":"Suriname.png","SZ":"Swaziland.png","SE":"Sweden.png","CH":"Switzerland.png","SY":"Syria.png","TJ":"Tajikistan.png","TZ":"Tanzania.png","TH":"Thailand.png","TG":"Togo.png","TO":"Tonga.png","TN":"Tunisia.png","TR":"Turkey.png","TM":"Turkmenistan.png","UG":"Uganda.png","UA":"Ukraine.png","AE":"United_Arab_Emirates.png","GB":"United_Kingdom.png","US":"United_States_of_America.png","UY":"Uruguay.png","UZ":"Uzbekistan.png","VU":"Vanuatu.png","VE":"Venezuela.png","VI":"Virgin_Islands.png","YD":"Yemen.png","YE":"Yemen.png","ZM":"Zambia.png","ZW":"Zimbabwe.png"}
  
};


var AudioTransport = {
  
  audioFileIndex: 0,
  soundStartTimes: [0, 0, 6, 11.18, 16.56, 22.23, 27.78],
  playTimeouts: [0,0,0],
  webAudioContext: false,
  
  initWebAudio: function() {
  
    try {
      
      if (typeof(AudioContext) != "undefined") {
        AudioTransport.ogg = true;
        AudioTransport.webAudioContext = new AudioContext(); 
      }
      else if (typeof(webkitAudioContext) != "undefined") {
        AudioTransport.ogg = false;
        AudioTransport.webAudioContext = new webkitAudioContext();  
      }
      else {
        
        console.log("web audio not supported in a context we understand, falling back to audio tags");
        AudioTransport.webAudioContext = false;

      }
      
    }
    catch(e) {
      console.log("web audio not supported, falling back to audio tags");
      AudioTransport.webAudioContext = false;
    }
    
    
    if (AudioTransport.webAudioContext) {
      
      // let's preload some sounds, kidz!
    
      AudioTransport.tone1Buffer = false;
      AudioTransport.tone2Buffer = false;
      AudioTransport.tone3Buffer = false;
      AudioTransport.tone4Buffer = false;
      AudioTransport.tone5Buffer = false;
      AudioTransport.tone6Buffer = false;
      
      if (AudioTransport.ogg ) {
      
        AudioTransport.loadWASound("media/t1.ogg", "tone1Buffer");
        AudioTransport.loadWASound("media/t2.ogg", "tone2Buffer");
        AudioTransport.loadWASound("media/t3.ogg", "tone3Buffer");
        AudioTransport.loadWASound("media/t4.ogg", "tone4Buffer");
        AudioTransport.loadWASound("media/t5.ogg", "tone5Buffer");
        AudioTransport.loadWASound("media/t6.ogg", "tone6Buffer");  
        
      }
      else {
      
        AudioTransport.loadWASound("media/t1.mp3", "tone1Buffer");
        AudioTransport.loadWASound("media/t2.mp3", "tone2Buffer");
        AudioTransport.loadWASound("media/t3.mp3", "tone3Buffer");
        AudioTransport.loadWASound("media/t4.mp3", "tone4Buffer");
        AudioTransport.loadWASound("media/t5.mp3", "tone5Buffer");
        AudioTransport.loadWASound("media/t6.mp3", "tone6Buffer");
        
      }
        
    }
    
  },
  
  loadWASound: function(inURI, inLoadSlot) {
      
      var request = new XMLHttpRequest();
      
      request.open('GET', inURI, true);
      
      request.responseType = 'arraybuffer';
    
      // Decode the hott bitz asynchronously. 'cause... we have to.
      request.onload = function() {
      
        AudioTransport.webAudioContext.decodeAudioData (
          
          request.response, 
          function(buffer) {
            AudioTransport[inLoadSlot] = buffer;
            
            // are we all loaded, you ask? let's find out.
            if (
              AudioTransport.tone1Buffer &&
              AudioTransport.tone2Buffer &&
              AudioTransport.tone3Buffer &&
              AudioTransport.tone4Buffer &&
              AudioTransport.tone5Buffer &&
              AudioTransport.tone6Buffer
            ) {
              
              AudioTransport.allSoundsLoaded = true;
              
            }
            
          }, 
          function(inError) {
            console.log("bummer, WebAudio can't load " + inURI);
          }
        );
      
      } // end onload
      
      
      // and kick off the asset request...
      request.send();
  
  },
  
  playFromAudioTag: function(inAudioTag, inSoundIndex) {
  
    console.log("playing from audio tag: ");
    console.log(inAudioTag);
    console.log(inSoundIndex);
    
  
    if (AudioTransport.playTimeouts[AudioTransport.audioFileIndex]) {
    
      clearInterval(AudioTransport.playTimeouts[AudioTransport.audioFileIndex]);
      AudioTransport.playTimeouts[AudioTransport.audioFileIndex] = 0;
      inAudioTag.pause();
    
    }
    
    if (inAudioTag.readyState > 3) {
      console.log("ready state is 3");
      inAudioTag.currentTime = AudioTransport.soundStartTimes[inSoundIndex];
      
      $(inAudioTag).unbind().bind("seeked", function() {
        
        console.log("AUDIO SEEKED");
        inAudioTag.play();
      
      });
      
    
    }
    else {
    
      var readyStateInterval = setInterval(function() {
        console.log('waiting for audio to load');
        if (inAudioTag.readyState > 3) {
          clearInterval(readyStateInterval);
          console.log("clearing timer, seeking to " + AudioTransport.soundStartTimes[inSoundIndex]);
          inAudioTag.currentTime = AudioTransport.soundStartTimes[inSoundIndex];
          
          $(inAudioTag).unbind().bind("seeked", function() {
        
            console.log("DELAYED AUDIO SEEKED");
            inAudioTag.play();
            
          });
          //inAudioTag.play();
        
        
        }
      
      }, 15);
    
    }
    
    //! pause audio after sound plays
    AudioTransport.playTimeouts[AudioTransport.audioFileIndex] = setTimeout(function() {
    
       //console.log("play timeout clearing on its own");
       inAudioTag.pause();
       AudioTransport.playTimeouts[AudioTransport.audioFileIndex] = 0;
       
    }, 5000);
    
  },
  
  playSound: function(inSoundIndex) {

    //console.log("ATTEMPTING TO PLAY SOUND: " + inSoundIndex);
  
    var bufferToPlay = [ AudioTransport.tone1Buffer,
                         AudioTransport.tone2Buffer,
                         AudioTransport.tone3Buffer,
                         AudioTransport.tone4Buffer,
                         AudioTransport.tone5Buffer,
                         AudioTransport.tone6Buffer][inSoundIndex-1];
  
    if (AudioTransport.webAudioContext) {
      
      //console.log("playing with web audio!")
      
      var source = AudioTransport.webAudioContext.createBufferSource(); // creates a sound source
      
      // when iPhones go to sleep, they drop their buffers.  fun!
      // if we don't have a bufferToPlay object, reload 'em
      // with luck they will still be in cache.
      if (! bufferToPlay) {
        
        console.log("DOH!  buffers have flushed, reloading....");
      
        AudioTransport.allSoundsLoaded = false;
        
        AudioTransport.loadWASound("media/t1.mp3", "tone1Buffer");
        AudioTransport.loadWASound("media/t2.mp3", "tone2Buffer");
        AudioTransport.loadWASound("media/t3.mp3", "tone3Buffer");
        AudioTransport.loadWASound("media/t4.mp3", "tone4Buffer");
        AudioTransport.loadWASound("media/t5.mp3", "tone5Buffer");
        AudioTransport.loadWASound("media/t6.mp3", "tone6Buffer");
        
        var soundLoaderInterval = setInterval(function() {
          
          if (AudioTransport.allSoundsLoaded) {
            
            clearInterval(soundLoaderInterval);
            
            bufferToPlay = [ AudioTransport.tone1Buffer,
                   AudioTransport.tone2Buffer,
                   AudioTransport.tone3Buffer,
                   AudioTransport.tone4Buffer,
                   AudioTransport.tone5Buffer,
                   AudioTransport.tone6Buffer][inSoundIndex-1];
  
            // do i repeat myself?  yes, and i'm sorry.
            source.buffer = bufferToPlay;
            source.connect(AudioTransport.webAudioContext.destination); 
            source.noteOn(0); // play sound form buffer
          
          }  
        
        }, 15);         
        
      }
      else {
        source.buffer = bufferToPlay;
        source.connect(AudioTransport.webAudioContext.destination); // that is, connect to the default speakers 
                
        source.start(0); // play the source now 
      }
      
    }
    else {
    
      console.log("playing old scool tone");
      
      if (AudioTransport.audioFileIndex == 0) { // that is, the first play
    
        var soundElementId = "t-"+inSoundIndex+"-1";
        var audioTag = document.getElementById(soundElementId);
        
        console.log("first play for: " + soundElementId);
      
        audioTag.play();
                
        AudioTransport.audioFileIndex = 2;
      }
      else {
        
        // determine where in the round robin we are: 
        var soundElementId = "t-"+inSoundIndex+"-" + AudioTransport.audioFileIndex;
        var audioTag = document.getElementById(soundElementId);
        console.log("playing: " + soundElementId);
        
        document.getElementById(soundElementId).play();
        
        AudioTransport.audioFileIndex ++;
        if (AudioTransport.audioFileIndex > 3) AudioTransport.audioFileIndex = 1;
        
      }
      
    }
  }
  
};



// app cache logistics, everyone loves app cache, right?
var AppCacheObserver = {
  
  appCache: window.applicationCache,
  
  handleCacheEvent: function(e) {
    console.log("APP CACHE EVENT");
    console.log(e);
    switch (AppCacheObserver.appCache.status) {
    case AppCacheObserver.appCache.UNCACHED: // UNCACHED == 0
      return 'UNCACHED';
      break;
    case AppCacheObserver.appCache.IDLE: // IDLE == 1
      return 'IDLE';
      break;
    case AppCacheObserver.appCache.CHECKING: // CHECKING == 2
      return 'CHECKING';
      break;
    case AppCacheObserver.appCache.DOWNLOADING: // DOWNLOADING == 3
      return 'DOWNLOADING';
      break;
    case AppCacheObserver.appCache.UPDATEREADY:  // UPDATEREADY == 4
      return 'UPDATEREADY';
      break;
    case AppCacheObserver.appCache.OBSOLETE: // OBSOLETE == 5
      return 'OBSOLETE';
      break;
    default:
      return 'UKNOWN CACHE STATUS';
      break;
    };
  },
  
  handleCacheError: function(e) {
    console.log('FYI, Cache failed to update...');
  }
  
};

// Fired after the first cache of the manifest.
AppCacheObserver.appCache.addEventListener('cached', AppCacheObserver.handleCacheEvent, false);

// Checking for an update. Always the first event fired in the sequence.
AppCacheObserver.appCache.addEventListener('checking', AppCacheObserver.handleCacheEvent, false);

// An update was found. The browser is fetching resources.
AppCacheObserver.appCache.addEventListener('downloading', AppCacheObserver.handleCacheEvent, false);

// The manifest returns 404 or 410, the download failed,
// or the manifest changed while the download was in progress.
AppCacheObserver.appCache.addEventListener('error', AppCacheObserver.handleCacheError, false);

// Fired after the first download of the manifest.
AppCacheObserver.appCache.addEventListener('noupdate', AppCacheObserver.handleCacheEvent, false);

// Fired if the manifest file returns a 404 or 410.
// This results in the application cache being deleted.
AppCacheObserver.appCache.addEventListener('obsolete', AppCacheObserver.handleCacheEvent, false);

// Fired for each resource listed in the manifest as it is being fetched.
AppCacheObserver.appCache.addEventListener('progress', AppCacheObserver.handleCacheEvent, false);


AppCacheObserver.appCache.addEventListener('updateready', function(e) {
  if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {

    window.applicationCache.swapCache();
    if (confirm('A new version of this site is available. Load it?')) {
      window.location.reload();
    }
  } else {
    // Manifest didn't changed. Nothing new to server.
  }
}, false);

