
EGWNameSpace.Felamimail=function(){var showGrid=function(_layout){var center=_layout.getRegion('center',false);var bodyTag=Ext.Element.get(document.body);var gridDivTag=bodyTag.createChild({tag:'div',id:'gridAddressbook',cls:'x-layout-inactive-content'});var ds=new Ext.data.JsonStore({url:'index.php',baseParams:{method:'Felamimail.getData'},root:'results',totalProperty:'totalcount',id:'message_id',fields:[{name:'message_id'},{name:'model'},{name:'description'},{name:'config_id'},{name:'setting_id'},{name:'software_id'}],remoteSort:true});ds.setDefaultSort('message_id','desc');ds.load();var cm=new Ext.grid.ColumnModel([{resizable:true,id:'userid',header:"ID",dataIndex:'userid',width:30},{resizable:true,id:'lastname',header:"lastname",dataIndex:'lastname',},{resizable:true,id:'firstname',header:"firstname",dataIndex:'firstname',hidden:true},{resizable:true,header:"street",dataIndex:'street',},{resizable:true,id:'city',header:"zip/city",dataIndex:'city',},{resizable:true,header:"birthday",dataIndex:'birthday',},{resizable:true,id:'addressbook',header:"addressbook",dataIndex:'addressbook',}]);cm.defaultSortable=true;var grid=new Ext.grid.Grid(outerDivTag,{ds:ds,cm:cm,autoSizeColumns:false,selModel:new Ext.grid.RowSelectionModel({multiSelect:true}),enableColLock:false,loadMask:true,enableDragDrop:true,ddGroup:'TreeDD',autoExpandColumn:'n_given'});grid.render();var gridHeader=grid.getView().getHeaderPanel(true);var pagingHeader=new Ext.PagingToolbar(gridHeader,ds,{pageSize:50,displayInfo:true,displayMsg:'Displaying contacts {0} - {1} of {2}',emptyMsg:"No contacts to display"});pagingHeader.insertButton(0,{id:'addbtn',cls:'x-btn-icon',icon:'images/oxygen/16x16/actions/edit-add.png',tooltip:'add new contact',onClick:_openDialog});pagingHeader.insertButton(1,{id:'editbtn',cls:'x-btn-icon',icon:'images/oxygen/16x16/actions/edit.png',tooltip:'edit current contact',disabled:true,onClick:_openDialog});pagingHeader.insertButton(2,{id:'deletebtn',cls:'x-btn-icon',icon:'images/oxygen/16x16/actions/edit-delete.png',tooltip:'delete selected contacts',disabled:true,onClick:_openDialog});pagingHeader.insertButton(3,new Ext.Toolbar.Separator());center.add(new Ext.GridPanel(grid));grid.on('rowclick',function(gridP,rowIndexP,eventP){var rowCount=grid.getSelectionModel().getCount();var btns=pagingHeader.items.map;if(rowCount<1){btns.editbtn.disable();btns.deletebtn.disable();}else if(rowCount==1){btns.editbtn.enable();btns.deletebtn.enable();}else{btns.editbtn.disable();btns.deletebtn.enable();}});grid.on('rowdblclick',function(gridPar,rowIndexPar,ePar){var record=gridPar.getDataSource().getAt(rowIndexPar);console.log('id: '+record.data.contact_id);try{_openDialog(record.data.contact_id);}catch(e){}});var grid=new Ext.grid.Grid(gridDivTag,{ds:ds,cm:cm,autoSizeColumns:false,selModel:new Ext.grid.RowSelectionModel({multiSelect:true}),enableColLock:false,loadMask:true,enableDragDrop:true,ddGroup:'TreeDD',autoExpandColumn:'lastname'});center.remove(0);grid.render();center.add(new Ext.GridPanel(grid));}
return{show:function(_layout){showGrid(_layout);}}}();