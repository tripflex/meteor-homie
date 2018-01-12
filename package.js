Package.describe({
    name: 'tripflex:homie',
    version: '0.0.1',
    summary: 'Homie iot configuration and helper methods',
    git: 'https://github.com/tripflex/meteor-homie',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.0');

	Npm.depends({
		"http-errors": '1.6.2'
	});

	api.export('Homie');

    api.use('underscore');
    api.use('ecmascript');

    api.mainModule('homie.js');

	api.addFiles( '.npm/package/node_modules/http-errors/index.js', 'client' );
	api.addFiles( 'utils.js', 'client' );

});