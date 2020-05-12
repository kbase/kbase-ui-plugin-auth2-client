(function (global) {
    'use strict';

    function getParamsFromIFrame(global) {
        if (!global.frameElement.hasAttribute('data-params')) {
            throw new Error('No params found in window!!');
        }
        return JSON.parse(decodeURIComponent(global.frameElement.getAttribute('data-params')));
    }

    function cacheBusterKey(buildInfo, developMode) {
        // NB developMode not implemented yet, so always defaults
        // to the gitCommitHash
        if (developMode) {
            return String(new Date().getTime());
        } else {
            return buildInfo.git.commitHash;
        }
    }

    const params = getParamsFromIFrame(global);
    const buildKey = cacheBusterKey(params.buildInfo, params.developMode);

    // Get the path to the index file. Since require-config is loaded directly by
    // index.html, the location is to index.html. We slice off index.html to get
    // the directory pathy.
    const pathList = global.location.pathname.split('/').slice(0, -1);

    // All javascript modules are located in the modules directory.
    pathList.push('modules');
    var baseUrl = pathList.join('/');

    global.require = {
        baseUrl,
        urlArgs: 'cb=' + buildKey,
        paths: {
            bluebird: 'vendor/bluebird/bluebird',
            bootstrap: 'vendor/bootstrap/bootstrap',
            bootstrap_css: 'vendor/bootstrap/css/bootstrap',
            css: 'vendor/require-css/css',
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
            },
            highlight: {
                deps: ['css!highlight_css']
            }
        }
    };
})(window);
