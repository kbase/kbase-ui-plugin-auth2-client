define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    'bootstrap'
], function (
    Promise,
    html,
    DomEvents,
    BS,
    Plugin
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        img = t('img'),
        h2 = t('h2'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        button = t('button'),
        form = t('form'),
        input = t('input'),
        select = t('select'),
        option = t('option'),
        iframe = t('iframe');

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

        function buildHtmlDoc() {
            var t = html.tag,
                htmlTag = t('html'),
                head = t('head'),
                body = t('body'),
                script = t('script');
            return 'not yet';
            var clientId = '295942161521-qhsqomsg7629f861s60kdvc9kr2tqm1b.apps.googleusercontent.com';
            return htmlTag([
                head([
                    script({
                        src: 'https://apis.google.com/js/platform.js',
                        async: true,
                        defer: true
                    })
                ]),
                body({
                    style: {
                        margin: '0px',
                        padding: '0px',
                        overflow: 'auto'
                    }
                }, [
                    script([
                        'gapi.client.init({',
                        ' clientId: ' + clientId + ',',
                        '})',
                        '.then'
                    ])
                ])
            ]);
        }

        function doStaySignedIn(e) {
            var checked = e.target.checked;
            var auth2Client = runtime.service('session').getClient();
            auth2Client.setSessionPersistent(checked);
        }

        function buildProviderLabel(provider) {
             return div({
                    style: {
                        display: 'inline',
                        whiteSPace: 'nowrap',
                        height: '54px'
                    }
                }, [
                    div({
                        style: {
                            display: 'inline-block',
                            width: '54px',
                            height: '24px',
                            marginRight: '4px'
                        }
                    }, 
                    img({                        
                        src: Plugin.plugin.fullPath + '/providers/' + provider.id.toLowerCase() + '_logo.png',
                        style: {
                            height: '24px'
                        }
                    })),
                    provider.label
                ]);
        }

        function buildLoginControl(events) {
            if (runtime.service('session').isAuthorized()) {
                return;
            }
            var providers = runtime.service('session').getProviders();
            var selectedProviderId = runtime.service('session').getLastProvider() || 'Globus';
            var selectedProvider = providers.filter(function (provider) {
                return (provider.id === selectedProviderId);
            })[0];
            var providerControlId = html.genId();
            var providerMenuId = html.genId();
            var providerMenuLabelId = html.genId();

            return form({
                    class: 'form-inline',
                    dataElement: 'login-form',
                }, div({}, [
                    div({}, [
                        button({
                            class: 'btn btn-primary',
                            type: 'button',
                            id: events.addEvent('click', doLogin)
                        }, 'Login'),
                        span({
                            style: {
                                margin: '0 0.7em'
                            }
                        }, 'with'),
                        div({
                            xclass: 'kb-dropdown',
                            style: {
                                position: 'relative',
                                display: 'inline-block'
                            }
                        }, [
                            input({
                                id: providerControlId,
                                name: 'provider',
                                type: 'hidden',
                                value: selectedProviderId
                            }),
                            button({
                                class: 'btn btn-default dropdown-toggle',
                                type: 'button',
                                id: events.addEvent('click', function () {
                                    var n = document.getElementById(providerMenuId);
                                    if (n.style.display === 'none') {
                                        n.style.display = 'block';
                                    } else {
                                        n.style.display = 'none';
                                    }
                                }),
                                xid: providerMenuId,
                                ariaHaspopup: 'true',
                                ariaExpanded: 'true'
                            }, [
                                span({
                                    id: providerMenuLabelId
                                }, buildProviderLabel(selectedProvider)),
                                span({
                                    class: 'caret',
                                    style: {
                                        marginLeft: '10px'
                                    }
                                })
                            ]),
                            ul({
                                style: {
                                    position: 'absolute',
                                    top: '100%',
                                    left: '0',                                    
                                    float: 'left',
                                    listStyle: 'none',
                                    display: 'none',
                                    border: '1px silver solid',
                                    padding: '0',
                                    backgroundColor: 'white'
                                },
                                id: providerMenuId,
                                xariaLabelledby: providerMenuId
                            }, providers.map(function (provider) {
                                return li({
                                    class: 'login-provider',
                                    style: {
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        margin: '8px 12px',
                                        display: 'block',
                                        whiteSpace: 'nowrap'
                                    }
                                }, div({
                                    id: events.addEvent('click', function () {
                                        // var controlNode = document.getElementById(providerControlId);
                                        var providerInput = document.querySelector('[data-element="login-form"] [name="provider"]')
                                        providerInput.value = provider.id;
                                        var menuLabelNode = document.getElementById(providerMenuLabelId);
                                        menuLabelNode.innerHTML = buildProviderLabel(provider);
                                        var n = document.getElementById(providerMenuId);
                                        n.style.display = 'none';
                                        runtime.service('session').getClient().setLastProvider(provider.id);
                                    })
                                },  buildProviderLabel(provider)))
                            })
                            )
                        ])
                        
                    ]),
                    div({
                        style: {
                            marginTop: '1em'
                        }
                    }, [
                        input({
                            type: 'checkbox',
                            checked: (function () {
                                return runtime.service('session').getClient().isSessionPersistent()
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

        function buildPresentableJson(data) {
            switch (typeof data) {
            case 'string':
                return data;
            case 'number':
                return String(data);
            case 'boolean':
                return String(data);
            case 'object':
                if (data === null) {
                    return 'NULL';
                }
                if (data instanceof Array) {
                    return table({ class: 'table table-striped' },
                        data.map(function (datum, index) {
                            return tr([
                                th(String(index)),
                                td(buildPresentableJson(datum))
                            ]);
                        }).join('\n')
                    );
                }
                return table({ class: 'table table-striped' },
                    Object.keys(data).map(function (key) {
                        return tr([th(key), td(buildPresentableJson(data[key]))]);
                    }).join('\n')
                );
            default:
                return 'Not representable: ' + (typeof data);
            }
        }

        function doLogin() {
            var providerSelect = document.querySelector('[data-element="login-form"] [name="provider"]');
            var providerId = providerSelect.value;
            var fakeUrl = window.location.origin + '?nextrequest=' + encodeURIComponent(JSON.stringify(nextRequest));

            runtime.service('session').login({
                // TODO: this should be either the redirect url passed in 
                // or the dashboard.
                // We just let the login page do this. When the login page is 
                // entered with a valid token, redirect to the nextrequest,
                // and if that is empty, the dashboard.
                redirectUrl: fakeUrl,
                provider: providerId,
                stayLoggedIn: false,
                node: container
            });
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
            var form = html.tag('form'),
                input = html.tag('input'),
                button = html.tag('button'),
                div = html.tag('div'),
                p = html.tag('p'),
                h1 = html.tag('h1'),
                legend = html.tag('legend'),
                i = html.tag('i'),
                a = html.tag('a');

            /* TODO: use the actual next path */
            // Variables for form.
            var nextPath = 'next path',
                nextURL = 'next url';

            // eventMan.reset();
            // var doodlePath = Plugin.plugin.fullPath + '/doodle.png';

            var authControl = buildAuthControl(events, params);
            return div({ class: 'container', style: 'margin-top: 4em', dataWidget: 'login' }, [
                div({}, [
                    div({
                        style: {
                            position: 'absolute',
                            // backgroundImage: 'url(' + doodlePath + ')',
                            // backgroundRepeat: 'no-repeat',
                            // backgroundSize: '35%',
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
                    div({ class: 'col-sm-6 col-sm-offset-1' }, [
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
                    div({ class: 'col-sm-4' }, [
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
                    return renderLoginStuff(params)
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