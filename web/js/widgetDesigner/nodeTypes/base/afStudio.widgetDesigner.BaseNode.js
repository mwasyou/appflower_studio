/**
 * BaseNode is common class for all nodes displayed in WI tree
 * It can contain nested elements which are some specific NodeTypes but even childs are based on BaseNode
 * It can also contain parameters which are accessed through Properties Grid displayed under WI tree
 *
 * This class is abstract class - you should not use it. Instead use CollectionNode or ContainerNode class
 **/
Ext.namespace('afStudio.widgetDesigner');

N = afStudio.widgetDesigner;

/**
 * BaseNode is common class for all other WI node types
 * @param {Object} 
 */
N.BaseNode = function(config){
    if (!config) {
        config = this.getNodeConfig();
    }
    this.createContextMenu();
    afStudio.widgetDesigner.BaseNode.superclass.constructor.apply(this, [config]);
    this._initEvents();
    this.createProperties();
    this.addRequiredChilds();
};
Ext.extend(N.BaseNode, Ext.tree.TreeNode, {
    /**
     * When concrete node sets here name of one of its properties then each time
     * that property changes - node text label is updated accordingly
     */
    updateNodeNameFromPropertyId: false,
    /**
     * This method should create an instance of Ext.menu.Menu class and place it in this.contextMenu variable
     * If defined - context menu will be displayed when given node is clicked with right mouse button
     */
    createContextMenu: Ext.emptyFn,
    containsIParams: false,
    /**
     * This method should initialize this.properties with records for GridProperty
     */
    createProperties: function(){return []},
    /**
     * Returns fields for properties grid
     *
     * @return array
     */
	getProperties: function(){
        var properties = [];
        for(i in this.properties) {
            properties.push(this.properties[i]);
        }

        return properties;
	},
    getProperty: function(id){
        return this.properties[id];
    },
    addProperty: function(property){
        if (!this.properties) {
            this.properties = {};
        }

        property.WITreeNode = this;
        this.properties[property.id] = property;
        if (property.get('oneOfIParam')){
            this.containsIParams = true;
        }
    },
    configureFor: function(widgetData){
        for(id in widgetData){
            var value = widgetData[id];
            this.configureForValue(id, value);
        }
    },
    configureForValue: function(id, value){
        if (this.properties && this.properties[id]) {
            var property = this.getProperty(id);
            property.set('value',value);
            this.propertyChanged(property);
        } else if (
                this.containsIParams &&
                id == 'i:params' &&
                value['i:param']
            ){
            if (!Ext.isArray(value['i:param'])) {
                var iParams = [value['i:param']];
            } else {
                var iParams = value['i:param'];
            }
            for(var i=0; i<iParams.length;i++) {
                this.configureForValue(iParams[i]['name'], iParams[i]['_content']);
            }
        } else {
            var child = this.findChild('id', id);
            if (child){
                child.configureFor(value);
            }
        }
    },
    propertyChanged: function(property) {
        if (this.updateNodeNameFromPropertyId){
            if (property && property.id && property.id == this.updateNodeNameFromPropertyId) {
                this.setText(property.get('value'));
            }
        }
    },
    dumpDataForWidgetDefinition: function(){

        var childsData = this.dumpChildsData();
        var propertiesData = this.dumpPropertiesData();

        //my array merge :)
        for(key in propertiesData) {
            if (propertiesData[key] != '') {
                childsData[key] = propertiesData[key];
            }
        }

        return childsData;
    },
    dumpChildsData: function(){
        var data = {};
        this.eachChild(function(childNode){
            data[childNode.id] = childNode.dumpDataForWidgetDefinition();
        });
        return data;
    },
    dumpPropertiesData: function(){
        var data = {};
        var iParams = [];
        for(i in this.properties){
            var property = this.properties[i];
            var propertyValue = property.get('value');
            // for boolean values we want them to travel as 'true' and 'false' strings
            if (propertyValue === false) {
                propertyValue = 'false';
            } else if (propertyValue === true){
                propertyValue = 'truee';
            }
            if (property.get('oneOfIParam')) {
                iParams.push({name: property.id, '_content': propertyValue});
            } else {
                data[property.id] = propertyValue;
            }
        }
        if (iParams.length > 0){
            data['i:params'] = {'i:param': iParams};
        }
        return data;
    },
	
    /**
     * Returns node configuration, something like: {text: 'sadads', iconCls: 'icon'}
     */
    getNodeConfig: Ext.emptyFn,
    _initEvents: function(){
        if (this.contextMenuHandler) {
            this.on('contextmenu', this.contextMenuHandler);
        }
    },
    getPropertyRecordCfg: Ext.emptyFn,
    /**
     * If given node should have some childs when builded - this method should do this
     */
    addRequiredChilds: Ext.emptyFn
});