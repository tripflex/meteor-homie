Package.describe({
    name: 'tripflex:mos-rpc',
    version: '1.0.0',
    summary: 'Mongoose OS RPC IoT API and other misc helper methods',
    git: 'https://github.com/tripflex/meteor-mos-rpc',
    documentation: 'README.md'
});

Package.onUse(function(api) {
    api.versionsFrom('1.2.1');

    api.use('ecmascript');

    api.mainModule('mos-rpc.js');

	api.addFiles( 'utils.js', 'client' );
	api.export('MOSRPC');
});