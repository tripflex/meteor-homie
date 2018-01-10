# Homie for Meteor

This Meteor package is for projects that utilize the [Homie IoT convention](https://github.com/marvinroger/homie).


It currently includes the [Homie2Config](https://github.com/tripflex/node-homie2-config) npm module, as well as a few helper methods, detailed below.

Homie2Config is a node.js module to configure esp8266 boards loaded with [Homie firmware](https://github.com/marvinroger/homie-esp8266).

## Installation
`meteor add tripflex:homie`

## Homie2Config
This package exports `Homie` object, and the Homie2Config methods can be accessed via `Homie.Config`

Please see [Homie2Config](https://github.com/tripflex/node-homie2-config) documentation for specifics on available methods.

Currently available are:
* getHeartBeat(callback)
* getDeviceInfo(callback)
* getNetworks(callback)
* saveConfig(config, callback)
* connectToWifi(ssid, password, callback)
* getWifiStatus(callback)
* setTransparentWifiProxy(enable, callback)
* generateConfig(device_name, device_id, wifi_ssid, wifi_password, mqtt_host, mqtt_options, ota, callback)

To call these methods using this Meteor package, construct a new config object:
```js
var config = new Homie.Config();
config.getHeartBeat(function(isAlive){
    // do something
});
```

**Promises are also supported by attaching (async) to method names**

For example, to call `getHeartBeat` using promises, you would do this:

```js
let config = new Homie.Config();
config.getHeartBeatAsync().then(
    function(isAlive) {
        if (!isAlive) {
            console.log("Oh no, we don't have a heartbeat! Please check the server url " + this.baseUrl);
        }
        console.log("We have a heartbeat!");
    }).catch(function (error) {
        console.log('error',error);
    });
```

If you want to maintain access to `this` in its original context (as in, `this` not referring to config object), I recommend using arrow functions:

```js
this.something = 'something';
let config = new Homie.Config();
config.getHeartBeatAsync().then( isAlive => {
        if (!isAlive) {
            console.log("Oh no, we don't have a heartbeat! Please check the server url " + config.baseUrl);
        }
        
        console.log("We have a heartbeat!");
        console.log("And I can still tell you something is ..." + this.something );
    }).catch( error => {
        console.log('error',error);
    });
```


## Helper Methods

Coming Soon ...

## Changelog

#### 0.0.1
- Initial package creation