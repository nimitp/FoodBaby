var app = angular.module('foodBaby', ['ngRoute']);


app.controller('ListingsCtrl', ($scope, $http) => {
  $scope.listingsLoaded = false; //Used to control when directive runs (see ng-if in main.html)

  $http.get('/api/listings').then((response) => {
    $scope.listings = response.data;
    $scope.listingsLoaded = true;
  }, (error) => {
    console.log('Unable to retrieve listings: ', error);
  });

  $http.get('/api/listings/recent').then((response) => {
    $scope.recent = response.data;
  }, (error) => {
    console.log('Unable to retrieve listings: ', error);
  });

  $scope.view = function(id) {
    window.location = `/api/listings/id/${id}`;
  }
});

app.config(function($routeProvider) {

  $routeProvider
    .when('/', {
      templateUrl : '../main.html',
      controller  : 'ListingsCtrl'
    })
    .when('/signup', {
      templateUrl : '../signup.html',
      controller  : 'SignUpController'
    })
    .when('/login', {
      templateUrl : '../login.html',
      controller  : 'LoginController'
    })
    .when('/events', {
        templateUrl : '../events.html',
        controller : 'EventsController'
    })
    .when('/profile', {
      templateUrl : '../profile.html',
      controller  : 'ProfileController'
    })

});

app.controller('SignUpController', function($scope, $location, $http) {
  $scope.signup = function() {
    $scope.usernameExists = false;
    $http({
      method: "POST",
      url: '/api/user/register',
      data: {username:$scope.username, password:$scope.password}
    }).success(function(res) {
      $location.path('/login');
    }).error(function(res) {
      console.log(res);
      $scope.usernameExists = true;
      $location.path('/signup');
    });
  }
});

app.controller('LoginController',  function($scope, $location, $http){


  $scope.login = function(){
    console.log("Attempting Login");

    $scope.hasLoginFailed = false; // flag for error message when login fails

    $http({

      method:"POST",
      url:'/user/login',
      data:{username:$scope.username,password:$scope.password},

    }).success(function(response){

      $scope.userData = response;
      console.log("Login successful!");
      $location.path("/profile");

    }).error(function(response){

      console.log("Login Failed!");
      $scope.hasLoginFailed = true;
      $location.path("/login");

    });

  };

});

app.controller('EventsController', function ($scope, $http) {
    $scope.sortByOccurence = function (listing, includePast) {
            var now = new Date();
            var curr = new Date(listing.time.end);

            if ((includePast && curr < now) || (!includePast && curr > now)) {
                return listing;
            }
    }

});

app.directive("mapbox", function() {
  return {
      restrict: 'E',
      replace: true,
      template: "<div id='map' style='width: 100%; height: 100%;'></div>",
      link: function ($scope) {
          mapboxgl.accessToken = 'pk.eyJ1IjoiZm9vZGJhYnlnMiIsImEiOiJjam10YTdtNjAwNWg2M3dwMWw3am14emhzIn0.dlnV1DEKRSxnKRwa7I2qLw';
          var map = new mapboxgl.Map({
              container: 'map',
              style: 'mapbox://styles/mapbox/streets-v10',
              center: [-82.35256285341353, 29.641654178244437],
              zoom: 13.6868419678297,
              minZoom: 13
          });

          /* Generates geojson data from the next 20 upcoming events. If events are held at the same location, the objects are merged. */
          (function generateMarkers() {
              var recentevents = $scope.listings.slice(0, 20);
              var geojson, index = 0; //track indeces of unique locations
              var fts = [];
              var eventmap = new Map();

              //create feature json for each event
              for (var i = 0; i < recentevents.length; i++) {
                  var curr = eventmap.get(recentevents[i].location.code);
                  var event = { //unique event info
                      title: recentevents[i].name,
                      food_type: recentevents[i].food_type,
                      time: {
                          start: new Date(recentevents[i].time.start).toLocaleString(), //prettify dates
                          end: new Date(recentevents[i].time.end).toLocaleString()
                      }
                  };

                  if (curr == undefined) { //first
                      eventmap.set(recentevents[i].location.code, index); //add to map
                      fts[index] = { //add initial object
                          type: 'feature',
                          geometry: {
                              type: 'point',
                              coordinates: [recentevents[i].location.coordinates.longitude, recentevents[i].location.coordinates.latitude]
                          },
                          properties: {
                              events: [], //holds all unique event info for each event at location
                              location: {
                                  name: recentevents[i].location.name,
                                  code: recentevents[i].location.code
                              }
                          }
                      }

                      fts[index].properties.events.push(event);

                      index++;
                  } else { //duplicate
                      fts[curr].properties.events.push(event);
                  }
              }

              //create geojson
              geojson = {
                  type: 'featurecollection',
                  features: fts
              };

              createMarker(geojson);
          })();

          /* Adds markers to the map for every feature within geojson object.*/
          function createMarker(geojson) {
              geojson.features.forEach(function (marker) {
                  var html = '';

                  marker.properties.events.forEach(function (event) { //Create list of event info
                      html += '<h3>' + event.title + '</h3><p><b>' + marker.properties.location.name + ' (' + marker.properties.location.code + ')</b></p><p>'
                                  + event.time.start + ' - ' + event.time.end + '</p><p>'
                                  + event.food_type + '</p>'
                  });

                  new mapboxgl.Marker({ color: "000000" })
                    .setLngLat(marker.geometry.coordinates)
                    .setPopup(new mapboxgl.Popup({ offset: 25 }) //add popups
                    .setHTML(html))
                    .addTo(map);
              });
          }
      }
  }

})
