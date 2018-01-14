import _ from 'lodash';

Homie = {
	Utils: {}
};

Homie.API = function(options) {

	this.options = _.assign({
		url: '192.168.123.1',
		userAgent: 'Meteor Homie',
		requestTimeout: 2000,
	}, options);

	if (this.options.url.substring(0,7) !== 'http://') {
		this.options.url = 'http://' + this.options.url;
	}

	this.defaults = {
		timeout: this.options.requestTimeout,
	};
};

Homie.API.prototype.getHeartBeat = function( options ) {
	/**
	 * 	GET /heart

	 Response

	 204 No Content
	 */
	return this.Query( 'GET', '/heart', options, 204 );
};


Homie.API.prototype.getDeviceInfo = function(options) {
	/**
	 * 	GET /device-info

	 Response

	 200 OK (application/json)

	 {
		 "hardware_device_id": "52a8fa5d",
		 "homie_esp8266_version": "2.0.0",
		 "firmware": {
		 "name": "awesome-device",
			 "version": "1.0.0"
	 },
		 "nodes": [
		 {
			 "id": "light",
			 "type": "light"
		 }
	 ],
		 "settings": [
		 {
			 "name": "timeout",
			 "description": "Timeout in seconds",
			 "type": "ulong",
			 "required": false,
			 "default": 10
		 }
	 ]
	 }
	 */
	return this.Query( 'GET', '/device-info', options );
};

Homie.API.prototype.getNetworks = function(options) {
	/**
	 * 	GET /networks

	 Response

	 In case of success:
	 200 OK (application/json)

	 {
	   "networks": [
		 { "ssid": "Network_2", "rssi": -82, "encryption": "wep" },
		 { "ssid": "Network_1", "rssi": -57, "encryption": "wpa" },
		 { "ssid": "Network_3", "rssi": -65, "encryption": "wpa2" },
		 { "ssid": "Network_5", "rssi": -94, "encryption": "none" },
		 { "ssid": "Network_4", "rssi": -89, "encryption": "auto" }
	   ]
	 }
	 In case the initial Wi-Fi scan is not finished on the device:
	 503 Service Unavailable (application/json)

	 {"error": "Initial Wi-Fi scan not finished yet"}
	 */
	return this.Query( 'GET', '/networks', options, 200, 'networks' );
};

Homie.API.prototype.generateConfig = function(device_name, device_id, wifi_ssid, wifi_password, mqtt_host, custom_settings, wifi_options, mqtt_options, ota ) {
	if (!wifi_password) throw new Error('wifi_password is empty');
	if (!mqtt_host) throw new Error('mqtt_host is empty');
	if (!wifi_ssid) throw new Error('wifi_ssid is empty');

	let config = {
		"name": device_name,
		"device_id": device_id,
		"wifi": {
			"ssid": wifi_ssid,
			"password": wifi_password,
			"bssid": wifi_options && wifi_options.bssid ? wifi_options.bssid : null,
			"channel": wifi_options && wifi_options.bssid ? wifi_options.bssid : null,
			"ip": wifi_options && wifi_options.ip ? wifi_options.ip : null,
			"mask": wifi_options && wifi_options.mask ? wifi_options.mask : null,
			"gw": wifi_options && wifi_options.gw ? wifi_options.gw : null,
			"dns1": wifi_options && wifi_options.dns1 ? wifi_options.dns1 : null,
			"dns2": wifi_options && wifi_options.dns2 ? wifi_options.dns2 : null
		},
		"mqtt": {
			"host": mqtt_host,
			"port": mqtt_options && mqtt_options.port ? mqtt_options.port : 1883,
			// "mdns": mqtt_options && mqtt_options.mdns ? mqtt_options.mdns : null,
			"base_topic": mqtt_options && mqtt_options.base_topic ? mqtt_options.base_topic : 'devices/',
			"auth": mqtt_options && mqtt_options.auth ? mqtt_options.auth : false,
			"username": mqtt_options && mqtt_options.username ? mqtt_options.username : null,
			"password": mqtt_options && mqtt_options.password ? mqtt_options.password : null,
			// "ssl": mqtt_options && mqtt_options.ssl ? mqtt_options.ssl : false,
			// "fingerprint": mqtt_options && mqtt_options.fingerprint ? mqtt_options.fingerprint : null
		},
		"ota": {
			"enabled": ota && ota.enabled ? ota.enabled : false,
		}
	};

	if( custom_settings ){
		config.settings = custom_settings;
	}

	this.Utils.remNullProps(config, true);

	if (!config.hasOwnProperty('name')) {
		config.device_name = 'Homie Device';
	}
	if (!config.hasOwnProperty('device_id')) {
		config.device_id = 'Homie-' + Homie.Utils.randomID(8, 'a0');
	}

	return config;
};

/**
 * Send HTTP API Query Call to Homie Device
 *
 * @param {String}  method       Method to use for HTTP call (GET, POST, PUT, etc)
 * @param {String}  endpoint     Endpoint on API to call (with prepended /), example: /device-info
 * @param {Object}  options      Options object for HTTP call.  To POST/PUT data, set data key in object to value to use for data
 * @param {Integer} successCode  HTTP status code to consider a successful HTTP call (optional - default 200)
 * @param {String}  dataKey      Specific key to return from data response (optional)
 * @returns {Promise<void>}
 */
Homie.API.prototype.Query = function( method, endpoint, options, successCode, dataKey ){

	let httpSuccessCode = successCode ? successCode : 200;
	let mergedOptions = _.extend( this.defaults, options );

	return new Promise( (resolve, reject) => {

		HTTP.call( method, this.options.url + endpoint, mergedOptions, (error, response) => {

			let hasError = this.parseError( error, response, httpSuccessCode );
			let successData = this.parseResponse( response, httpSuccessCode, dataKey );

			if( hasError ) {
				let responseError = hasError.statusCode ? '(' + hasError.statusCode + ') ' : '';
				responseError += hasError.data && hasError.data.error ? hasError.data.error : hasError.content ? hasError.content : JSON.stringify( hasError );

				console.log( 'Homie.API.Query reject hasError', hasError, responseError );

				// throw new Error( responseError );
				reject( new Error( responseError ) );

			} else if ( successData ){
				resolve(successData);
			} else {
				console.log( 'Unkown errorsz');
				reject( new Error( 'Unknown error!' ) );
			}

		});

	});

};

Homie.API.prototype.parseError = function( error, response, successCode ){

	if( error ){

		if( error.response && error.response.statusCode ){
			return error.response;
		}

		console.log( 'Non response code error', error );
		return error;

	} else if ( response && response.statusCode && response.statusCode !== successCode ){
		return response;
	}

	return false;
};

Homie.API.prototype.parseResponse = function( response, successCode, dataKey ){

	if( response && response.statusCode && response.statusCode === successCode ){

		// Initially set return response to data object (or true if doesn't exist)
		let returnResponse = response.data ? response.data : true;
		// If we want a specific data key to be returned, and it exists, return that instead
		if( dataKey && response.data && response.data.hasOwnProperty( dataKey ) ){
			returnResponse = response.data[dataKey];
		}

		return returnResponse;
	}

	return false;
};

Homie.API.prototype.saveConfig = function(config, options) {

	if( ! config ) return new Error( 'Config is missing!' );
	if( ! options ) options = {};

	/**
	 * 	PUT /config

	 Request body

	 (application/json)

	 See JSON configuration file.

	 Response

	 In case of success:
	 200 OK (application/json)

	 { "success": true }
	 In case of error in the payload:
	 400 Bad Request (application/json)

	 { "success": false, "error": "Reason why the payload is invalid" }
	 In case the device already received a valid configuration and is waiting for reboot:
	 403 Forbidden (application/json)

	 { "success": false, "error": "Device already configured" }

	 */
	// Set data object in options to JSON to configure device with
	let callOptions = { data: config };
	// Merge passed options, if any
	if( options ){
		callOptions = _.extend( callOptions, options );
	}

	return this.Query( 'PUT', '/config', callOptions );
};

Homie.API.prototype.connectToWifi = function(ssid, password,options) {
	if( ! ssid ) return new Error( 'ssid is missing!' );
	if( ! options ) options = {};

	/**
	 * 	PUT /wifi/connect
		v2.1 - POST /wifi/connect
	 Request params

	 ssid - wifi ssid network name
	 password - wifi password

	 Response

	 In case of success:
	 202 Accepted (application/json)

	 { "success": true }
	 In case of error in the payload:
	 400 Bad Request (application/json)

	 { "success": false, "error": "[Reason why the payload is invalid]" }
	 */

	// Set data object in options to JSON to configure device with
	let callOptions = { data: { ssid: ssid, password: password } };
	// Merge passed options, if any
	if( options ){
		callOptions = _.extend( callOptions, options );
	}

	return this.Query( 'POST', '/wifi/connect', callOptions, 202 );
};

Homie.API.prototype.getWifiStatus = function(options) {
	/**
	 * 	GET /wifi/status

	 Possible status values

	 idle
	 connect_failed
	 connection_lost
	 no_ssid_available
	 connected (along with a local_ip field)
	 disconnected

	 Response

	 In case of success:
	 200 OK (application/json)

	 { "status": "[status of wifi connection]" }
	 */

	return this.Query( 'GET', '/wifi/status', options );
};

/**
 * Get Device Configuration
 * @param options
 * @returns {Promise<void>}
 */
Homie.API.prototype.getConfig = function(options) {
	/**
	 * 	GET /config
	 *
	 In case of success:
	 200 OK (application/json)
	 */

	return this.Query( 'GET', '/config', options );
};

/*
* Enable/disable the device to act as a transparent proxy between AP and Station networks.
*
* All requests that don't collide with existing api paths will be bridged to the destination according to the "Host" header in http. The destination host is called using the existing Wifi connection (Station Mode established after ssid/password is configured in "/wifi-connect") and all contents are bridged back to the connection made to the AP side.
*
* This feature can be used to help captive portals to perform cloud api calls during device enrollment using the esp wifi ap connection without having to patch the Homie firmware. By using the transparent proxy, all operations can be performed by the custom javascript running on the browser (/data/homie/ui_bundle.gz)
* https is not supported.
*
* Important: The http request and responses must be kept as small as possible because all contents are transported using ram memory, which is very limited.
*/
Homie.API.prototype.setTransparentWifiProxy = function(enabled) {
	/**
	 * 	PUT /proxy/control
	    v2.1 POST /proxy/control
	 Request params

	 enable - true or false indicating if the device has to bridge all unknown requests to the Internet (transparent proxy activated) or not.

	 Response

	 In case of success:
	 200 OK (application/json)

	 {
		 "success": true
	 }
	 400 Bad Request (application/json)
	 {
		 "success": false,
		 "error": "Reason why the payload is invalid"
	 }
	 */

	let callOptions = { data: { enabled: enabled } };

	if( options ){
		callOptions = _.extend( callOptions, options );
	}

	return this.Query( 'POST', '/proxy/control', callOptions );
};
