<?php declare(strict_types=1);
/**
 * MAIN controller for SSO application
 *
 * @package     SSO
 * @subpackage  Controller
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Paul Mehrer <p.mehrer@metaways.de>
 * @copyright   Copyright (c) 2021 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/**
 * 
 * @package     SSO
 * @subpackage  Controller
 */
class SSO_Controller extends Tinebase_Controller_Event
{
    use Tinebase_Controller_SingletonTrait;

    public const WEBFINGER_REL = 'http://openid.net/specs/connect/1.0/issuer';

    protected $_applicationName = SSO_Config::APP_NAME;

    public static function addFastRoutes(
        /** @noinspection PhpUnusedParameterInspection */
        \FastRoute\RouteCollector $r
    ) {
        $r->addGroup('/sso', function (\FastRoute\RouteCollector $routeCollector) {
            $routeCollector->get('/.well-known/openid-configuration', (new Tinebase_Expressive_RouteHandler(
                self::class, 'publicGetWellKnownOpenIdConfiguration', [
                Tinebase_Expressive_RouteHandler::IS_PUBLIC => true
            ]))->toArray());
            $routeCollector->addRoute(['GET', 'POST'], '/oauth2/authorize', (new Tinebase_Expressive_RouteHandler(
                self::class, 'publicAuthorize', [
                Tinebase_Expressive_RouteHandler::IS_PUBLIC => true
            ]))->toArray());
            $routeCollector->addRoute(['GET', 'POST'], '/oauth2/token', (new Tinebase_Expressive_RouteHandler(
                self::class, 'publicToken', [
                Tinebase_Expressive_RouteHandler::IS_PUBLIC => true
            ]))->toArray());
            $routeCollector->post('/oauth2/register', (new Tinebase_Expressive_RouteHandler(
                self::class, 'publicRegister', [
                Tinebase_Expressive_RouteHandler::IS_PUBLIC => true
            ]))->toArray());
            $routeCollector->get('/oauth2/certs', (new Tinebase_Expressive_RouteHandler(
                self::class, 'publicCerts', [
                Tinebase_Expressive_RouteHandler::IS_PUBLIC => true
            ]))->toArray());
        });
    }

    public static function publicCerts(): \Psr\Http\Message\ResponseInterface
    {
        $keys = [
            'keys' => [
                [
                    'use' => 'sig',
                    'kty' => 'RSA',
                    'alg' => 'RS256',
                    'kid' => 'tempkid',
                    'e'   => 'AQAB',
                    'n'   => 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArXkViV0Cz0cwmGAcnP1U9z2K5utziToHUBHnWanV1HvLym8xsvlpjXVtqPXdnBQuHIXxDcDUfL7SWlKrrdkZTDZn21YJQvar3nS0Hwl1fpKd/CK1uWukmkfiOnuew6cwgskAbr4Oc3QVREEGBNTnpqiB0rLwlUqB4Pey/nGXCe2h8bm9NwNp/T9IlZhrwhfzMDhUSLo7FA6v9ShWVSLBDwvwXodLbq9DVX9OomZCPAapFjljxveCcSoKy1oQNUMDKdE7t1MEh5V4FAP2Ezhvexrq3cyLZtImypL15wgWujY2CXlDi9NkKAL7LyeevrQ2SbRAmKzTmCiZ7OKH4OpZWwIDAQAB',
                ]
            ]
        ];
        $response = (new \Zend\Diactoros\Response())
            // the jwks_uri SHOULD include a Cache-Control header in the response that contains a max-age directive
            ->withHeader('cache-control', 'public, max-age=20683, must-revalidate, no-transform');
        $response->getBody()->write(json_encode($keys));

        return $response;
    }

    public static function publicRegister(): \Psr\Http\Message\ResponseInterface
    {
        //TODO FIXME: The OpenID Provider MAY require an Initial Access Token that is provisioned out-of-band

    }

    // TODO FIX ME
    // 3.1.2.6.  Authentication Error Response
    public static function publicAuthorize(): \Psr\Http\Message\ResponseInterface
    {
        $server = static::getOpenIdConnectServer();

        // \League\OAuth2\Server\Grant\AuthCodeGrant::canRespondToAuthorizationRequest
        // expects ['response_type'] === 'code' && isset($request->getQueryParams()['client_id'])
        $authRequest = $server->validateAuthorizationRequest(
            /** @var \Psr\Http\Message\ServerRequestInterface $request */
            $request = Tinebase_Core::getContainer()->get(\Psr\Http\Message\RequestInterface::class)
        );

        try {
            Tinebase_Core::startCoreSession();
        } catch (Zend_Session_Exception $zse) {
            // expire session cookie for client
            Tinebase_Session::expireSessionCookie();
            return new \Zend\Diactoros\Response($body = 'php://memory', $status = 500);
        }

        if (isset($request->getParsedBody()['username']) && isset($request->getParsedBody()['password'])) {
            Tinebase_Controller::getInstance()->login($request->getParsedBody()['username'],
                $request->getParsedBody()['password'], Tinebase_Http_Request::fromString('POST /sso/authorize HTTP/1.1' . "\r\n\r\n"), 'openid connect flow');
        }

        // TODO FIXME
        // 3.1.2.3.  Authorization Server Authenticates End-User
        // The Authentication Request contains the prompt parameter with the value login. In this case, the Authorization Server MUST reauthenticate the End-User even if the End-User is already authenticated.

        if ($user = Tinebase_Core::getUser()) {
            $areaLock = Tinebase_AreaLock::getInstance();
            $userConfigIntersection = new Tinebase_Record_RecordSet(Tinebase_Model_MFA_UserConfig::class);
            if ($areaLock->hasLock(Tinebase_Model_AreaLockConfig::AREA_LOGIN) &&
                    $areaLock->isLocked(Tinebase_Model_AreaLockConfig::AREA_LOGIN)) {
                foreach ($areaLock->getAreaConfigs(Tinebase_Model_AreaLockConfig::AREA_LOGIN) as $areaConfig) {
                    $userConfigIntersection->mergeById($areaConfig->getUserMFAIntersection($user));
                }

                // user has no 2FA config -> currently its sort of optional -> no check
                if ($userConfigIntersection->count() === 0) {
                    $areaLock->forceUnlock(Tinebase_Model_AreaLockConfig::AREA_LOGIN);
                } else {

                    if (isset($request->getQueryParams()['mfaid'])) {
                        $mfaId = $request->getQueryParams()['mfaid'];
                        $userCfg = $userConfigIntersection->getById($mfaId);

                        if (isset($request->getQueryParams()['mfa'])) {
                            foreach ($areaLock->getAreaConfigs(Tinebase_Model_AreaLockConfig::AREA_LOGIN)->filter(function($rec) use($userCfg) {
                                return in_array($userCfg->{Tinebase_Model_MFA_UserConfig::FLD_MFA_CONFIG_ID}, $rec->{Tinebase_Model_AreaLockConfig::FLD_MFAS});
                            }) as $areaCfg) {
                                if (!$areaCfg->getBackend()->hasValidAuth()) {
                                    $areaLock->unlock(
                                        $areaCfg->{Tinebase_Model_AreaLockConfig::FLD_AREA_NAME},
                                        $mfaId,
                                        $request->getQueryParams()['mfa'],
                                        $user
                                    );
                                    break;
                                }
                            }
                        } else {
                            if (!Tinebase_Auth_MFA::getInstance($userCfg
                                    ->{Tinebase_Model_MFA_UserConfig::FLD_MFA_CONFIG_ID})->sendOut($userCfg)) {
                                throw new Tinebase_Exception('mfa send out failed');
                            } //else {
                                // success, FE to render input field
                            //}
                        }
                    }

                    if ($areaLock->isLocked(Tinebase_Model_AreaLockConfig::AREA_LOGIN)) {
                        // render mfa mask
                        $response = new \Zend\Diactoros\Response();
                        $response->getBody()->write('mfa mask');
                        return $response;
                    }
                }
            }

            $authRequest->setUser(new SSO_Facade_OAuth2_UserEntity($user));
            $authRequest->setAuthorizationApproved(true);
            return $server->completeAuthorizationRequest($authRequest, new \Zend\Diactoros\Response());
        }

        // render login mask
        $response = new \Zend\Diactoros\Response();
        $response->getBody()->write('<html>
<body>
<form method="post">');
        foreach ($request->getQueryParams() as $name => $value) {
            $response->getBody()->write('<input type="hidden" name="' . htmlspecialchars($name, ENT_HTML5 | ENT_COMPAT)
                . '" value="' . htmlspecialchars($value, ENT_HTML5 | ENT_COMPAT) . '"/>');
        }
        $response->getBody()->write('<input type="text" name="username"/><br/>
<input type="password" name="password"/><br/>
<input type="submit" value="Login"/>
</form>
</body>
</html>');

        return $response;
    }

    public static function publicToken(): \Psr\Http\Message\ResponseInterface
    {
        Tinebase_Core::set(Tinebase_Core::USER, Tinebase_User::getInstance()
            ->getFullUserByLoginName(Tinebase_User::SYSTEM_USER_ANONYMOUS));
        $server = static::getOpenIdConnectServer();

        return $server->respondToAccessTokenRequest(
            Tinebase_Core::getContainer()->get(\Psr\Http\Message\RequestInterface::class),
            new \Zend\Diactoros\Response()
        );
    }

    public static function publicGetWellKnownOpenIdConfiguration(): \Zend\Diactoros\Response
    {
        $response = new \Zend\Diactoros\Response('php://memory', 200, ['Content-Type' => 'application/json']);

        $serverUrl = rtrim(Tinebase_Core::getUrl(), '/');

        $config = [
            'issuer'                                            => Tinebase_Core::getUrl(Tinebase_Core::GET_URL_NOPATH),
            'authorization_endpoint'                            => $serverUrl . '/sso/oauth2/authorize',
            'token_endpoint'                                    => $serverUrl . '/sso/oauth2/token',
            'registration_endpoint'                             => $serverUrl . '/sso/oauth2/register',
            'userinfo_endpoint'                                 => $serverUrl . '/sso/openidconnect/userinfo',
            //'revocation_endpoint'                             => $serverUrl . '/sso/oauth2/revocation',
            'jwks_uri'                                          => $serverUrl . '/sso/oauth2/certs',
            //"device_authorization_endpoint": "https://oauth2.googleapis.com/device/code",
            'response_types_supported'                          => [
                'code',
            ],
            'grant_types_supported'                             => [
                'authorization_code',
            ],
            //'token_endpoint_auth_methods_supported'             => ['client_secret_basic', 'private_key_jwt'],
            //'token_endpoint_auth_signing_alg_values_supported'  => ["RS256", "ES256"],
        ];
        /**
        {
        "response_types_supported": [
        "code",
        "token",
        "id_token",
        "code token",
        "code id_token",
        "token id_token",
        "code token id_token",
        "none"
        ],
        "subject_types_supported": [
        "public"
        ],
        "id_token_signing_alg_values_supported": [
        "RS256"
        ],
        "scopes_supported": [
        "openid",
        "email",
        "profile"
        ],
        "token_endpoint_auth_methods_supported": [
        "client_secret_post",
        "client_secret_basic"
        ],
        "claims_supported": [
        "aud",
        "email",
        "email_verified",
        "exp",
        "family_name",
        "given_name",
        "iat",
        "iss",
        "locale",
        "name",
        "picture",
        "sub"
        ],
        "code_challenge_methods_supported": [
        "plain",
        "S256"
        ],
        "grant_types_supported": [
        "authorization_code",
        "refresh_token",
        "urn:ietf:params:oauth:grant-type:device_code",
        "urn:ietf:params:oauth:grant-type:jwt-bearer"
        ]
        }

         */
        /**
         *
        "userinfo_endpoint":
        "https://server.example.com/connect/userinfo",
        "check_session_iframe":
        "https://server.example.com/connect/check_session",
        "end_session_endpoint":
        "https://server.example.com/connect/end_session",
        "jwks_uri":
        "https://server.example.com/jwks.json",
        "scopes_supported":
        ["openid", "profile", "email", "address",
        "phone", "offline_access"],
        "response_types_supported":
        ["code", "code id_token", "id_token", "token id_token"],
        "acr_values_supported":
        ["urn:mace:incommon:iap:silver",
        "urn:mace:incommon:iap:bronze"],
        "subject_types_supported":
        ["public", "pairwise"],
        "userinfo_signing_alg_values_supported":
        ["RS256", "ES256", "HS256"],
        "userinfo_encryption_alg_values_supported":
        ["RSA1_5", "A128KW"],
        "userinfo_encryption_enc_values_supported":
        ["A128CBC-HS256", "A128GCM"],
        "id_token_signing_alg_values_supported":
        ["RS256", "ES256", "HS256"],
        "id_token_encryption_alg_values_supported":
        ["RSA1_5", "A128KW"],
        "id_token_encryption_enc_values_supported":
        ["A128CBC-HS256", "A128GCM"],
        "request_object_signing_alg_values_supported":
        ["none", "RS256", "ES256"],
        "display_values_supported":
        ["page", "popup"],
        "claim_types_supported":
        ["normal", "distributed"],
        "claims_supported":
        ["sub", "iss", "auth_time", "acr",
        "name", "given_name", "family_name", "nickname",
        "profile", "picture", "website",
        "email", "email_verified", "locale", "zoneinfo",
        "http://example.info/claims/groups"],
        "claims_parameter_supported":
        true,
        "service_documentation":
        "http://server.example.com/connect/service_documentation.html",
        "ui_locales_supported":
        ["en-US", "en-GB", "en-CA", "fr-FR", "fr-CA"]
         */
        $response->getBody()->write(json_encode($config));

        return $response;
    }

    public static function webfingerHandler(&$result)
    {
        $result['links'][] = [
            'rel' => SSO_Controller::WEBFINGER_REL,
            'href' => rtrim(Tinebase_Core::getUrl(), '/') . '/sso',
        ];
    }

    protected static function getOpenIdConnectServer(): \League\OAuth2\Server\AuthorizationServer
    {
        // Setup the authorization server
        $server = new \League\OAuth2\Server\AuthorizationServer(
            new SSO_Facade_OAuth2_ClientRepository(),
            new SSO_Facade_OAuth2_AccessTokenRepository(),
            new SSO_Facade_OAuth2_ScopeRepository(),
            __DIR__ . '/keys/private.key',
            __DIR__ . '/keys/public.key',
            new \Idaas\OpenID\ResponseTypes\BearerTokenResponse
        );

        $grant = new \Idaas\OpenID\Grant\AuthCodeGrant(
            new SSO_Facade_OAuth2_AuthCodeRepository(),
            new SSO_Facade_OAuth2_RefreshTokenRepository(),
            new SSO_Facade_OpenIdConnect_ClaimRepository(),
            new \Idaas\OpenID\Session(),
            new \DateInterval('PT10M'), // authorization codes will expire after 10 minutes
            new \DateInterval('PT1H') // id tokens will expire after 1 hour
        );

        $grant->setRefreshTokenTTL(new \DateInterval('P1M')); // refresh tokens will expire after 1 month

        // Enable the authentication code grant on the server
        $server->enableGrantType(
            $grant,
            new \DateInterval('PT1H') // access tokens will expire after 1 hour
        );

        /*
        $grant = new \League\OAuth2\Server\Grant\PasswordGrant(
            $userRepository,
            $refreshTokenRepository
        );

        $grant->setRefreshTokenTTL(new \DateInterval('P1M')); // refresh tokens will expire after 1 month

        // Enable the password grant on the server
        $server->enableGrantType(
            $grant,
            new \DateInterval('PT1H') // access tokens will expire after 1 hour
        );*/

        return $server;
    }
}
