define([
    'uuid',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/domEvent2'
], function (
    Uuid,
    html,
    BS,
    DomEvent
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        select = t('select'),
        option = t('option'),
        button = t('button'),
        label = t('label');

    var envs = {
        ci: {
            exportTo: {
                cialt: {
                    label: 'Alt CI',
                    host: 'cialt.kbase.us'
                },
            },
            importFrom: {
                cialt: {
                    label: 'Alt CI',
                    host: 'cialt.kbase.us'
                },
            }
        },
        cialt: {
            exportTo: {
                ci: {
                    label: 'CI',
                    host: 'ci.kbase.us'
                }
            },
            importFrom: {
                ci: {
                    label: 'CI',
                    host: 'ci.kbase.us'
                }
            }
        },
        prod: {
            exportTo: {
                appdev: {
                    label: 'App Dev',
                    host: 'appdev.kbase.us'
                }
            }
        },
        appdev: {
            importFrom: {
                prod: {
                    label: 'Prod',
                    host: 'narrative.kbase.us'
                }
            }
        }
    };

    function factory(config) {
        var runtime = config.runtime,
            container;

        var currentEnv = runtime.config('deploy.environment');
        var targets;

        function doSendEvent() {
            // console.log('target', container);
            var targetId = container.querySelector('[name="target"]').value;
            var target = targets[targetId];
            var token = runtime.service('session').getAuthToken();
            var windowId = new Uuid(4).format();

            var rawMessage = {
                token: token,
                source: runtime.config('deploy.environment')
            };

            // works by object -> utf8 -> encoded byte sequence -> raw bytes -> base64
            var message = window.btoa(unescape(encodeURIComponent(JSON.stringify(rawMessage))));
            var url = 'https://' + target.host + '#auth2/dev/receiveToken' + '?msg=' + message;
            window.open(url, windowId);
        }

        function renderUnsupported() {
            container.innerHTML = BS.buildPanel({
                type: 'danger',
                title: 'Unsupported Deploy Environment',
                body: div([
                    p([
                        'The ', runtime.config('deploy.environment'),
                        ' deployment environment does not support sending tokens.'
                    ])
                ])
            });
        }

        function attach(node) {
            container = node;
        }

        function start(params) {
            runtime.send('ui', 'setTitle', 'Send a Token');

            var envConfig = envs[currentEnv];
            if (!envConfig || !envConfig.exportTo) {
                renderUnsupported();
                return;
            }
            targets = envConfig.exportTo;

            // var supportedEnvs = ['prod'];
            // if (supportedEnvs.indexOf(runtime.config('deploy.environment')) === -1) {
            //     renderUnsupported();
            //     return;
            // }

            var targetSelect = select({
                name: 'target',
                class: 'form-control'
            }, Object.keys(targets).map(function (key) {
                return option({
                    value: key
                }, targets[key].label + ' (' + targets[key].host + ')');
            }));
            var events = DomEvent.make({
                node: container
            });

            container.innerHTML = div({
                class: 'container-fluid',
                style: {
                    width: '100%'
                }
            }, [
                div({ class: 'row' }, [
                    div({ class: 'col-md-6' }, BS.buildPanel({
                        title: 'Send Token',
                        body: div({

                        }, [
                            // p(['Your current token: ', token]),
                            div({
                                class: 'form-group'
                            }, [
                                label('Select target environment: '),
                                targetSelect,
                            ]),
                            div({
                                class: 'form-group'
                            }, [
                                button({
                                    type: 'button',
                                    class: 'btn btn-primary',
                                    id: events.addEvent({
                                        type: 'click',
                                        handler: doSendEvent
                                    })
                                }, 'Send Token')
                            ])

                            // p(['Link to set cookie in ', env, ', ', envHost, ':', link])
                        ])
                    })),
                    div({ class: 'col-md-6' }, BS.buildPanel({
                        title: 'Receive Token',
                        body: div({}, [
                            p(['After you send the token, the receiving app will use this panel.'])
                        ])
                    }))
                ])
            ]);
            events.attachEvents();
        }

        function stop() {

        }

        function detach() {

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