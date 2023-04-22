(function() {
"use strict";

zira.__DEBUG__.didLogInfo.then(function() {

    var modulesInfo = zira.__DEBUG__.js_modules;

    QUnit.module('Zira JS Modules');

    QUnit.test('all modules are properly loaded', function(assert) {
        assert.expect(2);

        assert.deepEqual(modulesInfo.missing, [],
            "no js module should be missing");
        assert.deepEqual(modulesInfo.failed, [],
            "no js module should have failed");
    });

});

})();