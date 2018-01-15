Package.describe({
    name: 'tripflex:homie',
    version: '1.0.0',
    summary: 'Homie IoT API and other misc helper methods',
    git: 'https://github.com/tripflex/meteor-homie',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.0');

    api.use('ecmascript');

    api.mainModule('homie.js');

	api.addFiles( 'utils.js', 'client' );
	api.export('Homie');
});