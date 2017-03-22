define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    './utils',
    'bootstrap'
], function (
    Promise,
    html,
    DomEvents,
    BS,
    Plugin,
    Utils
) {
    var t = html.tag,
        div = t('div'),
        a = t('a'),
        button = t('button'),
        form = t('form'),
        input = t('input');

    function factory(config) {
        var hostNode, container,
            runtime = config.runtime,
            utils = Utils.make({
                runtime: runtime
            }),
            nextRequest;

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function doStaySignedIn(e) {
            var checked = e.target.checked;
            var auth2Client = runtime.service('session').getClient();
            auth2Client.setSessionPersistent(checked);
        }

        function buildLoginControl(events) {
            if (runtime.service('session').isAuthorized()) {
                return;
            }
            var providers = runtime.service('session').getProviders();

            return form({
                    class: 'form-inline',
                    dataElement: 'login-form',
                }, div({
                    style: {
                        width: '150px',
                        display: 'inline-block'
                    }
                }, [
                    div({}, [
                        button({
                            class: 'btn btn-default',
                            style: {
                                textAlign: 'cener',
                                cursor: 'pointer',
                                margin: '8px 12px',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                width: '100%'
                            },
                            type: 'button',
                            id: events.addEvent('click', function () {
                                runtime.send('app', 'navigate', {
                                    path: 'auth2/login/legacy'
                                });
                            })
                        }, 'Legacy Login')
                    ]),
                    div({},
                        providers.map(function (provider) {
                            return utils.buildLoginButton(events, provider, {
                                nextrequest: JSON.stringify(nextRequest),
                                origin: 'login'
                            });
                        })
                    ),
                    div({
                        style: {
                            marginTop: '1em'
                        }
                    }, [
                        input({
                            type: 'checkbox',
                            checked: (function () {
                                return runtime.service('session').getClient().isSessionPersistent();
                            }()),
                            id: events.addEvent('change', doStaySignedIn)
                        }),
                        ' Stay signed in'
                    ]),
                    div({
                        style: {
                            marginTop: '2em'
                        }
                    }, [
                        a({
                            href: runtime.config('resources.documentation.troubleshooting.signin')
                        }, 'Trouble signing in?')
                    ]),
                    div({
                        style: {
                            marginTop: '2em'
                        }
                    }, [
                        a({
                            href: '#auth2/signup'
                        }, 'Sign Up for a KBase Account')
                    ])
                ])

            );
        }

        function buildLogoutControl(events) {
            if (!runtime.service('session').isAuthorized()) {
                return;
            }
            var auth = runtime.service('session');
            return div(button({
                class: 'btn btn-primary',
                id: events.addEvent('click', doLogout)
            }, 'Logout ' + auth.getUsername()));
        }

        function buildAuthControl(events, params) {
            // var iframeContent = buildHtmlDoc().replace(/"/g, '&quot;')
            return div({
                style: {
                    textAlign: 'center'
                }
            }, [
                buildLoginControl(events, params),
                buildLogoutControl(events)
            ]);
        }

        function doLogout() {
            runtime.service('session').logout()
                .then(function (result) {
                    if (result.status === 'error') {
                        console.error('ERROR', result);
                    } else {
                        return renderLoginStuff();
                    }
                });
        }

        function buildForm(events, params) {
            var div = html.tag('div'),
                p = html.tag('p'),
                h1 = html.tag('h1'),
                legend = html.tag('legend'),
                i = html.tag('i'),
                a = html.tag('a');

            // eventMan.reset();
            var doodlePath = Plugin.plugin.fullPath + '/doodle.png';

            var authControl = buildAuthControl(events, params);
            return div({ class: 'container', style: 'margin-top: 4em', dataWidget: 'login' }, [
                div({}, [
                    div({
                        style: {
                            position: 'absolute',
                            backgroundImage: 'url(' + doodlePath + ')',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '35%',
                            top: '0',
                            left: '0',
                            bottom: '0',
                            right: '0',
                            opacity: '0.1',
                            zIndex: '-1000'
                        }
                    })
                ]),
                div({ class: 'row' }, [
                    div({ class: 'col-sm-7 col-sm-offset-1' }, [
                        h1({ style: 'font-size:1.6em' }, ['Welcome to KBase']),
                        p([
                            'After signing in, you can start working with KBase. Upload your experimental data and perform comparative genomics and systems biology analyses by creating ',
                            i('Narratives'),
                            ': interactive, dynamic, and shareable documents. Narratives include all your analysis steps, commentary, and visualizations.'
                        ]),
                        p([
                            'Want to learn more?  Check out the ',
                            a({ href: runtime.config('resources.documentation.narrativeGuide.url') }, 'Narrative Interface User Guide'),
                            ' or the ',
                            a({ href: 'https://youtu.be/6ql7HAUzU7U' }, 'Narrative Interface video tutorial'),
                            ', and a ',
                            a({ href: runtime.config('resources.documentation.tutorials.url') }, 'library of tutorials'),
                            ' that show you how to use various KBase apps to analyze your data.'
                        ])
                    ]),
                    div({ class: 'col-sm-3' }, [
                        div({ class: 'well well-kbase' }, [
                            div({ class: 'login-form' }, [
                                legend({ style: 'text-align: center' }, 'KBase Sign In'),
                                authControl
                            ])
                        ])
                    ])
                ])
            ]);
        }

        function showErrorMessage(message) {
            container.innerHTML = div({
                class: 'alert alert-danger'
            }, message);
        }

        function renderLoginStuff() {
            try {
                var events = DomEvents.make({
                    node: container
                });
                container.innerHTML = buildForm(events);
                events.attachEvents();
            } catch (ex) {
                console.error('ERROR rendering login stuff', ex);
                showErrorMessage(ex);
            }
        }

        function doRedirect(params) {
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
            // container.innerHTML = BS.buildPresentableJson(params);
        }

        function start(params) {
            return Promise.try(function () {
                // if is logged in, just redirect to the nextrequest,
                // or the nexturl, or dashboard.

                if (params.nextrequest) {
                    nextRequest = JSON.parse(params.nextrequest);
                } else {
                    nextRequest = '';
                }

                if (runtime.service('session').isLoggedIn()) {
                    doRedirect(params);
                } else {
                    return renderLoginStuff(params);
                }
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