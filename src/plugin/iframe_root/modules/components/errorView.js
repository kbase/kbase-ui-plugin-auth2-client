define(['knockout', 'kb_knockout/registry', 'kb_lib/html', 'kb_lib/htmlBootstrapBuilders'], function (
    ko,
    reg,
    html,
    BS
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function template() {
        return BS.buildPanel({
            name: 'error',
            // hidden: true,
            title: 'Error',
            type: 'danger',
            body: div([
                BS.buildPanel({
                    name: 'code',
                    title: 'Code',
                    type: 'danger',
                    body: div({
                        dataBind: {
                            text: 'code'
                        }
                    })
                }),
                BS.buildPanel({
                    name: 'message',
                    title: 'Message',
                    type: 'danger',
                    body: div({
                        dataBind: {
                            text: 'message'
                        }
                    })
                }),
                BS.buildCollapsiblePanel({
                    name: 'detail',
                    title: 'Detail',
                    type: 'danger',
                    collapsed: false,
                    hidden: false,
                    body: div({
                        dataBind: {
                            html: 'detail'
                        }
                    })
                }),
                BS.buildCollapsiblePanel({
                    name: 'data',
                    title: 'Data',
                    type: 'danger',
                    collapsed: true,
                    hidden: false,
                    body: div(
                        {
                            dataBind: {
                                if: 'data'
                            }
                        },
                        div({
                            dataBind: {
                                html: 'data'
                            }
                        })
                    )
                })
            ])
        });
    }

    function viewModel(params) {
        return {
            code: params.code,
            message: params.message,
            detail: params.detail,
            data: BS.buildPresentableJson(params.data)
        };
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
