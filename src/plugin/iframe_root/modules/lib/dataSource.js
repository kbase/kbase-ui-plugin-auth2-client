define(['bluebird', 'js-yaml', 'kb_common_ts/HttpClient'], (Promise, yaml, HttpClient) => {
    function factory(config) {
        const db = {};

        const sources = config.sources;
        const sourcesPath = config.path;

        function load(file) {
            const client = new HttpClient.HttpClient();
            const url = `${window.location.origin  }/${  sourcesPath  }${file}`;
            return client
                .request({
                    method: 'GET',
                    url
                })
                .then((result) => {
                    if (result.status !== 200) {
                        throw new Error(`Cannot load data file: ${  result.status}`);
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
                .then((textData) => {
                    switch (source.type) {
                    case 'json':
                        return JSON.parse(textData);
                    case 'yaml':
                        return yaml.safeLoad(textData);
                    default:
                        throw new Error(`Data type not supported: ${  source.type}`);
                    }
                })
                .then((data) => {
                    if (source.translate) {
                        return data.map(source.translate);
                    }
                    return data;
                });
        }

        function getData(name) {
            return Promise.try(() => {
                const source = sources[name];
                if (!source) {
                    throw new Error(`Unrecognized data source: ${  name}`);
                }

                if (db[name]) {
                    return db[name];
                }
                if (source.file) {
                    return loadData(source);
                } else if (source.sources) {
                    return Promise.all(
                        Object.keys(source.sources).map((sourceId) => {
                            const translation = source.sources[sourceId].translate;
                            return getData(sourceId).then((data) => {
                                if (translation) {
                                    return data.map(translation);
                                }
                                return data;

                            });
                        })
                    ).then((sources) => {
                        return sources.reduce((acc, value) => {
                            return acc.concat(value);
                        }, []);
                    });
                }
            });
        }

        function dataFilter(arg) {
            let cached = null;
            const source = arg.source;

            // Add lower-case version of label
            function get() {
                return Promise.try(() => {
                    if (cached) {
                        return cached;
                    }
                    return getData(source).then((data) => {
                        data.forEach((item, index) => {
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
                return Promise.try(() => {
                    return get().then((data) => {
                        return data.length;
                    });
                });
            }

            function search(term) {
                return Promise.try(() => {
                    if (term) {
                        const searchTerm = term.toLowerCase();
                        return get().then((data) => {
                            return data.filter((item) => {
                                // Just do a substring search.
                                return item.searchable.label.indexOf(searchTerm) >= 0;
                                // return regex.test(item.label);
                            });
                        });
                    }
                    return [];

                });
            }

            function getAll() {
                return get();
            }

            return {
                totalCount,
                search,
                getAll
            };
        }

        function getFilter(name) {
            return dataFilter({
                source: name
            });
        }

        return {
            get: getData,
            getFilter
        };
    }
    return factory;
});
