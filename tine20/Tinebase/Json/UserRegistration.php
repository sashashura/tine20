<?php
/**
 * Tine 2.0
 * 
 * @package     Tinebase
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @version     $Id$
 * 
 */

/**
 * Json Container class
 * 
 * - handles the ajax requests and the json data
 * - calls the functions of class Tinebase_User_Registration
 * 
 * @package     Tinebase
 */
class Tinebase_Json_UserRegistration
{
			
	/**
	 * suggests a username
	 *
	 * @param 	array $regData		json data from registration frontend
	 * @return 	string
	 * 
	 * @todo 	add other methods for building username (move to js later on)
	 * 			get method from config (email, firstname+lastname, other strings)?
	 * @todo 	replace special chars in username
	 */
	public function suggestUsername ( $regData ) 
	{
		$regDataArray = Zend_Json_Decoder::decode($regData);

        // build username from firstname (first char) & lastname
		$firstname = ( isset($regDataArray['accountFirstName']) ) ? substr($regDataArray['accountFirstName'], 0, 1) : '';
        $lastname = ( isset($regDataArray['accountLastName']) ) ? $regDataArray['accountLastName'] : '';		
		$suggestedUsername = $firstname.$lastname;
		
		return $suggestedUsername;
	}

	/**
	 * checks if username is unique
	 *
	 * @param 	string $username
	 * @return 	bool
	 * 
	 */
	public function checkUniqueUsername ( $username ) 
	{
		$username = Zend_Json_Decoder::decode($username);
		
		return Tinebase_User_Registration::getInstance()->checkUniqueUsername($username);
	}

	/**
	 * registers a new user
	 *
	 * @param 	array $regData 		json data from registration frontend
	 * @return 	bool
	 * 
	 */
	public function registerUser ( $regData ) 
	{

		$regData = Zend_Json_Decoder::decode($regData);
		
		return Tinebase_User_Registration::getInstance()->registerUser($regData);
	}	

}
