define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html'
], (
    ko,
    reg,
    gen,
    html
) => {
    'use strict';

    class ViewModel {
        constructor({ description, more }) {
            this.description = description;
            this.more = more;
            this.showMore = ko.observable(false);
        }

        toggleShowMore() {
            this.showMore(!this.showMore());
        }
    }

    // TEMPLATE

    const t = html.tag,
        div = t('div'),
        span = t('span');

    function buildDocWithMore() {
        return div([
            div({}, [
                span({
                    style: {
                        padding: '2px',
                        cursor: 'pointer'
                    },
                    // TODO: toggle more observable
                    dataBind: {
                        click: 'toggleShowMore.bind($component)'
                    }
                }, span({

                }, [
                    span({
                        dataBind: {
                            html: 'description'
                        }
                    }),
                    span({
                        class: 'fa ',
                        style: {
                            marginLeft: '5px',
                        },
                        dataBind: {
                            css: {
                                '"fa-caret-right"': '!showMore()',
                                '"fa-caret-down"': 'showMore()'
                            }
                        }
                    })
                ]))
            ]),
            div({
                dataBind: {
                    css: {
                        hidden: '!showMore()',
                    }
                },
                style: {
                    borderLeft: '2px silver solid',
                    marginLeft: '4px',
                    padding: '4px'
                }
            }, div({
                dataBind: {
                    html: 'more'
                }
            }))
        ]);
    }

    function buildDocNoMore() {
        return div({
            dataBind: {
                html: 'description'
            }
        });
    }

    function buildTemplate() {
        return div({
            class: 'field-doc',
        }, [
            gen.if('more', buildDocWithMore(), buildDocNoMore())
        ]);
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: buildTemplate()
        };
    }

    return reg.registerComponent(component);
});