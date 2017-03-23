define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent2',
    'kb_common/ui',
    'kb_common_ts/Cookie',
    'kb_plugin_auth2-client',
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

    var vm = {};

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
                ui = UI.make({
                    node: container
                });
            });
        }

        function getElement(node, name) {
            return node.querySelector('[data-element="' + name + '"]')
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
                        div(
                            h1({
                                dataElement: 'main-title'
                            }, 'Link to External Account')
                        ),
                        div({
                            dataElement: 'introduction'
                        }),
                        div({
                            dataElement: 'link'
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

        function doLink(accountId) {
            return runtime.service('session').getClient().linkPick(accountId)
                .then(function (result) {
                    runtime.send('app', 'navigate', {
                        path: 'auth2/account',
                        params: {
                            tab: 'links'
                        }
                    });
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        function cancelLink() {
            runtime.send('app', 'navigate', {
                path: 'auth2/account',
                params: {
                    tab: 'links'
                }
            });
        }   

        function renderLinkChoice(choiceData) {
            var node = ui.getElement('link');
            var events = DomEvent.make({
                node: container
            });


            var content = div({}, [
                choiceData.ids.map(function (id) {
                    var canLink = true;
                    var message;
                    if (id.may_link === 'no') {
                        canLink = false;
                        message =  'I\'m sorry, this ' + choiceData.provider + ' account may not be linked - it is already linked to another KBase account';
                    } else {
                        message = div([
                            p([
                                'You have requested to link the ' + b(choiceData.provider) + ' account ' + b(id.prov_username),
                                ' to your KBase account ' + b(choiceData.user)
                            ])
                        ]);
                    }
                    return div({
                        class: 'row'
                    }, [
                        div({
                            class: 'col-md-12'
                        }, [
                            div({}, message),
                            div({}, [
                                button({                                
                                    class: 'btn btn-primary',
                                    type: 'button',
                                    disabled: !canLink,
                                    id: events.addEvent({
                                        type: 'click', 
                                        handler: function () {
                                            doLink(id.id);
                                        }
                                    })
                                }, 'Link ' + b(id.prov_username)),
                                button({                                
                                    class: 'btn btn-default',
                                    type: 'button',
                                    disabled: !canLink,
                                    id: events.addEvent({
                                        type: 'click', 
                                        handler: function () {
                                            cancelLink(id.id);
                                        }
                                    }),
                                    style: {
                                        marginLeft: '10px'
                                    }
                                }, 'Cancel &amp; Return to Links Page')
                            ])
                        ])
                    ]);
                })
            ]);
            node.innerHTML = content;
            events.attachEvents();
        }

        function start(params) {
            // inProcessToken = params['in-process-login-token'];
            // var cookieManager = new M_Cookie.CookieManager();
            // inProcessToken = cookieManager.getItem('in-process-login-token');

            // Clean up window 
            // if (window.history != undefined &&
            //     window.history.pushState != undefined &&
            //     window.location.search &&
            //     window.location.search.length > 0) {
            //     // if pushstate exists, add a new state the the history, this changes the url without 
            //     // reloading the page
            //     var newUrl = new URL(window.location.href);
            //     var oldQuery = newUrl.search;
            //     var newHash = newUrl.hash + oldQuery;
            //     newUrl.search = '';
            //     newUrl.hash = newHash;
            //     window.history.pushState({}, document.title, newUrl.toString());
            // }


            return Promise.try(function () {
                var events = DomEvent.make({
                    node: container
                });
                renderLayout();
                runtime.service('session').getClient().getLinkChoice()
                    .then(function (result) {
                        switch (result.status) {
                        case 'ok':
                            renderLinkChoice(result.data);
                            break;
                        case 'error':
                            showError({
                                title: 'Error processing login choice',
                                message: result.data.error.message,
                                detail: BS.buildPresentableJson(result)
                            });
                        }
                        events.attachEvents();
                    })
                    .catch(function (err) {
                        container.innerHTML = err.message;
                        console.error('ERROR', err);
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