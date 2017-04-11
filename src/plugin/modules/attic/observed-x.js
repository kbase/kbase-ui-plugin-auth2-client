define([
    'bluebird',
    'kb_common/utils',
    'kb_common/asyncQueue',
], function (
    Promise,
    Utils,
    fAsyncQueue
) {
    'use strict';

    function factory(config) {
        var state = config.value || {},
            listeners = {},
            regexpListeners = [],
            queue = fAsyncQueue.make();

        function get() {
            return state;
        }

        function setItem(key, value) {
            var oldState = Utils.getProp(state, key),
                newListeners = [];
            // literal listeners.
            if (listeners[key]) {
                listeners[key].forEach(function (item) {
                    queue.addItem({
                        onRun: (function (fun, value, oldvalue) {
                            return function () {
                                try {
                                    fun(value, oldvalue);
                                } catch (ex) {
                                    //TODO: need a sensible way to manage exception reporting.
                                    //console.log('EX running onrun handler');
                                    //console.log(ex);
                                }
                            };
                        }(item.onSet, value, oldState))
                    });
                    if (!item.oneTime) {
                        newListeners.push(item);
                    }
                });
                listeners[key] = newListeners;
            }
            // pattern listeners
            regexpListeners.forEach(function (def) {
                if (def.regexp.test(key)) {
                    queue.addItem({
                        onRun: (function (fun, value, oldvalue) {
                            return function () {
                                try {
                                    fun(value, oldvalue);
                                } catch (ex) {
                                    //TODO: need a sensible way to manage exception reporting.
                                    //console.log('EX running onrun handler');
                                    //console.log(ex);
                                }
                            };
                        }(def.onSet, value, oldState))
                    });
                }
            });

            Utils.setProp(state, key, value);
            return this;
        }

        function modifyItem(key, modifier) {
            var oldState = Utils.getProp(state, key),
                newValue = modifier(oldState.value),
                newListeners = [];
            if (listeners[key]) {
                listeners[key].forEach(function (item) {
                    queue.addItem({
                        onRun: (function (fun, value, oldvalue) {
                            return function () {
                                try {
                                    fun(value, oldvalue);
                                } catch (ex) {
                                    //TODO: need a sensible way to manage exception reporting.
                                    //console.log('EX running onrun handler');
                                    //console.log(ex);
                                }
                            };
                        }(item.onSet, newValue, oldState))
                    });
                    if (!item.oneTime) {
                        newListeners.push(item);
                    }
                });
                listeners[key] = newListeners;
            }

            Utils.setProp(state, key, newValue);
            return this;
        }

        /**
         * Return the value of the state object as specified by the property path
         * into the state object. Although this will work for sub-properties, 
         * the state machine is not yet designed to do anything special, so best
         * to just use top level keys.
         * This method is synchronous, so if the state object is not yet set,
         * it will return undefined or the default value if provided.
         * 
         * @function
         * @public
         * 
         * @param {PropertyPath} key - the key to the state object desired
         * @param {Any} defaultValue - a value to return if the state object was
         * not found.
         * 
         * @returns {Any) either the state object, the default value, or undefined.
         */
        function getItem(key, defaultValue) {
            return Utils.getProp(state, key, defaultValue);
        }
        /**
         * Use this method to determine whether or not the state property
         * exists. 
         * 
         * @function
         * @public
         * 
         * @param {PropertyPath{} key - the key to the state object desired.
         * 
         * @returns {boolean} true if the property was found, false otherwise.
         */
        function hasItem(key) {
            return Utils.hasProp(state, key);
        }

        /**
         * Sets a state property into an error state.
         * This should be called when an attempt to obtain the state value 
         * results in an error condition.
         * 
         * The error condition is communicated through the standard listener
         * mechanism, so that consumers can reflect the current state.
         * The onError method, if provideded by a listener, is called with the
         * error object.
         * 
         * @function
         * @public
         * 
         * @param {PropertyPath} key - the property path to the state object.
         * @param {Any} err - the error object generated by the attempt to
         * obtain the state property.
         * 
         * @returns {this} a reference to the state machine object to allow chaining.
         */
        function setError(key, err) {
            var newListeners = [];
            if (listeners[key]) {
                listeners[key].forEach(function (item) {
                    queue.addItem({
                        onRun: (function (fun, err) {
                            return function () {
                                try {
                                    fun(err);
                                } catch (ex) {
                                    //TODO: need a sensible way of logging exceptions...
                                    //console.log('EX running onRun handler');
                                    //console.log(ex);
                                }
                            };
                        }(item.onError, err))
                    });
                    if (!item.oneTime) {
                        newListeners.push(item);
                    }
                });
                listeners[key] = newListeners;
            }
            Utils.setProp(state, key, { status: 'error', error: err, time: new Date() });
        }

        /**
         * Used to determine if the state property is in an error state.
         * 
         * @function
         * @public
         * 
         * @param {PropertyPath} key - the path to the state property in 
         * question.
         * 
         * @returns {boolean} true if the state property is in an error state, 
         * false otherwise.
         */
        function hasError(key) {
            var item = Utils.getProp(state, key);
            if (item && item.status === 'error') {
                return true;
            }
            return false;
        }

        /**
         * Delete a state property.
         * 
         * @todo this needs to be communicated to subscribers
         * @todo then the subscribtions need to be removed.
         * @todo actually they are part of the state object??
         * 
         * @function
         * @public
         * 
         * @param {PropertyPath} key - the path to the state property to be removed.
         * 
         * @returns {boolean} true if the object was found and deleted, false
         * otherwise.
         */
        function delItem(key) {
            if (Utils.hasProp(state, key)) {
                Utils.deleteProp(state, key);
            }
        }

        /**
         * A short synonym for listenForItem.
         * 
         * @function 
         * @public
         * 
         * @see listenForItem
         */
        function listen(key, cfg) {
            return listenForItem(key, cfg);
        }

        // only listen for changes -- not initial value.
        function changed(key, fun) {
            if (listeners[key] === undefined) {
                listeners[key] = [];
            }
            if (key instanceof RegExp) {
                regexpListeners.push({
                    regexp: key,
                    onSet: fun
                });
            } else {
                listeners[key].push({
                    onSet: fun
                });
            }
        }

        /**
         * Set up a listener for changes to a state property.
         * The listener may be configured to receive set, error, or delete
         * notifiations. In addition, the listener may be specified a
         * one-time, meaning that it will be removed from the listener list
         * after the first call. For the latter usage, though, whenItem may
         * be more convenient.
         * 
         * @function
         * @public
         * 
         * @param {StatePropertyKey} key - a path to the state property
         * @param {ListenerConfig} cfg - a simple object to configure the listener.
         *  
         * @returns {this} a reference to the state machine to enable chaining. 
         */
        function listenForItem(key, cfg) {
            // A cheap call supplies just a function.
            //TODO: really support this?
            if (typeof cfg === 'function') {
                cfg = { onSet: cfg };
            }
            // If the item is available, provide immediate callback.

            // TODO: We should probably not have any immediate callback -- 
            // rather just queue this up.
            var item = Utils.getProp(state, key);
            if (item) {
                if (cfg.hear) {
                    cfg.hear(item.value);
                    if (cfg.oneTime) {
                        return;
                    }
                } else {
                    switch (item.status) {
                    case 'set':
                        cfg.onSet(item.value);
                        break;
                    case 'error':
                        cfg.onError(item.error);
                        break;
                    default:
                        throw 'Invalid status: ' + item.status;
                    }
                }
            }

            if (listeners[key] === undefined) {
                listeners[key] = [];
            }
            listeners[key].push(cfg);
        }

        /**
         * This differs from listen in that it returns a promise that is 
         * fulfilled either now (the item is available) or when it is
         * first set (via a set of one-time listeners).
         * 
         * @function
         * @public
         * 
         * @param {StatePropertyKey} key - a path to the state property in question
         * @params {integer} timeout - if the state property is not initialized 
         * within the timeout period, the onError method will be called with a 
         * reason set to 'timeout'.
         * 
         * @returns {promise} a promise that will be fulfilled when the state
         * property has been initialized.
         */
        function whenItem(key, timeout) {
            var p = new Promise(function (resolve, reject) {
                if (Utils.hasProp(state, key)) {
                    var item = Utils.getProp(state, key);
                    if (item.status === 'error') {
                        reject(item.error);
                    } else {
                        resolve(item.value);
                    }
                } else {
                    listenForItem(key, {
                        oneTime: true,
                        addedAt: (new Date()).getTime(),
                        onSet: function (value) {
                            resolve(value);
                        },
                        onError: function (err) {
                            reject(err);
                        }
                    });
                }
            });
            if (timeout) {
                return p.timeout(timeout);
            }
            return p;
        }

        return {
            setItem: setItem,
            modifyItem: modifyItem,
            getItem: getItem,
            listen: listen,
            listenForItem: listenForItem,
            whenItem: whenItem,
            hasItem: hasItem,
            changed: changed,
            get: get
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});