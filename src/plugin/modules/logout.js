define([
    'bluebird',
    'knockout',
    'kb_common/html'
], function (
    Promise,
    ko,
    html
) {
    'use strict';
    var t = html.tag,
        p = t('p'),
        div = t('div'),
        span = t('span'),
        button = t('button'),
        a = t('a');

    function template() {
        return div({
            class: 'container-fluid'
        }, div({
            class: 'row'
        }, [
            div({
                class: 'col-md-1'
            }),
            div({
                class: 'col-md-10'
            }, [
                p('Your session has been interrupted'),
                p([
                    'You will be unable to use KBase until your session has been restored. ',
                ]),
                p([
                    'If this is due to a temporary condition, such as as a network disconnection ',
                    'or a service interruption, you may monitor this page and continue when the ',
                    'connection has been restored.'
                ]),
                p([
                    'Otherwise, you may wish to sign out and try again later'
                ]),
                div({
                    class: ''
                }, [
                    button({
                        type: 'button',
                        class: 'btn btn-primary'
                    }, 'Sign Out'),
                    span({
                        class: 'btn-text'
                    }, ' and try again later.')
                ]),
                div({
                    style: {
                        border: '1px silver solid',
                        padding: '4px',
                        marginTop: '10px'
                    }
                }, [
                    div({
                        class: '',
                        style: {

                        }
                    }, [
                        div({

                        }, 'Your session is currently disconnected from KBase.'),
                        div({

                        }, 'Retrying in ... '),
                        button({
                            type: 'button',
                            class: 'btn btn-primary'
                        }, 'Continue')
                    ])
                ])
            ]),
            div({
                class: 'col-md-1'
            })
        ]));
    }

    function viewModel() {
        return {};
    }

    function component() {
        return {
            template: template(),
            viewModel: viewModel
        };
    }
    ko.components.register('interrupted-view', component());

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;

        // UI


        // VIEW

        function render(params) {
            container.innerHTML = div({
                dataBind: {
                    component: {
                        name: '"interrupted-view"',
                        params: {

                        }
                    }
                }
            });
            ko.applyBindings(container);
        }

        // API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return Promise.try(function () {
                runtime.send('ui', 'setTitle', 'Session Interrupted');
                render();
            });
        }

        function stop() {
            return Promise.try(function () {
                return null;
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