# Homie for Meteor

This Meteor package is for projects that utilize the [Homie IoT convention](https://github.com/marvinroger/homie).

It includes helper methods for connecting and configuring Homie devices using the Meteor `HTTP` package for API calls, as well as formatting configuration JSON, and other helper methods.

Meant to be used with NodeMCU (or any ESP8266) [Homie firmware](https://github.com/marvinroger/homie-esp8266).

## Installation
`meteor add tripflex:homie`

## Promises
All methods are Asynchronous and are Promise based methods.  If you are not familiar with JavaScript Promises ... you should be ... but if you're not, here's some great resources:

[https://javascript.info/promise-basics](https://javascript.info/promise-basics)

[https://promise-nuggets.github.io/](https://promise-nuggets.github.io/)

You should also be using the ES6 `async` `await` since it's supported in Meteor and makes things 100x easier:

[https://javascript.info/async-await](https://javascript.info/async-await)

## Helper Methods
* `sleep(customDelay)`

`customDelay` is optional, and should be specified in ms to use a custom sleep (default is 2 seconds [2000ms])

```javascript
async function f(){
	console.log( 'before sleep' );
	await Homie.sleep(); // execution will pause for 2 seconds
	console.log( 'after sleep for 2 seconds' );
}
```

## API Methods
This package exports `Homie` object, along with `Homie.API` for API calls

Please see [Homie2Config](https://github.com/tripflex/node-homie2-config) documentation for specifics on available methods.

Currently available are:
* `getHeartBeat(options)`
* `getDeviceInfo(options)`
* `getNetworks(options)`
* `saveConfig(config, options)`
* `connectToWifi(ssid, password, options)`
* `getWifiStatus(options)`
* `setProxy(enable, options)`
* `generateConfig(device_name, device_id, wifi_ssid, wifi_password, mqtt_host, custom_settings, wifi_options, mqtt_options, ota)`

`options` in each method is meant for overriding any of the default options for that specific API call, and are passed to `HTTP.Call`

Making API calls is very quick and easy (basic non `async/await` promise handling):
```js
let API = new Homie.API();
API.getHeartBeat().then( function( result ){
	// has a heartbeat
}).catch( function( error ){
	// no heartbeat or some other error
});
```

**All API Methods are asynchronous, and are JavaScript Promise based**

The example above is using `.then()` and `.catch()`, but you should be using `async/await`:

```js

async function getNetworks(){
    
	let API = new Homie.API();
	
	try {
		await API.getHeartBeat();
		let networks = API.getNetworks();
		console.log( 'Device networks found:', networks );
		return networks; // Returning value resolves the promise
	} catch( error ){
		console.log( 'Error with heartbeat OR getting networks would trigger this catch', error );
		throw error; // Throw rejects promise, this allows for bubbling up errors
	}
}
```

## Changelog
#### 1.0.0
- Complete code refactoring
- Now using Meteor `HTTP` package for API calls
- Updated `/wifi/connect` and `/proxy/control/` to use `POST`
- Basically completely new plugin codebase

#### 0.0.1
- Initial package creation

### Example Async/Await Class Try/Catch Handling

Initially learning Promises and `async/await` was quite confusing for me initially, and as such, I created some example code you can see below to show how to use `async/await` in classes, and `try/catch` blocks.
You can also run this code and play around with it at the links below:

[Glot.IO](https://glot.io/snippets/exdd6t4bjz) - OR - [JSFiddle](https://jsfiddle.net/tripflex/9ye8wbhd/)

```javascript
let WiFiLib = {

	addNetwork: function( netID ){

		return new Promise( function( resolve, reject ){

			if( netID > -1 ){
				resolve( true );
			} else {
				reject( 'Invalid network ID!' );
			}

		});

	},

	connect: function( netID ){

		return new Promise( function( resolve, reject ){

			resolve( true );
			//reject( 'Unable to connect to wifi!' );

		});

	}

};

class WiFi {

	constructor(){
		this.delay = 2000;
		this.netID = -1;
	}

	async connect(){

		try {

			let netID = this.add();
			this.netID = await netID;

			await this.doConnect();

			return true;

		} catch( error ){

                    console.log( 'Wifi connect catch error: ', error );
                    await this.timeout();
                    console.log( 'Wifi connect catch error after timeout' );
                    throw error;
		}
	}

	async add(){

		const networkAdded = await WiFiLib.addNetwork( 2 );
		await this.timeout();

		return networkAdded;
	}

	async doConnect(){

		const networkConnected = await WiFiLib.connect( this.netID );
		await this.timeout();

		return networkConnected;
	}

	/**
	 * Synchronous Sleep/Timeout `await this.timeout()`
	 */
	timeout( customDelay ) {
		let delay = customDelay ? parseInt( customDelay ) : parseInt( this.delay );
		return new Promise(function(resolve, reject) {
			setTimeout(resolve, delay);
		});
	}
}

class Provisioner {

	constructor( wifi ){
		this.wifi = wifi;
	}

	async startProvision(){

		try {

			await this.wifi.connect();
			//do some provision stuff
			
			return true;

		} catch ( error ){

			console.log( 'Provisioner Catch', error );
			
			let doRetry = this.doRetry( false );
			await doRetry;
			
			if( doRetry ){
				this.startProvision();
			} else {
				throw error;
			}
			
		}

	}
	
	async doRetry( shouldDo ){
			await this.timeout();
			return shouldDo;
	}
	
		/**
	 * Synchronous Sleep/Timeout `await this.timeout()`
	 */
	timeout( customDelay ) {
		let delay = customDelay ? parseInt( customDelay ) : parseInt( this.delay );
		return new Promise(function(resolve, reject) {
			setTimeout(resolve, delay);
		});
	}
}

let wifiConnector = new WiFi();
let provisioning = new Provisioner( wifiConnector );

provisioning.startProvision().then( ()=>{
	console.log( 'Provisioner Complete!' );
}, error => {
	console.log( 'Provisioner Error!' );
});
```