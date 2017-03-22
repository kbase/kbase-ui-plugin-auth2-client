/*global Promise*/
define([
    'kb_common_ts/Html',
    'kb_common/domEvent',
    'kb_plugin_auth2-client',
    './utils'
], function (
    Html,
    DomEvent,
    Plugin,
    Utils
) {
    var html = new Html.Html,
        t = html.tagMaker(),
        div = t('div'),
        a = t('a'),
        span = t('span'),
        b = t('b'),
        i = t('i'),
        bspan = t('span', {style: {fontWeight: 'bold'}}),
        h2 = t('h2'),
        p = t('p'),
        img = t('img'),
        ul = t('ul'),
        li = t('li');

    function factory(config) {
        var hostNode, container, runtime = config.runtime,
            nextRequest,
            utils = Utils.make({
                runtime: runtime
            });

        function render() {
            var events = DomEvent.make({
                node: container
            });
            var globusProvider = {
                id: 'Globus',
                label: 'Globus'
            };
            var content = div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12'
                    }, [
                        h2('KBase Legacy Login')
                    ])
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-6'
                    }, [
                        p([
                            'On April 15, 2017 KBase rolled out a new authentication system. '
                        ]),
                        p([
                            'The login process now provides much more functionality, but it does work differently. ',
                            'This page briefly describes the changes.'
                        ]),
                        div({
                            class: 'row'
                        }, [
                            div({
                                class: 'col-md-6',
                                style: {
                                    textAlign: 'center'
                                }
                            }, [
                                div({style: {fontWeight: 'bold'}}, 'Old Sign In Form'),
                                img({
                                    src: Plugin.plugin.fullPath + '/images/old-sign-in-form.png',
                                    style: {
                                        height: '300px'
                                    }
                                })
                            ]),
                            div({
                                class: 'col-md-6',
                                style: {
                                    textAlign: 'center'
                                }
                            }, [
                                div({style: {fontWeight: 'bold'}}, 'New Sign In Form'),
                                img({
                                    src: Plugin.plugin.fullPath + '/images/new-sign-in-form.png',
                                    style: {
                                        height: '300px'
                                    }
                                })
                            ])
                        ]),
                        p([
                            'The primary difference between the new and old sign in process is that we used to require and ',
                            'only support direct entry of a ', i('username'), ' and ', i('password'), '. ',
                            ' Behind the scenes, we used Globus to ',
                            'authenticate the username and password. (You may remember Globus from your initial KBase sign-up process.)'
                        ]),
                        p([
                            'The new sign in process still includes Globus as an authentication provider, but also supports Google. ',
                            'In addition, we no longer support entry of a username and password directly at KBase -- rather you enter ',
                            'this at either Globus or Google.'
                        ]),
                        p([
                            'In addition, Globus supports not just direct entry of username and password, but also authentication through ',
                            'organizational authentication providers as well as Google. The Globus direct login with username and ',
                            'password is referred to as ', b('Globus ID'), '.'
                        ])
                        
                    ]),
                    div({
                        class: 'col-md-6'
                    }, [
                        h2('How to Sign In the first time'),
                        p([
                            'If you signed up for KBase prior to ', b('April 15, 2017'), 
                            ' you will have created a Globus ID account. ',
                            'Therefore, the first time you log into KBase after April 15, you will need to: ',
                            ul([
                                li('Choose Globus as your Sign-in provider'),
                                li('Choose Globus ID as your authentication method at Globus'),
                                li('Log in at Globus ID with your usual KBase username and password')
                            ])
                        ]),
                        p([
                            '1. From the KBase Sign In page, choose the "Globus" button. (The button below works too)'
                        ]),
                        p({style: {textAlign: 'center'}}, [
                            div({
                                style: {
                                    display: 'inline-block',
                                    width: '150px'
                                }
                            }, utils.buildLoginButton(events, globusProvider, {
                                nextrequest: nextRequest,
                                origin: 'legacylogin'
                            }))
                        ]),
                        p([
                            '2. From the Globus Account Log In page, click the "Globus ID to sign in" link.',
                        ]),
                        p(
                            img({
                                src: Plugin.plugin.fullPath + '/images/globus-sign-in-marked.png',
                                style: {
                                    display: 'inline-block',
                                    width: '100%',
                                    border: '1px silver solid',
                                    padding: '4px'
                                }
                            })
                        ),
                        p([
                            'After you have logged in for the first time with the new system, you may link additional accounts.'
                        ]),

                        p([
                            '3. From the Globus ID sign in page, enter your usual KBase username and password. ',
                            'If you have trouble logging in, you may use the password recover feature, or ',
                            a({href: 'https://www.globus.org/'}, 'contact Globus directly')
                        ]),
                        p(
                            img({
                                src: Plugin.plugin.fullPath + '/images/globusid-sign-in-marked.png',
                                style: {
                                    display: 'inline-block',
                                    width: '100%',
                                    border: '1px silver solid',
                                    padding: '4px'
                                }
                            })
                        ),
                        p([
                            '4. After signing in you will be returned to the KBase log in page. If this is the first time ',
                            'accessing your account after 4/15/17, you will be prompted to agree to the KBase terms and conditions. ',
                            'When you originally signed up through Globus, you would have agreed to Globus as well as KBase terms. ',
                            'Since we have no way of tracking which users agreed to which terms, we are asking that users now re-agree ',
                            'to the KBase usage policies'
                        ]),
                        p([
                            'You may need to check the box next to each policy in order to agree. ',
                            'After this the "Continue to KBase account" button will become enabled. ',
                            'Simply click this button and you will be signed-in to KBase'
                        ]),
                        p(
                            img({
                                src: Plugin.plugin.fullPath + '/images/kbase-legacy-sign-in-marked.png',
                                style: {
                                    display: 'inline-block',
                                    width: '100%',
                                    border: '1px silver solid',
                                    padding: '4px'
                                }
                            })
                        ),
                        p([
                            'Don\'t worry, the next time you sign in to KBase should be much easier. Here are some tips:',
                            ul([
                                li('If you stay signed in to Globus, you will not be prompted by Globus until that signin expires'),
                                li([
                                    'Use your brower\'s login remember feature so you don\'t need to enter your Globus username ',
                                    'and password each time'
                                ]),
                                li([
                                    'Link a Google account to KBase, or an Organizational Account to Globus'
                                ])
                            ])
                        ])
                    ])
                ])
            ]);
            container.innerHTML = content;
            events.attachEvents();
        }

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        function start(params) {
            return Promise.try(function () {
                nextRequest = params.nextRequest;
                render();
            });
        }

        function stop() {
            return Promise.try(function () {});
        }

        function detach() {
            if (hostNode && container) {
                hostNode.remove(container);
            }
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