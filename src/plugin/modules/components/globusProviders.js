define([
    'knockout-plus',
    'kb_common/html',
    'kb_common_ts/HttpClient',
    'kb_plugin_auth2-client'
], function(
    ko,
    html,
    HttpClient,
    Plugin
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        input = t('input');

    function getGlobusProviders() {
        var http = new HttpClient.HttpClient();

        var path = [
            Plugin.plugin.fullPath,
            'data',
            'globus-providers.json'
        ].join('/');
        var url = window.location.origin + '/' + path;

        return http.request({
                method: 'GET',
                url: url
            })
            .then(function(result) {
                if (result.status === 200) {
                    try {
                        return JSON.parse(result.response);
                    } catch (ex) {
                        throw new Error('Error fetching file: ' + ex.message);
                    }
                } else {
                    throw new Error('Error fetching file: ' + result.status);
                }
            });
    }

    // function renderGlobusProviders() {
    //     getGlobusProviders()
    //         .then(function(globusProviders) {
    //             var filtered
    //             var searchInputId = html.genId();
    //             var searchOutputId = html.genId();
    //             var content = div({

    //             }, [
    //                 div({}, [
    //                     input({
    //                         type: 'text',
    //                         id: searchInputId
    //                     })
    //                 ]),
    //                 div({
    //                     style: {
    //                         border: '1px silver solid',
    //                         maxHeight: '300px',
    //                         overflow: 'auto',
    //                         padding: '4px'
    //                     }
    //                 }, div({
    //                     id: searchOutputId,
    //                 }, 'search for org above'))

    //             ]);
    //             vm.get('step2.globusProviders').node.innerHTML = content;

    //             var searchNode = document.getElementById(searchInputId);
    //             var outputNode = document.getElementById(searchOutputId);
    //             searchNode.addEventListener('keyup', function(e) {
    //                 updateSearch(searchNode.value);
    //             });

    //             function updateSearch(search) {
    //                 if (search.length === 0) {
    //                     outputNode.innerHTML = 'Please enter a search term above or "." to show all (case insensitive regular expression)';
    //                     return;
    //                 }

    //                 var term;
    //                 try {
    //                     term = new RegExp(search, 'i');
    //                 } catch (ex) {
    //                     outputNode.innerHTML = 'Error: ' + ex.message;
    //                     return;
    //                 }
    //                 var content = globusProviders
    //                     .filter(function(item) {
    //                         if (item.label.match(term)) {
    //                             return true;
    //                         }
    //                         return false;
    //                     })
    //                     .map(function(item) {
    //                         return div(
    //                             item.label
    //                         );
    //                     }).join('\n');
    //                 outputNode.innerHTML = content;
    //             }
    //             updateSearch('');
    //         });
    // }

    function template() {
        return div({
            style: {
                marginLeft: '10px'
            }
        }, [
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
                div(
                    input({
                        dataBind: {
                            value: 'providerSearch',
                            valueUpdate: '"input"'
                        }
                    })
                ),
                div({
                    dataBind: {
                        if: 'isSearching'
                    }
                }, div({
                    dataBind: {
                        foreach: 'globusProvidersSearch'
                    },
                    style: {
                        border: '1px silver solid',
                        padding: '4px'
                    }
                }, div({
                    dataBind: {
                        text: 'label'
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
                    'Please enter two or more letters above to search for organizations supported by Globus. ',
                    'The search is case-insensitive.'
                ])
            ])
        ]);
    }

    function viewModel() {
        var loading = ko.observable(true);
        var globusProviders = ko.observableArray();
        var providerSearch = ko.observable();
        var isSearching = ko.pureComputed(function() {
            if (!providerSearch() || providerSearch().length <= 1) {
                return false;
            }
            return true;
        });
        var providerSearchRegexp = ko.pureComputed(function() {
            if (!providerSearch() || providerSearch().length < 2) {
                return null;
            }
            return new RegExp(providerSearch(), 'i');
        });
        var globusProvidersSearch = globusProviders.filter(function(item) {
            if (providerSearchRegexp()) {
                return providerSearchRegexp().test(item.label);
            } else {
                return false;
            }
        });

        // populate the globus providers asynchronously.
        getGlobusProviders()
            .then(function(providers) {
                providers.forEach(function(provider) {
                    globusProviders.push(provider);
                });
                loading(false);
            });

        return {
            loading: loading,
            providerSearch: providerSearch,
            globusProviders: globusProviders,
            globusProvidersSearch: globusProvidersSearch,
            isSearching: isSearching
        };
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('globus-providers', component());
});