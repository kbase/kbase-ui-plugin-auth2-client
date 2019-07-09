define(['knockout', 'kb_knockout/registry', 'kb_lib/html'], function (ko, reg, html) {
    'use strict';
    var t = html.tag,
        p = t('p'),
        div = t('div'),
        span = t('span'),
        button = t('button');

    function template() {
        return div(
            {
                class: 'container-fluid'
            },
            div(
                {
                    class: 'row'
                },
                [
                    div({
                        class: 'col-md-1'
                    }),
                    div(
                        {
                            class: 'col-md-10'
                        },
                        [
                            p('Your session has been interrupted'),
                            p(['You will be unable to use KBase until your session has been restored. ']),
                            p([
                                'If this is due to a temporary condition, such as as a network disconnection ',
                                'or a service interruption, you may monitor this page and continue when the ',
                                'connection has been restored.'
                            ]),
                            p(['Otherwise, you may wish to sign out and try again later']),
                            div(
                                {
                                    class: ''
                                },
                                [
                                    button(
                                        {
                                            type: 'button',
                                            class: 'btn btn-primary'
                                        },
                                        'Sign Out'
                                    ),
                                    span(
                                        {
                                            class: 'btn-text'
                                        },
                                        ' and try again later.'
                                    )
                                ]
                            ),
                            div(
                                {
                                    style: {
                                        border: '1px silver solid',
                                        padding: '4px',
                                        marginTop: '10px'
                                    }
                                },
                                [
                                    div(
                                        {
                                            class: '',
                                            style: {}
                                        },
                                        [
                                            div({}, 'Your session is currently disconnected from KBase.'),
                                            div({}, 'Retrying in ... '),
                                            button(
                                                {
                                                    type: 'button',
                                                    class: 'btn btn-primary'
                                                },
                                                'Continue'
                                            )
                                        ]
                                    )
                                ]
                            )
                        ]
                    ),
                    div({
                        class: 'col-md-1'
                    })
                ]
            )
        );
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
    return reg.registerComponent(component);
});
