define([
    'bluebird',
    'kb_common/html',
    'kb_common/domEvent',
    'kb_common/bootstrapUtils',
    'kb_plugin_auth2-client',
    'bootstrap'
], function (
    Promise,
    html,
    DomEvents,
    BS,
    Plugin
) {
    var t = html.tag,
        div = t('div'),
        img = t('img'),
        button = t('button');


    // function doLogin(providerId, state) {

    //     runtime.service('session').loginStart({
    //         // TODO: this should be either the redirect url passed in 
    //         // or the dashboard.
    //         // We just let the login page do this. When the login page is 
    //         // entered with a valid token, redirect to the nextrequest,
    //         // and if that is empty, the dashboard.
    //         state: state,
    //         provider: providerId,
    //         stayLoggedIn: false
    //     });
    // }

    function buildProviderLabel() {
        return div({
            style: {
                display: 'inline',
                whiteSPace: 'nowrap',
                height: '54px'
            }
        }, [
            div({
                dataBind: {
                    text: 'label'
                },
                style: {
                    display: 'inline-block',
                    // width: '44px',
                    height: '24px',
                    marginRight: '4px'
                }
            }),
            img({
                dataBind: {
                    attr: {
                        src: 'logoImage'
                    }
                },
                // src: Plugin.plugin.fullPath + '/providers/' + provider.id.toLowerCase() + '_logo.png',
                style: {
                    height: '24px'
                }
            })
        ]);
    }

    // context: provider, state
    function buildLoginButton() {
        return button({
            class: 'btn btn-default',
            style: {
                margin: '8px 0',
                height: '44px',
                fontSize: '110%',
                fontWeight: 'bold'
            },
            dataBind: {
                click: '$parent.doProviderSignin'
            }
            // id: events.addEvent('click', function() {
            //     runtime.service('session').getClient().setLastProvider(provider.id);
            //     doLogin(provider.id, state);
            // })
        }, buildProviderLabel());
    }

    function parsePolicyAgreements(policyIds) {
        return policyIds.map(function (policyId) {
            var id = policyId.id.split('.');
            return {
                id: id[0],
                version: parseInt(id[1], 10),
                date: new Date(policyId.agreedon)
            };
        });
    }

    function buildTable(arg) {
        var t = html.tag,
            table = t('table'),
            thead = t('thead'),
            tbody = t('tbody'),
            tr = t('tr'),
            th = t('th'),
            td = t('td'),
            id, attribs;
        arg = arg || {};
        if (arg.id) {
            id = arg.id;
        } else {
            id = html.genId();
            arg.generated = { id: id };
        }
        attribs = { id: id };
        if (arg.class) {
            attribs.class = arg.class;
        } else if (arg.classes) {
            attribs.class = arg.classes.join(' ');
        }
        return table(attribs, [
            thead(tr(arg.columns.map(function (x) {
                return th(x.label);
            }))),
            tbody(arg.rows.map(function (row) {
                return tr(row.map(function (x, index) {
                    var col = arg.columns[index];
                    var value = x;
                    if (col.format) {
                        try {
                            value = col.format(x);
                        } catch (ex) {
                            value = 'er: ' + ex.message;
                        }
                    }
                    return td(value);
                }));
            }))
        ]);
    }



    return {
        buildLoginButton: buildLoginButton,
        parsePolicyAgreements: parsePolicyAgreements,
        buildTable: buildTable
    };



});