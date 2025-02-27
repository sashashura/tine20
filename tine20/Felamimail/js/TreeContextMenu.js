/*
 * Tine 2.0
 * 
 * @package     Felamimail
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.namespace('Tine.Felamimail');

/**
 * get felamimail tree panel context menus
 * this is used in Tine.Felamimail.TreePanel (with createDelegate)
 * 
 * TODO use Ext.apply to get this
 */
Tine.Felamimail.setTreeContextMenus = function() {
    
    // define additional actions
    const emptyFolderAction = {
        text: this.app.i18n._('Empty Folder'),
        iconCls: 'action_folder_emptytrash',
        scope: this,
        handler: function() {
            this.ctxNode.getUI().addClass("x-tree-node-loading");
            var folderId = this.ctxNode.attributes.folder_id;
            Ext.Ajax.request({
                params: {
                    method: 'Felamimail.emptyFolder',
                    folderId: folderId
                },
                scope: this,
                success: function(result, request){
                    var selectedNode = this.getSelectionModel().getSelectedNode(),
                        isSelectedNode = (selectedNode && this.ctxNode.id == selectedNode.id);
                        
                    if (isSelectedNode) {
                        var folder = Tine.Felamimail.folderBackend.recordReader(result);
                        this.app.getFolderStore().updateFolder(folder);
                    } else {
                        var folder = this.app.getFolderStore().getById(folderId);
                        folder.set('cache_unreadcount', 0);
                    }
                    this.ctxNode.getUI().removeClass("x-tree-node-loading");
                    this.ctxNode.removeAll();
                },
                failure: function() {
                    this.ctxNode.getUI().removeClass("x-tree-node-loading");
                },
                timeout: 120000 // 2 minutes
            });
        }
    };
    
    // we need this for adding folders to account (root level)
    const addFolderAction = {
        text: this.app.i18n._('Add Folder'),
        iconCls: 'action_add',
        scope: this,
        // disabled: true,
        handler: function() {
            Ext.MessageBox.prompt(String.format(i18n._('New {0}'), this.app.i18n._('Folder')), String.format(i18n._('Please enter the name of the new {0}:'), this.app.i18n._('Folder')), async (btn, folderName) => {
                if( this.ctxNode && btn === 'ok') {
                    if (! folderName) {
                        return Ext.Msg.alert(String.format(i18n._('No {0} added'), this.app.i18n._('Folder')), String.format(i18n._('You have to supply a {0} name!'), this.app.i18n._('Folder')));
                    }
                    Ext.MessageBox.wait(i18n._('Please wait'), String.format(i18n._('Creating {0}...' ), this.app.i18n._('Folder')));
                    this.fireEvent('containeradd', await Tine.Felamimail.addFolder(folderName, this.ctxNode.attributes.globalname, this.ctxNode.attributes.account_id), this.ctxNode);
                    Ext.MessageBox.hide();
                }
            }, this);
        }
    };

    const editAccountAction = {
        text: this.app.i18n._('Edit Account'),
        iconCls: 'FelamimailIconCls',
        scope: this,
        disabled: false,
        handler: function() {
            var record = this.accountStore.getById(this.ctxNode.attributes.account_id);
            var popupWindow = Tine.Felamimail.AccountEditDialog.openWindow({
                record: record,
                listeners: {
                    'update': _.bind(function(record) {
                        var account = new Tine.Felamimail.Model.Account(Ext.util.JSON.decode(record)),
                            selectedNode = this.getSelectionModel().getSelectedNode();
                        
                        // update tree node + store
                        this.ctxNode.setText(account.get('name'));
                                                
                        // reload tree node + remove all folders of this account from store ?
                        this.folderStore.resetQueryAndRemoveRecords('parent_path', '/' + this.ctxNode.attributes.account_id);
                        this.ctxNode.reload(_.bind(function(callback) {
                            let nodeToSelct = this.getNodeById(_.get(selectedNode, 'id'), '');
                            if (nodeToSelct) {
                                this.getSelectionModel().select(nodeToSelct);
                            }
                        }, this));
                    }, this)
                }
            });
        }
    };

    const editVacationAction = {
        text: this.app.i18n._('Edit Vacation Message'),
        iconCls: 'action_email_replyAll',
        scope: this,
        handler: function() {
            var accountId = this.ctxNode.attributes.account_id;
            var account = this.accountStore.getById(accountId);
            var record = new Tine.Felamimail.Model.Vacation({id: accountId}, accountId);
            
            var popupWindow = Tine.Felamimail.sieve.VacationEditDialog.openWindow({
                account: account,
                record: record
            });
        }
    };

    const editRulesAction = {
        text: this.app.i18n._('Edit Filter Rules'),
        iconCls: 'action_email_forward',
        scope: this,
        handler: function() {
            var accountId = this.ctxNode.attributes.account_id;
            var account = this.accountStore.getById(accountId);
            
            var popupWindow = Tine.Felamimail.sieve.RulesDialog.openWindow({
                account: account
            });
        }
    };

    const editNotificationAction = {
        text: this.app.i18n._('Notifications'),
        iconCls: 'felamimail-action-sieve-notification',
        scope: this,
        handler: function() {
            var accountId = this.ctxNode.attributes.account_id;
            var account = this.accountStore.getById(accountId);

            if (account.get('type') == 'system') {
                var popupWindow = Tine.Felamimail.sieve.NotificationDialog.openWindow({
                    record: account
                });
            }
        }
    };

    const markFolderSeenAction = {
        text: this.app.i18n._('Mark Folder as read'),
        iconCls: 'action_mark_read',
        scope: this,
        handler: function() {
            if (this.ctxNode) {
                var folderId = this.ctxNode.id,
                    filter = [{
                        field: 'folder_id',
                        operator: 'equals',
                        value: folderId
                    }, {
                        field: 'flags',
                        operator: 'notin',
                        value: ['\\Seen']
                    }
                ];
                
                var selectedNode = this.getSelectionModel().getSelectedNode(),
                    isSelectedNode = (selectedNode && this.ctxNode.id == selectedNode.id);
                
                Tine.Felamimail.messageBackend.addFlags(filter, '\\Seen', {
                    callback: function() {
                        this.app = Tine.Tinebase.appMgr.get('Felamimail');
                        var folder = this.app.getFolderStore().getById(folderId);
                        folder.set('cache_unreadcount', 0);
                        if (isSelectedNode) {
                            this.app.getMainScreen().getCenterPanel().loadGridData({
                                removeStrategy: 'keepBuffered'
                            });
                        }
                    }
                });
            }
        }
    };

    const updateFolderCacheAction = {
        text: this.app.i18n._('Update Folder List'),
        iconCls: 'action_update_cache',
        scope: this,
        handler: function() {
            if (this.ctxNode) {
                this.getSelectionModel().clearSelections();
                
                var folder = this.app.getFolderStore().getById(this.ctxNode.id),
                    account = folder ? this.app.getAccountStore().getById(folder.get('account_id')) :
                                       this.app.getAccountStore().getById(this.ctxNode.id);
                this.ctxNode.getUI().addClass("x-tree-node-loading");
                // call update folder cache
                Ext.Ajax.request({
                    params: {
                        method: 'Felamimail.updateFolderCache',
                        accountId: account.id,
                        folderName: folder ? folder.get('globalname') : ''
                    },
                    scope: this,
                    timeout: 150000, // 3 minutes
                    success: function(result, request){
                        this.ctxNode.getUI().removeClass("x-tree-node-loading");
                        // clear query to query server again and reload subfolders
                        this.folderStore.resetQueryAndRemoveRecords('parent_path', (folder ? folder.get('path') : '/') + account.id);
                        this.ctxNode.reload(function(callback) {
                            this.selectInbox(account);
                        }, this);
                    },
                    failure: function(exception) {
                        this.ctxNode.getUI().removeClass("x-tree-node-loading");
                        Tine.Felamimail.folderBackend.handleRequestException(exception);
                    }
                });
            }
        }
    };

    const approveMigrationAction = {
        text: this.app.i18n._('Approve Migration'),
        iconCls: 'action_approve_migration',
        scope: this,
        handler: function() {
            if (this.ctxNode) {
                let accountId = this.ctxNode.attributes.account_id;
                let account = this.app.getAccountStore().getById(accountId);
                this.ctxNode.getUI().addClass("x-tree-node-loading");
                Ext.Ajax.request({
                    params: {
                        method: 'Felamimail.approveAccountMigration',
                        accountId: accountId
                    },
                    scope: this,
                    success: function(result, request){
                        this.ctxNode.getUI().removeClass("x-tree-node-loading");
                        account.set('migration_approved', 1);
                    },
                    failure: function(exception) {
                        this.ctxNode.getUI().removeClass("x-tree-node-loading");
                        Tine.Felamimail.folderBackend.handleRequestException(exception);
                    }
                });
            }
        }
    };

    const moveFolderAction = {
        text: this.app.i18n._('Move Folder'),
        iconCls: 'action_move',
        scope: this,
        handler: function() {
            if (this.ctxNode) {
                this.getSelectionModel().clearSelections();
                var folder = this.app.getFolderStore().getById(this.ctxNode.id),
                    account = folder ? this.app.getAccountStore().getById(folder.get('account_id')) :
                        this.app.getAccountStore().getById(this.ctxNode.id);

                const selectPanel = Tine.Felamimail.FolderSelectPanel.openWindow({
                    account: account,
                    // allAccounts: this.allAccounts,
                    listeners: {
                        scope: this,
                        folderselect(newParentNode) {
                            selectPanel.close();
                            newParentNode = this.getNodeById(newParentNode.id); // switch context
                            // const newParentFolder = this.app.getFolderStore().getById(newParentNode.id);
                            const parentGlobalname = newParentNode.attributes.globalname;

                            if (parentGlobalname.replace(new RegExp(`^${folder.get('globalname').replace('.', '\.')}`), '') !== parentGlobalname) {
                                return Ext.Msg.alert(this.app.i18n._('Invalid Selection'), this.app.i18n._('You cannot move the folder to an own sub folder!'));
                            }

                            const newGlobalName = _.compact([parentGlobalname, folder.get('localname')]).join(account.get('delimiter'));

                            this.ctxNode.getUI().addClass("x-tree-node-loading");
                            newParentNode.getUI().addClass("x-tree-node-loading");

                            Ext.Ajax.request({
                                params: {
                                    method: 'Felamimail.moveFolder',
                                    accountId: account.id,
                                    oldGlobalName: folder.get('globalname'),
                                    newGlobalName
                                },
                                scope: this,
                                success: function(result, request) {
                                    const folderStore = newParentNode.ownerTree.folderStore;

                                    newParentNode.appendChild(newParentNode.ownerTree.loader.createNode(JSON.parse(result.responseText)));
                                    this.ctxNode.remove();
                                    folderStore.remove(folderStore.getById(this.ctxNode.id));
                                    const newRecord = Tine.Felamimail.folderBackend.recordReader({responseText: result.responseText});
                                    folderStore.getById(newParentNode.id)?.set('has_children', true);
                                    folderStore.add([newRecord]);
                                    newParentNode.ownerTree.initNewFolderNode(newRecord);

                                    newParentNode.getUI().removeClass("x-tree-node-loading");
                                    newParentNode.expand(() => {
                                        this.getNodeById(this.ctxNode.id).select();
                                    });
                                },
                                failure: function(exception) {
                                    this.ctxNode.getUI().removeClass("x-tree-node-loading");
                                    newParentNode.getUI().removeClass("x-tree-node-loading");
                                    Tine.Felamimail.folderBackend.handleRequestException(exception);
                                }
                            });
                        }
                    }
                });
            }
        }
    };

    // mutual config options
    const config = {
        nodeName: this.app.i18n.n_('Folder', 'Folders', 1),
        scope: this,
        backend: 'Felamimail',
        backendModel: 'Folder'
    };
    
    // system folder ctx menu
    config.actions = [markFolderSeenAction, addFolderAction];
    this.contextMenuSystemFolder = Tine.widgets.tree.ContextMenu.getMenu(config);
    
    // user folder ctx menu
    config.actions = [markFolderSeenAction, addFolderAction, moveFolderAction, 'rename', 'delete'];
    this.contextMenuUserFolder = Tine.widgets.tree.ContextMenu.getMenu(config);
    
    // trash ctx menu
    config.actions = [markFolderSeenAction, addFolderAction, emptyFolderAction];
    this.contextMenuTrash = Tine.widgets.tree.ContextMenu.getMenu(config);
    
    // account ctx menu
    let accountActions = [
        addFolderAction,
        updateFolderCacheAction,
        editVacationAction,
        editRulesAction,
        editNotificationAction,
        editAccountAction,
        'delete'
    ];
    if (Tine.Tinebase.registry.get('manageImapEmailUser')
        && Tine.Tinebase.appMgr.get('Felamimail').featureEnabled('accountMigration')
    ) {
        accountActions.push(approveMigrationAction);
    }
    this.contextMenuAccount = Tine.widgets.tree.ContextMenu.getMenu({
        nodeName: this.app.i18n.n_('Account', 'Accounts', 1),
        actions: accountActions,
        scope: this,
        backend: 'Felamimail',
        backendModel: 'Account'
    });
    
    // context menu for unselectable folders (like public/shared namespace)
    config.actions = [addFolderAction];
    this.unselectableFolder = Tine.widgets.tree.ContextMenu.getMenu(config);
};
