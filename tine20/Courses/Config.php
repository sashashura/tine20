<?php
/**
 * @package     Courses
 * @subpackage  Config
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2012 Metaways Infosystems GmbH (http://www.metaways.de)
 */

/**
 * Courses config class
 * 
 * @package     Courses
 * @subpackage  Config
 * 
 * @todo add config settings/properties here
 */
class Courses_Config extends Tinebase_Config_Abstract
{
    /**
    * fields for internet access
    *
    * @var string
    */
    const INTERNET_ACCESS = 'internetAccess';
    
    /**
    * internet access group id
    *
    * @var string
    */
    const INTERNET_ACCESS_GROUP_ON = 'internet_group';
    
    /**
    * internet access filtered group id
    *
    * @var string
    */
    const INTERNET_ACCESS_GROUP_FILTERED = 'internet_group_filtered';
    
    /**
    * students group id
    *
    * @var string
    */
    const STUDENTS_GROUP = 'students_group';
    
    /**
    * students import definition
    *
    * @var string
    */
    const STUDENTS_IMPORT_DEFINITION = 'students_import_definition';
    
    /**
     * (non-PHPdoc)
     * @see tine20/Tinebase/Config/Definition::$_properties
     */
    protected static $_properties = array(
        self::INTERNET_ACCESS => array(
        //_('Internet Access')
            'label'                 => 'Internet Access',
        //_('Internet access options.')
            'description'           => 'Internet access options.',
            'type'                  => 'keyFieldConfig',
            'options'               => array('recordModel' => 'Tinebase_Config_KeyFieldRecord'),
            'clientRegistryInclude' => TRUE,
        ),
        self::INTERNET_ACCESS_GROUP_ON => array(
        //_('Internet Access Group (ON)')
            'label'                 => 'Internet Access Group (ON)',
        //_('Internet Access Group (ON)')
            'description'           => 'Internet Access Group (ON)',
            'type'                  => 'string',
            'clientRegistryInclude' => TRUE,
        ),
        self::INTERNET_ACCESS_GROUP_FILTERED => array(
        //_('Internet Access Group (FILTERED)')
            'label'                 => 'Internet Access Group (FILTERED)',
        //_('Internet Access Group (FILTERED)')
            'description'           => 'Internet Access Group (FILTERED)',
            'type'                  => 'string',
            'clientRegistryInclude' => TRUE,
        ),
        self::STUDENTS_GROUP => array(
        //_('Students Group')
            'label'                 => 'Students Group',
        //_('Students Group')
            'description'           => 'Students Group',
            'type'                  => 'string',
            'clientRegistryInclude' => TRUE,
        ),
        self::STUDENTS_IMPORT_DEFINITION => array(
        //_('Students Import Definition')
            'label'                 => 'Students Import Definition',
        //_('Students Import Definition')
            'description'           => 'Students Import Definition',
            'type'                  => 'string',
            'clientRegistryInclude' => TRUE,
        ),
    );
    
    /**
     * (non-PHPdoc)
     * @see tine20/Tinebase/Config/Abstract::$_appName
     */
    protected $_appName = 'Courses';
    
    /**
     * holds the instance of the singleton
     *
     * @var Tinebase_Config
     */
    private static $_instance = NULL;
    
    /**
     * the constructor
     *
     * don't use the constructor. use the singleton 
     */    
    private function __construct() {}
    
    /**
     * the constructor
     *
     * don't use the constructor. use the singleton 
     */    
    private function __clone() {}
    
    /**
     * Returns instance of Tinebase_Config
     *
     * @return Tinebase_Config
     */
    public static function getInstance() 
    {
        if (self::$_instance === NULL) {
            self::$_instance = new self();
        }
        
        return self::$_instance;
    }
    
    /**
     * (non-PHPdoc)
     * @see tine20/Tinebase/Config/Abstract::getProperties()
     */
    public static function getProperties()
    {
        return self::$_properties;
    }
}
