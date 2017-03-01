define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'bootstrap'
], function (
    Promise,
    html,
    DomEvents,
    BS
) {
    var t = html.tag,
        div = t('div'),
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

        function buildLoginControl(events) {
            if (runtime.service('session').isAuthorized()) {
                return;
            }
            var selectedProvider = runtime.service('session').getLastProvider();
            var providers = runtime.service('session').getProviders();

            return form({
                class: 'form-inline',
                dataElement: 'login-form',
            }, [                
                button({
                    class: 'btn btn-primary',
                    type: 'button',
                    id: events.addEvent('click', doLogin)
                }, 'Login'),
                ' with ',
                select({
                    class: 'form-control',
                    name: 'provider'
                }, providers.map(function (provider) {
                    return option({
                        value: provider.id,
                        selected: (provider.id === selectedProvider)
                    }, provider.label);
                }))
            ]);
        }

        function buildLogoutControl(events) {
            if (!runtime.service('session').isAuthorized()) {
                return;
            }
            var auth = runtime.service('session');
            console.log('AUTH', auth);
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
            var providerId = providerSelect.item(providerSelect.selectedIndex).value;
            var fakeUrl = window.location.origin + '?nextrequest=' + encodeURIComponent(JSON.stringify(nextRequest));

            //  console.log('next request?', nextRequest, fakeUrl);
            //  return;

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
                console.log('ERROR rendering login stuff', ex);
                showErrorMessage(ex);
            }
        }

        function doRedirect(params) {
            if (nextRequest) {
                try {
                    // console.log('nextrequest', nextRequest);
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
                    console.log(params);
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