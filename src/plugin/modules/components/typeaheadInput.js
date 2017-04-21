define([
    'knockout-plus',
    'kb_common/html',
    'kb_common_ts/HttpClient',
    'kb_plugin_auth2-client'
], function (
    ko,
    html,
    HttpClient,
    Plugin
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input');

    // function getGlobusProviders() {
    //     var http = new HttpClient.HttpClient();

    //     var path = [
    //         Plugin.plugin.fullPath,
    //         'data',
    //         'globus-providers.json'
    //     ].join('/');
    //     var url = window.location.origin + '/' + path;

    //     return http.request({
    //             method: 'GET',
    //             url: url
    //         })
    //         .then(function (result) {
    //             if (result.status === 200) {
    //                 try {
    //                     return JSON.parse(result.response);
    //                 } catch (ex) {
    //                     throw new Error('Error fetching file: ' + ex.message);
    //                 }
    //             } else {
    //                 throw new Error('Error fetching file: ' + result.status);
    //             }
    //         });
    // }


    function template() {
        return div({
            style: {},
            class: 'typeaheadInput'
        }, [
            '<style>.typeaheadInput .-row:hover {  background-color: silver; }</style>',
            div({
                dataBind: {
                    if: 'loading()'
                }
            }, html.loading()),
            div({
                dataBind: {
                    ifnot: 'loading()'
                }
            }, [
                div({
                    class: 'input-group'
                }, [
                    input({
                        class: 'form-control',
                        dataBind: {
                            value: 'inputValue',
                            valueUpdate: '"input"'
                        }
                    }),
                    span({
                        class: 'input-group-addon fa',
                        dataBind: {
                            click: 'doToggleAll',
                            css: {
                                '"fa-caret-right"': '!showingAll()',
                                '"fa-caret-down"': 'showingAll()'
                            }
                        }
                    })
                ]),
                div({
                    dataBind: {
                        if: 'isSearching'
                    },
                    style: {
                        position: 'relative',
                        width: '100%'
                    }
                }, div({
                    dataBind: {
                        foreach: 'searchedValues'
                    },
                    style: {
                        border: '1px silver solid',
                        backgroundColor: 'white',
                        zIndex: '100',
                        padding: '4px',
                        cursor: 'pointer',
                        position: 'absolute',
                        width: '100%',
                        maxHeight: '10em',
                        overflow: 'auto'
                    }
                }, div({
                    class: '-row',
                    dataBind: {
                        text: 'label',
                        click: '$parent.doSelectValue',
                    }
                }))),
                div({
                    style: {
                        fontStyle: 'italic'
                    },
                    dataBind: {
                        ifnot: 'isSearching'
                    }
                }, [
                    // 'Please enter two or more letters above to search for organizations supported by Globus. ',
                    // 'The search is case-insensitive.'
                ])
            ])
        ]);
    }

    function viewModel(params) {
        var inputValue = params.inputValue;
        var availableValues = ko.observableArray(params.availableValues);

        var loading = ko.observable(false);
        var searchRegexp = ko.pureComputed(function () {
            if (!inputValue() || inputValue().length < 2) {
                return null;
            }
            return new RegExp(inputValue(), 'i');
        });
        var searchedValues = availableValues.filter(function (item) {
            if (searchRegexp()) {
                return searchRegexp().test(item.label);
            } else {
                return false;
            }
        });

        var itemSelected = ko.observable(false);
        // Don't start out with the search populated.
        if (inputValue() && inputValue().length > 0) {
            itemSelected(true);
        }
        inputValue.subscribe(function (newValue) {
            itemSelected(false);
        });

        var isSearching = ko.pureComputed(function () {
            if (itemSelected()) {
                return false;
            }
            if (!inputValue() || inputValue().length <= 1) {
                return false;
            }
            return true;
        });


        var showingAll = ko.observable(false);

        function doToggleAll() {
            if (inputValue() === '.*') {
                showingAll(false);
                inputValue('');
            } else {
                showingAll(true);
                inputValue('.*');
            }
        }


        function doSelectValue(selected) {
            inputValue(selected.label);
            itemSelected(true);
            showingAll(false);
        }


        // populate the globus providers asynchronously.
        // getAvailableValues()
        //     .then(function(providers) {
        //         providers.forEach(function(provider) {
        //             availableValues.push(provider);
        //         });
        //         loading(false);
        //     });

        return {
            loading: loading,
            inputValue: inputValue,
            availableValues: availableValues,
            searchedValues: searchedValues,
            isSearching: isSearching,
            doSelectValue: doSelectValue,
            itemSelected: itemSelected,
            doToggleAll: doToggleAll,
            showingAll: showingAll
        };
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('typeahead-input', component());
});