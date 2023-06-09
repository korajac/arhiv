zira.define('website.tour.customize', function (require) {
'use strict';

var core = require('web.core');
var tour = require('web_tour.tour');
var base = require('web_editor.base');

var _t = core._t;

tour.register('theme_customize', {
    url: '/',
    wait_for: base.ready(),
}, [{
    trigger: 'button.o_theme_customize_color_primary, button.o_theme_customize_color_alpha',
    content: _t("Click here to choose your main branding color.<br/>It will recompute the palette with suggested matching colors."),
    position: 'bottom',
}]);
});
