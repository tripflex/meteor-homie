if( ! Homie ){
	Homie = {};
}

/**
 * Homie Utilities
 * @type {{randomID: Homie.Utils.randomID, remNullProps: Homie.Utils.remNullProps}}
 */
Homie.Utils = {

	/**
	 * Generate Random ID
	 * @param len
	 * @param pattern
	 * @returns {string}
	 */
	randomID: function( len, pattern ){

		let possibilities = ["abcdefghijklmnopqrstuvwxyz","ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789", "~!@#$%^&()_+-={}[];\',"];
		let chars = "";

		pattern = pattern ? pattern : "aA0";
		pattern.split('').forEach(function(a){
			if(!isNaN(parseInt(a))){
				chars += possibilities[2];
			}else if(/[a-z]/.test(a)){
				chars += possibilities[0];
			}else if(/[A-Z]/.test(a)){
				chars += possibilities[1];
			}else{
				chars += possibilities[3];
			}
		});

		len = len ? len : 30;

		let result = '';

		while(len--){
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}

		return result;
	},
	/**
	 * Remove NULL properties
	 * @param test
	 * @param recurse
	 */
	remNullProps: function(test, recurse){

		for (let i in test) {
			if ( test.hasOwnProperty(i) && test[i] === null) {
				delete test[i];
			} else if (recurse && typeof test[i] === 'object') {
				this.remNullProps(test[i], recurse);
			}
		}
	},
};