define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/ui',
    'kb_common_ts/Cookie',
    'kb_plugin_login',
    'kb_common/bootstrapUtils'
], function (
    Promise,
    html,
    DomEvent,
    UI,
    M_Cookie,
    Plugin,
    BS
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        b = t('b'),
        i = t('i'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th'),
        form = t('form'),
        label = t('label'),
        input = t('input'),
        button = t('button'),
        h1 = t('h1');

    function widget(config) {
        var hostNode, container, runtime = config.runtime,
            nextRequest,
            events, ui,
            // passed in the params to invoke this endpoint
            inProcessToken,
            // obtained via the login/choice call
            redirectUrl;

        // var auth2 = Auth2.make({
        //     cookieName: runtime.config('services.auth2.cookieName'),
        //     authBaseUrl: runtime.config('services.auth2.url')
        // });

        // API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
                events = DomEvent.make(container);
                ui = UI.make({ node: container });
            });
        }

        function getElement(node, name) {
            return node.querySelector('[data-element="' + name + '"]')
        }

        function hideError() {
            var node = container.querySelector('[data-element="error"]');
            node.classList.add('hidden');
        }

        function showError(error) {
            var node = ui.getElement('error');
            // console.log('error node', node);
            node.classList.remove('hidden');
            ui.setContent('error.title', error.title);
            ui.setContent('error.message.body', error.message);
            ui.setContent('error.detail.body', error.detail || '');
        }

        function hideResponse(response) {
            var node = container.querySelector('[data-element="response"]');
            node.classList.add('hidden');
            node.innerHTML = BS.buildPresentableJson(response);
        }

        function showResponse(response) {
            var node = container.querySelector('[data-element="response"]');
            node.classList.remove('hidden');
            node.innerHTML = BS.buildPresentableJson(response);
        }

        function doSubmitSignup(event) {
            event.preventDefault();

            var signupForm = container.querySelector('[data-element="signup-form"]');
            var realName = signupForm.querySelector('[name="realname"]').value;
            var username = signupForm.querySelector('[name="username"]').value;
            var email = signupForm.querySelector('[name="email"]').value;
            var id = signupForm.querySelector('[name="id"]').value;

            var data = {
                id: id,
                user: username,
                display: realName,
                email: email
            };

            runtime.service('session').getClient().loginCreate(data)
                .then(function (response) {
                    switch (response.status) {
                    case 'ok':
                        hideError();
                        renderSignupSuccess(response);
                        break;
                    case 'error':
                        hideResponse();
                        showError({
                            title: 'Error creating account',
                            message: response.data.message,
                            detail: response.data
                        });
                        break;
                    default:
                        hideResponse();
                        showError({
                            message: 'Unknown response',
                            data: response
                        })
                    }
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                    showError({
                        title: 'Exception creating account',
                        message: err.message
                    });
                });
        }

        function extractNextRequest(url) {
            var re = /.*?\?nextrequest=(.*)/;
            var match = re.exec(url);
            // console.log('extract', url, match);
            if (!match) {
                return null;
            }
            return JSON.parse(decodeURIComponent(match[1]));
        }

        function doRedirect(redirectUrl) {
            var nextRequest = extractNextRequest(redirectUrl);
            // console.log('nextRequest', nextRequest);
            // return;
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

        function handleLoginClick(identityId) {
            runtime.service('session').getClient().loginPick(inProcessToken, identityId)
                .then(function (result) {
                    if (result.status === 'ok') {
                        doRedirect(redirectUrl);
                    } else if (result.error) {
                        showError({
                            title: 'Error',
                            message: 'Error logging into account',
                            detail: BS.buildPresentableJson(result.data)
                        });
                    }
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        function renderLogin(events, choiceResponse) {
            var content;
            if (choiceResponse.login.length === 0) {
                content = '';
            } else {
                content = BS.buildPanel({
                    title: 'Log in to KBase',
                    body: div({}, [
                        div({}, p('You may log into the following KBase accounts:')),
                        div({},
                            choiceResponse.login.map(function (login) {
                                return div({
                                    style: {
                                        // border: '1px silver solid',
                                        margin: '4px',
                                        padding: '4px'
                                    }
                                }, table({
                                    class: 'table table-striped'
                                }, [
                                    td([
                                        button({
                                        class: 'btn btn-primary',
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: function () {
                                                handleLoginClick(login.id);
                                            }
                                        })
                                    }, 'Continue to KBase with account <u>' + login.username + '</u>'),
                                    ' using your ' + choiceResponse.provider + ' account linked identity ',
                                    i(login.prov_usernames[0]) +'.'
                                    ])
                                ]))
                            })
                        )
                    ])
                });
            }
            getElement(container, 'login').innerHTML = content;
        }

        function renderSignupSuccess(response) {
            ui.setContent('main-title', 'KBase Login - Signed Up and Signed In')
            var events = DomEvent.make({ node: container });
            var content = BS.buildPanel({
                type: 'success',
                title: 'KBase Account Successfuly Created',
                body: div([
                    p('Your new KBase account has been created and is ready to be used.'),
                    div([
                        button({
                            class: 'btn btn-primary',
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    doRedirect(redirectUrl);
                                }
                            })
                        }, 'Continue to Destination')
                    ])
                ])
            });
            ui.setContent('create', content);
            ui.setContent('introduction', '');
            events.attachEvents();
        }

        function renderSignup(events, choiceResponse) {
            var showNumber = false;
            if (choiceResponse.create.length > 1) {
                showNumber = true;
            }
            var content = choiceResponse.create.map(function (create, index) {
                var numberPrefix = '';
                if (showNumber) {                    
                    numberPrefix = String(index + 1) + '. ';
                }
                return BS.buildPanel({
                    title: numberPrefix + 'Sign up for KBase',
                    body: div({}, [
                        div({
                            class: 'row'
                        }, [
                            div({
                                class: 'col-md-12'
                            }, [
                                p([
                                    'Signing up is easy. Just fill out the form below and click ',
                                    b('Create KBase Account')
                                 ]),
                                 p([
                                     'Field values are pre-filled from your ',
                                     b(choiceResponse.provider),
                                    ' account.'
                                ])
                            ])
                        ]),
                        div({
                            class: 'row'
                        }, [
                            div({
                                class: 'col-md-6'
                            }, [
                                // p([
                                //     'Signing up is easy. Just fill out the form below (with values pre-filled from your identity provider)',
                                //     ' and and then click the Create KBase Account button.'
                                // ]),
                                form({
                                    dataElement: 'signup-form',
                                    id: events.addEvent({
                                        type: 'submit',
                                        handler: doSubmitSignup
                                    })
                                }, [
                                    input({
                                        name: 'id',
                                        type: 'hidden',
                                        value: create.id
                                    }),
                                    div({
                                        class: 'form-group'
                                    }, [
                                        label({
                                            for: 'signup_realname'
                                        }, 'Your Name'),
                                        input({
                                            type: 'text',
                                            class: 'form-control',
                                            id: 'signup_realname',
                                            name: 'realname',
                                            value: create.prov_fullname
                                        })
                                    ]),
                                    div({
                                        class: 'form-group'
                                    }, [
                                        label({
                                            for: 'signup_username'
                                        }, 'Username'),
                                        input({
                                            type: 'text',
                                            class: 'form-control',
                                            id: 'signup_username',
                                            name: 'username',
                                            value: create.usernamesugg
                                        })
                                    ]),
                                    div({
                                        class: 'form-group'
                                    }, [
                                        label({
                                            for: 'signup_email'
                                        }, 'E-Mail'),
                                        input({
                                            type: 'text',
                                            class: 'form-control',
                                            id: 'signup_email',
                                            name: 'email',
                                            value: create.prov_email
                                        })
                                    ]),

                                    button({
                                        class: 'btn btn-primary',
                                        type: 'submit',
                                        id: events.addEvent({ type: 'click', handler: doSubmitSignup })
                                    }, 'Create KBase Account')
                                ])]),
                            div({
                                class: 'col-md-6'
                            }, [
                                    BS.buildPanel({
                                        title: 'Linking This Identity Account',
                                        body: div({ class: 'container-fluid' }, [
                                            div({ class: 'row' }, [
                                                div({
                                                    class: 'col-md-12'
                                                }, [
                                                    p('The new KBase account account will be <i>linked</i> to this ' + span({ style: { fontWeight: 'bold' } }, choiceResponse.provider) + ' account.')
                                                ]),
                                            ]),
                                            div({ class: 'row'}, [

                                                div({
                                                    class: 'col-md-12'
                                                }, [
                                                    table({
                                                        class: 'table table-striped'
                                                    }, [
                                                        tr([
                                                            th('Name on account'),
                                                            td(create.prov_fullname)
                                                        ]),
                                                        tr([
                                                            th('Username'),
                                                            td(create.prov_username)
                                                        ]),
                                                        tr([
                                                            th('E-Mail Address'),
                                                            td(create.prov_email)
                                                        ])
                                                    ])
                                                ])
                                            ])
                                        ])
                                    })
                                ])
                            ])
                        ])
                })
            }).join('\n');
            getElement(container, 'create').innerHTML = content;
        }

        function renderLayout() {
            container.innerHTML = div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        div(
                            h1({
                                dataElement: 'main-title'
                            }, 'KBase Login - further action required')
                        ),
                        div({
                            dataElement: 'introduction'
                        }),
                        div({
                            dataElement: 'login'
                        }),
                        div({
                            dataElement: 'create'
                        }),
                        div({
                            dataElement: 'debug'
                        }),
                        div({
                            dataElement: 'response'
                        }),
                        BS.buildPanel({
                            name: 'error',
                            hidden: true,
                            title: 'Error',
                            type: 'danger',
                            body: div([
                                div({
                                    dataElement: 'title'
                                }),

                                ui.buildPanel({
                                    name: 'message',
                                    title: 'Message',
                                    body: div({
                                        dataElement: 'body'
                                    })
                                }),
                                ui.buildCollapsiblePanel({
                                    name: 'detail',
                                    title: 'Detail',
                                    collapsed: true,
                                    hidden: false,
                                    body: div({
                                        dataElement: 'body'
                                    })
                                })
                            ])
                        })
                    ])
                ])
            ]);
        }

        function start(params) {
            // inProcessToken = params['in-process-login-token'];
            var cookieManager = new M_Cookie.CookieManager();
            inProcessToken = cookieManager.getItem('in-process-login-token');
            // console.log('cookie?', inProcessToken);

            // Clean up window 
           if(window.history != undefined && 
              window.history.pushState != undefined &&
              window.location.search &&
              window.location.search.length > 0) {
                // if pushstate exists, add a new state the the history, this changes the url without 
                // reloading the page
                var newUrl = new URL(window.location.href);
                var oldQuery = newUrl.search;
                var newHash = newUrl.hash + oldQuery;
                newUrl.search = '';                
                newUrl.hash = newHash;
                window.history.pushState({}, document.title, newUrl.toString());
            }


            return Promise.try(function () {
                var events = DomEvent.make({
                    node: container
                });                
                renderLayout();
                // console.log('params', params, params['in-process-login-token']);
                runtime.service('session').getClient().getClient().getLoginChoice(inProcessToken)
                    .then(function (result) {
                        // Two possible outcomes here:

                        // 1. user does not have an account yet, signalled by the 
                        // create property having 1 item and login being empty

                        // 2. user is using a non-primary identity from a federated
                        // service -- the only one of which we have is Globus.
                        // In this case the user can either "log in" to the account
                        // linked to their primary, or create a new account.
                        // I'm not sure we need to distinguish this case. If a user is
                        // using a secondary auth method for their Globus account, 
                        // it should be ok to just pass them through to that account.
                        // It is otherwise quite confusing...

                        // 3. usser is using an  identity which is linked to more then one
                        // account, in which case there are 2 or more login items and no 
                        // create.
                        var choice = result.data;
                        redirectUrl = choice.redirecturl;
                        if (result.status === 'ok') {
                            var intro;
                            if (result.data.create.length === 0) {
                                if (result.data.login.length === 0) {
                                    // should not be possible!
                                    intro = 'no choices -- should not occur!';
                                } else if (result.data.login.length === 1) {
                                    // just log them in, but we should never see this case.
                                    intro = div([
                                        p([
                                            'This ' + b(choice.provider) + ' identity account is associated with a KBase account.'
                                        ]), 
                                        p([
                                            'Click the login button for the associated account to continue using KBase as that user.'
                                        ])
                                    ]);
                                    ui.setContent('main-title', 'KBase Login - Ready')
                                    renderLogin(events, result.data);
                                } else {
                                    ui.setContent('main-title', 'KBase Login - Sign In')
                                     intro = div([
                                        p([
                                            'This ' + b(choice.provider) + ' identity account is associated with ',
                                            String(result.data.login.length), 
                                            ' KBase accounts.'
                                        ]), 
                                        p([
                                            'Click the login button for the associated account to continue using KBase as that user.'
                                        ])
                                    ]);
                                    renderLogin(events, result.data);
                                }
                            } else if (result.data.create.length === 1) {
                                if (result.data.login.length === 0) {
                                    ui.setContent('main-title', 'KBase Login - Sign Up')
                                    intro = div([
                                        p([
                                            'This ' + b(choice.provider) + ' identity account (shown below in <b>Linking This Identity Account</b>) is not currently associated ',
                                            'with a KBase account. You may create a new KBase account below and have this ',
                                            b(choice.provider),
                                            ' identity account linked to it.'
                                        ]),
                                        p([
                                            'After creating this new KBase account, you will be automatically logged in.',
                                        ]),
                                        p([
                                            'Thereafter, you may then use this ' + b(choice.provider) + ' account to log in to KBase.'
                                        ])
                                    ]);
                                    renderSignup(events, result.data);
                                } else if (result.data.login.length === 1) {
                                    intro = div([
                                        p([
                                            'This ' + choice.provider + ' identity account may be used to log into ',
                                            'the following KBase account, or to create a new KBase account.'
                                        ]),
                                        p([
                                            'To avoid this screen in the future, you may link this identity account to ',
                                            'your KBase account in order to log in directly with it.'
                                        ])
                                    ]);
                                    renderLogin(events, result.data);
                                    renderSignup(events, result.data);
                                    // should not occur
                                } else {
                                    intro = 'um, should not be able to sign up and log in at the same time.';
                                    // should not occur
                                }
                            } else {
                                if (result.data.login.length === 0) {
                                    // should not be possible!
                                    ui.setContent('main-title', 'KBase Login - Sign Up')
                                    intro = div([
                                        p([
                                            'Your  ',                                            
                                            b(choice.provider),
                                            ' account contains  ',
                                            String(result.data.create.length),
                                            ' linked identity accounts which ',
                                            'are not currently associated ',
                                            'with a KBase account.'
                                        ]),
                                        p([
                                            'You may create a new KBase account for each linked identity account.'
                                        ]),
                                        p([
                                            'After creating this new KBase account, you will be automatically logged in.',
                                        ]),
                                        p([
                                            'Thereafter, you may then use this ' + b(choice.provider) + ' account to log in to KBase.'
                                        ])
                                    ]);
                                } else {
                                    // just log them in, but we should never see this case.
                                    ui.setContent('main-title', 'KBase Login - Sign Up or Sign In')
                                    intro = div([
                                        p([
                                            'Your  ',                                            
                                            b(choice.provider),
                                            ' account contains  ',
                                            String(result.data.create.length),
                                            ' linked identity accounts which ',
                                            'are not currently associated ',
                                            'with a KBase account.'
                                        ]),
                                        p([
                                            'You may create a new KBase account for each linked identity account.'
                                        ]),
                                        p([
                                            'After creating this new KBase account, you will be automatically logged in.',
                                        ]),
                                        p([
                                            'Thereafter, you may then use this ' + b(choice.provider) + ' account to log in to KBase.'
                                        ])
                                    ]);
                                }

                                renderLogin(events, result.data);
                                renderSignup(events, result.data);
                            }
                            // ui.setContent('title', h1('KBase Login - further action required'));
                            ui.setContent('introduction', intro);
                            var debug = BS.buildCollapsiblePanel({
                                title: 'debug',
                                collapsed: true,
                                body: BS.buildPresentableJson(result.data)
                            });
                            container.querySelector('[data-element="debug"]').innerHTML = debug;
                        } else if (result.status === 'error') {
                            console.error(result);
                            showError({
                                title: 'Error fetching login choices',
                                message: result.data.error.message,
                                detail: BS.buildPresentableJson(result.data.error)
                            });
                        } else {
                            console.error(result);
                            showError({
                                title: 'Error processing login choice',
                                message: 'Unexpected response',
                                detail: BS.buildPresentableJson(result)
                            })
                        }
                        events.attachEvents();
                    })
                    .catch(function (err) {
                        container.innerHTML = err.message;
                        console.log('ERROR', err);
                    })
            });
        }

        function stop() {
            return null;
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
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
            return widget(config);
        }
    };

});