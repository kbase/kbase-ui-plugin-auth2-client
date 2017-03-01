define([
        'kb_common/html',
        'kb_common/domEvent2',
        'kb_common/ui',
        'bluebird',
        'kb_plugin_login',
        'kb_common/auth2',
        'kb_common/bootstrapUtils',
        'kb_common/format'
    ],
    function (
        html,
        DomEvent,
        UI,
        Promise,
        Plugin,
        Auth2,
        BS,
        Format
    ) {
        'use strict';

        var t = html.tag,
            div = t('div'),
            span = t('span'),
            table = t('table'),
            tr = t('tr'),
            td = t('td'),
            th = t('th'),
            input = t('input'),
            form = t('form'),
            button = t('button');

        function widget(config) {
            var hostNode, container, runtime = config.runtime,
                nextRequest,
                events, ui;

            var auth2 = Auth2.make({
                cookieName: runtime.config('services.auth2.cookieName'),
                authBaseUrl: runtime.config('services.auth2.url')
            });

            function niceTime(dateObj) {
                var date, time;
                if (typeof dateObj === 'string') {
                    date = new Date(dateObj);
                } else if (typeof dateObj === 'number') {
                    date = new Date(dateObj);
                } else {
                    date = dateObj;
                }

                var shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                var minutes = date.getMinutes();
                if (minutes < 10) {
                    minutes = '0' + minutes;
                }
                var seconds = date.getSeconds();
                if (seconds < 10) {
                    seconds = '0' + String(seconds);
                } else {
                    seconds = String(seconds);
                }
                if (date.getHours() >= 12) {
                    if (date.getHours() !== 12) {
                        time = (date.getHours() - 12) + ':' + minutes + ':' + seconds + 'pm';
                    } else {
                        time = '12:' + minutes + ':' + seconds + 'pm';
                    }
                } else {
                    time = date.getHours() + ':' + minutes + 'am';
                }
                return shortMonths[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() + ' at ' + time;
            }

            var viewModelDef = {
                name: 'root',
                children: [{
                        name: 'el1',
                        children: [{
                            name: 'el1',
                            component: function (vm) {
                                function render() {
                                    vm.node.innerHTML = div({}, [
                                        'Hi, this is rendered. ',
                                        'The value is ',
                                        vm.value
                                    ]);
                                }

                                function value(newValue) {
                                    if (newValue) {
                                        vm.value = newValue;
                                        render();
                                    } else {
                                        return vm.value;
                                    }
                                }
                                return {
                                    render: render,
                                    value: value
                                }
                            }

                        }]
                    },
                    {
                        name: 'el2',
                        children: [{
                            name: 'el1',
                            component: function (vm) {
                                function render() {
                                    vm.node.innerHTML = div({}, [
                                        'Hi, this is another component. ',
                                        'The value is ',
                                        vm.value
                                    ]);
                                }

                                function value(newValue) {
                                    if (newValue) {
                                        vm.value = newValue;
                                        render();
                                    } else {
                                        return vm.value;
                                    }
                                }
                                return {
                                    render: render,
                                    value: value
                                }
                            }
                        }]
                    },
                    {
                        name: 'el3',
                        children: [{
                            name: 'el1',
                            component: function (vm) {
                                function render() {
                                    vm.node.innerHTML = span({
                                        style: {
                                            border: '2px silver solid',
                                            padding: '4px',
                                            fontFamily: 'monospace',
                                            fontWeight: 'bold',
                                            color: 'green'
                                        }
                                    }, [
                                        niceTime(vm.value)
                                    ]);
                                }

                                function value(newValue) {
                                    if (newValue) {
                                        vm.value = newValue;
                                        render();
                                    } else {
                                        return vm.value;
                                    }
                                }
                                var timer;

                                function start() {
                                    value(new Date().getTime());
                                    timer = window.setInterval(function () {
                                        value(new Date().getTime());
                                    }, 1000);
                                }

                                function stop() {
                                    window.clearInterval(timer);
                                }
                                return {
                                    render: render,
                                    value: value,
                                    start: start,
                                    stop: stop
                                }
                            }
                        }]
                    }
                ]
            };

            var viewModelDef2 = {
                el1: {
                    el1: {
                        _config: {
                            component: function (vm) {
                                function render() {
                                    vm.node.innerHTML = div({}, [
                                        'Hi, this is rendered. ',
                                        'The value is ',
                                        vm.value
                                    ]);
                                }

                                function value(newValue) {
                                    if (newValue) {
                                        vm.value = newValue;
                                        render();
                                    } else {
                                        return vm.value;
                                    }
                                }
                                return {
                                    render: render,
                                    value: value
                                }
                            }
                        }
                    },
                    el2: {
                        el1: {
                            _config: {
                                component: function (vm) {
                                    function render() {
                                        vm.node.innerHTML = div({}, [
                                            'Hi, this is another component. ',
                                            'The value is ',
                                            vm.value
                                        ]);
                                    }

                                    function value(newValue) {
                                        if (newValue) {
                                            vm.value = newValue;
                                            render();
                                        } else {
                                            return vm.value;
                                        }
                                    }
                                    return {
                                        render: render,
                                        value: value
                                    }
                                }
                            }
                        }
                    },
                    el3: {
                        el1: {
                            _config: {
                                component: function (vm) {
                                    function render() {
                                        vm.node.innerHTML = span({
                                            style: {
                                                border: '2px silver solid',
                                                padding: '4px',
                                                fontFamily: 'monospace',
                                                fontWeight: 'bold',
                                                color: 'green'
                                            }
                                        }, [
                                            niceTime(vm.value)
                                        ]);
                                    }

                                    function value(newValue) {
                                        if (newValue) {
                                            vm.value = newValue;
                                            render();
                                        } else {
                                            return vm.value;
                                        }
                                    }
                                    var timer;

                                    function start() {
                                        value(new Date().getTime());
                                        timer = window.setInterval(function () {
                                            value(new Date().getTime());
                                        }, 1000);
                                    }

                                    function stop() {
                                        window.clearInterval(timer);
                                    }
                                    return {
                                        render: render,
                                        value: value,
                                        start: start,
                                        stop: stop
                                    }
                                }
                            }
                        },
                        el2: {
                        },
                        el3: {                            
                        }
                    }
                }
            };

            var viewModel;

            function makeViewModel(node, def) {

                function setValue(path, newValue) {
                    var vmNode = getViewModelNode(vm, path);
                    if (vmNode) {
                        if (vmNode.binding.component) {
                            vmNode.binding.component.value(newValue);
                        }
                    }
                }

                function startComponent(path, options) {
                    var vmNode = getViewModelNode(vm, path);
                    if (vmNode) {
                        console.log('start', vmNode);
                        if (vmNode.binding.component) {
                            vmNode.binding.component.start(options);
                        }
                    }
                }

                var vm = {
                    root: node,
                    setValue: setValue,
                    startComponent: startComponent,
                    model: makeViewModelLevel(def)
                };
                return vm;
            }

            function viewModelBind(vm, path) {
                var vmNode = getViewModelNode(vm, path);
                if (vmNode) {
                    return vmNode.id;
                }
            }

            function bindViewModel(viewModel) {
                // vm.root.appendChild(vm.model.node);

                function binder(vm) {
                    var node = document.getElementById(vm.id);
                    if (node === null) {
                        console.warn('no node, not binding', vm.id, node, vm);
                    } else {
                        console.log('binding', node);
                        vm.node = node;

                        // add write bindings...
                        // just hardcode for now.
                        vm.binding = {
                            write: {},
                            read: {}
                        };
                        vm.binding.write.html = function (newHtml) {
                            if (newHtml) {
                                node.innerHTML = newHtml;
                            } else {
                                return node.innerHTML;
                            }
                        }
                        vm.binding.value = function (newValue) {
                            if (newValue) {
                                vm.value = newValue;
                                vm.binding
                            } else {
                                return vm.value;
                            }
                        }
                        if (vm.component) {
                            console.log('binding component...', vm);
                            vm.binding.component = vm.component(vm);
                        }

                        // and read bindings...
                        vm.binding.read.click = function () {
                            alert('clicked');
                        }
                        node.addEventListener('click', vm.binding.read.click);

                        console.log('added binding...', vm);
                    }

                    if (vm.children) {
                        Object.keys(vm.children).forEach(function (key) {
                            binder(vm.children[key]);
                        })
                    }
                }
                binder(viewModel.model);
            }

            function makeViewModelLevel(def) {
                // var node = document.createElement('div');
                // node.style.border = '1px red solid';
                var id = html.genId();
                // node.id = id;
                var viewModel = {
                    id: id,
                    // node: node,
                    name: def.name,
                    component: def.component
                };
                if (!def.children) {
                    def.children = [];
                }
                viewModel.layout = def.children.map(function (child) {
                    return child.name
                });
                viewModel.children = {};
                def.children.forEach(function (child) {
                    viewModel.children[child.name] = makeViewModelLevel(child);
                });
                return viewModel;
            }

            function getViewModelNode(viewModel, pathString) {
                var path = pathString.split('.');
                var trail = [];

                function finder(node, path) {
                    if (path.length === 0) {
                        // console.log('** returning', node);
                        return node;
                    }
                    var nextElement = path.shift();
                    var next = node.children[nextElement];
                    // console.log('Next', nextElement, pathString, path, next, node);
                    if (next) {
                        trail.push(nextElement);
                        return finder(next, path);
                    } else {
                        return null;
                    }
                }
                var retval = finder(viewModel.model, path);
                console.log('trail', trail, retval);
                return retval;
            }

            function setViewModelNode(viewModel, path, content) {
                var vm = getViewModelNode(viewModel, path);
                if (!vm) {
                    console.warn('vm node not found', path);
                    return;
                }
                // console.log('setting node', vm.node, path, content);
                vm.node.innerHTML = content;
            }



            // API

            function attach(node) {
                return Promise.try(function () {
                    hostNode = node;
                    container = hostNode.appendChild(document.createElement('div'));
                    events = DomEvent.make(container);
                    ui = UI.make({ node: container });
                });
            }

            function getElement(node, name) {
                return node.querySelector('[data-element="' + name + '"]')
            }

            function hideError() {
                var node = container.querySelector('[data-element="error"]');
                node.classList.add('hidden');
            }

            function showError(error) {
                // var node = ui.getElement('error');
                // console.log('error node', node);
                //node.classList.remove('hidden');
                setViewModelNode(viewModel, 'error.title', error.title);
                setViewModelNode(viewModel, 'error.message', error.message);
                setViewModelNode(viewModel, 'error.detail', error.detail || '');
                // ui.setContent('error.title', error.title);
                // ui.setContent('error.message.body', error.message);
                // ui.setContent('error.detail.body', error.detail || '');

                // node.innerHTML = BS.buildPresentableJson(response);
            }

            function hideResponse(response) {
                var node = container.querySelector('[data-element="response"]');
                node.classList.add('hidden');
                node.innerHTML = BS.buildPresentableJson(response);
            }

            function showResponse(response) {
                var node = container.querySelector('[data-element="response"]');
                node.classList.remove('hidden');
                node.innerHTML = BS.buildPresentableJson(response);
            }

            function doSubmitSignup(event) {
                event.preventDefault();

                var signupForm = container.querySelector('[data-element="signup-form"]');
                var realName = signupForm.querySelector('[name="realname"]').value;
                var username = signupForm.querySelector('[name="username"]').value;
                var email = signupForm.querySelector('[name="email"]').value;
                var id = signupForm.querySelector('[name="id"]').value;

                var data = {
                    id: id,
                    user: username,
                    display: realName,
                    email: email
                };

                auth2.createAccount(data)
                    .then(function (response) {
                        console.log('RESP', response);
                        switch (response.status) {
                        case 'ok':
                            hideError();
                            showResponse({
                                title: 'Success',
                                message: 'The account was successfully created'
                            });
                            break;
                        case 'error':
                            hideResponse();
                            showError({
                                title: 'Error creating account',
                                message: response.data.message,
                                detail: response.data
                            });
                            break;
                        default:
                            hideResponse();
                            showError({
                                message: 'Unknown response',
                                data: response
                            })
                        }
                    })
                    .catch(function (err) {
                        console.log('ERROR', err);
                        showError({
                            title: 'Exception creating account',
                            message: err.message
                        });
                    });
            }

            function renderSignup(events, choiceResponse) {
                var content = BS.buildPanel({
                    title: 'Sign up for KBase',
                    body: form({
                        dataElement: 'signup-form',
                        id: events.addEvent({
                            type: 'submit',
                            handler: doSubmitSignup
                        })
                    }, [
                        table({
                            class: 'table table-striped'
                        }, [
                            tr([
                                th('Your name'),
                                td(input({
                                    class: 'form-input',
                                    name: 'realname',
                                    value: choiceResponse.create[0].prov_fullname
                                }))
                            ]),
                            tr([
                                th('Username'),
                                td(input({
                                    class: 'form-input',
                                    name: 'username',
                                    value: choiceResponse.create[0].usernamesugg
                                }))
                            ]),
                            tr([
                                th('E-Mail'),
                                td(input({
                                    class: 'form-input',
                                    name: 'email',
                                    value: choiceResponse.create[0].prov_email
                                }))
                            ]),
                            tr([
                                th('ID (hidden)'),
                                td(input({
                                    class: 'form-input',
                                    name: 'id',
                                    value: choiceResponse.create[0].id
                                }))
                            ]),
                            tr([
                                th(),
                                td(button({
                                    type: 'submit',
                                    id: events.addEvent({ type: 'click', handler: doSubmitSignup })
                                }, 'Create Account'))
                            ])
                        ]),
                        BS.buildPresentableJson(choiceResponse)
                    ])
                });
                getElement(container, 'form').innerHTML = content;
            }

            function buildLayout(vm) {
                var s = {
                    border: '1px red solid',
                    padding: '4px',
                    margin: '4px'
                };

                var markup = div({ style: s }, [
                    div({
                        style: s,
                        id: vm.model.children.el1.id
                    }, [
                        div({
                            style: s,
                            id: viewModelBind(vm, 'el1.el1')
                        }),
                        div({
                            style: s,
                            id: viewModelBind(vm, 'el2.el1')
                        }),
                        div({
                            style: s,
                            id: viewModelBind(vm, 'el3.el1')
                        })
                    ])
                ]);
                return markup;
            }

            function start(params) {
                return Promise.try(function () {
                    var events = DomEvent.make({
                        node: container
                    });
                    var test = container.appendChild(document.createElement('div'));

                    // Make a view model
                    viewModel = makeViewModel(container, viewModelDef);

                    console.log('view model', viewModel);

                    // Make components to plug into the view model.
                    var layout = buildLayout(viewModel);
                    container.innerHTML = layout;


                    bindViewModel(viewModel);

                    // viewModel.model.children.el1.children.el1.value('hi');

                    // console.log('vm??',viewModel.model.children.el1.children.el1);
                    // viewModel.model.children.el1.children.el1.binding.component.value('Hello');

                    viewModel.setValue('el1.el1', 'Hello');
                    viewModel.setValue('el2.el1', 'Hi');
                    viewModel.startComponent('el3.el1');

                    // viewModel.model.children.el1.children.el1.binding.component.render();

                    // viewModel.model.children.el1.children.el1.binding.write.html('Hi');
                    // bindViewModel({
                    //     vm: viewModel.model.children.el1.children.el1,
                    //     type: 
                    // viewModel.model.children.el1.children.el1.binding.read.html('Hi');


                });
            }

            function detach() {
                /// events.detachEvents();
                if (container) {
                    mount.removeChild(container);
                }
            }

            return {
                attach: attach,
                detach: detach,
                start: start
            };
        }

        return {
            make: function (config) {
                return widget(config);
            }
        };

    });