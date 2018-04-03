define([
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'knockout-plus'
], function (
    html,
    BS,
    ko
) {
    'use strict';

    var t = html.tag,
        table = t('table'),
        thead = t('thead'),
        tbody = t('tbody'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        button = t('button');

    function component() {
        return {
            viewModel: function (data) {
                this.roles = ko.observableArray(data.roles);
                this.remove = function () {
                    alert('removing!');
                };
            },
            template: table({
                class: 'table table-striped'
            }, [
                thead(
                    tr([
                        th('Id'),
                        th('Description'),
                        th()
                    ])
                ),
                tbody({ dataBind: 'foreach: roles' },
                    tr([
                        td({ dataBind: 'text: id' }),
                        td({ dataBind: 'text: desc' }),
                        td(button({
                            class: 'btn btn-danger',
                            dataBind: 'click: $parent.remove'
                        }, 'Remove'))
                    ])
                )
            ])
        };
    }
    return ko.kb.registerComponent(component);
});