define(['bluebird', 'knockout', 'kb_lib/html', './components/interruptedView'], function (
    Promise,
    ko,
    html,
    InterruptedViewComponent
) {
    'use strict';
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;

        // UI

        // VIEW

        function render() {
            container.innerHTML = div({
                dataBind: {
                    component: {
                        name: InterruptedViewComponent.quotedName(),
                        params: {}
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

        function start() {
            return Promise.try(function () {
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
