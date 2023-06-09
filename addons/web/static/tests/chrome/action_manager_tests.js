zira.define('web.action_manager_tests', function (require) {
"use strict";

var ReportClientAction = require('report.client_action');
var NotificationService = require('web.NotificationService');
var AbstractAction = require('web.AbstractAction');
var AbstractStorageService = require('web.AbstractStorageService');
var BasicFields = require('web.basic_fields');
var ControlPanelMixin = require('web.ControlPanelMixin');
var core = require('web.core');
var ListController = require('web.ListController');
var StandaloneFieldManagerMixin = require('web.StandaloneFieldManagerMixin');
var RamStorage = require('web.RamStorage');
var ReportService = require('web.ReportService');
var SessionStorageService = require('web.SessionStorageService');
var testUtils = require('web.test_utils');
var Widget = require('web.Widget');
var createActionManager = testUtils.createActionManager;

QUnit.module('ActionManager', {
    beforeEach: function () {
        this.data = {
            partner: {
                fields: {
                    foo: {string: "Foo", type: "char"},
                    bar: {string: "Bar", type: "many2one", relation: 'partner'},
                },
                records: [
                    {id: 1, display_name: "First record", foo: "yop", bar: 2},
                    {id: 2, display_name: "Second record", foo: "blip", bar: 1},
                    {id: 3, display_name: "Third record", foo: "gnap", bar: 1},
                    {id: 4, display_name: "Fourth record", foo: "plop", bar: 2},
                    {id: 5, display_name: "Fifth record", foo: "zoup", bar: 2},
                ],
            },
            pony: {
                fields: {
                    name: {string: 'Name', type: 'char'},
                },
                records: [
                    {id: 4, name: 'Twilight Sparkle'},
                    {id: 6, name: 'Applejack'},
                    {id: 9, name: 'Fluttershy'}
                ],
            },
        };

        this.actions = [{
            id: 1,
            name: 'Partners Action 1',
            res_model: 'partner',
            type: 'ir.actions.act_window',
            views: [[1, 'kanban']],
        }, {
            id: 2,
            type: 'ir.actions.server',
        }, {
            id: 3,
            name: 'Partners',
            res_model: 'partner',
            type: 'ir.actions.act_window',
            views: [[false, 'list'], [1, 'kanban'], [false, 'form']],
        }, {
            id: 4,
            name: 'Partners Action 4',
            res_model: 'partner',
            type: 'ir.actions.act_window',
            views: [[1, 'kanban'], [2, 'list'], [false, 'form']],
        }, {
            id: 5,
            name: 'Create a Partner',
            res_model: 'partner',
            target: 'new',
            type: 'ir.actions.act_window',
            views: [[false, 'form']],
        }, {
            id: 6,
            name: 'Partner',
            res_id: 2,
            res_model: 'partner',
            target: 'inline',
            type: 'ir.actions.act_window',
            views: [[false, 'form']],
        }, {
            id: 7,
            name: "Some Report",
            report_name: 'some_report',
            report_type: 'qweb-pdf',
            type: 'ir.actions.report',
        }, {
            id: 8,
            name: 'Favorite Ponies',
            res_model: 'pony',
            type: 'ir.actions.act_window',
            views: [[false, 'list'], [false, 'form']],
        }, {
            id: 9,
            name: 'A Client Action',
            tag: 'ClientAction',
            type: 'ir.actions.client',
        }, {
            id: 10,
            type: 'ir.actions.act_window_close',
        }, {
            id: 11,
            name: "Another Report",
            report_name: 'another_report',
            report_type: 'qweb-pdf',
            type: 'ir.actions.report',
            close_on_report_download: true,
        }];

        this.archs = {
            // kanban views
            'partner,1,kanban': '<kanban><templates><t t-name="kanban-box">' +
                    '<div class="oe_kanban_global_click"><field name="foo"/></div>' +
                '</t></templates></kanban>',

            // list views
            'partner,false,list': '<tree><field name="foo"/></tree>',
            'partner,2,list': '<tree limit="3"><field name="foo"/></tree>',
            'pony,false,list': '<tree><field name="name"/></tree>',

            // form views
            'partner,false,form': '<form>' +
                    '<header>' +
                        '<button name="object" string="Call method" type="object"/>' +
                        '<button name="4" string="Execute action" type="action"/>' +
                    '</header>' +
                    '<group>' +
                        '<field name="display_name"/>' +
                        '<field name="foo"/>' +
                    '</group>' +
                '</form>',
            'pony,false,form': '<form>' +
                    '<field name="name"/>' +
                '</form>',

            // search views
            'partner,false,search': '<search><field name="foo" string="Foo"/></search>',
            'partner,1,search': '<search>' +
                   '<filter name="bar" help="Bar" domain="[(\'bar\', \'=\', 1)]"/>' +
                '</search>',
            'pony,false,search': '<search></search>',
        };
    },
}, function () {
    QUnit.module('Misc');

    QUnit.test('breadcrumbs and actions with target inline', function (assert) {
        assert.expect(3);

        this.actions[3].views = [[false, 'form']];
        this.actions[3].target = 'inline';

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        actionManager.doAction(4);
        assert.ok(!$('.o_control_panel').is(':visible'),
            "control panel should not be visible");

        actionManager.doAction(1, {clear_breadcrumbs: true});
        assert.ok($('.o_control_panel').is(':visible'),
            "control panel should now be visible");
        assert.strictEqual($('.o_control_panel .breadcrumb').text(), "Partners Action 1",
            "should have only one current action visible in breadcrumbs");

        actionManager.destroy();
    });

    QUnit.test('no widget memory leaks when doing some action stuff', function (assert) {
        assert.expect(1);

        var delta = 0;
        testUtils.patch(Widget, {
            init: function () {
                delta++;
                this._super.apply(this, arguments);
            },
            destroy: function () {
                delta--;
                this._super.apply(this, arguments);
            },
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(8);

        var n = delta;
        actionManager.doAction(4);
        // kanban view is loaded, switch to list view
        $('.o_control_panel .o_cp_switch_list').click();
        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        // go back to action 7 in breadcrumbs
        $('.o_control_panel .breadcrumb a:first').click();

        assert.strictEqual(delta, n,
            "should have properly destroyed all other widgets");
        actionManager.destroy();
        testUtils.unpatch(Widget);
    });

    QUnit.test('no widget memory leaks when executing actions in dialog', function (assert) {
        assert.expect(1);

        var delta = 0;
        testUtils.patch(Widget, {
            init: function () {
                delta++;
                this._super.apply(this, arguments);
            },
            destroy: function () {
                if (!this.isDestroyed()) {
                    delta--;
                }
                this._super.apply(this, arguments);
            },
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        var n = delta;

        actionManager.doAction(5);
        actionManager.doAction({type: 'ir.actions.act_window_close'});

        assert.strictEqual(delta, n,
            "should have properly destroyed all widgets");

        actionManager.destroy();
        testUtils.unpatch(Widget);
    });

    QUnit.test('no memory leaks when executing an action while switching view', function (assert) {
        assert.expect(1);

        var def;
        var delta = 0;
        testUtils.patch(Widget, {
            init: function () {
                delta += 1;
                this._super.apply(this, arguments);
            },
            destroy: function () {
                delta -= 1;
                this._super.apply(this, arguments);
            },
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                var result = this._super.apply(this, arguments);
                if (args.method === 'read') {
                    return $.when(def).then(_.constant(result));
                }
                return result;
            },
        });

        actionManager.doAction(4);
        var n = delta;

        actionManager.doAction(3, {clear_breadcrumbs: true});

        // switch to the form view (this request is blocked)
        def = $.Deferred();
        actionManager.$('.o_list_view .o_data_row:first').click();

        // execute another action meanwhile (don't block this request)
        actionManager.doAction(4, {clear_breadcrumbs: true});

        // unblock the switch to the form view in action 3
        def.resolve();

        assert.strictEqual(n, delta,
            "all widgets of action 3 should have been destroyed");

        actionManager.destroy();
        testUtils.unpatch(Widget);
    });

    QUnit.test('no memory leaks when executing an action while loading views', function (assert) {
        assert.expect(1);

        var def;
        var delta = 0;
        testUtils.patch(Widget, {
            init: function () {
                delta += 1;
                this._super.apply(this, arguments);
            },
            destroy: function () {
                delta -= 1;
                this._super.apply(this, arguments);
            },
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
               var result = this._super.apply(this, arguments);
                if (args.method === 'load_views') {
                    return $.when(def).then(_.constant(result));
                }
                return result;
            },
        });

        // execute action 4 to know the number of widgets it instantiates
        actionManager.doAction(4);
        var n = delta;

        // execute a first action (its 'load_views' RPC is blocked)
        def = $.Deferred();
        actionManager.doAction(3, {clear_breadcrumbs: true});

        // execute another action meanwhile (and unlock the RPC)
        actionManager.doAction(4, {clear_breadcrumbs: true});
        def.resolve();

        assert.strictEqual(n, delta,
            "all widgets of action 3 should have been destroyed");

        actionManager.destroy();
        testUtils.unpatch(Widget);
    });

    QUnit.test('no memory leaks when executing an action while loading data of default view', function (assert) {
        assert.expect(1);

        var def;
        var delta = 0;
        testUtils.patch(Widget, {
            init: function () {
                delta += 1;
                this._super.apply(this, arguments);
            },
            destroy: function () {
                delta -= 1;
                this._super.apply(this, arguments);
            },
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route) {
                var result = this._super.apply(this, arguments);
                if (route === '/web/dataset/search_read') {
                    return $.when(def).then(_.constant(result));
                }
                return result;
            },
        });

        // execute action 4 to know the number of widgets it instantiates
        actionManager.doAction(4);
        var n = delta;

        // execute a first action (its 'search_read' RPC is blocked)
        def = $.Deferred();
        actionManager.doAction(3, {clear_breadcrumbs: true});

        // execute another action meanwhile (and unlock the RPC)
        actionManager.doAction(4, {clear_breadcrumbs: true});
        def.resolve();

        assert.strictEqual(n, delta,
            "all widgets of action 3 should have been destroyed");

        actionManager.destroy();
        testUtils.unpatch(Widget);
    });

    QUnit.test('action with "no_breadcrumbs" set to true', function (assert) {
        assert.expect(2);

        _.findWhere(this.actions, {id: 4}).context = {no_breadcrumbs: true};

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");

        // push another action flagged with 'no_breadcrumbs=true'
        actionManager.doAction(4);
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 0,
            "the breadcrumbs should be empty");

        actionManager.destroy();
    });

    QUnit.test('on_reverse_breadcrumb handler is correctly called', function (assert) {
        assert.expect(3);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        // execute action 3 and open a record in form view
        actionManager.doAction(3);
        actionManager.$('.o_list_view .o_data_row:first').click();

        // execute action 4 without 'on_reverse_breadcrumb' handler, then go back
        actionManager.doAction(4);
        $('.o_control_panel .breadcrumb a:first').click();
        assert.verifySteps([]);

        // execute action 4 with an 'on_reverse_breadcrumb' handler, then go back
        actionManager.doAction(4, {
            on_reverse_breadcrumb: function () {
                assert.step('on_reverse_breadcrumb');
            }
        });
        $('.o_control_panel .breadcrumb a:first').click();
        assert.verifySteps(['on_reverse_breadcrumb']);

        actionManager.destroy();
    });

    QUnit.test('handles "history_back" event', function (assert) {
        assert.expect(2);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        actionManager.doAction(4);
        actionManager.doAction(3);
        actionManager.trigger_up('history_back');

        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').text(), 'Partners Action 4',
            "breadcrumbs should display the display_name of the action");

        actionManager.destroy();
    });

    QUnit.test('stores and restores scroll position', function (assert) {
        assert.expect(7);

        var left;
        var top;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                getScrollPosition: function (ev) {
                    assert.step('getScrollPosition');
                    ev.data.callback({left: left, top: top});
                },
                scrollTo: function (ev) {
                    assert.step('scrollTo left ' + ev.data.left + ', top ' + ev.data.top);
                },
            },
        });

        // execute a first action and simulate a scroll
        assert.step('execute action 3');
        actionManager.doAction(3);
        left = 50;
        top = 100;

        // execute a second action (in which we don't scroll)
        assert.step('execute action 4');
        actionManager.doAction(4);

        // go back using the breadcrumbs
        assert.step('go back to action 3');
        $('.o_control_panel .breadcrumb a').click();

        assert.verifySteps([
            'execute action 3',
            'execute action 4',
            'getScrollPosition', // of action 3, before leaving it
            'go back to action 3',
            'getScrollPosition', // of action 4, before leaving it
            'scrollTo left 50, top 100', // restore scroll position of action 3
        ]);

        actionManager.destroy();
    });

    QUnit.module('Push State');

    QUnit.test('properly push state', function (assert) {
        assert.expect(3);

        var stateDescriptions = [
            {action: 4, model: "partner", title: "Partners Action 4", view_type: "kanban"},
            {action: 8, model: "pony", title: "Favorite Ponies", view_type: "list"},
            {action: 8, id: 4, model: "pony", title: "Twilight Sparkle", view_type: "form"},
        ];

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                push_state: function (event) {
                    var descr = stateDescriptions.shift();
                    assert.deepEqual(_.extend({}, event.data.state), descr,
                        "should notify the environment of new state");
                },
            },
        });
        actionManager.doAction(4);
        actionManager.doAction(8);
        actionManager.$('tr.o_data_row:first').click();

        actionManager.destroy();
    });

    QUnit.test('push state after action is loaded, not before', function (assert) {
        assert.expect(5);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                push_state: function () {
                    assert.step('push_state');
                },
            },
            mockRPC: function (route) {
                assert.step(route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(4);
        assert.verifySteps([
            '/web/action/load',
            '/web/dataset/call_kw/partner',
            '/web/dataset/search_read',
            'push_state'
        ]);

        actionManager.destroy();
    });

    QUnit.test('do not push state for actions in target=new', function (assert) {
        assert.expect(3);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                push_state: function () {
                    assert.step('push_state');
                },
            },
        });
        actionManager.doAction(4);
        assert.verifySteps(['push_state']);
        actionManager.doAction(5);
        assert.verifySteps(['push_state']);

        actionManager.destroy();
    });

    QUnit.test('do not push state when action fails', function (assert) {
        assert.expect(4);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                push_state: function () {
                    assert.step('push_state');
                },
            },
            mockRPC: function (route, args) {
                if (args.method === 'read') {
                    // this is the rpc to load form view
                    return $.Deferred().reject();
                }
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(8);
        assert.verifySteps(['push_state']);
        actionManager.$('tr.o_data_row:first').click();
        assert.verifySteps(['push_state']);
        // we make sure here that the list view is still in the dom
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "there should still be a list view in dom");

        actionManager.destroy();
    });

    QUnit.module('Load State');

    QUnit.test('should not crash on invalid state', function (assert) {
        assert.expect(2);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.loadState({
            res_model: 'partner', // the valid key for the model is 'model', not 'res_model'
        });

        assert.strictEqual(actionManager.$el.text(), '', "should display nothing");
        assert.verifySteps([]);

        actionManager.destroy();
    });

    QUnit.test('properly load client actions', function (assert) {
        assert.expect(2);

        var ClientAction = AbstractAction.extend({
            className: 'o_client_action_test',
            start: function () {
                this.$el.text('Hello World');
            },
        });
        core.action_registry.add('HelloWorldTest', ClientAction);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.loadState({
            action: 'HelloWorldTest',
        });

        assert.strictEqual(actionManager.$('.o_client_action_test').text(),
            'Hello World', "should have correctly rendered the client action");

        assert.verifySteps([]);

        actionManager.destroy();
        delete core.action_registry.map.HelloWorldTest;
    });

    QUnit.test('properly load act window actions', function (assert) {
        assert.expect(6);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.loadState({
            action: 1,
        });

        assert.strictEqual($('.o_control_panel').length, 1,
            "should have rendered a control panel");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should have rendered a kanban view");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read',
        ]);

        actionManager.destroy();
    });

    QUnit.test('properly load records', function (assert) {
        assert.expect(5);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.loadState({
            id: 2,
            model: 'partner',
        });

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should have rendered a form view");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').text(), 'Second record',
            "should have opened the second record");

        assert.verifySteps([
            'load_views',
            'read',
        ]);

        actionManager.destroy();
    });

    QUnit.test('load requested view for act window actions', function (assert) {
        assert.expect(6);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.loadState({
            action: 3,
            view_type: 'kanban',
        });

        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should not have rendered a list view");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should have rendered a kanban view");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read',
        ]);

        actionManager.destroy();
    });

    QUnit.test('lazy load multi record view if mono record one is requested', function (assert) {
        assert.expect(11);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.loadState({
            action: 3,
            id: 2,
            view_type: 'form',
        });

        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should not have rendered a list view");
        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should have rendered a form view");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should be two controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'Second record',
            "breadcrumbs should contain the display_name of the opened record");

        // go back to Lst
        $('.o_control_panel .breadcrumb a').click();
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should now display the list view");
        assert.strictEqual(actionManager.$('.o_form_view').length, 0,
            "should not display the form view anymore");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            'read', // read the opened record
            '/web/dataset/search_read', // search read when coming back to List
        ]);

        actionManager.destroy();
    });

    QUnit.test('lazy load multi record view with previous action', function (assert) {
        assert.expect(6);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            debug: 1,
        });
        actionManager.doAction(4);

        assert.strictEqual($('.o_control_panel .breadcrumb li').length, 1,
            "there should be one controller in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb li').text(), 'Partners Action 4',
            "breadcrumbs should contain the display_name of the opened record");

        actionManager.doAction(3, {
            resID: 2,
            viewType: 'form',
        });

        assert.strictEqual($('.o_control_panel .breadcrumb li').length, 3,
            "there should be three controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb li').text(), 'Partners Action 4PartnersSecond record',
            "the breadcrumb elements should be correctly ordered");

        // go back to List
        $('.o_control_panel .breadcrumb a:last').click();

        assert.strictEqual($('.o_control_panel .breadcrumb li').length, 2,
            "there should be two controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb li').text(), 'Partners Action 4Partners',
            "the breadcrumb elements should be correctly ordered");

        actionManager.destroy();
    });

    QUnit.test('change the viewType of the current action', function (assert) {
        assert.expect(13);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(3);

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should have rendered a list view");

        // switch to kanban view
        actionManager.loadState({
            action: 3,
            view_type: 'kanban',
        });

        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should not display the list view anymore");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should have switched to the kanban view");

        // switch to form view, open record 4
        actionManager.loadState({
            action: 3,
            id: 4,
            view_type: 'form',
        });

        assert.strictEqual(actionManager.$('.o_kanban_view').length, 0,
            "should not display the kanban view anymore");
        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should have switched to the form view");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should be two controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'Fourth record',
            "should have opened the requested record");

        // verify steps to ensure that the whole action hasn't been re-executed
        // (if it would have been, /web/action/load and load_views would appear
        // several times)
        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read', // list view
            '/web/dataset/search_read', // kanban view
            'read', // form view
        ]);

        actionManager.destroy();
    });

    QUnit.test('change the id of the current action', function (assert) {
        assert.expect(11);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });

        // execute action 3 and open the first record in a form view
        actionManager.doAction(3);
        actionManager.$('.o_list_view .o_data_row:first').click();

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should have rendered a form view");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'First record',
            "should have opened the first record");

        // switch to record 4
        actionManager.loadState({
            action: 3,
            id: 4,
            view_type: 'form',
        });

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should still display the form view");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should be two controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'Fourth record',
            "should have switched to the requested record");

        // verify steps to ensure that the whole action hasn't been re-executed
        // (if it would have been, /web/action/load and load_views would appear
        // twice)
        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read', // list view
            'read', // form view, record 1
            'read', // form view, record 4
        ]);

        actionManager.destroy();
    });

    QUnit.test('should not push a loaded state', function (assert) {
        assert.expect(3);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                push_state: function () {
                    assert.step('push_state');
                },
            },
        });
        actionManager.loadState({action: 3});

        assert.verifySteps([], "should not push the loaded state");

        actionManager.$('tr.o_data_row:first').click();

        assert.verifySteps(['push_state'],
            "should push the state of it changes afterwards");

        actionManager.destroy();
    });

    QUnit.test('should not push a loaded state of a client action', function (assert) {
        assert.expect(4);

        var ClientAction = Widget.extend({
            init: function (parent, action, options) {
                this._super.apply(this, arguments);
                this.controllerID = options.controllerID;
            },
            start: function () {
                var self = this;
                var $button = $('<button>').text('Click Me!');
                $button.on('click', function () {
                    self.trigger_up('push_state', {
                        controllerID: self.controllerID,
                        state: {someValue: 'X'},
                    });
                });
                this.$el.append($button);
                return this._super.apply(this, arguments);
            },
        });
        core.action_registry.add('ClientAction', ClientAction);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                push_state: function (ev) {
                    assert.step('push_state');
                    assert.deepEqual(ev.data.state, {
                        action: 9,
                        someValue: 'X',
                        title: 'A Client Action',
                    });
                },
            },
        });
        actionManager.loadState({action: 9});

        assert.verifySteps([], "should not push the loaded state");

        actionManager.$('button').click();

        assert.verifySteps(['push_state'],
            "should push the state of it changes afterwards");

        actionManager.destroy();
    });

    QUnit.test('change a param of an ir.actions.client in the url', function (assert) {
        assert.expect(7);

        var ClientAction = AbstractAction.extend(ControlPanelMixin, {
            className: 'o_client_action',
            init: function (parent, action) {
                this._super.apply(this, arguments);
                var context = action.context;
                this.a = context.params && context.params.a || 'default value';
            },
            start: function () {
                assert.step('start');
                this.$el.text(this.a);
                this.trigger_up('push_state', {
                    controllerID: this.controllerID,
                    state: {a: this.a},
                });
            },
        });
        core.action_registry.add('ClientAction', ClientAction);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        // execute the client action
        actionManager.doAction(9);

        assert.strictEqual(actionManager.$('.o_client_action').text(), 'default value',
            "should have rendered the client action");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");

        // update param 'a' in the url
        actionManager.loadState({
            action: 9,
            a: 'new value',
        });

        assert.strictEqual(actionManager.$('.o_client_action').text(), 'new value',
            "should have rerendered the client action with the correct param");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should still be one controller in the breadcrumbs");

        // should have executed the client action twice
        assert.verifySteps(['start', 'start']);

        actionManager.destroy();
        delete core.action_registry.map.ClientAction;
    });

    QUnit.test('load a window action without id (in a multi-record view)', function (assert) {
        assert.expect(14);

        var RamStorageService = AbstractStorageService.extend({
            storage: new RamStorage(),
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            services: {
                session_storage: RamStorageService,
            },
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });

        testUtils.intercept(actionManager, 'call_service', function (ev) {
            if (ev.data.service === 'session_storage') {
                assert.step(ev.data.method);
            }
        }, true);

        actionManager.doAction(4);

        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should display a kanban view");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').text(), 'Partners Action 4',
            "breadcrumbs should display the display_name of the action");

        actionManager.loadState({
            model: 'partner',
            view_type: 'list',
        });

        assert.strictEqual($('.o_control_panel .breadcrumb-item').text(), 'Partners Action 4',
            "should still be in the same action");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 0,
            "should no longer display a kanban view");
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display a list view");

        assert.verifySteps([
            '/web/action/load', // action 3
            'load_views', // action 3
            '/web/dataset/search_read', // action 3
            'setItem', // action 3
            'getItem', // loadState
            'load_views', // loaded action
            '/web/dataset/search_read', // loaded action
            'setItem', // loaded action
        ]);

        actionManager.destroy();
    });

    QUnit.test('state.sa should load action from session', function (assert) {
        assert.expect(1);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                if (route === '/web/session/get_session_action') {
                    return $.when(1);
                }
                return this._super.apply(this, arguments);
            },
        });
        actionManager.loadState({
            sa: 1,
        });

        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should have rendered a kanban view");

        actionManager.destroy();
    });

    QUnit.test('state with integer active_ids should not crash', function (assert) {
        assert.expect(0);

        var actionManager = createActionManager({
            actions: this.actions,
            mockRPC: function (route, args) {
                if (route === '/web/action/run') {
                    return $.when();
                }
                return this._super.apply(this, arguments);
            },
        });
        actionManager.loadState({
            action: 2,
            active_ids: 3,
        });

        actionManager.destroy();
    });

    QUnit.module('Concurrency management');

    QUnit.test('drop previous actions if possible', function (assert) {
        assert.expect(6);

        var def = $.Deferred();
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route) {
                var result = this._super.apply(this, arguments);
                assert.step(route);
                if (route === '/web/action/load') {
                    return def.then(_.constant(result));
                }
                return result;
            },
        });
        actionManager.doAction(4);
        actionManager.doAction(8);

        def.resolve();

        // action 4 loads a kanban view first, 6 loads a list view. We want a list
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            'there should be a list view in DOM');

        assert.verifySteps([
            '/web/action/load',  // load action 4
            '/web/action/load', // load action 6
            '/web/dataset/call_kw/pony', // load views for action 6
            '/web/dataset/search_read', // search read for list view action 6
        ]);

        actionManager.destroy();
    });

    QUnit.test('handle switching view and switching back on slow network', function (assert) {
        assert.expect(8);

        var def = $.Deferred();
        var defs = [$.when(), def, $.when()];

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route) {
                assert.step(route);
                var result = this._super.apply(this, arguments);
                if (route === '/web/dataset/search_read') {
                    var def = defs.shift();
                    return def.then(_.constant(result));
                }
                return result;
            },
        });
        actionManager.doAction(4);

        // kanban view is loaded, switch to list view
        $('.o_control_panel .o_cp_switch_list').click();

        // here, list view is not ready yet, because def is not resolved
        // switch back to kanban view
        $('.o_control_panel .o_cp_switch_kanban').click();

        // here, we want the kanban view to reload itself, regardless of list view
        assert.verifySteps([
            "/web/action/load",             // initial load action
            "/web/dataset/call_kw/partner", // load views
            "/web/dataset/search_read",     // search_read for kanban view
            "/web/dataset/search_read",     // search_read for list view (not resolved yet)
            "/web/dataset/search_read"      // search_read for kanban view reload (not resolved yet)
        ]);

        // we resolve def => list view is now ready (but we want to ignore it)
        def.resolve();

        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "there should be a kanban view in dom");
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "there should not be a list view in dom");

        actionManager.destroy();
    });

    QUnit.test('when an server action takes too much time...', function (assert) {
        assert.expect(1);

        var def = $.Deferred();

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route) {
                if (route === '/web/action/run') {
                    return def.then(_.constant(1));
                }
                return this._super.apply(this, arguments);
            },
        });

        actionManager.doAction(2);
        actionManager.doAction(4);

        def.resolve();

        assert.strictEqual($('.o_control_panel .breadcrumb-item.active').text(), 'Partners Action 4',
            'action 4 should be loaded');

        actionManager.destroy();
    });

    QUnit.test('clicking quickly on breadcrumbs...', function (assert) {
        assert.expect(1);

        var def = $.when();

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                var result = this._super.apply(this, arguments);
                if (args.method === 'read') {
                    return def.then(_.constant(result));
                }
                return result;
            },
        });

        // create a situation with 3 breadcrumbs: kanban/form/list
        actionManager.doAction(4);
        actionManager.$('.o_kanban_record:first').click();
        actionManager.doAction(8);

        // now, the next read operations will be deferred (this is the read
        // operation for the form view reload)
        def = $.Deferred();

        // click on the breadcrumbs for the form view, then on the kanban view
        // before the form view is fully reloaded
        $('.o_control_panel .breadcrumb-item:eq(1)').click();
        $('.o_control_panel .breadcrumb-item:eq(0)').click();

        // resolve the form view read
        def.resolve();

        assert.strictEqual($('.o_control_panel .breadcrumb-item.active').text(), 'Partners Action 4',
            'action 4 should be loaded and visible');

        actionManager.destroy();
    });

    QUnit.test('execute a new action while loading a lazy-loaded controller', function (assert) {
        assert.expect(15);

        var def;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                var result = this._super.apply(this, arguments);
                assert.step(args.method || route);
                if (route === '/web/dataset/search_read' && args.model === 'partner') {
                    return $.when(def).then(_.constant(result));
                }
                return result;
            },
        });
        actionManager.loadState({
            action: 4,
            id: 2,
            view_type: 'form',
        });

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should display the form view of action 4");

        // click to go back to Kanban (this request is blocked)
        def = $.Deferred();
        $('.o_control_panel .breadcrumb a').click();

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should still display the form view of action 4");

        // execute another action meanwhile (don't block this request)
        actionManager.doAction(8, {clear_breadcrumbs: true});

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display action 8");
        assert.strictEqual(actionManager.$('.o_form_view').length, 0,
            "should no longer display the form view");

        assert.verifySteps([
            '/web/action/load', // load state action 4
            'load_views', // load state action 4
            'read', // read the opened record (action 4)
            '/web/dataset/search_read', // blocked search read when coming back to Kanban (action 4)
            '/web/action/load', // action 8
            'load_views', // action 8
            '/web/dataset/search_read', // search read action 8
        ]);

        // unblock the switch to Kanban in action 4
        def.resolve();

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should still display action 8");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 0,
            "should not display the kanban view of action 4");

        assert.verifySteps([
            '/web/action/load', // load state action 4
            'load_views', // load state action 4
            'read', // read the opened record (action 4)
            '/web/dataset/search_read', // blocked search read when coming back to Kanban (action 4)
            '/web/action/load', // action 8
            'load_views', // action 8
            '/web/dataset/search_read', // search read action 8
        ]);

        actionManager.destroy();
    });

    QUnit.test('execute a new action while handling a call_button', function (assert) {
        assert.expect(16);

        var self = this;
        var def = $.Deferred();
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                if (route === '/web/dataset/call_button') {
                    return def.then(_.constant(self.actions[0]));
                }
                return this._super.apply(this, arguments);
            },
        });

        // execute action 3 and open a record in form view
        actionManager.doAction(3);
        actionManager.$('.o_list_view .o_data_row:first').click();

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should display the form view of action 3");

        // click on 'Call method' button (this request is blocked)
        actionManager.$('.o_form_view button:contains(Call method)').click();

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should still display the form view of action 3");

        // execute another action
        actionManager.doAction(8, {clear_breadcrumbs: true});

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display the list view of action 8");
        assert.strictEqual(actionManager.$('.o_form_view').length, 0,
            "should no longer display the form view");

        assert.verifySteps([
            '/web/action/load', // action 3
            'load_views', // action 3
            '/web/dataset/search_read', // list for action 3
            'read', // form for action 3
            'object', // click on 'Call method' button (this request is blocked)
            '/web/action/load', // action 8
            'load_views', // action 8
            '/web/dataset/search_read', // list for action 8
        ]);

        // unblock the call_button request
        def.resolve();

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should still display the list view of action 8");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 0,
            "should not display action 1");

        assert.verifySteps([
            '/web/action/load', // action 3
            'load_views', // action 3
            '/web/dataset/search_read', // list for action 3
            'read', // form for action 3
            'object', // click on 'Call method' button (this request is blocked)
            '/web/action/load', // action 8
            'load_views', // action 8
            '/web/dataset/search_read', // list for action 8
        ]);

        actionManager.destroy();
    });

    QUnit.test('execute a new action while switching to another controller', function (assert) {
        assert.expect(15);

        var def;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                var result = this._super.apply(this, arguments);
                assert.step(args.method || route);
                if (args.method === 'read') {
                    return $.when(def).then(_.constant(result));
                }
                return result;
            },
        });

        actionManager.doAction(3);

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display the list view of action 3");

        // switch to the form view (this request is blocked)
        def = $.Deferred();
        actionManager.$('.o_list_view .o_data_row:first').click();

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should still display the list view of action 3");

        // execute another action meanwhile (don't block this request)
        actionManager.doAction(4, {clear_breadcrumbs: true});

        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should display the kanban view of action 8");
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should no longer display the list view");

        assert.verifySteps([
            '/web/action/load', // action 3
            'load_views', // action 3
            '/web/dataset/search_read', // search read of list view of action 3
            'read', // read the opened record of action 3 (this request is blocked)
            '/web/action/load', // action 4
            'load_views', // action 4
            '/web/dataset/search_read', // search read action 4
        ]);

        // unblock the switch to the form view in action 3
        def.resolve();

        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should still display the kanban view of action 8");
        assert.strictEqual(actionManager.$('.o_form_view').length, 0,
            "should not display the form view of action 3");

        assert.verifySteps([
            '/web/action/load', // action 3
            'load_views', // action 3
            '/web/dataset/search_read', // search read of list view of action 3
            'read', // read the opened record of action 3 (this request is blocked)
            '/web/action/load', // action 4
            'load_views', // action 4
            '/web/dataset/search_read', // search read action 4
        ]);

        actionManager.destroy();
    });

    QUnit.test('execute a new action while loading views', function (assert) {
        assert.expect(10);

        var def;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                var result = this._super.apply(this, arguments);
                assert.step(args.method || route);
                if (args.method === 'load_views') {
                    return $.when(def).then(_.constant(result));
                }
                return result;
            },
        });

        // execute a first action (its 'load_views' RPC is blocked)
        def = $.Deferred();
        actionManager.doAction(3);

        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should not display the list view of action 3");

        // execute another action meanwhile (and unlock the RPC)
        actionManager.doAction(4);
        def.resolve();

        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should display the kanban view of action 4");
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should not display the list view of action 3");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");

        assert.verifySteps([
            '/web/action/load', // action 3
            'load_views', // action 3
            '/web/action/load', // action 4
            'load_views', // action 4
            '/web/dataset/search_read', // search read action 4
        ]);

        actionManager.destroy();
    });

    QUnit.test('execute a new action while loading data of default view', function (assert) {
        assert.expect(11);

        var def;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                var result = this._super.apply(this, arguments);
                assert.step(args.method || route);
                if (route === '/web/dataset/search_read') {
                    return $.when(def).then(_.constant(result));
                }
                return result;
            },
        });

        // execute a first action (its 'search_read' RPC is blocked)
        def = $.Deferred();
        actionManager.doAction(3);

        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should not display the list view of action 3");

        // execute another action meanwhile (and unlock the RPC)
        actionManager.doAction(4);
        def.resolve();

        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should display the kanban view of action 4");
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should not display the list view of action 3");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");

        assert.verifySteps([
            '/web/action/load', // action 3
            'load_views', // action 3
            '/web/dataset/search_read', // search read action 3
            '/web/action/load', // action 4
            'load_views', // action 4
            '/web/dataset/search_read', // search read action 4
        ]);

        actionManager.destroy();
    });

    QUnit.test('open a record while reloading the list view', function (assert) {
        assert.expect(12);

        var def;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route) {
                var result = this._super.apply(this, arguments);
                if (route === '/web/dataset/search_read') {
                    return $.when(def).then(_.constant(result));
                }
                return result;
            },
        });

        actionManager.doAction(3);

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display the list view");
        assert.strictEqual(actionManager.$('.o_list_view .o_data_row').length, 5,
            "list view should contain 5 records");
        assert.strictEqual($('.o_control_panel .o_list_buttons').length, 1,
            "list view buttons should be displayed in control panel");

        // reload (the search_read RPC will be blocked)
        def = $.Deferred();
        $('.o_control_panel .o_cp_switch_list').click(); // click on the switch button

        assert.strictEqual(actionManager.$('.o_list_view .o_data_row').length, 5,
            "list view should still contain 5 records");
        assert.strictEqual($('.o_control_panel .o_list_buttons').length, 1,
            "list view buttons should still be displayed in control panel");

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should display the form view");
        assert.strictEqual($('.o_control_panel .o_list_buttons').length, 0,
            "list view buttons should no longer be displayed in control panel");
        assert.strictEqual($('.o_control_panel .o_form_buttons_view').length, 1,
            "form view buttons should be displayed instead");

        // unblock the search_read RPC
        def.resolve();

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should display the form view");
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should not display the list view");
        assert.strictEqual($('.o_control_panel .o_list_buttons').length, 0,
            "list view buttons should still not be displayed in control panel");
        assert.strictEqual($('.o_control_panel .o_form_buttons_view').length, 1,
            "form view buttons should still be displayed instead");

        actionManager.destroy();
    });

    QUnit.module('Client Actions');

    QUnit.test('can execute client actions from tag name', function (assert) {
        assert.expect(3);

        var ClientAction = AbstractAction.extend({
            className: 'o_client_action_test',
            start: function () {
                this.$el.text('Hello World');
            },
        });
        core.action_registry.add('HelloWorldTest', ClientAction);

        var actionManager = createActionManager({
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            }
        });
        actionManager.doAction('HelloWorldTest');

        assert.strictEqual($('.o_control_panel:visible').length, 0, // AAB: global selector until the ControlPanel is moved from ActionManager to the Views
            "shouldn't have rendered a control panel");
        assert.strictEqual(actionManager.$('.o_client_action_test').text(),
            'Hello World', "should have correctly rendered the client action");
        assert.verifySteps([]);

        actionManager.destroy();
        delete core.action_registry.map.HelloWorldTest;
    });

    QUnit.test('client action with control panel', function (assert) {
        assert.expect(4);

        var ClientAction = AbstractAction.extend(ControlPanelMixin, {
            className: 'o_client_action_test',
            start: function () {
                this.$el.text('Hello World');
                this.set('title', 'Hello'); // AAB: drop this and replace by getTitle()
            },
        });
        core.action_registry.add('HelloWorldTest', ClientAction);

        var actionManager = createActionManager();
        actionManager.doAction('HelloWorldTest');

        assert.strictEqual($('.o_control_panel:visible').length, 1,
            "should have rendered a control panel");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').text(), 'Hello',
            "breadcrumbs should still display the title of the controller");
        assert.strictEqual(actionManager.$('.o_client_action_test').text(),
            'Hello World', "should have correctly rendered the client action");

        actionManager.destroy();
        delete core.action_registry.map.HelloWorldTest;
    });

    QUnit.test('state is pushed for client actions', function (assert) {
        assert.expect(2);

        var ClientAction = AbstractAction.extend(ControlPanelMixin, {
            className: 'o_client_action_test',
            start: function () {
                this.$el.text('Hello World');
            },
        });
        var actionManager = createActionManager({
            intercepts: {
                push_state: function () {
                    assert.step('push state');
                },
            },
        });
        core.action_registry.add('HelloWorldTest', ClientAction);

        actionManager.doAction('HelloWorldTest');

        assert.verifySteps(['push state']);

        actionManager.destroy();
        delete core.action_registry.map.HelloWorldTest;
    });

    QUnit.test('breadcrumb is updated on title change', function (assert) {
        assert.expect(2);

        var ClientAction = Widget.extend(ControlPanelMixin, {
            className: 'o_client_action_test',
            events: {
                click: function () {
                    this.set("title", 'new title');
                },
            },
            start: function () {
                this.set("title", 'initial title');
                this.$el.text('Hello World');
            },
        });
        var actionManager = createActionManager();
        core.action_registry.add('HelloWorldTest', ClientAction);
        actionManager.doAction('HelloWorldTest');

        assert.strictEqual($('ol.breadcrumb').text(), "initial title",
            "should have initial title as breadcrumb content");

        actionManager.$('.o_client_action_test').click();
        assert.strictEqual($('ol.breadcrumb').text(), "new title",
            "should have updated title as breadcrumb content");

        actionManager.destroy();
        delete core.action_registry.map.HelloWorldTest;
    });

    QUnit.module('Server actions');

    QUnit.test('can execute server actions from db ID', function (assert) {
        assert.expect(9);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                if (route === '/web/action/run') {
                    assert.strictEqual(args.action_id, 2,
                        "should call the correct server action");
                    return $.when(1); // execute action 1
                }
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(2);

        assert.strictEqual($('.o_control_panel:visible').length, 1,
            "should have rendered a control panel");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should have rendered a kanban view");
        assert.verifySteps([
            '/web/action/load',
            '/web/action/run',
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read',
        ]);

        actionManager.destroy();
    });

    QUnit.test('handle server actions returning false', function (assert) {
        assert.expect(9);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                if (route === '/web/action/run') {
                    return $.when(false);
                }
                return this._super.apply(this, arguments);
            },
        });

        // execute an action in target="new"
        actionManager.doAction(5, {
            on_close: assert.step.bind(assert, 'close handler'),
        });
        assert.strictEqual($('.o_technical_modal .o_form_view').length, 1,
            "should have rendered a form view in a modal");

        // execute a server action that returns false
        actionManager.doAction(2);
        assert.strictEqual($('.o_technical_modal').length, 0,
            "should have closed the modal");
        assert.verifySteps([
            '/web/action/load', // action 5
            'load_views',
            'default_get',
            '/web/action/load', // action 2
            '/web/action/run',
            'close handler',
        ]);

        actionManager.destroy();
    });

    QUnit.module('Report actions');

    QUnit.test('can execute report actions from db ID', function (assert) {
        assert.expect(6);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            services: {
                report: ReportService,
            },
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                if (route === '/report/check_wkhtmltopdf') {
                    return $.when('ok');
                }
                return this._super.apply(this, arguments);
            },
            session: {
                get_file: function (params) {
                    assert.step(params.url);
                    params.success();
                    params.complete();
                    return true;
                },
            },
        });
        actionManager.doAction(7, {
            on_close: function () {
                assert.step('on_close');
            },
        });

        assert.verifySteps([
            '/web/action/load',
            '/report/check_wkhtmltopdf',
            '/web/static/src/img/spin.png', // block UI image
            '/report/download',
            'on_close',
        ]);

        actionManager.destroy();
    });

    QUnit.test('report actions can close modals and reload views', function (assert) {
        assert.expect(8);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            services: {
                report: ReportService,
            },
            mockRPC: function (route, args) {
                if (route === '/report/check_wkhtmltopdf') {
                    return $.when('ok');
                }
                return this._super.apply(this, arguments);
            },
            session: {
                get_file: function (params) {
                    assert.step(params.url);
                    params.success();
                    params.complete();
                    return true;
                },
            },
        });

        // load modal
        actionManager.doAction(5, {
            on_close: function () {
                assert.step('on_close');
            },
        });

        assert.strictEqual($('.o_technical_modal .o_form_view').length, 1,
        "should have rendered a form view in a modal");

        actionManager.doAction(7, {
            on_close: function () {
                assert.step('on_printed');
            },
        });

        assert.strictEqual($('.o_technical_modal .o_form_view').length, 1,
        "The modal should still exist");

        actionManager.doAction(11);

        assert.strictEqual($('.o_technical_modal .o_form_view').length, 0,
        "the modal should have been closed after the action report");

        assert.verifySteps([
            '/report/download',
            'on_printed',
            '/report/download',
            'on_close',
        ]);

        actionManager.destroy();
    });

    QUnit.test('should trigger a notification if wkhtmltopdf is to upgrade', function (assert) {
        assert.expect(6);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            services: {
                report: ReportService,
                notification: NotificationService.extend({
                    notify: function (params) {
                        assert.step(params.type || 'notification');
                    }
                }),
            },
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                if (route === '/report/check_wkhtmltopdf') {
                    return $.when('upgrade');
                }
                return this._super.apply(this, arguments);
            },
            session: {
                get_file: function (params) {
                    assert.step(params.url);
                    params.success();
                    params.complete();
                    return true;
                },
            },
        });
        actionManager.doAction(7);
        assert.verifySteps([
            '/web/action/load',
            '/report/check_wkhtmltopdf',
            'notification',
            '/web/static/src/img/spin.png', // block UI image
            '/report/download',
        ]);

        actionManager.destroy();
    });

    QUnit.test('should open the report client action if wkhtmltopdf is broken', function (assert) {
        assert.expect(6);

        // patch the report client action to override its iframe's url so that
        // it doesn't trigger an RPC when it is appended to the DOM (for this
        // usecase, using removeSRCAttribute doesn't work as the RPC is
        // triggered as soon as the iframe is in the DOM, even if its src
        // attribute is removed right after)
        testUtils.patch(ReportClientAction, {
            start: function () {
                var self = this;
                return this._super.apply(this, arguments).then(function () {
                    self.iframe.src = 'test ' + self.iframe.getAttribute('src');
                });
            }
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            services: {
                report: ReportService,
                notification: NotificationService.extend({
                    notify: function (params) {
                        assert.step(params.type || 'notification');
                    }
                })
            },
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                if (route === '/report/check_wkhtmltopdf') {
                    return $.when('broken');
                }
                if (route === 'test /report/html/some_report') {
                    return $.when();
                }
                return this._super.apply(this, arguments);
            },
            session: {
                get_file: function (params) {
                    assert.step(params.url); // should not be called
                    return true;
                },
            },
        });
        actionManager.doAction(7);

        assert.strictEqual(actionManager.$('.o_report_iframe').length, 1,
            "should have opened the report client action");

        assert.verifySteps([
            '/web/action/load',
            '/report/check_wkhtmltopdf',
            'notification',
            'test /report/html/some_report', // report client action's iframe
        ]);

        actionManager.destroy();
        testUtils.unpatch(ReportClientAction);
    });

    QUnit.module('Window Actions');

    QUnit.test('can execute act_window actions from db ID', function (assert) {
        assert.expect(6);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(1);

        assert.strictEqual($('.o_control_panel').length, 1,
            "should have rendered a control panel");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should have rendered a kanban view");
        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read',
        ]);

        actionManager.destroy();
    });

    QUnit.test('can switch between views', function (assert) {
        assert.expect(18);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(3);

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display the list view");

        // switch to kanban view
        $('.o_control_panel .o_cp_switch_kanban').click();
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should no longer display the list view");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should display the kanban view");

        // switch back to list view
        $('.o_control_panel .o_cp_switch_list').click();
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display the list view");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 0,
            "should no longer display the kanban view");

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should no longer display the list view");
        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should display the form view");
        assert.strictEqual(actionManager.$('.o_field_widget[name=foo]').text(), 'yop',
            "should have opened the correct record");

        // go back to list view using the breadcrumbs
        $('.o_control_panel .breadcrumb a').click();
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display the list view");
        assert.strictEqual(actionManager.$('.o_form_view').length, 0,
            "should no longer display the form view");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read', // list
            '/web/dataset/search_read', // kanban
            '/web/dataset/search_read', // list
            'read', // form
            '/web/dataset/search_read', // list
        ]);

        actionManager.destroy();
    });

    QUnit.test('orderedBy in context is not propagated when executing another action', function (assert) {
        assert.expect(6);

        this.data.partner.fields.foo.sortable = true,

        this.archs['partner,false,form'] = '<header>' +
                                                '<button name="8" string="Execute action" type="action"/>' +
                                            '</header>';

        var searchReadCount = 0;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                if (route === '/web/dataset/search_read') {
                    if (searchReadCount === 1) {
                        assert.strictEqual(args.model, 'partner');
                        assert.notOk(args.sort);
                    }
                    if (searchReadCount === 2) {
                        assert.strictEqual(args.model, 'partner');
                        assert.strictEqual(args.sort, "foo ASC");
                    }
                    if (searchReadCount === 3) {
                        assert.strictEqual(args.model, 'pony');
                        assert.notOk(args.sort);
                    }
                    searchReadCount += 1;
                }
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(3);

        // Simulate the activation of a filter
        var searchData = {
            domains: [[["foo", "=", "yop"]]],
            contexts: [{
                orderedBy: [],
            }],
        };
        actionManager.trigger_up('search', searchData);

        // Sort records
        actionManager.$('.o_list_view th.o_column_sortable').click();

        // get to the form view of the model, on the first record
        actionManager.$('.o_data_cell:first').click();

        // Change model by clicking on the button within the form
        actionManager.$('.o_form_view button').click();

        actionManager.destroy();
    });

    QUnit.test('breadcrumbs are updated when switching between views', function (assert) {
        assert.expect(10);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').text(), 'Partners',
            "breadcrumbs should display the display_name of the action");

        // switch to kanban view
        $('.o_control_panel .o_cp_switch_kanban').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should still be one controller in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').text(), 'Partners',
            "breadcrumbs should still display the display_name of the action");

        // switch back to list view
        $('.o_control_panel .o_cp_switch_list').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should still be one controller in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').text(), 'Partners',
            "breadcrumbs should still display the display_name of the action");

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should be two controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'First record',
            "breadcrumbs should contain the display_name of the opened record");

        // go back to list view using the breadcrumbs
        $('.o_control_panel .breadcrumb a').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').text(), 'Partners',
            "breadcrumbs should display the display_name of the action");

        actionManager.destroy();
    });

    QUnit.test('switch buttons are updated when switching between views', function (assert) {
        assert.expect(13);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        assert.strictEqual($('.o_control_panel .o_cp_switch_buttons button').length, 2,
            "should have two switch buttons (list and kanban)");
        assert.strictEqual($('.o_control_panel .o_cp_switch_buttons button.active').length, 1,
            "should have only one active button");
        assert.ok($('.o_control_panel .o_cp_switch_buttons button:first').hasClass('o_cp_switch_list'),
            "list switch button should be the first one");
        assert.ok($('.o_control_panel .o_cp_switch_list').hasClass('active'),
            "list should be the active view");

        // switch to kanban view
        $('.o_control_panel .o_cp_switch_kanban').click();
        assert.strictEqual($('.o_control_panel .o_cp_switch_buttons button').length, 2,
            "should still have two switch buttons (list and kanban)");
        assert.strictEqual($('.o_control_panel .o_cp_switch_buttons button.active').length, 1,
            "should still have only one active button");
        assert.ok($('.o_control_panel .o_cp_switch_buttons button:first').hasClass('o_cp_switch_list'),
            "list switch button should still be the first one");
        assert.ok($('.o_control_panel .o_cp_switch_kanban').hasClass('active'),
            "kanban should now be the active view");

        // switch back to list view
        $('.o_control_panel .o_cp_switch_list').click();
        assert.strictEqual($('.o_control_panel .o_cp_switch_buttons button').length, 2,
            "should still have two switch buttons (list and kanban)");
        assert.ok($('.o_control_panel .o_cp_switch_list').hasClass('active'),
            "list should now be the active view");

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual($('.o_control_panel .o_cp_switch_buttons button').length, 0,
            "should not have any switch buttons");

        // go back to list view using the breadcrumbs
        $('.o_control_panel .breadcrumb a').click();
        assert.strictEqual($('.o_control_panel .o_cp_switch_buttons button').length, 2,
            "should have two switch buttons (list and kanban)");
        assert.ok($('.o_control_panel .o_cp_switch_list').hasClass('active'),
            "list should be the active view");

        actionManager.destroy();
    });

    QUnit.test('pager is updated when switching between views', function (assert) {
        assert.expect(10);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(4);

        assert.strictEqual($('.o_control_panel .o_pager_value').text(), '1-5',
            "value should be correct for kanban");
        assert.strictEqual($('.o_control_panel .o_pager_limit').text(), '5',
            "limit should be correct for kanban");

        // switch to list view
        $('.o_control_panel .o_cp_switch_list').click();
        assert.strictEqual($('.o_control_panel .o_pager_value').text(), '1-3',
            "value should be correct for list");
        assert.strictEqual($('.o_control_panel .o_pager_limit').text(), '5',
            "limit should be correct for list");

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual($('.o_control_panel .o_pager_value').text(), '1',
            "value should be correct for form");
        assert.strictEqual($('.o_control_panel .o_pager_limit').text(), '3',
            "limit should be correct for form");

        // go back to list view using the breadcrumbs
        $('.o_control_panel .breadcrumb a').click();
        assert.strictEqual($('.o_control_panel .o_pager_value').text(), '1-3',
            "value should be correct for list");
        assert.strictEqual($('.o_control_panel .o_pager_limit').text(), '5',
            "limit should be correct for list");

        // switch back to kanban view
        $('.o_control_panel .o_cp_switch_kanban').click();
        assert.strictEqual($('.o_control_panel .o_pager_value').text(), '1-5',
            "value should be correct for kanban");
        assert.strictEqual($('.o_control_panel .o_pager_limit').text(), '5',
            "limit should be correct for kanban");

        actionManager.destroy();
    });

    QUnit.test('there is no flickering when switching between views', function (assert) {
        assert.expect(20);

        var def;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function () {
                var result = this._super.apply(this, arguments);
                return $.when(def).then(_.constant(result));
            },
        });
        actionManager.doAction(3);

        // switch to kanban view
        def = $.Deferred();
        $('.o_control_panel .o_cp_switch_kanban').click();
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should still display the list view");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 0,
            "shouldn't display the kanban view yet");
        def.resolve();
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "shouldn't display the list view anymore");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should now display the kanban view");

        // switch back to list view
        def = $.Deferred();
        $('.o_control_panel .o_cp_switch_list').click();
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should still display the kanban view");
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "shouldn't display the list view yet");
        def.resolve();
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 0,
            "shouldn't display the kanban view anymore");
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should now display the list view");

        // open a record in form view
        def = $.Deferred();
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should still display the list view");
        assert.strictEqual(actionManager.$('.o_form_view').length, 0,
            "shouldn't display the form view yet");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should still be one controller in the breadcrumbs");
        def.resolve();
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "should no longer display the list view");
        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should display the form view");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should be two controllers in the breadcrumbs");

        // go back to list view using the breadcrumbs
        def = $.Deferred();
        $('.o_control_panel .breadcrumb a').click();
        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should still display the form view");
        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "shouldn't display the list view yet");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should still be two controllers in the breadcrumbs");
        def.resolve();
        assert.strictEqual(actionManager.$('.o_form_view').length, 0,
            "should no longer display the form view");
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display the list view");
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");

        actionManager.destroy();
    });

    QUnit.test('breadcrumbs are updated when display_name changes', function (assert) {
        assert.expect(4);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should be two controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'First record',
            "breadcrumbs should contain the display_name of the opened record");

        // switch to edit mode and change the display_name
        $('.o_control_panel .o_form_button_edit').click();
        actionManager.$('.o_field_widget[name=display_name]').val('New name').trigger('input');
        $('.o_control_panel .o_form_button_save').click();

        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should still be two controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'New name',
            "breadcrumbs should contain the display_name of the opened record");

        actionManager.destroy();
    });

    QUnit.test('reload previous controller when discarding a new record', function (assert) {
        assert.expect(8);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(3);

        // create a new record
        $('.o_control_panel .o_list_button_add').click();
        assert.strictEqual(actionManager.$('.o_form_view.o_form_editable').length, 1,
            "should have opened the form view in edit mode");

        // discard
        $('.o_control_panel .o_form_button_cancel').click();
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should have switched back to the list view");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read', // list
            'default_get', // form
            '/web/dataset/search_read', // list
        ]);

        actionManager.destroy();
    });

    QUnit.test('requests for execute_action of type object are handled', function (assert) {
        assert.expect(10);

        var self = this;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                if (route === '/web/dataset/call_button') {
                    assert.deepEqual(args, {
                        args: [[1], {some_key: 2}],
                        method: 'object',
                        model: 'partner',
                    }, "should call route with correct arguments");
                    var record = _.findWhere(self.data.partner.records, {id: args.args[0][0]});
                    record.foo = 'value changed';
                    return $.when(false);
                }
                return this._super.apply(this, arguments);
            },
            session: {user_context: {
                some_key: 2,
            }},
        });
        actionManager.doAction(3);

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual(actionManager.$('.o_field_widget[name=foo]').text(), 'yop',
            "check initial value of 'yop' field");

        // click on 'Call method' button (should call an Object method)
        actionManager.$('.o_form_view button:contains(Call method)').click();
        assert.strictEqual(actionManager.$('.o_field_widget[name=foo]').text(), 'value changed',
            "'yop' has been changed by the server, and should be updated in the UI");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read', // list for action 3
            'read', // form for action 3
            'object', // click on 'Call method' button
            'read', // re-read form view
        ]);

        actionManager.destroy();
    });

    QUnit.test('requests for execute_action of type action are handled', function (assert) {
        assert.expect(11);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(3);

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();

        // click on 'Execute action' button (should execute an action)
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should be two parts in the breadcrumbs");
        actionManager.$('.o_form_view button:contains(Execute action)').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 3,
            "the returned action should have been stacked over the previous one");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "the returned action should have been executed");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read', // list for action 3
            'read', // form for action 3
            '/web/action/load', // click on 'Execute action' button
            'load_views',
            '/web/dataset/search_read', // kanban for action 4
        ]);

        actionManager.destroy();
    });

    QUnit.test('requests for execute_action of type object: disable buttons', function (assert) {
        assert.expect(2);

        var self = this;
        var def;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                if (route === '/web/dataset/call_button') {
                    return $.when(false);
                } else if (args.method === 'read') {
                    // Block the 'read' call
                    var result = this._super.apply(this, arguments);
                    return $.when(def).then(_.constant(result));
                }
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(3);

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();

        // click on 'Call method' button (should call an Object method)
        def = $.Deferred();
        actionManager.$('.o_form_view button:contains(Call method)').click();

        // Buttons should be disabled
        assert.strictEqual(
            actionManager.$('.o_form_view button:contains(Call method)').attr('disabled'),
            'disabled', 'buttons should be disabled')

        // Release the 'read' call
        def.resolve();

        // Buttons should be enabled after the reload
        assert.strictEqual(
            actionManager.$('.o_form_view button:contains(Call method)').attr('disabled'),
            undefined, 'buttons should be disabled')

        actionManager.destroy();
    });

    QUnit.test('can open different records from a multi record view', function (assert) {
        assert.expect(11);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(3);

        // open the first record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'First record',
            "breadcrumbs should contain the display_name of the opened record");
        assert.strictEqual(actionManager.$('.o_field_widget[name=foo]').text(), 'yop',
            "should have opened the correct record");

        // go back to list view using the breadcrumbs
        $('.o_control_panel .breadcrumb a').click();

        // open the second record in form view
        actionManager.$('.o_list_view .o_data_row:nth(1)').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'Second record',
            "breadcrumbs should contain the display_name of the opened record");
        assert.strictEqual(actionManager.$('.o_field_widget[name=foo]').text(), 'blip',
            "should have opened the correct record");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read', // list
            'read', // form
            '/web/dataset/search_read', // list
            'read', // form
        ]);

        actionManager.destroy();
    });

    QUnit.test('restore previous view state when switching back', function (assert) {
        assert.expect(5);

        this.actions[2].views.unshift([false, 'graph']);
        this.archs['partner,false,graph'] = '<graph></graph>';

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        assert.ok($('.o_control_panel  .fa-bar-chart-o').hasClass('active'),
            "bar chart button is active");
        assert.ok(!$('.o_control_panel  .fa-area-chart').hasClass('active'),
            "line chart button is not active");

        // display line chart
        $('.o_control_panel  .fa-area-chart').click();
        assert.ok($('.o_control_panel  .fa-area-chart').hasClass('active'),
            "line chart button is now active");

        // switch to kanban and back to graph view
        $('.o_control_panel .o_cp_switch_kanban').click();
        assert.strictEqual($('.o_control_panel  .fa-area-chart').length, 0,
            "graph buttons are no longer in control panel");

        $('.o_control_panel .o_cp_switch_graph').click();
        assert.ok($('.o_control_panel  .fa-area-chart').hasClass('active'),
            "line chart button is still active");
        actionManager.destroy();
    });

    QUnit.test('view switcher is properly highlighted in graph view', function (assert) {
        assert.expect(4);

        // note: this test should be moved to graph tests ?

        this.actions[2].views.splice(1, 1, [false, 'graph']);
        this.archs['partner,false,graph'] = '<graph></graph>';

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        assert.ok($('.o_control_panel .o_cp_switch_list').hasClass('active'),
            "list button in control panel is active");
        assert.ok(!$('.o_control_panel .o_cp_switch_graph').hasClass('active'),
            "graph button in control panel is not active");

        // switch to graph view
        $('.o_control_panel .o_cp_switch_graph').click();
        assert.ok(!$('.o_control_panel .o_cp_switch_list').hasClass('active'),
            "list button in control panel is not active");
        assert.ok($('.o_control_panel .o_cp_switch_graph').hasClass('active'),
            "graph button in control panel is active");
        actionManager.destroy();
    });

    QUnit.test('can interact with search view', function (assert) {
        assert.expect(2);

        this.archs['partner,false,search'] = '<search>'+
                '<group>'+
                    '<filter name="foo" string="foo" context="{\'group_by\': \'foo\'}"/>' +
                '</group>'+
            '</search>';
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        assert.ok(!actionManager.$('.o_list_view').hasClass('o_list_view_grouped'),
            "list view is not grouped");
        // open search view sub menus
        $('.o_control_panel .o_searchview_more').click();

        // open group by dropdown
        $('.o_control_panel .o_cp_right button:contains(Group By)').click();

        // click on first link
        $('.o_control_panel .o_group_by_menu a:first').click();

        assert.ok(actionManager.$('.o_list_view').hasClass('o_list_view_grouped'),
            'list view is now grouped');

        actionManager.destroy();
    });

    QUnit.test('can open a many2one external window', function (assert) {
        // AAB: this test could be merged with 'many2ones in form views' in relational_fields_tests.js
        assert.expect(8);

        this.data.partner.records[0].bar = 2;
        this.archs['partner,false,search'] = '<search>'+
                '<group>'+
                    '<filter name="foo" string="foo" context="{\'group_by\': \'foo\'}"/>' +
                '</group>'+
            '</search>';
        this.archs['partner,false,form'] = '<form>' +
            '<group>' +
                '<field name="foo"/>' +
                '<field name="bar"/>' +
            '</group>' +
        '</form>';

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(route);
                if (args.method === "get_formview_id") {
                    return $.when(false);
                }
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(3);

        // open first record in form view
        actionManager.$('.o_data_row:first').click();
        // click on edit
        $('.o_control_panel .o_form_button_edit').click();

        // click on external button for m2o
        actionManager.$('.o_external_button').click();
        assert.verifySteps([
            '/web/action/load',             // initial load action
            '/web/dataset/call_kw/partner', // load views
            '/web/dataset/search_read',     // read list view data
            '/web/dataset/call_kw/partner/read', // read form view data
            '/web/dataset/call_kw/partner/get_formview_id', // get form view id
            '/web/dataset/call_kw/partner', // load form view for modal
            '/web/dataset/call_kw/partner/read' // read data for m2o record
        ]);
        actionManager.destroy();
    });

    QUnit.test('ask for confirmation when leaving a "dirty" view', function (assert) {
        assert.expect(4);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(4);

        // open record in form view
        actionManager.$('.o_kanban_record:first').click();

        // edit record
        $('.o_control_panel button.o_form_button_edit').click();
        actionManager.$('input[name="foo"]').val('pinkypie').trigger('input');

        // go back to kanban view
        $('.o_control_panel .breadcrumb-item:first a').click();

        assert.strictEqual($('.modal .modal-body').text(),
            "The record has been modified, your changes will be discarded. Do you want to proceed?",
            "should display a modal dialog to confirm discard action");

        // cancel
        $('.modal .modal-footer button.btn-secondary').click();

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "should still be in form view");

        // go back again to kanban view
        $('.o_control_panel .breadcrumb-item:first a').click();

        // confirm discard
        $('.modal .modal-footer button.btn-primary').click();

        assert.strictEqual(actionManager.$('.o_form_view').length, 0,
            "should no longer be in form view");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should be in kanban view");

        actionManager.destroy();
    });

    QUnit.test('limit set in action is passed to each created controller', function (assert) {
        assert.expect(2);

        _.findWhere(this.actions, {id: 3}).limit = 2;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        assert.strictEqual(actionManager.$('.o_data_row').length, 2,
            "should only display 2 record");

        // switch to kanban view
        $('.o_control_panel .o_cp_switch_kanban').click();

        assert.strictEqual(actionManager.$('.o_kanban_record:not(.o_kanban_ghost)').length, 2,
            "should only display 2 record");

        actionManager.destroy();
    });

    QUnit.test('go back to a previous action using the breadcrumbs', function (assert) {
        assert.expect(10);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should be two controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'First record',
            "breadcrumbs should contain the display_name of the opened record");

        // push another action on top of the first one, and come back to the form view
        actionManager.doAction(4);
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 3,
            "there should be three controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'Partners Action 4',
            "breadcrumbs should contain the name of the current action");
        // go back using the breadcrumbs
        $('.o_control_panel .breadcrumb a:nth(1)').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 2,
            "there should be two controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'First record',
            "breadcrumbs should contain the display_name of the opened record");

        // push again the other action on top of the first one, and come back to the list view
        actionManager.doAction(4);
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 3,
            "there should be three controllers in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'Partners Action 4',
            "breadcrumbs should contain the name of the current action");
        // go back using the breadcrumbs
        $('.o_control_panel .breadcrumb a:first').click();
        assert.strictEqual($('.o_control_panel .breadcrumb-item').length, 1,
            "there should be one controller in the breadcrumbs");
        assert.strictEqual($('.o_control_panel .breadcrumb-item:last').text(), 'Partners',
            "breadcrumbs should contain the name of the current action");

        actionManager.destroy();
    });

    QUnit.test('form views are restored in readonly when coming back in breadcrumbs', function (assert) {
        assert.expect(2);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        // open a record in form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        // switch to edit mode
        $('.o_control_panel .o_form_button_edit').click();

        assert.ok(actionManager.$('.o_form_view').hasClass('o_form_editable'));
        // do some other action
        actionManager.doAction(4);
        // go back to form view
        $('.o_control_panel .breadcrumb a').last().click();
        assert.ok(actionManager.$('.o_form_view').hasClass('o_form_readonly'));

        actionManager.destroy();
    });

    QUnit.test('honor group_by specified in actions context', function (assert) {
        assert.expect(5);

        _.findWhere(this.actions, {id: 3}).context = "{'group_by': 'bar'}";
        this.archs['partner,false,search'] = '<search>'+
            '<group>'+
                '<filter name="foo" string="foo" context="{\'group_by\': \'foo\'}"/>' +
            '</group>'+
        '</search>';

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(3);

        assert.strictEqual(actionManager.$('.o_list_view_grouped').length, 1,
            "should be grouped");
        assert.strictEqual(actionManager.$('.o_group_header').length, 2,
            "should be grouped by 'bar' (two groups) at first load");

        // groupby 'bar' using the searchview
        $('.o_control_panel .o_searchview_more').click(); // open search view sub menus
        $('.o_control_panel .o_cp_right button:contains(Group By)').click(); // open groupby dropdown
        $('.o_control_panel .o_group_by_menu a:first').click(); // click on 'Foo'

        assert.strictEqual(actionManager.$('.o_group_header').length, 5,
            "should be grouped by 'foo' (five groups)");

        // remove the groupby in the searchview
        $('.o_control_panel .o_searchview .o_facet_remove').click();

        assert.strictEqual(actionManager.$('.o_list_view_grouped').length, 1,
            "should still be grouped");
        assert.strictEqual(actionManager.$('.o_group_header').length, 2,
            "should be grouped by 'bar' (two groups) at reload");

        actionManager.destroy();
    });

    QUnit.test('switch request to unknown view type', function (assert) {
        assert.expect(7);

        this.actions.push({
            id: 33,
            name: 'Partners',
            res_model: 'partner',
            type: 'ir.actions.act_window',
            views: [[false, 'list'], [1, 'kanban']], // no form view
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(33);

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should display the list view");

        // try to open a record in a form view
        actionManager.$('.o_list_view .o_data_row:first').click();
        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "should still display the list view");
        assert.strictEqual(actionManager.$('.o_form_view').length, 0,
            "should not display the form view");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read',
        ]);

        actionManager.destroy();
    });

    QUnit.test('save current search', function (assert) {
        assert.expect(4);

        testUtils.patch(ListController, {
            getContext: function () {
                return {
                    shouldBeInFilterContext: true,
                };
            },
        });

        this.actions.push({
            id: 33,
            context: {
                shouldNotBeInFilterContext: false,
            },
            name: 'Partners',
            res_model: 'partner',
            search_view_id: [1, 'a custom search view'],
            type: 'ir.actions.act_window',
            views: [[false, 'list']],
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                create_filter: function (event) {
                    var filter = event.data.filter;
                    assert.deepEqual(filter.domain, `[("bar", "=", 1)]`,
                        "should save the correct domain");
                    assert.deepEqual(filter.context, {shouldBeInFilterContext: true},
                        "should save the correct context");
                },
            },
        });
        actionManager.doAction(33);

        assert.strictEqual(actionManager.$('.o_data_row').length, 5,
            "should contain 5 records");

        // filter on bar
        $('.o_control_panel .o_filters_menu a:contains(Bar)').click();

        assert.strictEqual(actionManager.$('.o_data_row').length, 2,
            "should contain 2 records");

        // save filter
        $('.o_control_panel .o_save_search a').click(); // toggle 'Save current search'
        $('.o_control_panel .o_save_name input[type=text]').val('some name'); // name the filter
        $('.o_control_panel .o_save_name button').click(); // click on 'Save'

        testUtils.unpatch(ListController);
        actionManager.destroy();
    });

    QUnit.test("search menus are still available when switching between actions", function (assert) {
        assert.expect(3);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        actionManager.doAction(1);
        assert.strictEqual($('.o_search_options .o_dropdown:visible .o_filters_menu').length, 1,
            "the search options should be available");

        actionManager.doAction(3);
        assert.strictEqual($('.o_search_options .o_dropdown:visible .o_filters_menu').length, 1,
            "the search options should be available");

        // go back using the breadcrumbs
        $('.o_control_panel .breadcrumb a:first').click();
        assert.strictEqual($('.o_search_options .o_dropdown:visible .o_filters_menu').length, 1,
            "the search options should be available");

        actionManager.destroy();
    });

    QUnit.test("doAction with option 'keepSearchView'", function (assert) {
        assert.expect(4);

        this.actions.push({
            id: 33,
            name: 'Partners',
            res_model: 'partner',
            search_view_id: [1, 'a specific search view'],
            type: 'ir.actions.act_window',
            views: [[false, 'list']],
        });

        var checkRPC = false;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                if (checkRPC && route === '/web/dataset/search_read') {
                    assert.deepEqual(args.domain, [['bar', '=', 1]],
                        "should search with the correct domain");
                }
                return this._super.apply(this, arguments);
            },
        });

        actionManager.doAction(33);

        checkRPC = true;
        $('.o_control_panel .o_filters_menu a:contains(Bar)').click(); // filter on bar
        assert.strictEqual($('.o_control_panel .o_facet_values').text().trim(), 'Bar',
            "the filter on Bar should appear in the search view");

        actionManager.doAction(3, {keepSearchView: true});
        assert.strictEqual($('.o_control_panel .o_facet_values').text().trim(), 'Bar',
            "the filter on Bar should still be in the search view");

        actionManager.destroy();
    });

    QUnit.test("current act_window action is stored in session_storage", function (assert) {
        assert.expect(1);

        var expectedAction = _.extend({}, _.findWhere(this.actions, {id: 3}), {
            context: {},
        });
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            services: {
                session_storage: SessionStorageService.extend({
                    setItem: function (key, value) {
                        assert.strictEqual(value, JSON.stringify(expectedAction),
                            "should store the executed action in the sessionStorage");
                    },
                }),
            },
        });

        actionManager.doAction(3);

        actionManager.destroy();
    });

    QUnit.test("store evaluated context of current action in session_storage", function (assert) {
        // this test ensures that we don't store stringified instances of
        // CompoundContext in the session_storage, as they would be meaningless
        // once restored
        assert.expect(1);

        var expectedAction = _.extend({}, _.findWhere(this.actions, {id: 4}), {
            context: {
                active_model: 'partner',
                active_id: 1,
                active_ids: [1],
            },
        });
        var checkSessionStorage = false;
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            services: {
                session_storage: SessionStorageService.extend({
                    setItem: function (key, value) {
                        if (checkSessionStorage) {
                            assert.strictEqual(value, JSON.stringify(expectedAction),
                                "should correctly store the executed action in the sessionStorage");
                        }
                    },
                }),
            },
        });

        // execute an action and open a record in form view
        actionManager.doAction(3);
        actionManager.$('.o_list_view .o_data_row:first').click();

        // click on 'Execute action' button (it executes an action with a CompoundContext as context)
        checkSessionStorage = true;
        actionManager.$('.o_form_view button:contains(Execute action)').click();

        actionManager.destroy();
    });

    QUnit.module('Actions in target="new"');

    QUnit.test('can execute act_window actions in target="new"', function (assert) {
        assert.expect(7);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(5);

        assert.strictEqual($('.o_technical_modal .o_form_view').length, 1,
            "should have rendered a form view in a modal");
        assert.ok($('.o_technical_modal .modal-body').hasClass('o_act_window'),
            "dialog main element should have classname 'o_act_window'");
        assert.ok($('.o_technical_modal .o_form_view').hasClass('o_form_editable'),
            "form view should be in edit mode");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            'default_get',
        ]);

        actionManager.destroy();
    });

    QUnit.test('chained action on_close', function (assert) {
        assert.expect(3);

        function on_close() {
            assert.step('Close Action');
        };

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(5, {on_close: on_close});

        // a target=new action shouldn't activate the on_close
        actionManager.doAction(5);
        assert.verifySteps([]);

        // An act_window_close should trigger the on_close
        actionManager.doAction(10);
        assert.verifySteps(['Close Action']);

        actionManager.destroy();
    });

    QUnit.test('footer buttons are moved to the dialog footer', function (assert) {
        assert.expect(3);

        this.archs['partner,false,form'] = '<form>' +
                '<field name="display_name"/>' +
                '<footer>' +
                    '<button string="Create" type="object" class="infooter"/>' +
                '</footer>' +
            '</form>';

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction(5);

        assert.strictEqual($('.o_technical_modal .modal-body button.infooter').length, 0,
            "the button should not be in the body");
        assert.strictEqual($('.o_technical_modal .modal-footer button.infooter').length, 1,
            "the button should be in the footer");
        assert.strictEqual($('.o_technical_modal .modal-footer button').length, 1,
            "the modal footer should only contain one button");

        actionManager.destroy();
    });

    QUnit.test('on_attach_callback is called for actions in target="new"', function (assert) {
        assert.expect(4);

        var ClientAction = AbstractAction.extend({
            className: 'o_test',
            on_attach_callback: function () {
                assert.step('on_attach_callback');
                assert.ok(actionManager.currentDialogController,
                    "the currentDialogController should have been set already");
            },
        });
        core.action_registry.add('test', ClientAction);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction({
            tag: 'test',
            target: 'new',
            type: 'ir.actions.client',
        });

        assert.strictEqual($('.modal .o_test').length, 1,
            "should have rendered the client action in a dialog");
        assert.verifySteps(['on_attach_callback']);

        actionManager.destroy();
        delete core.action_registry.map.test;
    });

    QUnit.module('Actions in target="inline"');

    QUnit.test('form views for actions in target="inline" open in edit mode', function (assert) {
        assert.expect(5);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
        });
        actionManager.doAction(6);

        assert.strictEqual(actionManager.$('.o_form_view.o_form_editable').length, 1,
            "should have rendered a form view in edit mode");

        assert.verifySteps([
            '/web/action/load',
            'load_views',
            'read',
        ]);

        actionManager.destroy();
    });

    QUnit.module('Actions in target="fullscreen"');

    QUnit.test('correctly execute act_window actions in target="fullscreen"', function (assert) {
        assert.expect(7);

        this.actions[0].target = 'fullscreen';
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                assert.step(args.method || route);
                return this._super.apply(this, arguments);
            },
            intercepts: {
                toggle_fullscreen: function () {
                    assert.step('toggle_fullscreen');
                },
            },
        });
        actionManager.doAction(1);

        assert.strictEqual($('.o_control_panel').length, 1,
            "should have rendered a control panel");
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            "should have rendered a kanban view");
        assert.verifySteps([
            '/web/action/load',
            'load_views',
            '/web/dataset/search_read',
            'toggle_fullscreen',
        ]);

        actionManager.destroy();
    });

    QUnit.test('fullscreen on action change: back to a "current" action', function (assert) {
        assert.expect(3);

        this.actions[0].target = 'fullscreen';
        this.archs['partner,false,form'] = '<form>' +
                                            '<button name="1" type="action" class="oe_stat_button" />' +
                                        '</form>';

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                toggle_fullscreen: function (ev) {
                    var fullscreen = ev.data.fullscreen;

                    switch (toggleFullscreenCalls) {
                        case 0:
                            assert.strictEqual(fullscreen, false);
                            break;
                        case 1:
                            assert.strictEqual(fullscreen, true);
                            break;
                        case 2:
                            assert.strictEqual(fullscreen, false);
                            break;
                    }
                },
            },

        });

        var toggleFullscreenCalls = 0;
        actionManager.doAction(6);

        toggleFullscreenCalls = 1;
        actionManager.$('button[name=1]').click();

        toggleFullscreenCalls = 2;
        $('.breadcrumb li a:first').click();

        actionManager.destroy();
    });

    QUnit.test('fullscreen on action change: all "fullscreen" actions', function (assert) {
        assert.expect(3);

        this.actions[5].target = 'fullscreen';
        this.archs['partner,false,form'] = '<form>' +
                                            '<button name="1" type="action" class="oe_stat_button" />' +
                                        '</form>';

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            intercepts: {
                toggle_fullscreen: function (ev) {
                    var fullscreen = ev.data.fullscreen;
                    assert.strictEqual(fullscreen, true);
                },
            },
        });

        actionManager.doAction(6);

        actionManager.$('button[name=1]').click();

        $('.breadcrumb li a:first').click();

        actionManager.destroy();
    });

    QUnit.module('"ir.actions.act_window_close" actions');

    QUnit.test('close the currently opened dialog', function (assert) {
        assert.expect(2);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        // execute an action in target="new"
        actionManager.doAction(5);
        assert.strictEqual($('.o_technical_modal .o_form_view').length, 1,
            "should have rendered a form view in a modal");

        // execute an 'ir.actions.act_window_close' action
        actionManager.doAction({
            type: 'ir.actions.act_window_close',
        });
        assert.strictEqual($('.o_technical_modal').length, 0,
            "should have closed the modal");

        actionManager.destroy();
    });

    QUnit.test('execute "on_close" only if there is no dialog to close', function (assert) {
        assert.expect(3);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        // execute an action in target="new"
        actionManager.doAction(5);

        var options = {
            on_close: assert.step.bind(assert, 'on_close'),
        };
        // execute an 'ir.actions.act_window_close' action
        // should not call 'on_close' as there is a dialog to close
        actionManager.doAction({type: 'ir.actions.act_window_close'}, options);

        assert.verifySteps([]);

        // execute again an 'ir.actions.act_window_close' action
        // should call 'on_close' as there is no dialog to close
        actionManager.doAction({type: 'ir.actions.act_window_close'}, options);

        assert.verifySteps(['on_close']);

        actionManager.destroy();
    });

    QUnit.test('doAction resolved with an action', function (assert) {
        assert.expect(4);

        this.actions.push({
            id: 21,
            name: 'A Close Action',
            type: 'ir.actions.act_window_close',
        });

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        actionManager.doAction(21).then(function (action) {
            assert.ok(action, "doAction should be resolved with an action");
            assert.strictEqual(action.id, 21,
                "should be resolved with correct action id");
            assert.strictEqual(action.name, 'A Close Action',
                "should be resolved with correct action name");
            assert.strictEqual(action.type, 'ir.actions.act_window_close',
                "should be resolved with correct action type");
            actionManager.destroy();
        });
    });

    QUnit.test('close action with provided infos', function (assert) {
        assert.expect(1);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        var options = {
            on_close: function (infos) {
                assert.strictEqual(infos, 'just for testing',
                    "should have the correct close infos");
            }
        };

        actionManager.doAction({
            type: 'ir.actions.act_window_close',
            infos: 'just for testing',
        }, options);

        actionManager.destroy();
    });

    QUnit.test('history back calls on_close handler of dialog action', function (assert) {
        assert.expect(2);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });

        // open a new dialog form
        actionManager.doAction(this.actions[4], {
            on_close: function () {
                assert.step('on_close');
            },
        });

        actionManager.trigger_up('history_back');
        assert.verifySteps(['on_close'], "should have called the on_close handler");

        actionManager.destroy();
    });

    QUnit.test('properly drop client actions after new action is initiated', function (assert) {
        assert.expect(1);

        var slowWillStartDef = $.Deferred();

        var ClientAction = AbstractAction.extend({
            willStart: function () {
                return slowWillStartDef;
            },
        });

        core.action_registry.add('slowAction', ClientAction);

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction('slowAction');
        actionManager.doAction(4);
        slowWillStartDef.resolve();
        assert.strictEqual(actionManager.$('.o_kanban_view').length, 1,
            'should have loaded a kanban view');

        actionManager.destroy();
        delete core.action_registry.map.slowAction;
    });


    QUnit.test('abstract action does not crash on navigation_moves', function (assert) {
        assert.expect(1);
        var ClientAction = AbstractAction.extend({
        });
        core.action_registry.add('ClientAction', ClientAction);
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction('ClientAction');
        actionManager.trigger_up('navigation_move', {direction:'down'});

        assert.ok(true); // no error so it's good
        actionManager.destroy();
        delete core.action_registry.ClientAction;
    });

    QUnit.test('fields in abstract action does not crash on navigation_moves', function (assert) {
        assert.expect(1);
        var self = this;

        // create a client action with 2 input field
        var inputWidget;
        var secondInputWidget;
        var ClientAction = AbstractAction.extend(StandaloneFieldManagerMixin, {
            init: function () {
                this._super.apply(this, arguments);
                StandaloneFieldManagerMixin.init.call(this);
            },
            start: function () {
                var _self = this;

                return this.model.makeRecord('partner', [{
                    name: 'display_name',
                    type: 'char',
                }]).then(function (recordID) {
                    var record = _self.model.get(recordID);
                    inputWidget = new BasicFields.InputField(_self, 'display_name', record, {mode: 'edit',});
                    _self._registerWidget(recordID, 'display_name', inputWidget);

                    secondInputWidget = new BasicFields.InputField(_self, 'display_name', record, {mode: 'edit',});
                    secondInputWidget.attrs = {className:"secondField"};
                    _self._registerWidget(recordID, 'display_name', secondInputWidget);

                    inputWidget.appendTo(_self.$el);
                    secondInputWidget.appendTo(_self.$el);
                });
            }
        });
        core.action_registry.add('ClientAction', ClientAction);
        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
        });
        actionManager.doAction('ClientAction');
        inputWidget.$el[0].focus();
        var event = $.Event('keydown', {
            which: $.ui.keyCode.TAB,
            keyCode: $.ui.keyCode.TAB,
        });
        $(inputWidget.$el[0]).trigger(event);

        assert.notOk(event.isDefaultPrevented(),
            "the keyboard event default should not be prevented"); // no crash is good
        actionManager.destroy();
        delete core.action_registry.ClientAction;
    });

    QUnit.test('web client is not deadlocked when a view crashes', function (assert) {
        assert.expect(3);

        var readOnFirstRecordDef = $.Deferred();

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                if (args.method === 'read' && args.args[0][0] === 1) {
                    return readOnFirstRecordDef;
                }
                return this._super.apply(this, arguments);
            }
        });

        actionManager.doAction(3);

        // open first record in form view. this will crash and will not
        // display a form view
        actionManager.$('.o_list_view .o_data_row:first').click();

        readOnFirstRecordDef.reject("not working as intended");

        assert.strictEqual(actionManager.$('.o_list_view').length, 1,
            "there should still be a list view in dom");

        // open another record, the read will not crash
        actionManager.$('.o_list_view .o_data_row:eq(2)').click();

        assert.strictEqual(actionManager.$('.o_list_view').length, 0,
            "there should not be a list view in dom");

        assert.strictEqual(actionManager.$('.o_form_view').length, 1,
            "there should be a form view in dom");

        actionManager.destroy();
    });

    QUnit.module('Search View Action');

    QUnit.test('search view should keep focus during do_search', function (assert) {
        assert.expect(5);

        /* One should be able to type something in the search view, press on enter to
         * make the facet and trigger the search, then do this process
         * over and over again seamlessly.
         * Verifying the input's value is a lot trickier than verifying the search_read
         * because of how native events are handled in tests
         */

        var searchDeferred = $.Deferred();

        var actionManager = createActionManager({
            actions: this.actions,
            archs: this.archs,
            data: this.data,
            mockRPC: function (route, args) {
                if (route === '/web/dataset/search_read') {
                    assert.step('search_read ' + args.domain);
                    if ( _.isEqual(args.domain, [['foo', 'ilike', 'm']])) {
                        return searchDeferred.then(this._super.bind(this, route, args));
                    }
                }
                return this._super.apply(this, arguments);
            }
        });

        actionManager.doAction(3);

        var $searchInput = $('.o_searchview input');
        $searchInput.trigger($.Event('keypress', {key: 'm', which: 109, keyCode: 109}));
        $searchInput.trigger($.Event('keydown', {key: 'Enter', which: 13, keyCode: 13}));

        assert.verifySteps(["search_read ",
                            "search_read foo,ilike,m"]);

        // Triggering the do_search above will kill the current searchview Input
        $searchInput = $('.o_searchview input');
        $searchInput.trigger($.Event('keypress', {key: 'o', which: 111, keyCode: 111}));

        // We have something in the input of the search view. Making the search_read
        // return at this point will trigger the redraw of the view.
        // However we want to hold on to what we just typed
        searchDeferred.resolve();

        $searchInput.trigger($.Event('keydown', {key: 'Enter', which: 13, keyCode: 13}));

        assert.verifySteps(["search_read ",
                            "search_read foo,ilike,m",
                            "search_read |,foo,ilike,m,foo,ilike,o"]);

        actionManager.destroy();
    });
});

});
