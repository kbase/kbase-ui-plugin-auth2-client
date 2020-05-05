define([
    'knockout',
    'kb_lib/html',
    './components/loginView',

    // for effect
    'bootstrap'
], function (ko, html, LoginViewComponent) {
    'use strict';

    const t = html.tag,
        img = t('img'),
        p = t('p'),
        div = t('div');

    function factory(config) {
        var hostNode,
            container,
            runtime = config.runtime,
            nextRequest,
            source;

        const listeners = [];

        function showErrorMessage(message) {
            container.innerHTML = div(
                {
                    class: 'alert alert-danger'
                },
                message
            );
        }

        function render() {
            try {
                container.innerHTML = div({
                    class: 'scrollable-flex-column'
                }, [
                    div({
                        style: {
                            marginBottom: '20px'
                        }
                    }, [
                        div({
                            style: {
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }
                        }, [
                            img({
                                src: runtime.pluginResourcePath + '/images/kbase-logo-99.png',
                                style: {
                                    height: '50px'
                                }
                            }),
                            div({
                                style: {
                                    fontSize: '200%',
                                    fontWeight: 'bold',
                                    marginLeft: '10px',
                                    color: 'rgba(50, 50, 50, 1)'
                                }
                            }, 'Welcome to KBase')
                        ]),
                        div({
                            style: {
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }
                        }, [
                            p({
                                style: {
                                    maxWidth: '25em',
                                    fontStyle: 'italic',
                                    fontWeight: 'bold',
                                    color: 'rgba(100, 100, 100, 1)',
                                    marginTop: '10px',
                                    textAlign: 'center'
                                }
                            }, [
                                'A collaborative, open environment for systems biology ',
                                'of plants, microbes and their communities'
                            ])
                        ])
                    ]),
                    div({
                        dataKBTesthookPlugin: 'auth2-client',
                        dataWidget: 'auth2_signin',
                        dataBind: {
                            component: {
                                name: LoginViewComponent.quotedName(),
                                params: {
                                    runtime: 'runtime',
                                    source: 'source',
                                    nextRequest: 'nextRequest'
                                }
                            }
                        }
                    }),
                    div({
                        class: 'Col'
                    })
                ]);
                ko.applyBindings(
                    {
                        runtime: runtime,
                        nextRequest: nextRequest,
                        source: source
                    },
                    container
                );
            } catch (ex) {
                showErrorMessage(ex);
            }
        }

        function doRedirect() {
            if (nextRequest) {
                try {
                    if (nextRequest) {
                        runtime.send('app', 'navigate', nextRequest);
                    } else {
                        runtime.send('app', 'navigate', 'dashboard');
                    }
                } catch (ex) {
                    runtime.send('app', 'navigate', 'dashboard');
                }
            } else {
                runtime.send('app', 'navigate', 'dashboard');
            }
        }

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
            container.classList.add('plugin-auth2-client', 'widget-auth2_login', 'scrollable-flex-column');
        }

        function start(params) {
            // if is logged in, just redirect to the nextrequest,
            // or the nexturl, or dashboard.

            if (params.nextrequest) {
                nextRequest = JSON.parse(params.nextrequest);
            } else {
                nextRequest = null;
            }
            source = params.source;

            if (runtime.service('session').isLoggedIn()) {
                doRedirect(params);
                return null;
            }
            listeners.push(
                runtime.recv('session', 'loggedin', function () {
                    doRedirect(params);
                })
            );
            runtime.send('ui', 'setTitle', 'KBase Sign In');
            return render(params);
        }

        function stop() {
            listeners.forEach(function (listener) {
                runtime.drop(listener);
            });
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
        }

        return {
            attach,
            start,
            stop,
            detach
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
