/* global Promise */
define([
    'js-yaml',
    'kb_common_ts/HttpClient',
    'kb_plugin_auth2-client',
], function (
    yaml,
    HttpClient,
    Plugin
) {
    'use strict';



    function factory(config) {
        var db = {};

        var sources = config.sources;

        function load(file, type) {
            var client = new HttpClient.HttpClient();
            var url = window.location.origin + Plugin.plugin.fullPath + '/dataSources/' + file;
            return client.request({
                    method: 'GET',
                    url: url
                })
                .then(function (result) {
                    if (result.status !== 200) {
                        throw new Error('Cannot load data file: ' + result.status);
                    }
                    return result.response;
                });
        }

        // function loadDataSources(dataSources) {
        //     dataSources.forEach(function (dataSource) {
        //         var parsed = dataSource.split('/')
        //     });
        // }

        function loadData(source) {
            return load(source.file)
                .then(function (textData) {
                    switch (source.type) {
                    case 'json':
                        return JSON.parse(textData);
                    case 'yaml':
                        return yaml.safeLoad(textData);
                    default:
                        throw new Error('Data type not supported: ' + source.type);
                    }
                })
                .then(function (data) {
                    if (source.translate) {
                        return data.map(source.translate);
                    }
                    return data;
                });
        }

        function getData(name) {
            return Promise.try(function () {
                var source = sources[name];
                if (!source) {
                    throw new Error('Unrecognized data source: ' + name);
                }

                if (db[name]) {
                    return db[name];
                }
                if (source.file) {
                    return loadData(source);
                } else if (source.sources) {
                    return Promise.all(Object.keys(source.sources).map(function (sourceId) {
                            var translation = source.sources[sourceId].translate;
                            return getData(sourceId)
                                .then(function (data) {
                                    if (translation) {
                                        return data.map(translation);
                                    } else {
                                        return data;
                                    }
                                });
                        }))
                        .then(function (sources) {
                            return sources.reduce(function (acc, value) {
                                return acc.concat(value);
                            }, []);
                        });
                }
            });
        }

        function dataFilter(arg) {
            var cached = null;
            var source = arg.source;

            // Add lower-case version of label
            function get() {
                return Promise.try(function () {
                    if (cached) {
                        return cached;
                    }
                    return getData(source)
                        .then(function (data) {
                            data.forEach(function (item, index) {
                                item.order = index;
                                item.searchable = {
                                    label: item.label.toLowerCase()
                                };
                            });
                            cached = data;
                            return cached;
                        });
                });
            }

            function totalCount() {
                return Promise.try(function () {
                    return get()
                        .then(function (data) {
                            return data.length;
                        });
                });
            }

            function search(term) {
                return Promise.try(function () {
                    if (term) {
                        var searchTerm = term.toLowerCase();
                        return get()
                            .then(function (data) {
                                return data.filter(function (item) {
                                    // Just do a substring search.
                                    return item.searchable.label.indexOf(searchTerm) >= 0;
                                    // return regex.test(item.label);
                                });
                            });
                    } else {
                        return [];
                    }
                });
            }

            function getAll() {
                return get();
            }

            return {
                totalCount: totalCount,
                search: search,
                getAll: getAll
            };
        }

        function getFilter(name) {
            return dataFilter({
                source: name
            });
        }

        return {
            get: getData,
            getFilter: getFilter
        };
    }
    return factory;
});