<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Route Filter
    |--------------------------------------------------------------------------
    |
    | Routes can be filtered by the route name using basic string glob patterns.
    | By default, all routes are included in the JavaScript output.
    |
    */
    'only' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Route Groups
    |--------------------------------------------------------------------------
    |
    | Routes can be organized into groups that can be included or excluded.
    | This is useful when you have many routes and want to include only
    | specific groups in your JavaScript.
    |
    */
    'groups' => [
        'admin' => ['admin.*'],
        'auth' => [
            'login',
            'register',
            'password.request',
            'password.email',
            'password.reset',
            'password.update',
            'verification.notice',
            'verification.verify',
            'verification.send',
            'password.confirm',
            'password.confirmation',
            'logout',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Route Model Binding
    |--------------------------------------------------------------------------
    |
    | This option determines how route model binding should work in your
    | JavaScript. When enabled, route model binding will automatically
    | convert route parameters to their corresponding model instances.
    |
    */
    'bindings' => [
        // 'user' => App\Models\User::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Absolute URLs
    |--------------------------------------------------------------------------
    |
    | By default, Ziggy will generate relative URLs. Set this to `true` to
    | generate absolute URLs instead. This is useful when generating URLs
    | for API responses or emails.
    |
    */
    'absolute' => false,

    /*
    |--------------------------------------------------------------------------
    | URL Generation
    |--------------------------------------------------------------------------
    |
    | This option determines how URLs should be generated. When set to 'path',
    | Ziggy will generate paths (e.g., /users/1). When set to 'url', Ziggy
    | will generate full URLs (e.g., http://example.com/users/1).
    |
    */
    'url' => 'path',

    /*
    |--------------------------------------------------------------------------
    | App URL
    |--------------------------------------------------------------------------
    |
    | This is the base URL that will be used for generating absolute URLs.
    | By default, this is set to the value of the APP_URL environment
    | variable. You should set this to the root URL of your application.
    |
    */
    'app_url' => env('APP_URL', 'http://localhost'),

    /*
    |--------------------------------------------------------------------------
    | Asset URL
    |--------------------------------------------------------------------------
    |
    | This is the base URL that will be used for generating asset URLs.
    | By default, this is set to the value of the ASSET_URL environment
    | variable. You should set this to the root URL of your assets.
    |
    */
    'asset_url' => env('ASSET_URL', null),

    /*
    |--------------------------------------------------------------------------
    | Default Parameters
    |--------------------------------------------------------------------------
    |
    | Default parameters to include with every route. These can be overridden
    | on a per-route basis by passing an array of parameters to the route
    | helper function.
    |
    */
    'defaults' => [
        // 'locale' => 'en',
    ],
];
