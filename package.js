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
        "homie2-config": '2.0.0'
    });

    api.use('ecmascript');
    api.mainModule('homie.js');

    api.export('Homie');
});