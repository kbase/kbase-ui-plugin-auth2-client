define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_service/client/workspace',
    'bootstrap'
], function (
    Promise,
    html,
    DomEvents,
    Workspace
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
        option = t('option'),
        iframe = t('iframe');

    function factory(config) {
        var hostNode, container,
        runtime = config.runtime;

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }
        function buildHtmlDoc () {
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
        
        function render(events, token, tokenIntrospection, accountInfo, wsInfo) {
            var iframeContent = buildHtmlDoc().replace(/"/g, '&quot;')
            return Promise.try(function () {
                return div({
                        class: 'container-fluid'
                    }, [
                        div({
                            class: 'row'
                        }, [
                            div({
                                class: 'col-md-12'
                            }, [
                                h2('Auth2 Info'),
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
                                     tr([
                                        th('Account'),
                                        td(accountInfo)
                                    ]),
                                     tr([
                                        th('Account'),
                                        td(wsInfo)
                                    ]),
                                    tr([
                                        th('Authorized?'),
                                        td(runtime.service('session').isLoggedIn() ? 'yes' : 'no')
                                    ])
                                ])
                            // div({
                            //     style: {
                            //         border: '2px red solid'
                            //     }
                            // }, [
                            //     iframe({
                            //         srcdoc: iframeContent
                            //     })
                            // ])
                            ])
                        ])
                    ]);
            })
            .catch(function (err) {
                return err.message;
            });
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

        function wsTest() {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.service('session').getAuthToken()
            });
            console.log('trying token', runtime.service('session').getAuthToken(), 'for', runtime.config('services.workspace.url'));
            return workspace.get_workspace_info({
                id: 17371
            });
        }

        function renderForm() {
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
            
            return div({class: 'container', style: 'margin-top: 4em', dataWidget: 'login'}, [
                div({}, [
                    div({style: {
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
                        }})
                ]),
                div({class: 'row'}, [
                    div({class: 'col-sm-7 col-sm-offset-1'}, [
                        h1({style: 'font-size:1.6em'}, ['Welcome to KBase']),
                        p([
                            'After signing in, you can start working with KBase. Upload your experimental data and perform comparative genomics and systems biology analyses by creating ', 
                            i('Narratives'), 
                            ': interactive, dynamic, and shareable documents. Narratives include all your analysis steps, commentary, and visualizations.'
                        ]),
                        p([
                            'Want to learn more?  Check out the ',
                            a({href: runtime.config('resources.documentation.narrativeGuide.url')}, 'Narrative Interface User Guide'),
                            ' or the ',
                            a({href: 'https://youtu.be/6ql7HAUzU7U'}, 'Narrative Interface video tutorial'),
                            ', and a ',
                            a({href: runtime.config('resources.documentation.tutorials.url')}, 'library of tutorials'), 
                            ' that show you how to use various KBase apps to analyze your data.'
                        ])
                    ]),
                    div({class: 'col-sm-3'}, [
                        div({class: 'well well-kbase'}, [
                            form({class: 'form login-form', id: events.addEvent('submit', handleLogin)}, [
                                input({type: 'hidden', value: nextPath}),
                                input({type: 'hidden', value: nextURL}),
                                legend({style: 'text-align: center'}, 'KBase Sign In'),
                                div({class: 'form-group'}, [
                                    input({name: 'username', type: 'text', placeholder: 'username', id: events.addEvent('keyup', handleUsernameKeyup), dataElement: 'username', autocomplete: 'off', class: 'form-control form-control-kbase', tabindex: '1'}),
                                    div({dataElement: 'username-message', class: 'alert', style: {display: 'none'}})
                                ]),
                                div({class: 'form-group'}, [
                                    input({name: 'password', type: 'password', placeholder: 'password', id: 'kbase_password', dataElement: 'password', autocomplete: 'off', class: 'form-control form-control-kbase', tabindex: '2'})
                                ]),
                                div({class: 'form-group'}, [
                                    button({id: 'signinbtn', type: 'submit', class: 'btn btn-primary btn-block btn-kbase', tabindex: '3', 'data-element': 'sign-in'}, [
                                        i({class: 'fa fa-sign-in', style: 'margin-right: 1em;'}),
                                        'Sign In'
                                    ]),
                                    button({id: 'signinbtn', type: 'submit', class: 'btn btn-primary btn-block btn-kbase', style: 'display:none;', tabindex: '3', 'data-element': 'signing-in'}, [
                                        i({class: 'fa fa-spinner fa-spin', style: 'margin-right: 1em;'}),
                                        'Signing In...'
                                    ]),
                                    div({'data-element': 'error', class: 'alert alert-danger alert-kbase', style: 'display:none; margin-top: 1em'})
                                ]),
                                div({class: 'form-group', style: 'margin-top: 3em; margin-bottom: 0;'}, [
                                    a({target: '_blank', href: runtime.config('resources.userAccount.signUp.url'), class: 'btn btn-block btn-link'}, 'New to KBase? Sign Up'),
                                    a({target: '_blank', href: runtime.config('resources.userAccount.resetPassword.url'), class: 'btn btn-block btn-link'}, 'Forgot your password?'),
                                    a({target: '_blank', href: runtime.config('resources.documentation.loginHelp.url'), class: 'btn btn-block btn-link'}, 'Help')
                                ])
                            ])
                        ])
                    ])
                ])
            ]);

        }
        function start() {
            return Promise.try(function () {
                var events = DomEvents.make({
                    node: container
                });
                var auth2 = runtime.service('session');
                var token = auth2.getAuthToken();

                Promise.all([
                    auth2.getIntrospection(),
                    auth2.getAccount(),
                    'n/a'
                ])

                    .spread(function (tokenInfo, accountInfo, wsInfo) {
                        return render(events, token, buildPresentableJson(tokenInfo), buildPresentableJson(accountInfo), buildPresentableJson(wsInfo))
                    })
                    .then(function (content) {
                        container.innerHTML = content;
                        events.attachEvents();
                    })
                    .catch(function (err) {
                        console.error('ERROR', err);
                        container.innerHTML = div({
                            class: 'alert alert-danger'
                        }, err.message || (err.error && err.error.message));
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