define([], function () {
    'use strict';

    function NotFoundException(request) {
        this.name = 'NotFoundException';
        this.original = request.original;
        this.path = request.path;
        this.params = request.params;
        this.request = request.request;
    }
    NotFoundException.prototype = Object.create(Error.prototype);
    NotFoundException.prototype.constructor = NotFoundException;

    function parseQueryString(s) {
        const fields = s.split(/[?&]/);
        const params = {};
        fields.forEach((field) => {
            if (field.length > 0) {
                const [key, value] = field.split('=');
                if (key.length > 0) {
                    params[decodeURIComponent(key)] = decodeURIComponent(value);
                }
            }
        });
        return params;
    }

    function paramsToQuery(params) {
        return Object.keys(params).map((key) => {
            return key + '=' + encodeURIComponent(params[key]);
        }).join('&');
    }

    function getQuery() {
        const query = window.location.search;
        if (!query || query.length === 1) {
            return {};
        }
        return parseQueryString(query.substr(1));
    }

    class Router {
        constructor(config) {
            if (!config.defaultRoute) {
                throw new Error('The defaultRoute must be provided');
            }
            // Routing
            this.routes = [];
            this.defaultRoute = config.defaultRoute;
        }

        addRoute(pathSpec) {
            /*
             * The path spec is an array of elements. Each element is either a
             * string, in which case it is a literal path component,
             * regular expression, which case it is matched on a path component,
             * object with type:param
             */
            /* TODO: do something on overlapping routes */
            /* TODO: better mapping method for routes. */
            /* still, with a relatively short list of routes, this is far from a performance issue. */

            // fix up the path. This business is to make it easier to have
            // compact path specifications.
            let path = pathSpec.path;
            if (typeof path === 'string') {
                path = [path];
            }
            pathSpec.path = path.map((pathElement) => {
                if (typeof pathElement === 'string') {
                    return {
                        type: 'literal',
                        value: pathElement
                    };
                }
                if (typeof pathElement === 'object') {
                    if (pathElement instanceof Array) {
                        return {
                            type: 'options',
                            value: pathElement
                        };
                    }
                    if (!pathElement.type) {
                        pathElement.type = 'param';
                    }
                    return pathElement;
                }
                throw new Error('Unsupported route path element');
            });
            this.routes.push(pathSpec);
        }

        getCurrentRequest() {
            let path = [];
            let query2 = {};

            let hash, pathQuery;

            // Also get the query the normal way ...
            const query = getQuery();

            // The path is (for now) from the hash component.
            if (window.location.hash && window.location.hash.length > 1) {
                hash = window.location.hash.substr(1);
                pathQuery = hash.split('?', 2);

                if (pathQuery.length === 2) {
                    query2 = parseQueryString(pathQuery[1]);
                    Object.keys(query2).forEach((key) => {
                        query[key] = query2[key];
                    });
                }
                path = pathQuery[0].split('/')
                    .filter((pathComponent) => {
                        return (pathComponent.length > 0);
                    })
                    .map((pathComponent) => {
                        return decodeURIComponent(pathComponent);
                    });
            }

            return {
                original: hash,
                path: path,
                query: query
            };
        }

        findRoute(req) {
            let foundRoute, j, route, params,
                requestPathElement, routePathElement,
                allowableParams;

            // No route at all? Return the default route.
            if ((req.path.length === 0) && (Object.keys(req.query).length === 0)) {
                return {
                    request: req,
                    params: {},
                    route: this.defaultRoute
                };
            }
            routeloop:
            for (let i = 0; i < this.routes.length; i += 1) {
                route = this.routes[i];
                params = {};

                // We can use a route which is longer than the path if it has
                // optional params at the end.
                if (route.path.length > req.path.length) {
                    if (!req.path.slice(route.path.length).every(function (routePathElement) {
                        return routePathElement.optional;
                    })) {
                        continue routeloop;
                    }
                } else if (route.path.length < req.path.length) {
                    continue routeloop;
                }

                for (j = 0; j < req.path.length; j += 1) {
                    routePathElement = route.path[j];
                    requestPathElement = req.path[j];
                    switch (routePathElement.type) {
                    case 'literal':
                        if (routePathElement.value !== requestPathElement) {
                            continue routeloop;
                        }
                        break;
                    case 'options':
                        if (!routePathElement.value.some(function (option) {
                            if (requestPathElement === option) {
                                return true;
                            }
                        })) {
                            continue routeloop;
                        }
                        break;
                    case 'param':
                        params[routePathElement.name] = requestPathElement;
                        break;
                    }
                }
                // First found route wins
                // TODO: fix this?
                foundRoute = {
                    request: req,
                    params: params,
                    route: route
                };
                break routeloop;
            }
            // The total params is the path params and query params
            if (foundRoute) {
                allowableParams = foundRoute.route.queryParams || {};
                Object.keys(req.query).forEach(function (key) {
                    var paramDef = allowableParams[key];
                    /* TODO: implement the param def for conversion, validation, etc. */
                    if (paramDef) {
                        foundRoute.params[key] = req.query[key];
                    }
                });
            } else {
                throw new NotFoundException({
                    request: req,
                    params: params,
                    route: null,
                    original: req.original,
                    path: req.path
                });
            }
            return foundRoute;
        }

        findCurrentRoute() {
            const req = this.getCurrentRequest();
            return this.findRoute(req);
        }

        listRoutes() {
            return this.routes.map((route) => {
                return route.path;
            });
        }

        navigateToPath(location) {
            let providedPath, queryString, finalPath;
            if (typeof location.path === 'string') {
                providedPath = location.path.split('/');
            } else if (location.path instanceof Array) {
                providedPath = location.path;
            } else {
                console.error('Invalid path in location', location);
                throw new Error('Invalid path in location');
            }
            // we eliminate empty path components, like extra slashes, or an initial slash.
            const normalizedPath = providedPath
                .filter((element) => {
                    if (!element || (typeof element !== 'string')) {
                        return false;
                    }
                    return true;
                })
                .join('/');
            if (location.params) {
                queryString = paramsToQuery(location.params);
            }
            // Oops, may be encoded as query
            if (location.query) {
                queryString = paramsToQuery(location.query);
            }
            if (queryString) {
                finalPath = normalizedPath + '?' + queryString;
            } else {
                finalPath = normalizedPath;
            }
            if (location.external) {
                finalPath = '/' + finalPath;
                if (location.replace) {
                    this.replacePath(finalPath);
                } else {
                    // We need to blow away the whole thing, since there will
                    // be a hash there.
                    window.location.href = finalPath;
                }
            } else {
                if (location.replace) {
                    this.replacePath('#' + finalPath);
                } else {
                    window.location.hash = '#' + finalPath;
                }
            }
        }

        navigateTo(location) {
            //if (window.history.pushState) {
            //    window.history.pushState(null, '', '#' + location);
            //} else {
            if (!location) {
                location = this.defaultRoute;
            }
            if (typeof location === 'string') {
                location = { path: location };
            }

            if (location.path !== undefined) {
                this.navigateToPath(location);
            } else if (typeof location.redirect === 'string') {
                this.redirectTo(location.redirect);
            } else {
                throw new Error('Invalid navigation location -- no path');
            }
        }

        replacePath(location) {
            window.location.replace(location);
        }

        redirectTo(location, newWindow) {
            if (newWindow) {
                window.open(location);
            } else {
                window.location.replace(location);
            }
        }

        // return {
        //     addRoute: addRoute,
        //     listRoutes: listRoutes,
        //     findCurrentRoute: findCurrentRoute,
        //     getCurrentRequest: getCurrentRequest,
        //     findRoute: findRoute,
        //     navigateTo: navigateTo,
        //     redirectTo: redirectTo
        // };
    }

    return {
        NotFoundException,
        Router
    };
});
