/* global Promise */
define([
    'knockout',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common_ts/Auth2Error',
    // for effect
    './components/loginView',
    'bootstrap'
], function (
    ko,
    html,
    BS,
    Auth2Error
) {
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container,
            runtime = config.runtime,
            nextRequest;

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function showErrorMessage(message) {
            container.innerHTML = div({
                class: 'alert alert-danger'
            }, message);
        }

        function render() {
            try {
                container.innerHTML = div({
                    class: 'plugin-auth2-client widget-auth2_login',
                    dataPlugin: 'auth2-client',
                    dataWidget: 'auth2_signin',
                    dataBind: {
                        component: {
                            name: '"login-view"',
                            params: {
                                runtime: 'runtime',
                                nextRequest: 'nextRequest'
                            }
                        }
                    }
                });
                ko.applyBindings({
                    runtime: runtime,
                    nextRequest: nextRequest
                }, container);
            } catch (ex) {
                console.error('ERROR rendering login stuff', ex);
                showErrorMessage(ex);
            }
        }

        function doRedirect() {
            if (nextRequest) {
                try {
                    if (nextRequest) {
                        runtime.send('app', 'navigate', nextRequest);
                    } else {
                        runtime.send('app', 'navigate', '');
                    }
                } catch (ex) {
                    runtime.send('app', 'navigate', '');
                }
            } else {
                runtime.send('app', 'navigate', '');
            }
        }

        function start(params) {
            return Promise.try(function () {
                // if is logged in, just redirect to the nextrequest,
                // or the nexturl, or dashboard.
                if (params.nextrequest) {
                    nextRequest = JSON.parse(params.nextrequest);
                } else {
                    nextRequest = null;
                }

                if (runtime.service('session').isLoggedIn()) {
                    doRedirect(params);
                    return null;
                }
                runtime.send('ui', 'setTitle', 'KBase Sign In');
                return render(params);
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