define([

], function () {

    function factory(config) {
        var hostNode, container,
            runtime = config.runtime;

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }
        function start(params) {
            return Promise.try(function () {
                runtime.send('ui', 'setTitle', 'Account Manager');
                container.innerHTML = 'this will be the account manager';
            });
        }
        function stop() {
            return Promise.try(function () {
            });
        }
        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
        }

        return Object.freeze({
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        });
    }

    return {
        make: function (config) {
            return factory(config);
        }
    }
});