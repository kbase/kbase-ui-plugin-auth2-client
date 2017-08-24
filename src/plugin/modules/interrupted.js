define([
    'bluebird',
    'knockout',
    'kb_common/html'
], function (
    Promise,
    ko,
    html
) {
    'use strict';
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;

        // UI


        // VIEW

        function render(params) {
            container.innerHTML = div({
                dataBind: {
                    component: {
                        name: '"interrupted-view"',
                        params: {

                        }
                    }
                }
            });
            ko.applyBindings(container);
        }

        // API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return Promise.try(function () {
                // if (runtime.service('session').isLoggedIn()) {
                //     runtime.send('app', 'navigate', {
                //         path: 'dashboard'
                //     });
                // }
                runtime.send('ui', 'setTitle', 'Session Interrupted');
                render();
            });
        }

        function stop() {
            return Promise.try(function () {
                return null;
            });
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
        }

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});