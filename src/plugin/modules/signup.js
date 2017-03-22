/*global Promise*/
define([
    'kb_common/html',
    'kb_common/domEvent',
    'kb_plugin_auth2-client',
    './utils'
], function (
    html,
    DomEvent,
    Plugin,
    Utils
) {
    var t = html.tag,
        div = t('div'),
        h2 = t('h2'),
        p = t('p'),
        img = t('img');

    function factory(config) {
        var hostNode, container, runtime = config.runtime,
            nextRequest,
            utils = Utils.make({
                runtime: runtime
            });

       

        function render() {
            var events = DomEvent.make({
                node: container
            });
            var globusProvider = {
                id: 'Globus',
                label: 'Globus'
            };
            var providers = runtime.service('session').getProviders();
            var content = div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        h2('Sign Up for a KBase Account')
                    ])
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-6'
                    }, [
                        'col 1'
                    ]),
                    div({
                        class: 'col-md-6'
                    }, [
                        p([
                            'Continue to Sign Up',
                            div({
                                style: {
                                    width: '150px'
                                }
                            },
                                providers.map(function (provider) {
                                    return utils.buildLoginButton(events, provider, {
                                        nextrequest: JSON.stringify({
                                            path: 'dashboard'
                                        }),
                                        origin: 'signup'
                                    });
                                })
                            ),
                        ])
                    ])
                ])
            ]);
            container.innerHTML = content;
            events.attachEvents();
        }

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        function start(params) {
            return Promise.try(function () {
                nextRequest = params.nextRequest;
                render();
            });
        }

        function stop() {
            return Promise.try(function () {});
        }

        function detach() {
            if (hostNode && container) {
                hostNode.remove(container);
            }
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