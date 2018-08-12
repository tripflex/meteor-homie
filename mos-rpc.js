MOSRPC = {
	Utils: {},
	/**
	 * Synchronous Sleep/Timeout `await this.timeout()`
	 * Default delay is 2s, specify delay in ms in call to `this.timeout(2000)` for custom delays
	 */
	sleep( customDelay ) {
		let delay = customDelay ? parseInt( customDelay ) : 2000;
		return new Promise(function(resolve, reject) {
			setTimeout(resolve, delay);
		});
	}
};
/**
 * MOSRPC API Constructor
 * @param options
 * @constructor
 */
MOSRPC.API = function(options) {

	this.options = Object.assign({
		url: '192.168.4.1',
		userAgent: 'MOS RPC Meteor',
		requestTimeout: 30000,
	}, options);

	if (this.options.url.substring(0,7) !== 'http://') {
		this.options.url = 'http://' + this.options.url;
	}

	this.defaults = {
		timeout: this.options.requestTimeout
	};
};

/**
 * Get Device Info
 * @param options
 * @returns {Promise<void>}
 */
MOSRPC.API.prototype.getDeviceInfo = function(options) {
	// {
	// 	"app": "pcbtest",
	// 	"fw_version": "1.0",
	// 	"fw_id": "20180809-150722/master@237e150b+",
	// 	"mac": "30AEA474FC10",
	// 	"arch": "esp32",
	// 	"uptime": 30,
	// 	"ram_size": 256580,
	// 	"ram_free": 39916,
	// 	"ram_min_free": 22164,
	// 	"fs_size": 233681,
	// 	"fs_free": 9538,
	// 	"wifi": {
	// 		"sta_ip": "10.5.0.169",
	// 			"ap_ip": "192.168.4.1",
	// 			"status": "got ip", //     "status": "disconnected",
	// 			"ssid": "Devices"
	// 	}
	// }
	return this.Query( 'GET', '/rpc/Sys.GetInfo', options );
};

/**
 * Connect device to WiFi
 * @param ssid
 * @param password
 * @param options
 * @returns {*}
 */
MOSRPC.API.prototype.connectToWifi = function(ssid, password,options) {
	if( ! ssid ) return new Error( 'ssid is missing!' );
	if( ! options ) options = {};

	let wifiData = { "ssid": ssid, "pass": password, "noreboot": "true" };

	let callOptions = {
		data: wifiData
	};

	console.log( 'ProvisionWifi POST test', callOptions );

	return this.Query( 'POST', '/rpc/Provision.WiFi', callOptions );
};

/**
 * Get WiFi Status
 * @param options
 * @returns {Promise<void>}
 */
MOSRPC.API.prototype.getWifiStatus = function(options) {

	// "got ip" when has IP and connected
	// "disconnected" when not connected

	return new Promise( (resolve, reject ) => {

		this.getDeviceInfo().then( deviceInfo => {

			console.log( 'MOSRPC getWifiStatus', deviceInfo );

			if( deviceInfo && deviceInfo.wifi && deviceInfo.wifi.status ){
				console.log( 'Got Wifi Status', deviceInfo.wifi.status, deviceInfo.wifi.sta_ip );
				resolve( { status: deviceInfo.wifi.status, local_ip: deviceInfo.wifi.sta_ip, sta_ip: deviceInfo.wifi.sta_ip, ssid: deviceInfo.wifi.ssid } );
			}

		}).catch( error => {

			console.log( 'MOSRPC getWifiStatus', error.message );
			reject( error );

		});

	});
};

/**
 * Get Device Heartbeat
 *
 * Basically this checks if the device is alive and can respond to RPC calls.  Returns uptime value
 * @param options
 * @returns {Promise<void>}
 */
MOSRPC.API.prototype.getHeartBeat = function( options ) {

	return new Promise( (resolve, reject ) => {

		this.getDeviceInfo().then( deviceInfo => {

			if( deviceInfo && deviceInfo.uptime ){
				resolve( deviceInfo.uptime );
			}

		}).catch( error => {

			console.log( 'MOSRPC getWifiStatus', error.message );
			reject( error );

		});

	});
};

/**
 * Get WiFi Networks from Device
 * @param options
 * @returns {Promise<void>}
 */
MOSRPC.API.prototype.getNetworks = function(options) {
	// [
	// 	{
	// 		"ssid": "Devices",
	// 		"bssid": "92:2a:a8:54:91:d3",
	// 		"auth": 3,
	// 		"channel": 1,
	// 		"rssi": -46
	// 	},
	// 	{
	// 		"ssid": "Watchtower",
	// 		"bssid": "a2:2a:a8:54:91:d3",
	// 		"auth": 3,
	// 		"channel": 1,
	// 		"rssi": -48
	// 	},
	// ]

	return this.Query( 'GET', '/rpc/Wifi.Scan', options );
};

/**
 * Generate Device Configuration JSON
 * @param device_name
 * @param device_id
 * @param wifi_ssid
 * @param wifi_password
 * @param mqtt_host
 * @param custom_settings
 * @param wifi_options
 * @param mqtt_options
 * @param ota
 * @returns {{name: *, device_id: *, wifi: {ssid: *, password: *, bssid: null, channel: *, ip: null, mask: null, gw: null, dns1: null, dns2: null}, mqtt: {host: *, port: number, base_topic: string, auth: boolean, username: null, password: null}, ota: {enabled: boolean}}}
 */
MOSRPC.API.prototype.generateConfig = function(device_name, device_id, wifi_ssid, wifi_password, mqtt_host, custom_settings, wifi_options, mqtt_options, ota ) {
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
		config.device_name = 'MOSRPC Device';
	}
	if (!config.hasOwnProperty('device_id')) {
		config.device_id = 'MOSRPC-' + MOSRPC.Utils.randomID(8, 'a0');
	}

	return config;
};

/**
 * Send HTTP API Query Call to MOSRPC Device
 *
 * @param {String}  method       Method to use for HTTP call (GET, POST, PUT, etc)
 * @param {String}  endpoint     Endpoint on API to call (with prepended /), example: /device-info
 * @param {Object}  options      Options object for HTTP call.  To POST/PUT data, set data key in object to value to use for data
 * @param {Integer} successCode  HTTP status code to consider a successful HTTP call (optional - default 200)
 * @param {String}  dataKey      Specific key to return from data response (optional)
 * @returns {Promise<void>}
 */
MOSRPC.API.prototype.Query = function( method, endpoint, options, successCode, dataKey ){

	let httpSuccessCode = successCode ? successCode : 200;
	let mergedOptions = Object.assign( {}, this.defaults, options );

	console.log( 'MOSRPC API Query', method, this.options.url + endpoint, mergedOptions );

	return new Promise( (resolve, reject) => {

		HTTP.call( method, this.options.url + endpoint, mergedOptions, (error, response) => {

			console.log( 'MOSRPC API QUERY RESULTS', error, response );

			let hasError = this.parseError( error, response, httpSuccessCode );
			let successResponse = this.parseResponse( response, httpSuccessCode, dataKey );

			// HTTP Specific Error
			if( hasError ) {
				let responseError = hasError.statusCode ? '(' + hasError.statusCode + ') ' : '';
				responseError += hasError.data && hasError.data.error ? hasError.data.error : hasError.message ? hasError.message : hasError;

				console.log('MOSRPC.API.Query reject hasError', hasError, responseError);

				// throw new Error( responseError );
				reject(new Error(responseError));

			} else if ( successResponse ){

				resolve(successResponse);


			} else {
				console.log( 'Unkown errorsz');
				reject( new Error( 'Unknown error!' ) );
			}

		});

	});

};

/**
 * Parse Query Errors
 * @param error
 * @param response
 * @param successCode
 * @returns {*}
 */
MOSRPC.API.prototype.parseError = function( error, response, successCode ){

	if( error ){

		if( error.response && error.response.statusCode ){
			error.response.message = error.response.content ? error.response.content : "Unknown Error Content";
			return error.response;
		}

		console.log( 'Non response code error', error );
		return error;

	} else if ( response && response.statusCode && response.statusCode !== successCode ){

		return response;

	} else if ( response && response.data && response.data.error ){

		return response;

	}

	return false;
};


/**
 * Parse Successful Response (and check if should return error)
 * @param response
 * @param successCode
 * @param dataKey
 * @returns {boolean}
 */
MOSRPC.API.prototype.parseResponse = function( response, successCode, dataKey ){

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
/**
 * Save configuration to Device
 * @param config
 * @param options
 * @returns {*}
 */
MOSRPC.API.prototype.setConfig = function(config, options) {

	if( ! config ) return new Error( 'Config is missing!' );
	if( ! options ) options = {};

	// Set data object in options to JSON to configure device with
	let callOptions = { "data": { "config": config } };

	return this.Query( 'POST', '/rpc/Config.Set', callOptions );
};

/**
 * Save Config and Reboot
 * @param config
 * @param options
 * @returns {*}
 */
MOSRPC.API.prototype.saveConfig = function(options) {

	if( ! options ) options = {};

	// Set data object in options to JSON to configure device with
	let callOptions = {
		// data: {
		// 	"reboot": true
		// }
	};

	return this.Query( 'GET', '/rpc/Config.Save', callOptions );
};

/**
 * Reboot Device
 * @param config
 * @param options
 * @returns {*}
 */
MOSRPC.API.prototype.rebootDevice = function(delayMs, options) {

	if( ! options ) options = {};

	// Set data object in options to JSON to configure device with
	let callOptions = { data: {
			"delay": delayMs
		} };

	return this.Query( 'POST', '/rpc/Sys.Reboot', callOptions );
};

/**
 * Get Device Configuration
 * @param options
 * @returns {Promise<void>}
 */
MOSRPC.API.prototype.getConfig = function(getKey) {

	let options = {
		data: {
			key: getKey
		}
	};

	return this.Query( 'POST', '/rpc/Config.Get', options );
};