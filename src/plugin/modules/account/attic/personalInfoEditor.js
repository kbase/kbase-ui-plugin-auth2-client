define([
    'bluebird',
    'kb_common/html',
], function (
    Promise,
    html
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span'),
        input = t('input'),
        label = t('label'),
        p = t('p');

    function more(content) {
        var id = html.genId();
        return div({
            dataElement: 'more'
        }, [
            div([
                button({
                    type: 'button',
                    class: 'btn btn-text',
                    dataElement: 'button'
                }, span({
                    dataElement: 'label'
                }, 'more'))
            ]),
            div({
                class: 'hidden',
                dataElement: 'content'
            }, content)
        ]);
    }

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;
        var vm = {
            form: {
                id: html.genId(),
                node: null
            },
            realname: {
                id: html.genId(),
                node: null,
                value: null,
                label: 'Name',
                type: 'text',
                placeholder: 'Your Name',
                description: div([
                    p([
                        'This field contains your name as you wish it to be displayed to other KBase users ',
                        ' as well as KBase staff.'
                    ])
                ]),
                more: div([
                    p([
                        'This name will be displayed to other KBase users until you create your profile. ',
                        'When you create your profile, a new display name will be created which contains ',
                        'additional information, including title, suffix, first and last name. '
                    ]),
                    p([
                        'After you create your profile, that name information will be used for display to ',
                        'other users (when they are logged in), and in Narratives and related data you may publish. ',
                        'When you have a profile, the name shown here ',
                        'on your account will the only be available to KBase staff.'
                    ])
                ])
            },
            email: {
                id: html.genId(),
                node: null,
                value: null,
                label: 'E-Mail',
                type: 'text',
                placeholder: 'Your E-Mail Address',
                description: div([
                    p([
                        'Your email address may be used by KBase staff to contact you. ',
                        'It will not be displayed to other users.'
                    ])
                ]),
                more: div([
                    p([
                        'This email address is'
                    ])
                ])
            }
        };

        function buildInput(vm) {
            var id = html.genId();
            return div({
                class: 'form-group',
                id: vm.id
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, label({
                        for: id
                    }, vm.label))
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                            class: 'col-md-6'
                        },
                        input({
                            type: vm.type | 'text',
                            class: 'form-control',
                            id: id,
                            placeholder: vm.placeholder,
                            value: vm.value
                        })
                    ),
                    div({
                        class: 'col-md-6'
                    }, [
                        vm.description,
                        more(vm.more)
                    ])
                ])
            ]);
        }

        function buildForm() {
            var content = div([
                buildInput(vm.realname),
                buildInput(vm.email),
                button({
                    class: 'btn btn-primary',
                    type: 'button'
                }, 'Save')
            ]);
            return content;
        }

        function buildLayout() {
            return div({
                class: 'container-fluid',
                style: {
                    marginTop: '10px'
                }
            }, [
                div({
                    class: 'row'
                }, [
                    div({ class: 'col-md-12' }, [
                        p('You may edit your account information here.')
                    ])
                ]),

                div({
                    class: 'row'
                }, [
                    div({ class: 'col-md-12' }, [
                        buildForm()
                    ])
                ])
            ]);
        }

        function bindMoreControl(vm) {
            var moreControl = vm.node.querySelector('[data-element="more"]');
            var moreLabel = moreControl.querySelector('[data-element="label"]');
            var moreButton = moreControl.querySelector('[data-element="button"]');
            var moreContent = moreControl.querySelector('[data-element="content"]');
            moreButton.addEventListener('click', function () {
                if (moreContent.classList.contains('hidden')) {
                    moreContent.classList.remove('hidden');
                    moreLabel.innerHTML = 'less';
                } else {
                    moreContent.classList.add('hidden');
                    moreLabel.innerHTML = 'more';
                }
            });
        }

        function bindVm() {
            // bind the nodes
            vm.form.node = document.getElementById(vm.form.id);
            vm.realname.node = document.getElementById(vm.realname.id);
            vm.email.node = document.getElementById(vm.email.id);

            // bind the more buttons
            bindMoreControl(vm.realname);
            bindMoreControl(vm.email);

            // bind the controls to validators

            // bind the form to the updater
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return Promise.try(function () {
                return runtime.service('session').getClient().getMe()
                    .then(function (account) {
                        vm.realname.value = account.display;
                        vm.email.value = account.email;
                        // vm = {
                        //     realName: account.display,
                        //     email: account.email,
                        //     created: account.created,
                        //     lastLogin: account.lastLogin,
                        //     username: account.user
                        // };
                        // vm = {
                        //     realName: runtime.service('session').getRealname(),
                        //     email: runtime.service('session').getClient().getEmail()
                        // };
                        container.innerHTML = buildLayout();
                        bindVm();
                    });
            });
        }

        function stop() {
            return Promise.try(function () {});
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                    hostNode.innerHTML = '';
                }
            });
        }

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };

    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});