require.config({
    baseUrl: './modules',
    paths: {
        bluebird: 'vendor/bluebird/bluebird',
        bootstrap: 'vendor/bootstrap/bootstrap',
        bootstrap_css: 'vendor/bootstrap/css/bootstrap',
        css: 'vendor/require-css/css',
        datatables: 'vendor/datatables/jquery.dataTables',
        datatables_css: 'vendor/datatables/jquery.dataTables',
        datatables_bootstrap_css: 'vendor/datatables-bootstrap3-plugin/datatables-bootstrap3',
        datatables_bootstrap: 'vendor/datatables-bootstrap3-plugin/datatables-bootstrap3',
        font_awesome: 'vendor/font-awesome/css/font-awesome',
        jquery: 'vendor/jquery/jquery',
        'js-yaml': 'vendor/js-yaml/js-yaml',
        kb_common: 'vendor/kbase-common-js',
        kb_common_ts: 'vendor/kbase-common-ts',
        kb_lib: 'vendor/kbase-common-es6',
        kb_service: 'vendor/kbase-service-clients-js',
        kb_knockout: 'vendor/kbase-knockout-extensions-es6',
        'knockout-arraytransforms': 'vendor/knockout-arraytransforms/knockout-arraytransforms',
        'knockout-projections': 'vendor/knockout-projections/knockout-projections',
        'knockout-switch-case': 'vendor/knockout-switch-case/knockout-switch-case',
        'knockout-validation': 'vendor/knockout-validation/knockout.validation',
        'knockout-mapping': 'vendor/bower-knockout-mapping/knockout.mapping',
        'knockout-plus': 'lib/knockout-plus/knockout-plus',
        knockout: 'vendor/knockout/knockout',
        marked: 'vendor/marked/marked',
        moment: 'vendor/moment/moment',
        numeral: 'vendor/numeral/numeral',
        md5: 'vendor/spark-md5/spark-md5',
        text: 'vendor/requirejs-text/text',
        yaml: 'vendor/requirejs-yaml/yaml',
        uuid: 'vendor/pure-uuid/uuid'
    },
    shim: {
        bootstrap: {
            deps: ['jquery', 'css!bootstrap_css']
        }
    }
});

require([
    'bluebird',
    // 'kbaseUI/runtime',
    'lib/auth2ClientRuntime',
    'kbaseUI/integration',
    'kb_knockout/load',
    'yaml!./config.yml',
    'account/panel',
    'bootstrap',
    'css!font_awesome'
], (Promise, Runtime, Integration, knockoutLoader, pluginConfig, PanelWidget) => {
    Promise.try(() => {
        const integration = new Integration({
            rootWindow: window
        });
        // try {
        //     integration.start();
        // } catch (ex) {
        //     console.error('Error starting main: ', ex.message);
        // }

        const {
            params: { config, token, username, routeParams }
        } = integration.getParamsFromIFrame();

        const runtime = new Runtime({
            config,
            token,
            username
        });

        const widgets = pluginConfig.install.widgets;
        widgets.forEach((widgetDef) => {
            runtime.widgetManager.addWidget(widgetDef);
        });

        // Now start the one and only panel.
        const rootNode = document.getElementById('root');

        const panel = new PanelWidget({ runtime });

        knockoutLoader
            .load()
            .then((ko) => {
                // For more efficient ui updates.
                // This was introduced in more recent knockout releases,
                // and in the past introduced problems which were resolved
                // in knockout 3.5.0.
                ko.options.deferUpdates = true;

                return runtime.start();
            })
            .then(() => {
                return panel.attach(rootNode);
            })
            .then(() => {
                panel.start({ tab: routeParams.tab });
            });
    }).catch((err) => {
        console.error('ERROR', err);
    });
});
