define([
    'kb_common/html',
], function (
    html
) {
    var // t = html.tagMaker(),
        t = html.tag,
        div = t('div'),
        h2 = t('h2'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        button = t('button'),
        form = t('form'),
        input = t('input'),
        label = t('label'),
        select = t('select'),
        option = t('option'),
        p = t('p'),
        iframe = t('iframe');

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;
        var vm = {
            realname: {
                label: 'Name',
                type: 'text',
                placeholder: 'Your Name',
                description: div([
                    p([
                        'This field contains your name as you wish it to be displayed to other KBase users ',
                        ' as well as KBase staff.'
                    ]),
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
                label: 'E-Mail',
                type: 'text',
                placeholder: 'Your E-Mail Address',
                description: div([
                    p([
                        'Your email address is displayed to other users as well as KBase staff.',
                        'It is never publicly displayed.'
                    ])
                ])
            }
        };

        function buildInput(vm) {
            var id = html.genId();
            return div({
                class: 'form-group'
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
                        },
                        vm.description
                    )
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
                }, 'Submit')
            ]);
            return content;
        }

        function render() {
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

                        buildForm(vm)
                    ])
                ])
            ])
        }

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                container = hostNode.appendChild(document.createElement('div'));
            });
        }

        function start(params) {
            return Promise.try(function () {
                return runtime.service('session').getClient().getAccount()
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
                        container.innerHTML = render();
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