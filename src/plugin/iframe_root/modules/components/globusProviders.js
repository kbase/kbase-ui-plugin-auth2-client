define(['knockout', 'kb_knockout/registry', 'kb_lib/html', 'kb_lib/htmlBuilders', 'kb_common_ts/HttpClient'], function (
    ko,
    reg,
    html,
    build,
    HttpClient
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        input = t('input');

    function template() {
        return div(
            {
                style: {
                    marginLeft: '10px'
                }
            },
            [
                div(
                    {
                        dataBind: {
                            if: 'loading()'
                        }
                    },
                    build.loading()
                ),
                div(
                    {
                        dataBind: {
                            ifnot: 'loading()'
                        }
                    },
                    [
                        div(
                            input({
                                dataBind: {
                                    value: 'providerSearch',
                                    valueUpdate: '"input"'
                                }
                            })
                        ),
                        div(
                            {
                                dataBind: {
                                    if: 'isSearching'
                                }
                            },
                            div(
                                {
                                    dataBind: {
                                        foreach: 'globusProvidersSearch'
                                    },
                                    style: {
                                        border: '1px silver solid',
                                        padding: '4px'
                                    }
                                },
                                div({
                                    dataBind: {
                                        text: 'label'
                                    }
                                })
                            )
                        ),
                        div(
                            {
                                style: {
                                    fontStyle: 'italic'
                                },
                                dataBind: {
                                    ifnot: 'isSearching'
                                }
                            },
                            [
                                'Please enter two or more letters above to search for organizations supported by Globus. ',
                                'The search is case-insensitive.'
                            ]
                        )
                    ]
                )
            ]
        );
    }

    function viewModel(params) {
        var runtime = params.runtime;
        var loading = ko.observable(true);
        var globusProviders = ko.observableArray();
        var providerSearch = ko.observable();
        var isSearching = ko.pureComputed(function () {
            if (!providerSearch() || providerSearch().length <= 1) {
                return false;
            }
            return true;
        });
        var providerSearchRegexp = ko.pureComputed(function () {
            if (!providerSearch() || providerSearch().length < 2) {
                return null;
            }
            return new RegExp(providerSearch(), 'i');
        });
        var globusProvidersSearch = globusProviders.filter(function (item) {
            if (providerSearchRegexp()) {
                return providerSearchRegexp().test(item.label);
            } else {
                return false;
            }
        });

        function getGlobusProviders() {
            var http = new HttpClient.HttpClient();

            var path = [runtime.pluginResourcePath, 'data', 'globus-providers.json'].join('/');
            var url = window.location.origin + '/' + path;

            return http
                .request({
                    method: 'GET',
                    url: url
                })
                .then(function (result) {
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

        // populate the globus providers asynchronously.
        getGlobusProviders().then(function (providers) {
            providers.forEach(function (provider) {
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
    return reg.registerComponent(component);
});
