/* 
 * Tine 2.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2009 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id$
 */
 
Ext.ns('Tine.Calendar');

/**
 * @namespace Tine.Calendar
 * @class Tine.Calendar.ColorManager
 * @extends Ext.util.Observable
 * Colormanager for Coloring Calendar Events <br>
 * 
 * @constructor
 * Creates a new color manager
 * @param {Object} config
 * 
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id$
 */
Tine.Calendar.ColorManager = function(config) {
    Ext.apply(this, config);
    
    this.colorMap = {};
    
    // allthough we don't extend component as we have nothing to render, we borrow quite some stuff from it
    this.id = this.stateId;
    Ext.ComponentMgr.register(this);
    
    this.addEvents(
        /**
         * @event beforestaterestore
         * Fires before the state of this colormanager is restored. Return false to stop the restore.
         * @param {Tine.Calendar.ColorManager} this
         * @param {Object} state The hash of state values
         */
        'beforestaterestore',
        /**
         * @event staterestore
         * Fires after the state of tthis colormanager is restored.
         * @param {Tine.Calendar.ColorManager} this
         * @param {Object} state The hash of state values
         */
        'staterestore',
        /**
         * @event beforestatesave
         * Fires before the state of this colormanager is saved to the configured state provider. Return false to stop the save.
         * @param {Tine.Calendar.ColorManager} this
         * @param {Object} state The hash of state values
         */
        'beforestatesave',
        /**
         * @event statesave
         * Fires after the state of this colormanager is saved to the configured state provider.
         * @param {Tine.Calendar.ColorManager} this
         * @param {Object} state The hash of state values
         */
        'statesave'
    );
    
    if (this.stateful) {
        this.initState();
    }
   
};

Ext.extend(Tine.Calendar.ColorManager, Ext.util.Observable, {
    /**
     * @cfg {String} schemaName
     * Name of color schema to use
     */
    schemaName: 'standard',
    
    /**
     * @cfg {String} stateId
     * State id to use
     */
    stateId: 'cal-color-mgr-containers',
    
    /**
     * @cfg {Boolean} stateful
     * Is this component statefull?
     */
    stateful: true,
    
    /**
     * current color map 
     * 
     * @type Object 
     * @propertycolorMap
     */
    colorMap: null,
    
    /**
     * pointer to current color set in color schema 
     * 
     * @type Number 
     * @property colorSchemataPointer
     */
    colorSchemataPointer: 0,
    
    /**
     * gray color set
     * 
     * @type Object 
     * @property gray
     */
    gray: {color: '#808080', light: '#EDEDED', text: '#808080', lightText: '#FFFFFF'},
    
    /**
     * color palette from Ext.ColorPalette
     * 
     * @type Array
     * @property colorPalette
     */
    colorPalette: Ext.ColorPalette.prototype.colors,
    
    /**
     * color sets for colors from colorPalette
     * 
     * @type Array 
     * @property colorSchemata
     */
    colorSchemata : [
        /*"000000" :*/ {},
        /*"993300" :*/ {},
        /*"333300" :*/ {}, 
        /*"003300" :*/ {},
        /*"003366" :*/ {},
        /*"000080" :*/ {},
        /*"333399" :*/ {},
        /*"333333" :*/ {},
        /*"800000" :*/ {},
        /*"FF6600" :*/ {color: '#FF7200', light: '#FFB87F', text: '#FFFFFF', lightText: '#FFFFFF'}, // orange
        /*"808000" :*/ {},
        /*"008000" :*/ {},
        /*"008080" :*/ {},
        /*"0000FF" :*/ {},
        /*"666699" :*/ {},
        /*"808080" :*/ {},
        /*"FF0000" :*/ {color: '#FD0000', light: '#FE7F7F', text: '#FFFFFF', lightText: '#FFFFFF'}, // red
        /*"FF9900" :*/ {},
        /*"99CC00" :*/ {},
        /*"339966" :*/ {},
        /*"33CCCC" :*/ {},
        /*"3366FF" :*/ {color: '#0050D9', light: '#7FA7EC', text: '#FFFFFF', lightText: '#FFFFFF'}, // blue
        /*"800080" :*/ {},
        /*"969696" :*/ {},
        /*"FF00FF" :*/ {color: '#C302B1', light: '#E080D7', text: '#FFFFFF', lightText: '#FFFFFF'}, // purple
        /*"FFCC00" :*/ {},
        /*"FFFF00" :*/ {},
        /*"00FF00" :*/ {color: '#00A700', light: '#7FD27F', text: '#FFFFFF', lightText: '#FFFFFF'}, // green
        /*"00FFFF" :*/ {},
        /*"00CCFF" :*/ {},
        /*"993366" :*/ {color: '#5123A5', light: '#A790D1', text: '#FFFFFF', lightText: '#FFFFFF'}, // violet
        /*"C0C0C0" :*/ {},
        /*"FF99CC" :*/ {},
        /*"FFCC99" :*/ {},
        /*"FFFF99" :*/ {},
        /*"CCFFCC" :*/ {},
        /*"CCFFFF" :*/ {},
        /*"99CCFF" :*/ {},
        /*"CC99FF" :*/ {},
        /*"FFFFFF" :*/ {}
    ],
    
    /**
     * hack for container only support
     * 
     * @param {Tine.Calendar.Model.Evnet} event
     * @return {Object} colorset
     */
    getColor: function(event) {
        var container = null;
        
        if (typeof event.get != 'function') {
            // tree comes with containers only
            container = event;
        } else {
            container = event.get('container_id');
            if (! container || !container.type || container.type != 'shared') {
                container = event.getDisplayContainer();
            }
        }
        
        var container_id = container.id ? container.id : container;
        return container ? this.getColorSchema(container_id) : this.gray;
    },
    
    /**
     * gets the next free color set
     * 
     * @param {String} item e.g. a calendar id
     * @return {Object} colorset
     */
    getColorSchema: function(item) {
        if (this.colorMap[item]) {
            return this.colorSchemata[this.colorMap[item]];
        }
        
        // find a 'free' schema
        for (var i=1,cpi; i<=this.colorPalette.length; i++) {
            // color palette index
            cpi = (i+this.colorSchemataPointer) % this.colorPalette.length;
            if (this.colorSchemata[cpi].color && !this.inUse(this.colorPalette[cpi])) {
                this.colorSchemataPointer = cpi;
                this.colorMap[item] = this.colorSchemataPointer;
                this.saveState();
                //console.log('assigned color ' + this.colorMap[item] + ' to item ' + item);
                
                return this.colorSchemata[this.colorSchemataPointer];
            }
        }

        // no more free colors ;-(
        this.colorSchemataPointer++;
        this.colorMap[item] = this.colorSchemataPointer;
        return this.colorSchemata[this.colorSchemataPointer];
    },
    
    /**
     * checkes if given color is already in use
     * 
     * @param {String} color
     * @return {Boolean}
     */
    inUse: function(color) {
        for (var item in this.colorMap) {
            if (this.colorMap.hasOwnProperty(item) && this.colorMap[item] == color) {
                //console.log(color + ' is already used');
                return true;
            }
        }
        //console.log(color + 'is not in use yet');
        return false;
    },
    
    /* state handling */
    initState:       Ext.Component.prototype.initState,
    getStateId:      Ext.Component.prototype.getStateId,
    //initStateEvents: Ext.Component.prototype.initState,
    applyState:      Ext.Component.prototype.applyState,
    saveState:       Ext.Component.prototype.saveState,
    getState:        function() {
        return {
            colorMap            : this.colorMap,
            colorSchemataPointer: this.colorSchemataPointer
        };
    }
    
    
    
});
