define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    var t = html.tag,
        div = t('div'),
        select = t('select');

    function template() {
        // if (options.optionsCaption) {
        //     controlBinding.optionsCaption = '"' + options.optionsCaption.replace(/"/g, '\\"') + '"';
        //     // controlBinding.optionsCaption = '"enter a value"';
        // }
        var binding = {
            value: 'field',
            options: 'values',
            optionsText: '"label"',
            optionsValue: '"value"',
            optionsCaption: 'emptyLabel'
        };
        return div({
            if: 'ready'
        }, select({
            class: 'form-control',
            // id: id,
            dataBind: binding
        }));
    }

    function viewModel(params) {
        // incoming is an observable array of strings ...
        var field = params.field;

        // HACK - the options binding seems to take effect 
        // even when protected by the if binding,  AFAIK the 
        // bindings should not be applied until ready is true.
        var originalValue = field();

        // ... and a data source definition for the set of values.
        var dataSource = params.dataSource;

        var emptyLabel = params.emptyLabel || ' - ';

        var ready = ko.observable(false);

        var values = ko.observableArray();

        dataSource.getAll()
            .then(function (data) {
                // for now we use labels as values...
                // var transformed = data.map(function (item) {
                //     return {
                //         value: item.label,
                //         label: item.label
                //     };
                // });
                values(data);
                field(originalValue);
                ready(true);
            });

        return {
            ready: ready,
            field: field,
            values: values,
            emptyLabel: emptyLabel
        };
    }

    function component() {
        return {
            template: template(),
            viewModel: viewModel
        };
    }
    return ko.kb.registerComponent(component);
});