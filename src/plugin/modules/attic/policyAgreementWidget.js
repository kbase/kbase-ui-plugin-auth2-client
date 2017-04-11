define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/ui',
    'kb_common_ts/Cookie',
    'kb_plugin_auth2-client',
    'kb_common/bootstrapUtils',
    '../policies',
    '../utils'
], function (
    Promise,
    html,
    DomEvent,
    UI,
    M_Cookie,
    Plugin,
    BS,
    Policies,
    Utils
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
        h3 = t('h3'),
        ul = t('ul'),
        li = t('li');

    var vm;

    function widget(config) {
        var hostNode, container, runtime = config.runtime,
            nextRequest,
            events, ui,
            // passed in the params to invoke this endpoint
            inProcessToken,
            // obtained via the login/choice call
            redirectUrl,
            stateParams,
            policies = Policies.make({
                runtime: runtime
            });

        var utils = Utils.make({
            runtime: runtime
        });

        var vm = config.vm;

        // var vm = utils.

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
                ui = UI.make({
                    node: container
                });
            });
        }

        function getElement(node, name) {
            return node.querySelector('[data-element="' + name + '"]');
        }

        function hideError() {
            var node = container.querySelector('[data-element="error"]');
            node.classList.add('hidden');
        }

        function setContent(id, selector, content) {
            document.getElementById(id).querySelector(selector).innerHTML = content;
        }

        function showError(error) {
            var node = ui.getElement('error');
            node.classList.remove('hidden');
            setContent(vm.error.id, '[data-element="title"]', error.title);
            setContent(vm.error.message.id, '[data-element="body"]', error.message);
            setContent(vm.error.detail.id, '[data-element="body"]', error.detail);
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

       

        function doRedirect() {
            var nextRequest = stateParams.nextrequest;
            if (nextRequest) {
                try {
                    var navigateRequest = JSON.parse(nextRequest);
                    runtime.send('app', 'navigate', navigateRequest);
                } catch (ex) {
                    console.error('ERROR parsing next request', nextRequest, ex);
                    runtime.send('app', 'navigate', '');
                }
            } else {
                runtime.send('app', 'navigate', '');
            }
        }

        function evaluatePolicies(policyIds) {
            var userAgreementMap = {};
            var userAgreementVersionMap = {};
            policyIds.forEach(function (policyId) {
                var id = policyId.id.split('.');
                var agreement = {
                    id: id[0],
                    version: id[1],
                    date: new Date(policyId.agreed_on)
                };
                userAgreementMap[agreement.id] = agreement;
                userAgreementVersionMap[agreement.id + '.' + agreement.version] = agreement;
            });
            return policies.getLatestPolicies()
                .then(function (latestPolicies) {
                    var userPolicies = [];
                    var missingPolicies = [];
                    var outdatedPolicies = [];
                    latestPolicies.forEach(function (latestPolicy) {
                        var userAgreement = userAgreementMap[latestPolicy.id];
                        var userAgreementVersion = userAgreementVersionMap[latestPolicy.id + '.' + latestPolicy.version];
                        if (!userAgreement) {
                            missingPolicies.push({
                                policy: latestPolicy,
                                id: latestPolicy.id,
                                version: latestPolicy.version
                            });
                        } else if (!userAgreementVersion) {
                            outdatedPolicies.push({
                                policy: latestPolicy,
                                id: latestPolicy.id,
                                version: latestPolicy.version,
                                agreement: userAgreement
                            });
                        } else {
                            userPolicies.push(userAgreement);
                        }
                    });
                    return {
                        user: userPolicies,
                        missing: missingPolicies,
                        outdated: outdatedPolicies
                    };
                });
        }

        function niceDate(epoch) {
            var date = new Date(epoch);
            return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
            // return date.toUTCString();
        }

        function updateUI() {
            Object.keys(vm.login.vm).forEach(function (loginId) {
                var login = vm.login.vm[loginId];
                var disableLogin = false;
                login.value.policiesToResolve.missing.forEach(function (policy) {
                    if (!policy.agreed) {
                        disableLogin = true;
                    }
                });
                login.value.policiesToResolve.outdated.forEach(function (policy) {
                    if (!policy.agreed) {
                        disableLogin = true;
                    }
                });
                if (disableLogin) {
                    login.vm.button.node.disabled = true;
                } else {
                    login.vm.button.node.disabled = false;
                }

            });

            Object.keys(vm.create.vm).forEach(function (id) {
                var create = vm.create.vm[id];
                var disableButton = false;
                create.value.policiesToResolve.missing.forEach(function (policy) {
                    if (!policy.agreed) {
                        disableButton = true;
                    }
                });
                create.value.policiesToResolve.outdated.forEach(function (policy) {
                    if (!policy.agreed) {
                        disableButton = true;
                    }
                });
                if (disableButton) {
                    create.vm.button.node.disabled = true;
                } else {
                    create.vm.button.node.disabled = false;
                }

            });
        }

        function minifyResolver(id) {
            var n = document.getElementById(id).querySelector('[data-element="policyViewer"]');
            if (!n) {
                return;
            }
            n.style.height = '100px';
            n.setAttribute('data-min-max', 'min');
        }

        function maxifyResolver(id) {
            var n = document.getElementById(id).querySelector('[data-element="policyViewer"]');
            if (!n) {
                return;
            }
            n.style.height = '400px';
            n.setAttribute('data-min-max', 'max');
        }

        function renderPolicies(node, policiesToResolve) {
            var content = [
                
            ];
            var events = DomEvent.make({
                node: node
            });
            if (policiesToResolve.missing.length > 0) {
                content.push(h3('Agree to KBase User Policies'));
                content.push(div({
                    style: {
                        marginTop: '20px'
                    }
                }, [
                    p([
                        'The following KBase account policies will need to be agreed to before you can create a KBase account.',
                    ]),
                    div({}, [
                        policiesToResolve.missing.map(function (missingPolicy) {
                            var policy = policies.getPolicy(missingPolicy.id);
                            var version = policies.getPolicyVersion(missingPolicy.id, missingPolicy.version);
                            var resolverId = html.genId();
                            return div({
                                style: {
                                    marginTop: '10px'
                                },
                                id: resolverId
                            }, [
                                div({
                                    style: {
                                        fontWeight: 'bold'
                                    }
                                }, policy.title),
                                div({
                                    style: {

                                    }
                                }, 'Version: ' + missingPolicy.policy.version),
                                div({
                                    style: {

                                    }
                                }, 'Published on: ' + version.date),
                                div({
                                    style: {

                                    }
                                }, [
                                    div({
                                        style: {
                                            height: '400px',
                                            overflowY: 'scroll',
                                            border: '1px silver solid',
                                            padding: '4px',
                                            backgroundColor: '#EEE'
                                        },
                                        dataElement: 'policyViewer',
                                        dataMinMax: 'max',
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: function (e) {
                                                var n = e.currentTarget;
                                                if (n.getAttribute('data-min-max') === 'min') {
                                                    n.style.height = '400px';
                                                    n.setAttribute('data-min-max', 'max');
                                                } else {
                                                    n.style.height = '100px';
                                                    n.setAttribute('data-min-max', 'min');
                                                }
                                            }
                                        })
                                    }, missingPolicy.policy.fileContent)
                                ]),
                                div({
                                    style: {

                                    }
                                }, [
                                    input({
                                        type: 'checkbox',
                                        name: 'agreed',
                                        // TODO: this is just for prototyping -- this needs to evolve
                                        // in to a viewmodel-based widget.
                                        value: JSON.stringify({
                                            id: missingPolicy.policy.id,
                                            version: missingPolicy.policy.version
                                        }),
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: function (e) {
                                                if (e.target.checked) {
                                                    missingPolicy.agreed = true;
                                                    minifyResolver(resolverId);
                                                } else {
                                                    missingPolicy.agreed = false;
                                                    maxifyResolver(resolverId);
                                                }
                                                updateUI();
                                            }
                                        })
                                    }),
                                    ' I have read and agree to this policy'
                                ])
                            ]);
                        }).join('\n')
                    ])
                ]));
            }
            if (policiesToResolve.outdated.length > 0) {
                content.push(div({
                    style: {
                        marginTop: '20px'
                    }
                }, [
                    p([
                        'The following KBase User Agreements have been updated and you need to re-agree to them. ',
                    ]),
                    p([
                        'You may log into this account after you have agreed to these policies by checking the box at the bottom of each.'
                    ]),
                    div({}, [
                        policiesToResolve.outdated.map(function (missingPolicy) {
                            var policy = policies.getPolicy(missingPolicy.id);
                            var version = policies.getPolicyVersion(missingPolicy.id, missingPolicy.version);
                            var resolverId = html.genId();
                            return div({
                                style: {
                                    marginTop: '10px'
                                },
                                id: resolverId
                            }, [
                                div({
                                    style: {
                                        fontWeight: 'bold'
                                    }
                                }, policy.title),
                                div({
                                    style: {

                                    }
                                }, 'Version you last agreed to: ' + missingPolicy.agreement.version),
                                div({
                                    style: {

                                    }
                                }, 'On: ' + niceDate(missingPolicy.agreement.date)),
                                div({
                                    style: {

                                    }
                                }, 'Current version: ' + missingPolicy.version),
                                div({
                                    style: {

                                    }
                                }, 'Published on: ' + version.date),
                                div({
                                    style: {

                                    }
                                }, [
                                    div({
                                        style: {
                                            height: '400px',
                                            overflowY: 'scroll',
                                            border: '1px silver solid',
                                            padding: '4px'
                                        },
                                        dataElement: 'policyViewer',
                                        dataMinMax: 'max',
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: function (e) {
                                                var n = e.currentTarget;
                                                if (n.getAttribute('data-min-max') === 'min') {
                                                    n.style.height = '400px';
                                                    n.setAttribute('data-min-max', 'max');
                                                } else {
                                                    n.style.height = '100px';
                                                    n.setAttribute('data-min-max', 'min');
                                                }
                                            }
                                        })
                                    }, missingPolicy.policy.fileContent)
                                ]),
                                div({
                                    style: {}
                                }, [
                                    input({
                                        type: 'checkbox',
                                        name: 'agreed',
                                        // TODO: this is just for prototyping -- this needs to evolve
                                        // in to a viewmodel-based widget.
                                        value: JSON.stringify({
                                            id: missingPolicy.policy.id,
                                            version: missingPolicy.policy.version
                                        }),
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: function (e) {
                                                if (e.target.checked) {
                                                    missingPolicy.agreed = true;
                                                    minifyResolver(resolverId);
                                                } else {
                                                    missingPolicy.agreed = false;
                                                    maxifyResolver(resolverId);
                                                }
                                                updateUI();
                                            }
                                        })
                                    }),
                                    ' I have read and agree to this policy'
                                ])
                            ]);
                        }).join('\n')
                    ])
                ]));
            }
            node.innerHTML = content.join('\n');
            events.attachEvents();
        }

        function renderLogin(events, choiceResponse) {
            var content;
            var deferUI = DeferUI();

            if (choiceResponse.login.length === 0) {
                content = '';
            } else {
                content = BS.buildPanel({
                    title: 'Log in to KBase',
                    body: div({}, [
                        div({}, p('You may log into the following KBase accounts:')),
                        div({},
                            choiceResponse.login.map(function (login) {
                                var formId = html.genId();
                                vm.login.vm[login.id] = {
                                    value: login,
                                    id: formId,
                                    node: null,
                                    vm: {
                                        button: {
                                            id: html.genId(),
                                            node: null
                                        }
                                    }
                                };
                                var disableLogin = login.policiesToResolve.missing.length + login.policiesToResolve.outdated.length > 0;
                                return div({
                                    id: formId,
                                    style: {
                                        // border: '1px silver solid',
                                        margin: '4px',
                                        padding: '4px'
                                    }
                                }, table({
                                    class: 'table table-striped'
                                }, [
                                    tr(
                                        td([
                                            form({
                                                id: events.addEvent({
                                                    type: 'submit',
                                                    handler: function (e) {
                                                        e.preventDefault();
                                                        var linkAllControl = document.getElementById(formId)
                                                            .querySelector('[name="linkall"]');
                                                        var linkAll = linkAllControl ? linkAllControl.checked : false;
                                                        handleLoginSubmit(login.id, linkAll);
                                                    }
                                                })
                                            }, [
                                                div(
                                                    button({
                                                        class: 'btn btn-primary',
                                                        type: 'submit',
                                                        disabled: disableLogin,
                                                        id: vm.login.vm[login.id].vm.button.id
                                                    }, 'Continue to the KBase account <b>' + login.username + '</b>'),
                                                    ' via ' + choiceResponse.provider + ' account linked identity ',
                                                    i(login.prov_usernames[0]) + '.'),
                                                (function () {
                                                    if (choiceResponse.create.length > 0) {
                                                        return div({
                                                            style: {
                                                                marginTop: '10px'
                                                            }
                                                        }, [
                                                            p({}, [
                                                                'The following ',
                                                                choiceResponse.provider,
                                                                ' identities are also available on this same Globus account. ',
                                                                'You may link them to this KBase account, or  create new ',
                                                                'KBase accounts for them bellow'
                                                            ]),
                                                            div({
                                                                class: 'form-group'
                                                            }, [
                                                                input({
                                                                    type: 'checkbox',
                                                                    name: 'linkall',
                                                                    checked: true
                                                                }),
                                                                label({
                                                                    style: {
                                                                        margin: '0 0 0 6px'
                                                                    }
                                                                }, 'Link The Following Identities ')
                                                            ]),
                                                            ul({}, choiceResponse.create                                                            
                                                            .map(function (create) {
                                                                return li(create.prov_username);
                                                            }).join('\n'))
                                                        ]);
                                                    }
                                                    return '';
                                                }()),
                                                div({
                                                    id: deferUI.defer(function (node) {
                                                        renderPolicies(node, login.policiesToResolve);
                                                    })
                                                })

                                            ])
                                        ])
                                    )
                                ]));
                            })
                        )
                    ])
                });
            }
            getElement(container, 'login').innerHTML = content;
            deferUI.resolve();
            // sync the vm
            Object.keys(vm.login.vm).forEach(function (loginId) {
                var login = vm.login.vm[loginId];
                login.vm.button.node = document.getElementById(login.vm.button.id);

            });
        }

        function renderSignupSuccess(response) {
            ui.setContent('main-title', 'Signed Up and Signed In')
            var events = DomEvent.make({
                node: container
            });
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

        function DeferUI() {
            var deferred = [];

            function defer(fun) {
                var id = html.genId();
                deferred.push({
                    id: id,
                    fun: fun
                });
                return id;
            }

            function resolve() {
                deferred.forEach(function (defer) {
                    var node = document.getElementById(defer.id);
                    try {
                        defer.fun(node);
                    } catch (ex) {
                        console.error('ERROR resolving deferred ', ex);
                    }
                });
            }
            return {
                defer: defer,
                resolve: resolve
            };
        }

        function renderSignup(events, choiceResponse) {
            var showNumber = false;
            if (choiceResponse.create.length > 1) {
                showNumber = true;
            }
            var deferUI = DeferUI();
            var content = choiceResponse.create.map(function (create, index) {
                var numberPrefix = '';
                if (showNumber) {
                    numberPrefix = String(index + 1) + '. ';
                }

                var createVm = {
                    value: create,
                    id: html.genId(),
                    node: null,
                    vm: {
                        button: {
                            id: html.genId(),
                            node: null
                        },
                        form: {
                            id: html.genId(),
                            node: null
                        }
                    }
                };
                vm.create.vm[create.id] = createVm;

                var disableButton = create.policiesToResolve.missing.length + create.policiesToResolve.outdated.length > 0;

                return BS.buildPanel({
                    title: numberPrefix + 'Sign up for KBase',
                    body: div({
                        id: createVm.vm.form.id
                    }, [
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
                                        handler: function (e) {
                                            e.preventDefault();

                                            var linkAllControl = document.getElementById(createVm.vm.form.id)
                                                .querySelector('[name="linkall"]');
                                            var linkAll = linkAllControl ? linkAllControl.checked : false;

                                            doSubmitSignup(create.id, linkAll);
                                        }
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
                                        disabled: disableButton,
                                        id: createVm.vm.button.id
                                    }, 'Create KBase Account')
                                ])
                            ]),
                            div({
                                class: 'col-md-6'
                            }, [
                                BS.buildPanel({
                                    title: 'Linking to this identity account',
                                    type: 'default',
                                    body: div({
                                        class: 'container-fluid'
                                    }, [
                                        div({
                                            class: 'row'
                                        }, [
                                            div({
                                                class: 'col-md-12'
                                            }, [
                                                p('The new KBase account account will be <i>linked</i> to this ' + span({
                                                    style: {
                                                        fontWeight: 'bold'
                                                    }
                                                }, choiceResponse.provider) + ' account.')
                                            ]),
                                        ]),
                                        div({
                                            class: 'row'
                                        }, [

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
                        ]),

                        (function () {
                            var additionalCreates = choiceResponse.create.filter(function (create2) {
                                return (create2.prov_username !== create.prov_username);
                            });
                            if (additionalCreates.length > 0) {
                                return div({
                                    style: {
                                        marginTop: '10px'
                                    }
                                }, [
                                    h3('Link Additional Identities'),
                                    p({}, [
                                        'The following ',
                                        choiceResponse.provider,
                                        ' identities are also available on this same Globus account. ',
                                        'You may link them to this KBase account, or  create new ',
                                        'KBase accounts for them bellow'
                                    ]),
                                    div({
                                        class: 'form-group'
                                    }, [
                                        input({
                                            type: 'checkbox',
                                            name: 'linkall',
                                            checked: true
                                        }),
                                        label({
                                            style: {
                                                margin: '0 0 0 6px'
                                            }
                                        }, 'Link The Following Additional Identities ')
                                    ]),
                                    ul({}, additionalCreates
                                    .map(function (create) {
                                        return li(create.prov_username);
                                    }).join('\n'))
                                ]);
                            }
                            return '';
                        }()),

                        div({
                            class: 'row'
                        }, [
                            div({
                                class: 'col-md-12'
                            }, [
                                div({
                                    id: deferUI.defer(function (node) {
                                        renderPolicies(node, create.policiesToResolve);
                                    })
                                })
                            ])
                        ])
                    ])
                });
            }).join('\n');
            getElement(container, 'create').innerHTML = content;
            deferUI.resolve();
            Object.keys(vm.create.vm).forEach(function (id) {
                var create = vm.create.vm[id];
                create.vm.button.node = document.getElementById(create.vm.button.id);
                create.vm.form.node = document.getElementById(create.vm.form.id);
            });
        }

        function renderLayout() {
            vm = {
                error: {
                    id: html.genId(),
                    message: {
                        id: html.genId()
                    },
                    detail: {
                        id: html.genId()
                    }
                },
                login: {
                    vm: {}
                },
                create: {
                    vm: {}
                }
            };
            container.innerHTML = div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        div({
                            style: {
                                display: 'none'
                            }
                        },
                            h3({
                                dataElement: 'main-title'
                            }, 'KBase Signup')
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
                        div({
                            id: vm.error.id,
                        }, BS.buildPanel({

                            name: 'error',
                            hidden: true,
                            title: 'Error',
                            type: 'danger',
                            body: div([
                                div({
                                    dataElement: 'title'
                                }),
                                div({
                                    id: vm.error.message.id,
                                }, ui.buildPanel({
                                    name: 'message',
                                    title: 'Message',
                                    body: div({
                                        dataElement: 'body'
                                    })
                                })),
                                div({
                                    id: vm.error.detail.id,
                                }, ui.buildCollapsiblePanel({
                                    name: 'detail',
                                    title: 'Detail',
                                    collapsed: true,
                                    hidden: false,
                                    body: div({
                                        dataElement: 'body'
                                    })
                                }))
                            ])
                        }))
                    ])
                ])
            ]);
        }

        function start(params) {
            // Clean up window 
            if (window.history != undefined &&
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
                return policies.start()
                    .then(function () {
                        return runtime.service('session').getClient().getClient().getLoginChoice();
                    })
                    .then(function (choice) {
                        var fixing = [];
                        // This will update the login and create objects with a
                        // "policiesToResolve" property, which will contain any
                        // new or updated usage policies that need to be agreed to.
                        if (choice.login) {
                            fixing = fixing.concat(choice.login.map(function (login) {
                                return evaluatePolicies(login.policy_ids)
                                    .then(function (policiesToResolve) {
                                        login.policiesToResolve = policiesToResolve;
                                    });
                            }));
                        }
                        if (choice.create) {
                            fixing = fixing.concat(choice.create.map(function (create) {
                                return evaluatePolicies([])
                                    .then(function (policiesToResolve) {
                                        create.policiesToResolve = policiesToResolve;
                                    });
                            }));
                        }

                        return Promise.all([choice, Promise.all(fixing)]);
                    })
                    .spread(function (choice) {
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
                        redirectUrl = choice.redirecturl;
                        stateParams = choice.state;

                        var intro;
                        if (choice.create.length === 0) {
                            if (choice.login.length === 0) {
                                // should not be possible!
                                intro = 'no choices -- should not occur!';
                            } else if (choice.login.length === 1) {
                                // just log them in, but we should never see this case.
                                intro = div([
                                    p([
                                        'This ' + b(choice.provider) + ' account is already associated with a KBase account.'
                                    ]),
                                    p([
                                        'You may simply click the login button to continue using KBase with the indicated account.'
                                    ])
                                ]);
                                ui.setContent('main-title', 'Ready to Sign In');
                                renderLogin(events, choice);
                            } else {
                                ui.setContent('main-title', 'Sign In');
                                intro = div([
                                    p([
                                        'This ' + b(choice.provider) + ' identity account is associated with ',
                                        String(choice.login.length),
                                        ' KBase accounts.'
                                    ]),
                                    p([
                                        'Click the login button for the associated account to continue using KBase as that user.'
                                    ])
                                ]);
                                renderLogin(events, choice);
                            }
                        } else if (choice.create.length === 1) {
                            if (choice.login.length === 0) {
                                ui.setContent('main-title', 'Sign Up');

                                intro = div([
                                    p([
                                        'You are ready to create a new KBase account this ' + b(choice.provider) + ' identity account.'
                                    ])
                                ]);

                                renderSignup(events, choice);
                            } else if (choice.login.length === 1) {
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
                                renderLogin(events, choice);
                                renderSignup(events, choice);
                                // should not occur
                            } else {
                                intro = div([
                                    p([
                                        'This ' + choice.provider + ' identity account may be used to log into ',
                                        'the following KBase accounts, or to create a new KBase account.'
                                    ]),
                                    p([
                                        'To avoid this screen in the future, you may link this identity account to ',
                                        'your KBase account in order to log in directly with it.'
                                    ])
                                ]);
                                renderLogin(events, choice);
                                renderSignup(events, choice);
                            }
                        } else {
                            if (choice.login.length === 0) {
                                // should not be possible!
                                ui.setContent('main-title', 'Sign Up');
                                intro = div([
                                    p([
                                        'Your  ',
                                        b(choice.provider),
                                        ' account contains  ',
                                        String(choice.create.length),
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
                                ui.setContent('main-title', 'Sign Up or Sign In');
                                intro = div([
                                    p([
                                        'Your  ',
                                        b(choice.provider),
                                        ' account contains  ',
                                        String(choice.create.length),
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

                            renderLogin(events, choice);
                            renderSignup(events, choice);
                        }
                        events.attachEvents();
                        // ui.setContent('title', h1('KBase Login - further action required'));
                        ui.setContent('introduction', intro);
                        // var debug = BS.buildCollapsiblePanel({
                        //     title: 'debug',
                        //     collapsed: true,
                        //     body: BS.buildPresentableJson(choice)
                        // });
                        // container.querySelector('[data-element="debug"]').innerHTML = debug;
                    })
                    .catch(function (err) {
                        if (err.code) {
                            console.error('ERROR', err);
                            // appCode is the specific error code from auth2
                            switch (err.code) {
                            case 10010:
                                showError({
                                    title: 'Error',
                                    message: 'No authentication token or token has expired',
                                    detail: div([
                                        p([
                                            'This error can occur when visiting this page without logging in first, ',
                                            'or if the previous login page was unattended for more than 30 minutes'
                                        ])
                                    ])
                                });
                                break;
                            default:
                                showError({
                                    title: 'Error fetching login choices',
                                    message: err.message,
                                    detail: BS.buildPresentableJson(err)
                                });
                            }

                        } else {
                            console.error(err);
                            showError({
                                title: 'Error processing login choice',
                                message: 'Unexpected response',
                                detail: BS.buildPresentableJson(err)
                            });
                        }

                    });
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