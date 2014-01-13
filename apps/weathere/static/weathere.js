var APP = function() {
  this.ANIMATION_SPEED = 150;  /* In milliseconds. */
  this.APP_NAME = 'weathere';

  // Locations.
  // { name: '', lat: 0, lng: 0, temp_f: 0 }
  this.here = null;
  this.there = null;

  // Resources.
  this.geocoder = null;
};


APP.prototype.init = function() {
  console.log('init');
  this.here = { name: null, lat: null, lng: null, temp_f: null }
  this.there = { name: null, lat: null, lng: null, temp_f: null }
  this.geocoder = new google.maps.Geocoder();

  $('#location input').stop().hide()
      .keypress((function(app) {
        return function(e) {
          if (e.which === 13) {
            var there_name = $('#location input').val();

            // Update the address bar.
            url = location.pathname.match('.*' + app.APP_NAME + '|')[0];
            url += '/' + there_name;
            window.history.replaceState(null, null, url);

            // Set app.there and clear out stale data.
            app.there = {
              name: there_name,
              lat: null,
              lng: null,
              temp_f: null
            };

            // Send off req to weather API.
            app.getTemperature(app.there);

            app.askHere();
          }
        }
      })(this));

  if (_get.location) {
    this.there = { name: _get.location, lat: null, lng:null, temp_f: null };
    this.getTemperature(this.there);
    this.askHere();
  }
  else {
    this.askThere();
  }
};


APP.prototype.say = function(str_1, str_2) {
  console.log('SAY', new Date().getTime(), str_1, str_2);
  if (str_1 !== null) {
    $('#notify').stop().fadeOut(this.ANIMATION_SPEED, function() {
      $('#notify').html(str_1).fadeIn(this.ANIMATION_SPEED);
    });
  }
  if (str_2 !== null) {
    $('#location input').stop().hide().delay(1500).fadeIn(
        this.ANIMATION_SPEED,
        function() {
          $('#location input').focus().select();
        });
    $('#location input').val(str_2);
  }
  else {
    $('#location input').fadeOut(this.ANIMATION_SPEED);
  }
};


APP.prototype.askThere = function() {
  console.log('askThere');
  this.say('Enter a location below', '');
};


APP.prototype.askHere = function() {
  console.log('askHere', new Date().getTime());
  if (this.here && this.here.temp_f) {
    // Already have it.
    return;
  }
  ask_timer = window.setTimeout((function(app) {
    return function() {
      app.say('Click to allow your browser to share your location', null);
    };
  })(this), 1000);
  navigator.geolocation.getCurrentPosition((function(app) {
    return function(rsp) {
      window.clearTimeout(ask_timer);
      app.here = {
        name: null,
        lat: rsp.coords.latitude,
        lng: rsp.coords.longitude,
        temp_f: null
      };
      app.getTemperature(app.here);
    };
  })(this));
};


APP.prototype.tryReport = function() {
  console.log('tryReport');
  if (!this.here || this.here.temp_f === null) {
    return;
  }
  if (!this.there || this.there.temp_f === null) {
    return;
  }

  temp_diff = this.there.temp_f - this.here.temp_f;
  if (temp_diff < 0) {
    notification_text =
        'It is <temperature>' + Math.abs(temp_diff) + '</temperature>' +
        ' degrees <colder>colder</colder> there!';
  }
  else if (temp_diff > 0) {
    notification_text =
        'It is <temperature>' + Math.abs(temp_diff) + '</temperature>' +
        ' degrees <warmer>warmer</warmer> there!';
  }
  else {
    notification_text =
        'It is the <temperature>same</temperature> temperature there!';
  }

  if (this.there.name) {
    notification_text = notification_text.replace(
        /there/, 'in ' + this.there.name);
  }
  if (Math.abs(temp_diff) === 1) {
    notification_text = notification_text.replace(/degrees/, 'degree');
  }

  this.say(notification_text, 'another location?');
};


APP.prototype.getLatLng = function(loc) {
  console.log('getLatLng', loc);
  this.geocoder.geocode(
      { 'address': loc.name },
      (function(app) {
        return function(results, status) {
          console.log('geocode response');
          if (status === google.maps.GeocoderStatus.OK) {
            var latlng = results[0].geometry.location;
            loc.lat = latlng.lat();
            loc.lng = latlng.lng();
            app.getTemperature(loc);
          }
          else {
            app.there = null;
            app.say('Are you sure that\'s a real place?', 'Try again, smartass');
          }
        };
      })(this));
};


APP.prototype.getTemperature = function(loc) {
  console.log('getTemperature', loc);
  if (!loc.lat || !loc.lng) {
    this.getLatLng(loc);
    return;
  }

  if (this.here.lat && this.there.lat) {
    this.say('Wait...', null);
  }
  $.ajax({
    url: '/' + this.APP_NAME + '/q/temperature',
    data: { lat: loc.lat, lng: loc.lng },
    dataType: 'json',
    type: 'POST'
  }).done((function(app) {
    return function(rsp) {
      if (rsp.error) {
        app.say('We seem to have found a corner case.', 'Ever onward');
      }
      loc.lat = rsp.lat;
      loc.lng = rsp.lng;
      loc.temp_f = rsp.temp_f;
      app.tryReport();
    }
  })(this));
};


$(document).ready(function(){
  var app = new APP();
  console.log(app);
  app.init();
});


