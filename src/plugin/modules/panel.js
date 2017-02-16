define([
    'bluebird',
    'kb_common/auth2',
    'kb_common/html',
    'kb_common/domEvent',
    'bootstrap'
], function (
    Promise,
    Auth2,
    html,
    DomEvents
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
        select = t('select'),
        option = t('option');

    function factory(config) {
        var hostNode, container,
        runtime = config.runtime;

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function render(auth2, events, token, tokenIntrospection) {
            var selectedProvider = 'Globus';
            var selectedProvider = auth2.getLastProvider();
            var providers = [
                {
                    id: 'Globus',
                    label: 'Globus'
                },
                {
                    id: 'Google',
                    label: 'Google'
                }
            ];
            return div({
                    class: 'container-fluid'
                }, [
                    div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-md-12'
                        }, [
                            h2('Auth2 Testing'),
                            form({
                                dataElement: 'login-form',
                            }, [
                                button({
                                    type: 'button',
                                    id: events.addEvent('click', function () {doLogin('Google');})
                                }, 'Login'),
                                ' with ', 
                                select({
                                    name: 'provider'
                                }, providers.map(function (provider) {
                                    return option({
                                        value: provider.id,
                                        selected: (provider.id === selectedProvider)
                                    }, provider.label);
                                }))
                            ]),
                            div(button({
                                id: events.addEvent('click', doLogout)
                            }, 'Logout')),
                            h2('Info'),
                            table({
                                class: 'table table-striped'
                            }, [
                                tr([
                                    th('Token'),
                                    td(token)
                                ]),
                                tr([
                                    th('Introspection'),
                                    td(tokenIntrospection)
                                ]),
                                
                            ])
                        ])
                    ])
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
            var auth2 = Auth2.make({
                    cookieName: runtime.config('services.auth2.cookieName'),
                    authBaseUrl: runtime.config('services.auth2.url')
                });
            var providerSelect = document.querySelector('[data-element="login-form"] [name="provider"]');
            //  console.log('provider select', providerSelect, providerSelect.selectedIndex, providerSelect.item, providerSelect.item(providerSelect.selectedIndex).value);
            //  return false;
            var providerId = providerSelect.item(providerSelect.selectedIndex).value;

            auth2.login({
                    redirectUrl: 'https://authdev.kbase.us#auth2/login/success',
                    provider: providerId,
                    stayLoggedIn: false,
                    node: container
                });
        }

        function doLogout() {
            var auth2 = Auth2.make({
                    cookieName: runtime.config('services.auth2.cookieName'),
                    authBaseUrl: runtime.config('services.auth2.url')
                });
                auth2.logout({
                    redirectUrl: 'https://authdev.kbase.us#auth2/login/success'
                });
        }

        function start() {
            return Promise.try(function () {

                var auth2 = Auth2.make({
                    cookieName: runtime.config('services.auth2.cookieName'),
                    authBaseUrl: runtime.config('services.auth2.url')
                });
                var token = auth2.getToken();
                var tokenIntrospection;

                Promise.try(function () {
                    if (token) {
                        return auth2.introspectToken(token)
                        .then(function (response) {
                            return JSON.parse(response);
                        });
                    } else {
                        return {status: 'notoken'};
                    }
                })
                    .then(function (result) {
                        tokenIntrospection = result;
                        console.log('introspectionx', result);
                        var events = DomEvents.make({
                            node: container
                        });
                        container.innerHTML = render(auth2, events, token, buildPresentableJson(result));
                        events.attachEvents();
                    })
                    .catch(function (err) {
                        container.innerHTML = div({
                            class: 'alert alert-danger'
                        }, err.message);
                    });

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
        make: function(config) {
            return factory(config);
        }
    };
});