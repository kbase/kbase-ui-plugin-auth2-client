define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input');

    function viewModel(params) {
        var subscriptions = ko.kb.SubscriptionManager.make();
        var inputValue = params.inputValue;
        // datasource is an object with the method "search"...
        var dataSource = params.dataSource;

        var loading = ko.observable(false);
        // var searchRegexp = ko.pureComputed(function () {
        //     if (!inputValue() || inputValue().length < 2) {
        //         return null;
        //     }
        //     return new RegExp(inputValue(), 'i');
        // });
        var searchExpression = ko.pureComputed(function () {
            if (!inputValue() || inputValue().length < 2) {
                return null;
            }
            return inputValue();
        });

        var tooManyResults = ko.observable(false);
        var searchCount = ko.observable();
        var totalCount = ko.observable();
        subscriptions.add(searchExpression.subscribe(function (newValue) {
            isSearching(true);
            dataSource.totalCount()
                .then(function (result) {
                    totalCount(result);
                    return dataSource.search(newValue);
                })
                .then(function (result) {
                    isSearching(false);
                    searchCount(result.length);
                    if (result.length > 100) {
                        searchedValues.removeAll();
                        tooManyResults(true);
                        return;
                    } else {
                        tooManyResults(false);
                    }
                    if (result.length === 0) {
                        searchedValues.removeAll();
                        return;
                    }

                    // var current = searchedValues;
                    var changes = [];
                    var currentPos = 0,
                        resultPos = 0,
                        done = false;
                    while (!done) {
                        if (currentPos === searchedValues().length) {
                            if (resultPos === result.length) {
                                done = true;
                                break;
                            } else {
                                // add and move on
                                changes.push({
                                    op: 'add',
                                    value: result[resultPos],
                                    at: currentPos
                                });
                                resultPos += 1;
                            }
                        } else {
                            if (resultPos === result.length) {
                                changes.push({
                                    op: 'delete',
                                    at: currentPos
                                });
                                currentPos += 1;
                            } else {
                                var comp = searchedValues()[currentPos].order - result[resultPos].order;
                                if (comp > 0) {
                                    // a value before this one is now available, insert it
                                    // before this one.
                                    changes.push({
                                        op: 'insert',
                                        value: result[resultPos],
                                        at: currentPos
                                    });
                                    resultPos += 1;
                                } else if (comp < 0) {
                                    // the current item is before the results item, so it needs to be removed.
                                    changes.push({
                                        op: 'delete',
                                        at: currentPos
                                    });
                                    currentPos += 1;
                                } else {
                                    // otherwise they are the same, so just continue walking both.
                                    currentPos += 1;
                                    resultPos += 1;
                                }
                            }
                        }
                    }
                    var adj = 0;
                    changes.forEach(function (change) {
                        var value;
                        switch (change.op) {
                        case 'delete':
                            searchedValues.splice(change.at + adj, 1);
                            adj -= 1;
                            break;
                        case 'add':
                            value = change.value;
                            value.active = ko.observable(false);
                            searchedValues.splice(change.at + adj + 1, 0, value);
                            adj += 1;
                            break;
                        case 'insert':
                            value = change.value;
                            value.active = ko.observable(false);
                            searchedValues.splice(change.at + adj, 0, value);
                            adj += 1;
                            break;
                        }
                    });
                })
                .catch(function (err) {
                    isSearching(false);
                    console.error('show error!', err);
                });
        }));
        var searchedValues = ko.observableArray();

        var itemSelected = ko.observable(false);
        // Don't start out with the search populated.
        if (inputValue() && inputValue().length > 0) {
            itemSelected(true);
        }
        subscriptions.add(inputValue.subscribe(function () {
            itemSelected(false);
        }));

        var userHasModified = ko.pureComputed(function () {
            return (inputValue.isDirty() && !itemSelected());
        });

        var isSearching = ko.observable(false);

        var mode = ko.pureComputed(function () {
            if (isSearching()) {
                return 'searching';
            }
            if (searchedValues().length > 0) {
                if (userHasModified()) {
                    return 'canselect';
                } else {
                    return 'cansearch';
                }
            } else {
                return 'cansearch';
            }
        });

        var showingAll = ko.observable(false);


        function doSelectValue(selected) {
            inputValue(selected.label);
            inputValue.markClean();
            itemSelected(true);
            showingAll(false);
        }

        function doActivate(selected) {
            selected.active(true);
        }

        function doDeactivate(selected) {
            selected.active(false);
        }

        function doCancelSearch() {
            inputValue.markClean();
            // inputValue.reset();
            // restoring the value should be all we need to do... 
        }

        // handle user clicking the search button.
        // if not searching, should invoke a search against whatever is in the field;
        // if the field is empty it will show everything.
        // if is searching, should close the search selection and mark the field as clean.
        // how to tell if searching? --- maybe just with the dirty flag on the input? try it.
        function doToggleSearch() {
            if (inputValue.isDirty()) {
                inputValue.markClean();
            } else {
                inputValue.markDirty();
            }
        }

        function onInputKeyup(data, ev) {
            if (ev.key === 'Escape') {
                inputValue.markClean();
            }
        }

        function dispose() {
            subscriptions.dispose();
        }

        return {
            loading: loading,
            inputValue: inputValue,
            searchedValues: searchedValues,
            totalCount: totalCount,
            searchCount: searchCount,
            isSearching: isSearching,
            userHasModified: userHasModified,
            doSelectValue: doSelectValue,
            itemSelected: itemSelected,
            showingAll: showingAll,
            doCancelSearch: doCancelSearch,
            tooManyResults: tooManyResults,
            mode: mode,

            // ACTIONS
            doDeactivate: doDeactivate,
            doActivate: doActivate,
            doToggleSearch: doToggleSearch,

            // EVENT HANDLERS
            onInputKeyup: onInputKeyup,

            dispose: dispose
        };
    }
    

    function template() {
        return div({
            style: {},
            class: 'typeaheadInput'
        }, [
            '<style>.typeaheadInput .-row.-active {  background-color: silver; }</style>',
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
                            valueUpdate: '"input"',
                            event: {
                                keyup: '$component.onInputKeyup'
                            }
                        }
                    }),
                    span({
                        class: 'input-group-addon fa',
                        dataBind: {
                            visible: 'mode() !== "canselect"',
                            css: {
                                '"fa-search"': 'mode() === "cansearch"',
                                '"fa-spinner fa-pulse fa-fw"': 'mode() === "searching"',
                            },
                            click: 'doToggleSearch'
                        }
                    }),
                    span({
                        class: 'input-group-addon fa fa-times',
                        style: {
                            cursor: 'pointer'
                        },
                        dataBind: {
                            click: 'doCancelSearch',
                            visible: 'mode() === "canselect"'
                        }
                    })
                ]),
                div({
                    dataBind: {
                        if: 'mode() === "canselect"'
                    },
                    style: {
                        position: 'relative',
                        width: '100%'
                    }
                }, [
                    div({
                        style: {
                            position: 'relative',
                            borderTop: '1px silver solid',
                            borderLeft: '1px silver solid',
                            borderRight: '1px silver solid',
                            backgroundColor: '#EEE',
                            zIndex: '100',
                            padding: '4px',
                            width: '100%'
                        }
                    }, [
                        'Found ',
                        span({
                            dataBind: {
                                text: 'searchCount'
                            }
                        }),
                        ' out of ',
                        span({
                            dataBind: {
                                text: 'totalCount'
                            }
                        })
                    ]),
                    div({
                        dataBind: {
                            foreach: 'searchedValues'
                        },
                        style: {
                            border: '1px silver solid',
                            backgroundColor: 'white',
                            zIndex: '100',
                            position: 'absolute',
                            width: '100%',
                            maxHeight: '10em',
                            overflow: 'auto'
                        }
                    }, div({
                        class: '-row',
                        style: {
                            padding: '4px',
                            cursor: 'pointer'
                        },
                        dataBind: {
                            text: 'label',
                            click: '$parent.doSelectValue',
                            style: {
                                '"background-color"': 'active() ? "silver" : "transparent"'
                            },
                            // css: '{"-active": active()}',

                            event: {
                                mouseover: '$parent.doActivate',
                                mouseout: '$parent.doDeactivate'
                            }
                        }
                    }))
                ]),
                div({
                    class: 'text-warning',
                    style: {
                        fontStyle: 'italic'
                    },
                    dataBind: {
                        if: 'tooManyResults()'
                    }
                }, [
                    'Too many matches (',
                    span({ dataBind: { text: 'searchCount' } }),
                    ') to display -- please enter more in order to narrow your results.'
                ]),
                div({
                    style: {
                        fontStyle: 'italic'
                    },
                    dataBind: {
                        if: '!tooManyResults() && searchedValues().length === 0 && inputValue() && inputValue().length < 2'
                    }
                }, [
                    'Please enter two or more letters above to search for your research or educational organization. '
                ]),
                div({
                    style: {
                        fontStyle: 'italic'
                    },
                    dataBind: {
                        if: '!tooManyResults() && searchedValues().length === 0 && userHasModified() && inputValue().length >= 2'
                    }
                }, [
                    'Nothing matched your entry. You may leave it as is to use this value in your profile, ',
                    'or try different text to match your organization.'
                ])
            ])
        ]);
    }
   
    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    
    return ko.kb.registerComponent(component);
});