<?php
/*
Plugin Name: SEO AutoFix Pro
Plugin URI: https://example.com
Description: Complete SEO toolkit with remote API - AI alt text, image optimization, broken link checker, meta editor, schema markup, security headers, and auto-fix integration.
Version: 5.3.0
Requires at least: 5.0
Requires PHP: 7.0
Author: SEO AutoFix Team
License: GPL v2 or later
Text Domain: seo-auto-fix
*/

defined('ABSPATH') || exit;

define('SEO_AUTOFIX_VERSION', '5.3.0');
define('SEO_AUDIT_API_URL', 'https://seo-audit-tool.vercel.app');

// Register REST API routes immediately on plugin load
add_action('rest_api_init', function() {
    register_rest_route('seo-autofix/v1', '/ping', array(
        'methods' => 'GET',
        'callback' => function() {
            return new WP_REST_Response(array('pong' => true, 'version' => SEO_AUTOFIX_VERSION), 200);
        },
        'permission_callback' => '__return_true',
    ));
});
define('SEO_AUTOFIX_PATH', plugin_dir_path(__FILE__));
define('SEO_AUTOFIX_URL', plugin_dir_url(__FILE__));

// ==================== AUTO INDEXING ON POST PUBLISH ====================
add_action('transition_post_status', 'seo_autofix_auto_index_on_publish', 10, 3);
function seo_autofix_auto_index_on_publish($new_status, $old_status, $post) {
    if ($new_status !== 'publish') return;
    $settings = get_option('seo_autofix_settings', array());
    if (empty($settings['enable_auto_indexing'])) return;
    if (!in_array($post->post_type, array('post', 'page', 'product'))) return;
    
    $url = get_permalink($post->ID);
    $results = array();
    
    // Submit to IndexNow (Bing, Yandex)
    if (!empty($settings['indexnow_api_key'])) {
        $indexnow_result = seo_autofix_submit_to_indexnow($url, $settings['indexnow_api_key']);
        $results['indexnow'] = $indexnow_result;
    }
    
    // Submit to Google Indexing API
    if (!empty($settings['google_service_account_key'])) {
        $google_result = seo_autofix_submit_to_google_indexing($url, $settings['google_service_account_key']);
        $results['google'] = $google_result;
    }
    
    // Ping sitemaps
    if (!empty($settings['enable_sitemap'])) {
        $sitemap_url = home_url('/sitemap.xml');
        wp_remote_get('https://www.google.com/ping?sitemap=' . urlencode($sitemap_url), array('timeout' => 5, 'blocking' => false));
        wp_remote_get('https://www.bing.com/ping?sitemap=' . urlencode($sitemap_url), array('timeout' => 5, 'blocking' => false));
        $results['sitemap_ping'] = true;
    }
    
    // Log the indexing
    update_post_meta($post->ID, '_seo_autofix_indexed', current_time('mysql'));
    update_post_meta($post->ID, '_seo_autofix_index_results', $results);
}

function seo_autofix_submit_to_indexnow($url, $api_key) {
    $host = wp_parse_url(home_url(), PHP_URL_HOST);
    $response = wp_remote_post('https://api.indexnow.org/indexnow', array(
        'timeout' => 10,
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode(array(
            'host' => $host,
            'key' => $api_key,
            'urlList' => array($url)
        ))
    ));
    return !is_wp_error($response) && wp_remote_retrieve_response_code($response) < 300;
}

function seo_autofix_submit_to_google_indexing($url, $service_account_json) {
    $credentials = json_decode($service_account_json, true);
    if (!$credentials || empty($credentials['client_email']) || empty($credentials['private_key'])) {
        return false;
    }
    
    // Create JWT
    $header = base64_encode(json_encode(array('alg' => 'RS256', 'typ' => 'JWT')));
    $now = time();
    $claim = base64_encode(json_encode(array(
        'iss' => $credentials['client_email'],
        'scope' => 'https://www.googleapis.com/auth/indexing',
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600
    )));
    
    $signature_input = $header . '.' . $claim;
    openssl_sign($signature_input, $signature, $credentials['private_key'], 'SHA256');
    $jwt = $signature_input . '.' . base64_encode($signature);
    
    // Get access token
    $token_response = wp_remote_post('https://oauth2.googleapis.com/token', array(
        'body' => array(
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        )
    ));
    
    if (is_wp_error($token_response)) return false;
    $token_data = json_decode(wp_remote_retrieve_body($token_response), true);
    if (empty($token_data['access_token'])) return false;
    
    // Submit URL
    $response = wp_remote_post('https://indexing.googleapis.com/v3/urlNotifications:publish', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $token_data['access_token'],
            'Content-Type' => 'application/json'
        ),
        'body' => json_encode(array('url' => $url, 'type' => 'URL_UPDATED'))
    ));
    
    return !is_wp_error($response) && wp_remote_retrieve_response_code($response) < 300;
}

// Load module classes
require_once SEO_AUTOFIX_PATH . 'includes/class-seo-autofix-local.php';
require_once SEO_AUTOFIX_PATH . 'includes/class-seo-autofix-trust.php';
require_once SEO_AUTOFIX_PATH . 'includes/class-seo-autofix-performance.php';
require_once SEO_AUTOFIX_PATH . 'includes/class-seo-autofix-accessibility.php';
require_once SEO_AUTOFIX_PATH . 'includes/class-seo-autofix-advanced.php';
require_once SEO_AUTOFIX_PATH . 'includes/class-seo-autofix-content.php';
require_once SEO_AUTOFIX_PATH . 'includes/admin-pages.php';

// Activation
register_activation_hook(__FILE__, 'seo_autofix_activate');
function seo_autofix_activate() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();
    
    // Create redirects table
    $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}seo_autofix_redirects (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        source_url varchar(500) NOT NULL,
        target_url varchar(500) NOT NULL,
        redirect_type int(3) DEFAULT 301,
        hits bigint(20) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY source_url (source_url(191))
    ) $charset;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    // Create service areas table
    $sql2 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}seo_autofix_service_areas (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        slug varchar(255) NOT NULL,
        page_id bigint(20) DEFAULT NULL,
        schema_data longtext,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY slug (slug(191))
    ) $charset;";
    dbDelta($sql2);
    
    // Create testimonials table
    $sql3 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}seo_autofix_testimonials (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        author_name varchar(255) NOT NULL,
        author_photo varchar(500) DEFAULT NULL,
        rating int(1) DEFAULT 5,
        review_text text NOT NULL,
        review_date date DEFAULT NULL,
        source varchar(100) DEFAULT NULL,
        display_order int(11) DEFAULT 0,
        is_active tinyint(1) DEFAULT 1,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset;";
    dbDelta($sql3);
    
    // Create trust badges table
    $sql4 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}seo_autofix_badges (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        type varchar(50) NOT NULL DEFAULT 'certification',
        image_url varchar(500) DEFAULT NULL,
        link_url varchar(500) DEFAULT NULL,
        display_order int(11) DEFAULT 0,
        is_active tinyint(1) DEFAULT 1,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset;";
    dbDelta($sql4);
    
    // Generate API key if not exists
    if (!get_option('seo_autofix_api_key')) {
        update_option('seo_autofix_api_key', wp_generate_password(32, false));
    }
    
    // Default settings
    $defaults = array(
        'openai_api_key' => '',
        'enable_image_compression' => true,
        'enable_webp_conversion' => true,
        'compression_quality' => 82,
        'max_image_width' => 1920,
        'max_image_height' => 1080,
        'enable_lazy_loading' => true,
        'enable_security_headers' => true,
        'enable_schema' => false,
        'enable_og_tags' => true,
        'enable_twitter_cards' => true,
        'default_og_image' => '',
        'twitter_card_type' => 'summary_large_image',
        'business_name' => '',
        'business_type' => 'LocalBusiness',
        'business_phone' => '',
        'business_email' => '',
        'business_address' => '',
        'business_city' => '',
        'business_country' => '',
        'custom_robots_txt' => '',
        'enable_sitemap' => true,
        'enable_remote_api' => true,
    );
    
    $existing = get_option('seo_autofix_settings', array());
    update_option('seo_autofix_settings', array_merge($defaults, $existing));
}

// ==================== REST API FOR REMOTE AUTO-FIX ====================
add_action('rest_api_init', 'seo_autofix_register_rest_routes', 10);
function seo_autofix_register_rest_routes() {
    $namespace = 'seo-autofix/v1';
    
    // Debug: Log that this function is being called
    error_log('SEO AutoFix: Registering REST API routes');
    
    // Verify connection
    register_rest_route($namespace, '/verify', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_verify',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Get site status/stats
    register_rest_route($namespace, '/status', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_status',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Generate alt text for images
    register_rest_route($namespace, '/fix/alt-text', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_alt_text',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Compress images
    register_rest_route($namespace, '/fix/compress-images', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_compress',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Enable security headers
    register_rest_route($namespace, '/fix/security-headers', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_security',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Enable lazy loading
    register_rest_route($namespace, '/fix/lazy-loading', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_lazy_loading',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Generate sitemap
    register_rest_route($namespace, '/fix/sitemap', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_sitemap',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Enable schema markup
    register_rest_route($namespace, '/fix/schema', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_schema',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Enable Open Graph tags
    register_rest_route($namespace, '/fix/og-tags', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_og_tags',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Update robots.txt
    register_rest_route($namespace, '/fix/robots', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_robots',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Meta descriptions
    register_rest_route($namespace, '/fix/meta-descriptions', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_meta',
        'permission_callback' => 'seo_autofix_api_permission',
    ));

    // Fix: Title tag editing
    register_rest_route($namespace, '/fix/title-tag', array(
        'methods' => ['POST', 'GET', 'PUT'],
        'callback' => 'seo_autofix_api_fix_title_tag',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Title optimization (separate endpoint)
    register_rest_route($namespace, '/fix/title-optimize', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_title_optimize',
        'permission_callback' => 'seo_autofix_api_permission',
    ));

    // Fix: WebP conversion
    register_rest_route($namespace, '/fix/webp-conversion', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_webp_conversion',
        'permission_callback' => 'seo_autofix_api_permission',
    ));

    // Fix: Redirect management
    register_rest_route($namespace, '/redirects', array(
        'methods' => ['GET', 'POST', 'PUT', 'DELETE'],
        'callback' => 'seo_autofix_api_redirects',
        'permission_callback' => 'seo_autofix_api_permission',
    ));

    // Fix: Bulk fix status tracking
    register_rest_route($namespace, '/bulk-status', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_bulk_status',
        'permission_callback' => 'seo_autofix_api_permission',
    ));

    // Content Publishing
    register_rest_route($namespace, '/content/publish', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_publish_content',
        'permission_callback' => 'seo_autofix_api_permission',
    ));

    // Get published content
    register_rest_route($namespace, '/content', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_get_content',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Set featured image for a post
    register_rest_route($namespace, '/content/set-featured', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_set_featured_image',
        'permission_callback' => 'seo_autofix_api_permission',
    ));

    // Fix: Settings export/import
    register_rest_route($namespace, '/settings/export', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_export_settings',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    register_rest_route($namespace, '/settings/import', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_import_settings',
        'permission_callback' => 'seo_autofix_api_permission',
    ));

    // Fix: Database cleanup
    register_rest_route($namespace, '/fix/database', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_database',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Bulk fix multiple issues
    register_rest_route($namespace, '/fix/bulk', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_bulk',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // ==================== HANDSHAKE ENDPOINTS ====================
    register_rest_route($namespace, '/handshake/init', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_handshake_init',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route($namespace, '/handshake/complete', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_handshake_complete',
        'permission_callback' => '__return_true',
    ));
    
    register_rest_route($namespace, '/handshake/status', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_handshake_status',
        'permission_callback' => '__return_true',
    ));
    
    // ==================== ISSUE DETECTION ====================
    register_rest_route($namespace, '/audit/issues', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_audit_issues',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/audit/auto-fix', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_audit_autofix',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // ==================== CATEGORY-SPECIFIC FIX ENDPOINTS ====================
    register_rest_route($namespace, '/fix/local-seo', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_local_seo',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/eeat', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_eeat',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/content', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_content',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/usability', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_usability',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/performance', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_performance',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/social', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_social',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/technology', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_technology',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/links', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_links',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/onpage', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_onpage',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Verify/Rescan endpoint - checks current SEO status after fixes
    register_rest_route($namespace, '/verify', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_verify_status',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Get fix capabilities - what can and cannot be auto-fixed
    register_rest_route($namespace, '/capabilities', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_get_capabilities',
        'permission_callback' => '__return_true',
    ));
    
    // Get items that need AI-generated fixes (images, posts)
    register_rest_route($namespace, '/ai/pending', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_get_ai_pending',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Apply AI-generated content from website
    register_rest_route($namespace, '/ai/apply', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_apply_ai_content',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Get social/OG settings and apply fixes
    register_rest_route($namespace, '/social/settings', array(
        'methods' => 'GET',
        'callback' => 'seo_autofix_api_get_social_settings',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/social/apply', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_apply_social_fixes',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // ==================== ADDITIONAL FIX ENDPOINTS ====================
    
    // Fix: Indexing issues (remove noindex, submit to search engines)
    register_rest_route($namespace, '/fix/indexing', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_indexing',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Canonical URLs
    register_rest_route($namespace, '/fix/canonical', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_canonical',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Internal linking suggestions
    register_rest_route($namespace, '/fix/internal-links', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_internal_links',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Heading structure
    register_rest_route($namespace, '/fix/headings', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_headings',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Core Web Vitals optimizations
    register_rest_route($namespace, '/fix/cwv', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_cwv',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Fix: Redirects - auto-fix broken link issues
    register_rest_route($namespace, '/fix/redirects', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_redirects',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Per-page fix endpoints (AI-powered)
    register_rest_route($namespace, '/fix/meta-page', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_meta_page',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/title-page', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_title_page',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/alt-text-page', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_alt_text_page',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/headings-page', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_headings_page',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    register_rest_route($namespace, '/fix/canonical-page', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_canonical_page',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Technical SEO combined fix endpoint
    register_rest_route($namespace, '/fix/technical-seo', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_technical_seo',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Keyword page fix endpoint
    register_rest_route($namespace, '/fix/keywords-page', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_keywords_page',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
    
    // Broken links page fix endpoint
    register_rest_route($namespace, '/fix/broken-links-page', array(
        'methods' => 'POST',
        'callback' => 'seo_autofix_api_fix_broken_links_page',
        'permission_callback' => 'seo_autofix_api_permission',
    ));
}

function seo_autofix_api_permission($request) {
    $settings = get_option('seo_autofix_settings', array());
    if (empty($settings['enable_remote_api'])) {
        return new WP_Error('api_disabled', 'Remote API is disabled', array('status' => 403));
    }

    // 1. Try standard WP Request Header
    $api_key = $request->get_header('X-SEO-AutoFix-Key');

    // 2. Try raw SERVER values (Fix for Hostinger/Apache stripping headers)
    if (empty($api_key) && isset($_SERVER['HTTP_X_SEO_AUTOFIX_KEY'])) {
        $api_key = $_SERVER['HTTP_X_SEO_AUTOFIX_KEY'];
    }

    // 3. Try Authorization Bearer (Standard method, rarely stripped)
    if (empty($api_key)) {
        $auth_header = $request->get_header('Authorization');
        if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
            $api_key = substr($auth_header, 7);
        }
    }

    // 4. Fallback to Query Parameter (Least secure, but reliable)
    if (empty($api_key)) {
        $api_key = $request->get_param('api_key');
    }

    $stored_key = get_option('seo_autofix_api_key');

    // Log for debugging (remove in production)
    error_log('SEO AutoFix: API key received - ' . (empty($api_key) ? 'empty' : 'present'));
    error_log('SEO AutoFix: Stored API key exists - ' . (empty($stored_key) ? 'no' : 'yes'));
    if ($api_key && $stored_key) {
        error_log('SEO AutoFix: API keys match - ' . (hash_equals($stored_key, $api_key) ? 'yes' : 'no'));
    }

    // Strict string comparison to prevent timing attacks
    if (!$api_key || !hash_equals($stored_key, $api_key)) {
        return new WP_Error('invalid_api_key', 'Invalid API key', array('status' => 401));
    }

    return true;
}

function seo_autofix_api_verify($request) {
    return new WP_REST_Response(array(
        'success' => true,
        'site' => home_url(),
        'name' => get_bloginfo('name'),
        'version' => SEO_AUTOFIX_VERSION,
        'wordpress' => get_bloginfo('version'),
        'php' => PHP_VERSION,
    ), 200);
}

function seo_autofix_api_status($request) {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    
    $stats = array(
        'total_images' => intval($wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_mime_type LIKE 'image/%'")),
        'images_without_alt' => intval($wpdb->get_var("SELECT COUNT(p.ID) FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt' WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%' AND (pm.meta_value IS NULL OR pm.meta_value = '')")),
        'posts_without_meta' => intval($wpdb->get_var("SELECT COUNT(p.ID) FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_seo_autofix_description' WHERE p.post_type IN ('post','page') AND p.post_status = 'publish' AND (pm.meta_value IS NULL OR pm.meta_value = '')")),
        'total_posts' => intval($wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type IN ('post','page') AND post_status = 'publish'")),
        'revisions' => intval($wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'revision'")),
        'spam_comments' => intval($wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->comments} WHERE comment_approved = 'spam'")),
    );
    
    $features = array(
        'https' => is_ssl(),
        'security_headers' => !empty($settings['enable_security_headers']),
        'lazy_loading' => !empty($settings['enable_lazy_loading']),
        'schema' => !empty($settings['enable_schema']),
        'og_tags' => !empty($settings['enable_og_tags']),
        'twitter_cards' => !empty($settings['enable_twitter_cards']),
        'sitemap' => !empty($settings['enable_sitemap']) || file_exists(ABSPATH . 'sitemap.xml'),
        'image_compression' => !empty($settings['enable_image_compression']),
        'webp_support' => function_exists('imagewebp'),
        'gd_library' => function_exists('imagecreatefromjpeg'),
    );
    
    return new WP_REST_Response(array(
        'success' => true,
        'stats' => $stats,
        'features' => $features,
        'settings' => array(
            'compression_quality' => $settings['compression_quality'] ?? 82,
            'max_image_width' => $settings['max_image_width'] ?? 1920,
            'business_name' => $settings['business_name'] ?? '',
        ),
    ), 200);
}

function seo_autofix_api_fix_alt_text($request) {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    $use_ai = $request->get_param('use_ai') && !empty($settings['openai_api_key']);
    $limit = min(100, intval($request->get_param('limit') ?: 50)); // Increased default limit
    
    // Get images without alt text from media library
    $images = $wpdb->get_results($wpdb->prepare("
        SELECT p.ID, p.post_title, p.post_name, p.guid FROM {$wpdb->posts} p 
        LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt'
        WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%%'
        AND (pm.meta_value IS NULL OR pm.meta_value = '')
        LIMIT %d
    ", $limit));
    
    $fixed = 0;
    $results = array();
    
    foreach ($images as $img) {
        $alt = '';
        
        if ($use_ai) {
            $image_url = wp_get_attachment_url($img->ID);
            $alt = seo_autofix_generate_ai_alt($image_url, $settings['openai_api_key']);
            if (is_wp_error($alt)) {
                $alt = '';
            }
        }
        
        // Fallback: Generate from filename/title
        if (empty($alt)) {
            // Try post_title first
            $source = !empty($img->post_title) ? $img->post_title : $img->post_name;
            // Clean up the name
            $alt = preg_replace('/[-_]+/', ' ', $source);
            $alt = preg_replace('/\d{3,}x\d{3,}/', '', $alt); // Remove dimensions like 800x600
            $alt = preg_replace('/\s+/', ' ', $alt);
            $alt = ucfirst(trim($alt));
            
            // If still empty, try from guid/url
            if (empty($alt) || strlen($alt) < 3) {
                $filename = pathinfo(parse_url($img->guid, PHP_URL_PATH), PATHINFO_FILENAME);
                $alt = preg_replace('/[-_]+/', ' ', $filename);
                $alt = preg_replace('/\d{3,}x\d{3,}/', '', $alt);
                $alt = ucfirst(trim($alt));
            }
        }
        
        if ($alt && strlen($alt) >= 2) {
            update_post_meta($img->ID, '_wp_attachment_image_alt', sanitize_text_field($alt));
            $fixed++;
            $results[] = array('id' => $img->ID, 'alt' => $alt, 'url' => wp_get_attachment_url($img->ID));
        }
    }
    
    // Also fix content images (images in post content)
    $content_result = seo_autofix_fix_content_images();
    $content_fixed = is_array($content_result) ? ($content_result['fixed'] ?? 0) : 0;
    
    // Count remaining
    $remaining = intval($wpdb->get_var("
        SELECT COUNT(p.ID) FROM {$wpdb->posts} p 
        LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt' 
        WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%' 
        AND (pm.meta_value IS NULL OR pm.meta_value = '')
    "));
    
    return new WP_REST_Response(array(
        'success' => true,
        'fixed' => $fixed,
        'content_images_fixed' => $content_fixed,
        'remaining' => $remaining,
        'results' => array_slice($results, 0, 10), // Limit results in response
        'message' => "Fixed alt text for $fixed media images" . ($content_fixed > 0 ? " and $content_fixed content images" : ""),
    ), 200);
}

function seo_autofix_api_fix_compress($request) {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    $quality = $settings['compression_quality'] ?? 82;
    $limit = min(20, intval($request->get_param('limit') ?: 10));
    
    $images = $wpdb->get_results($wpdb->prepare("
        SELECT ID FROM {$wpdb->posts} 
        WHERE post_type = 'attachment' AND post_mime_type IN ('image/jpeg', 'image/png') 
        LIMIT %d
    ", $limit));
    
    $compressed = 0;
    $total_saved = 0;
    
    foreach ($images as $img) {
        $file = get_attached_file($img->ID);
        if ($file && file_exists($file)) {
            $original = filesize($file);
            if (seo_autofix_compress_image($file, $quality)) {
                clearstatcache(true, $file);
                $total_saved += $original - filesize($file);
                $compressed++;
            }
        }
    }
    
    // Enable auto-compression
    $settings['enable_image_compression'] = true;
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'compressed' => $compressed,
        'saved_bytes' => $total_saved,
        'saved_kb' => round($total_saved / 1024, 2),
        'auto_enabled' => true,
    ), 200);
}

function seo_autofix_api_fix_security($request) {
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_security_headers'] = true;
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Security headers enabled',
        'headers' => array(
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'X-XSS-Protection' => '1; mode=block',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Strict-Transport-Security' => is_ssl() ? 'max-age=31536000; includeSubDomains' : 'N/A (requires HTTPS)',
        ),
    ), 200);
}

function seo_autofix_api_fix_lazy_loading($request) {
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_lazy_loading'] = true;
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Lazy loading enabled for all images',
    ), 200);
}

function seo_autofix_api_fix_sitemap($request) {
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_sitemap'] = true;
    update_option('seo_autofix_settings', $settings);
    
    seo_autofix_generate_sitemap();
    
    // Ping search engines
    $sitemap_url = home_url('/sitemap.xml');
    wp_remote_get('https://www.google.com/ping?sitemap=' . urlencode($sitemap_url), array('timeout' => 10, 'blocking' => false));
    wp_remote_get('https://www.bing.com/ping?sitemap=' . urlencode($sitemap_url), array('timeout' => 10, 'blocking' => false));
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Sitemap generated and search engines notified',
        'sitemap_url' => $sitemap_url,
    ), 200);
}

function seo_autofix_api_fix_schema($request) {
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_schema'] = true;
    $settings['enable_breadcrumb_schema'] = true;
    
    // Set business name from site name if not set
    if (empty($settings['business_name'])) {
        $settings['business_name'] = get_bloginfo('name');
    }
    
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Schema markup enabled',
        'business_name' => $settings['business_name'],
    ), 200);
}

function seo_autofix_api_fix_og_tags($request) {
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_og_tags'] = true;
    $settings['enable_twitter_cards'] = true;
    $settings['twitter_card_type'] = 'summary_large_image';
    
    $fixes_applied = array('og_tags_enabled', 'twitter_cards_enabled');
    $needs_manual = array();
    $og_image_found = false;
    
    // Try to set default OG image from various sources
    if (empty($settings['default_og_image'])) {
        // 1. Try site logo
        $custom_logo_id = get_theme_mod('custom_logo');
        if ($custom_logo_id) {
            $logo_url = wp_get_attachment_url($custom_logo_id);
            if ($logo_url) {
                $settings['default_og_image'] = $logo_url;
                $fixes_applied[] = 'og_image_from_site_logo';
                $og_image_found = true;
            }
        }
        
        // 2. Try site icon (favicon)
        if (!$og_image_found) {
            $site_icon_id = get_option('site_icon');
            if ($site_icon_id) {
                $icon_url = wp_get_attachment_url($site_icon_id);
                if ($icon_url) {
                    $settings['default_og_image'] = $icon_url;
                    $fixes_applied[] = 'og_image_from_site_icon';
                    $og_image_found = true;
                }
            }
        }
        
        // 3. Try homepage featured image
        if (!$og_image_found) {
            $front_page_id = get_option('page_on_front');
            if ($front_page_id) {
                $featured_id = get_post_thumbnail_id($front_page_id);
                if ($featured_id) {
                    $featured_url = wp_get_attachment_url($featured_id);
                    if ($featured_url) {
                        $settings['default_og_image'] = $featured_url;
                        $fixes_applied[] = 'og_image_from_homepage_featured';
                        $og_image_found = true;
                    }
                }
            }
        }
        
        // 4. Try any large image from media library
        if (!$og_image_found) {
            global $wpdb;
            $image = $wpdb->get_row("
                SELECT ID, guid FROM {$wpdb->posts} 
                WHERE post_type = 'attachment' 
                AND post_mime_type LIKE 'image/%'
                AND post_mime_type NOT LIKE '%svg%'
                ORDER BY post_date DESC LIMIT 1
            ");
            if ($image) {
                // Get the large size if available
                $large_url = wp_get_attachment_image_url($image->ID, 'large');
                $settings['default_og_image'] = $large_url ?: $image->guid;
                $fixes_applied[] = 'og_image_from_media_library';
                $og_image_found = true;
            }
        }
    } else {
        $og_image_found = true;
        $fixes_applied[] = 'og_image_already_set';
    }
    
    // If no image found, add to manual actions
    if (!$og_image_found) {
        $needs_manual[] = array(
            'issue' => 'og_image_missing',
            'message' => 'No suitable image found for Open Graph. Upload a logo or featured image (recommended: 1200x630px).',
            'admin_url' => admin_url('upload.php?mode=grid')
        );
    }
    
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => $og_image_found 
            ? 'Open Graph tags enabled with default image' 
            : 'Open Graph tags enabled (no default image found)',
        'default_og_image' => $settings['default_og_image'] ?? null,
        'og_image_found' => $og_image_found,
        'fixes_applied' => $fixes_applied,
        'needs_manual_action' => $needs_manual,
    ), 200);
}

function seo_autofix_api_fix_robots($request) {
    $settings = get_option('seo_autofix_settings', array());
    
    $robots = "User-agent: *\n";
    $robots .= "Disallow: /wp-admin/\n";
    $robots .= "Disallow: /wp-includes/\n";
    $robots .= "Disallow: /wp-content/plugins/\n";
    $robots .= "Disallow: /trackback/\n";
    $robots .= "Disallow: /feed/\n";
    $robots .= "Disallow: /comments/\n";
    $robots .= "Disallow: /?s=\n";
    $robots .= "Disallow: /search/\n\n";
    $robots .= "Allow: /wp-admin/admin-ajax.php\n";
    $robots .= "Allow: /wp-content/uploads/\n\n";
    $robots .= "Sitemap: " . home_url('/sitemap.xml') . "\n";
    
    $settings['custom_robots_txt'] = $robots;
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Robots.txt optimized',
        'robots_url' => home_url('/robots.txt'),
    ), 200);
}

function seo_autofix_api_fix_meta($request) {
    global $wpdb;
    
    $force = $request->get_param('force') ? true : false;
    $limit = min(50, intval($request->get_param('limit') ?: 20));
    
    // Get posts - if force is true, get all posts regardless of existing meta
    if ($force) {
        $posts = $wpdb->get_results($wpdb->prepare("
            SELECT p.ID, p.post_title, p.post_excerpt, p.post_content 
            FROM {$wpdb->posts} p
            WHERE p.post_type IN ('post', 'page') AND p.post_status = 'publish'
            LIMIT %d
        ", $limit));
    } else {
        // Get posts without meta description OR with short/empty descriptions
        $posts = $wpdb->get_results($wpdb->prepare("
            SELECT p.ID, p.post_title, p.post_excerpt, p.post_content 
            FROM {$wpdb->posts} p
            LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_seo_autofix_description'
            WHERE p.post_type IN ('post', 'page') AND p.post_status = 'publish'
            AND (pm.meta_value IS NULL OR pm.meta_value = '' OR LENGTH(pm.meta_value) < 50)
            LIMIT %d
        ", $limit));
    }

    $fixed = 0;
    $results = array();
    
    foreach ($posts as $post) {
        // Generate description from excerpt or content
        $desc = '';
        if (!empty($post->post_excerpt)) {
            $desc = wp_trim_words(strip_tags($post->post_excerpt), 30, '...');
        }
        if (empty($desc) || strlen($desc) < 50) {
            // Strip shortcodes and HTML, get clean content
            $clean_content = strip_shortcodes($post->post_content);
            $clean_content = wp_strip_all_tags($clean_content);
            $clean_content = preg_replace('/\s+/', ' ', $clean_content);
            $desc = wp_trim_words($clean_content, 30, '...');
        }
        
        if ($desc && strlen($desc) >= 20) {
            // Store in our custom meta
            update_post_meta($post->ID, '_seo_autofix_description', sanitize_textarea_field($desc));
            update_post_meta($post->ID, '_seo_autofix_title', sanitize_text_field($post->post_title));
            
            // Also try to set Yoast/RankMath meta if those plugins exist
            if (defined('WPSEO_VERSION')) {
                update_post_meta($post->ID, '_yoast_wpseo_metadesc', sanitize_textarea_field($desc));
            }
            if (defined('RANK_MATH_VERSION')) {
                update_post_meta($post->ID, 'rank_math_description', sanitize_textarea_field($desc));
            }
            
            $fixed++;
            $results[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'description' => substr($desc, 0, 100) . '...'
            );
        }
    }
    
    // Count remaining posts without meta
    $remaining = intval($wpdb->get_var("
        SELECT COUNT(*) FROM {$wpdb->posts} p
        LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_seo_autofix_description'
        WHERE p.post_type IN ('post', 'page') AND p.post_status = 'publish'
        AND (pm.meta_value IS NULL OR pm.meta_value = '' OR LENGTH(pm.meta_value) < 50)
    "));

    return new WP_REST_Response(array(
        'success' => true,
        'fixed' => $fixed,
        'remaining' => $remaining,
        'results' => $results,
        'message' => $fixed > 0 ? "Generated meta descriptions for $fixed posts" : "All posts already have meta descriptions",
    ), 200);
}

// ==================== TITLE TAG EDITING ====================
function seo_autofix_api_fix_title_tag($request) {
    $method = $request->get_method();

    if ($method === 'GET') {
        // Get all posts with titles
        global $wpdb;
        $page = intval($request->get_param('page') ?: 1);
        $per_page = intval($request->get_param('per_page') ?: 20);
        $offset = ($page - 1) * $per_page;

        $posts = $wpdb->get_results($wpdb->prepare("
            SELECT p.ID, p.post_title, p.post_type, p.post_status,
                   pm.meta_value as custom_title
            FROM {$wpdb->posts} p
            LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_seo_autofix_title'
            WHERE p.post_type IN ('post', 'page')
            ORDER BY p.post_date DESC
            LIMIT %d OFFSET %d
        ", $per_page, $offset));

        $total = intval($wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type IN ('post', 'page')"));

        return new WP_REST_Response(array(
            'success' => true,
            'posts' => array_map(function($post) {
                return array(
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'custom_title' => $post->custom_title ?: '',
                    'post_type' => $post->post_type,
                    'status' => $post->post_status,
                );
            }, $posts),
            'pagination' => array(
                'page' => $page,
                'per_page' => $per_page,
                'total' => $total,
                'total_pages' => ceil($total / $per_page),
            ),
        ), 200);
    }

    if ($method === 'POST' || $method === 'PUT') {
        // Update title for a specific post
        $post_id = intval($request->get_param('post_id'));
        $title = sanitize_text_field($request->get_param('title'));
        $apply_to_wp = (bool) $request->get_param('apply_to_wp');

        if (empty($post_id) || empty($title)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'post_id and title are required',
            ), 400);
        }

        // Save custom title
        update_post_meta($post_id, '_seo_autofix_title', $title);

        // Optionally apply to WordPress title
        if ($apply_to_wp) {
            wp_update_post(array(
                'ID' => $post_id,
                'post_title' => $title,
            ));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Title updated successfully',
            'post_id' => $post_id,
            'title' => $title,
        ), 200);
    }

    return new WP_REST_Response(array(
        'success' => false,
        'error' => 'Invalid method',
    ), 405);
}

// ==================== WEBP CONVERSION ====================
function seo_autofix_api_fix_webp_conversion($request) {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    $limit = min(50, intval($request->get_param('limit') ?: 20));
    $quality = $settings['compression_quality'] ?? 82;

    // Get images that don't have WebP versions yet
    $images = $wpdb->get_results($wpdb->prepare("
        SELECT ID FROM {$wpdb->posts}
        WHERE post_type = 'attachment'
        AND post_mime_type IN ('image/jpeg', 'image/png')
        LIMIT %d
    ", $limit));

    $converted = 0;
    $total_saved = 0;
    $results = array();

    foreach ($images as $img) {
        $file = get_attached_file($img->ID);
        if ($file && file_exists($file)) {
            $original_size = filesize($file);
            $path_info = pathinfo($file);
            $webp_path = $path_info['dirname'] . '/' . $path_info['filename'] . '.webp';

            // Convert to WebP
            if (seo_autofix_convert_to_webp($file, $webp_path, $quality)) {
                $webp_size = filesize($webp_path);
                $saved = $original_size - $webp_size;
                $total_saved += $saved;
                $converted++;

                $results[] = array(
                    'id' => $img->ID,
                    'original_size' => $original_size,
                    'webp_size' => $webp_size,
                    'saved' => $saved,
                    'webp_path' => $webp_path,
                );
            }
        }
    }

    // Enable auto WebP conversion
    $settings['enable_webp_conversion'] = true;
    update_option('seo_autofix_settings', $settings);

    return new WP_REST_Response(array(
        'success' => true,
        'converted' => $converted,
        'total_saved' => $total_saved,
        'total_saved_kb' => round($total_saved / 1024, 2),
        'results' => $results,
        'auto_enabled' => true,
    ), 200);
}

function seo_autofix_convert_to_webp($source, $destination, $quality = 82) {
    if (!function_exists('imagecreatefromjpeg') || !function_exists('imagewebp')) {
        return false;
    }

    $image_info = getimagesize($source);
    if (!$image_info) {
        return false;
    }

    $mime = $image_info['mime'];
    $image = null;

    switch ($mime) {
        case 'image/jpeg':
            $image = imagecreatefromjpeg($source);
            break;
        case 'image/png':
            $image = imagecreatefrompng($source);
            break;
        default:
            return false;
    }

    if (!$image) {
        return false;
    }

    // Convert to WebP
    $result = imagewebp($image, $destination, $quality);
    imagedestroy($image);

    return $result;
}

// ==================== REDIRECT MANAGEMENT ====================
function seo_autofix_api_redirects($request) {
    global $wpdb;
    $method = $request->get_method();
    $table_name = $wpdb->prefix . 'seo_autofix_redirects';

    if ($method === 'GET') {
        // Get all redirects
        $page = intval($request->get_param('page') ?: 1);
        $per_page = intval($request->get_param('per_page') ?: 50);
        $offset = ($page - 1) * $per_page;

        $redirects = $wpdb->get_results($wpdb->prepare("
            SELECT * FROM {$table_name}
            ORDER BY created_at DESC
            LIMIT %d OFFSET %d
        ", $per_page, $offset));

        $total = intval($wpdb->get_var("SELECT COUNT(*) FROM {$table_name}"));

        return new WP_REST_Response(array(
            'success' => true,
            'redirects' => array_map(function($r) {
                return array(
                    'id' => $r->id,
                    'source_url' => $r->source_url,
                    'target_url' => $r->target_url,
                    'redirect_type' => $r->redirect_type,
                    'hits' => $r->hits,
                    'created_at' => $r->created_at,
                );
            }, $redirects),
            'pagination' => array(
                'page' => $page,
                'per_page' => $per_page,
                'total' => $total,
                'total_pages' => ceil($total / $per_page),
            ),
        ), 200);
    }

    if ($method === 'POST') {
        // Create new redirect
        $source_url = esc_url_raw($request->get_param('source_url'));
        $target_url = esc_url_raw($request->get_param('target_url'));
        $redirect_type = intval($request->get_param('redirect_type') ?: 301);

        if (empty($source_url) || empty($target_url)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'source_url and target_url are required',
            ), 400);
        }

        $result = $wpdb->insert($table_name, array(
            'source_url' => $source_url,
            'target_url' => $target_url,
            'redirect_type' => $redirect_type,
            'hits' => 0,
            'created_at' => current_time('mysql'),
        ));

        if ($result === false) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Failed to create redirect',
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Redirect created successfully',
            'id' => $wpdb->insert_id,
        ), 201);
    }

    if ($method === 'PUT') {
        // Update existing redirect
        $id = intval($request->get_param('id'));
        $source_url = esc_url_raw($request->get_param('source_url'));
        $target_url = esc_url_raw($request->get_param('target_url'));
        $redirect_type = intval($request->get_param('redirect_type'));

        if (empty($id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'id is required',
            ), 400);
        }

        $data = array();
        if (!empty($source_url)) $data['source_url'] = $source_url;
        if (!empty($target_url)) $data['target_url'] = $target_url;
        if (!empty($redirect_type)) $data['redirect_type'] = $redirect_type;

        if (empty($data)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'No fields to update',
            ), 400);
        }

        $result = $wpdb->update($table_name, $data, array('id' => $id));

        if ($result === false) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Failed to update redirect',
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Redirect updated successfully',
        ), 200);
    }

    if ($method === 'DELETE') {
        // Delete redirect
        $id = intval($request->get_param('id'));

        if (empty($id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'id is required',
            ), 400);
        }

        $result = $wpdb->delete($table_name, array('id' => $id));

        if ($result === false) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Failed to delete redirect',
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Redirect deleted successfully',
        ), 200);
    }

    return new WP_REST_Response(array(
        'success' => false,
        'error' => 'Invalid method',
    ), 405);
}

// ==================== BULK FIX STATUS TRACKING ====================
function seo_autofix_api_bulk_status($request) {
    $bulk_id = $request->get_param('bulk_id');

    if (empty($bulk_id)) {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'bulk_id is required',
        ), 400);
    }

    $status = get_transient('seo_autofix_bulk_' . $bulk_id);

    if ($status === false) {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'Bulk operation not found or expired',
        ), 404);
    }

    return new WP_REST_Response(array(
        'success' => true,
        'status' => $status,
    ), 200);
}

// ==================== SETTINGS EXPORT/IMPORT ====================
function seo_autofix_api_export_settings($request) {
    $settings = get_option('seo_autofix_settings', array());

    // Remove sensitive data
    $export_data = $settings;
    if (isset($export_data['openai_api_key'])) {
        unset($export_data['openai_api_key']);
    }

    return new WP_REST_Response(array(
        'success' => true,
        'settings' => $export_data,
        'exported_at' => current_time('mysql'),
        'version' => SEO_AUTOFIX_VERSION,
    ), 200);
}

function seo_autofix_api_import_settings($request) {
    $settings = $request->get_param('settings');
    $merge = (bool) $request->get_param('merge');

    if (empty($settings) || !is_array($settings)) {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'settings array is required',
        ), 400);
    }

    $current_settings = get_option('seo_autofix_settings', array());

    if ($merge) {
        // Merge with existing settings
        $new_settings = array_merge($current_settings, $settings);
    } else {
        // Replace all settings
        $new_settings = $settings;
    }

    // Validate settings
    $validated = array();
    $allowed_keys = array(
        'business_name', 'business_type', 'business_subtype', 'business_description',
        'business_phone', 'business_email', 'business_address', 'business_city',
        'business_state', 'business_zip', 'business_country', 'business_lat', 'business_lng',
        'business_price_range', 'enable_click_to_call', 'enable_local_schema',
        'google_maps_api_key', 'business_hours', 'service_areas',
        'business_social_facebook', 'business_social_instagram', 'business_social_twitter',
        'business_social_linkedin', 'business_social_youtube',
        'enable_image_compression', 'enable_webp_conversion', 'compression_quality',
        'max_image_width', 'enable_lazy_loading', 'enable_security_headers',
        'enable_sitemap', 'enable_schema', 'enable_breadcrumb_schema', 'enable_og_tags',
        'enable_twitter_cards', 'twitter_card_type', 'custom_robots_txt',
        'enable_resource_hints', 'preconnect_domains', 'dns_prefetch_domains',
        'preload_resources', 'defer_js', 'async_analytics', 'remove_jquery_migrate',
        'inline_critical_css', 'defer_css', 'enable_skip_link', 'enable_focus_styles',
        'add_link_warnings', 'ga4_id', 'gtm_id', 'fb_pixel_id',
        'default_author_name', 'default_author_title', 'default_author_bio',
        'default_author_photo', 'default_author_credentials', 'display_author_on_posts',
        'display_author_on_pages', 'enable_author_schema',
    );

    foreach ($allowed_keys as $key) {
        if (isset($new_settings[$key])) {
            $validated[$key] = $new_settings[$key];
        }
    }

    update_option('seo_autofix_settings', $validated);

    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Settings imported successfully',
        'imported_at' => current_time('mysql'),
        'settings_count' => count($validated),
    ), 200);
}

function seo_autofix_api_fix_database($request) {
    global $wpdb;
    $results = array();
    
    // Delete revisions
    $revisions = $wpdb->query("DELETE FROM {$wpdb->posts} WHERE post_type = 'revision'");
    $results['revisions_deleted'] = $revisions;
    
    // Delete spam
    $spam = $wpdb->query("DELETE FROM {$wpdb->comments} WHERE comment_approved = 'spam'");
    $results['spam_deleted'] = $spam;
    
    // Delete trash
    $trash = $wpdb->query("DELETE FROM {$wpdb->posts} WHERE post_status = 'trash'");
    $results['trash_deleted'] = $trash;
    
    // Delete transients
    $transients = $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%' OR option_name LIKE '_site_transient_%'");
    $results['transients_deleted'] = $transients;
    
    // Optimize tables
    $tables = $wpdb->get_results("SHOW TABLES", ARRAY_N);
    foreach ($tables as $table) {
        $wpdb->query("OPTIMIZE TABLE {$table[0]}");
    }
    $results['tables_optimized'] = count($tables);
    
    return new WP_REST_Response(array(
        'success' => true,
        'results' => $results,
        'message' => 'Database cleaned and optimized',
    ), 200);
}

function seo_autofix_api_fix_bulk($request) {
    $fixes = $request->get_param('fixes') ?: array();
    $config = $request->get_param('config') ?: array();
    $results = array();
    
    // Handle "all" keyword - apply all available fixes
    if (in_array('all', $fixes)) {
        $fixes = array(
            'security', 'lazy_loading', 'sitemap', 'robots', 'og_tags',
            'schema', 'meta', 'alt_text', 'compress', 'database',
            'resource_hints', 'skip_link', 'focus_styles', 'link_warnings',
        );
    }
    
    foreach ($fixes as $fix) {
        $fix_request = new WP_REST_Request('POST');
        
        // Pass config data to fix request
        if (!empty($config[$fix])) {
            foreach ($config[$fix] as $key => $value) {
                $fix_request->set_param($key, $value);
            }
        }
        
        switch ($fix) {
            // Original fixes
            case 'alt_text':
                $r = seo_autofix_api_fix_alt_text($fix_request);
                $results['alt_text'] = $r->get_data();
                break;
            case 'compress':
            case 'compress_images':
                $r = seo_autofix_api_fix_compress($fix_request);
                $results['compress'] = $r->get_data();
                break;
            case 'security':
            case 'security_headers':
                $r = seo_autofix_api_fix_security($fix_request);
                $results['security'] = $r->get_data();
                break;
            case 'lazy_loading':
                $r = seo_autofix_api_fix_lazy_loading($fix_request);
                $results['lazy_loading'] = $r->get_data();
                break;
            case 'sitemap':
                $r = seo_autofix_api_fix_sitemap($fix_request);
                $results['sitemap'] = $r->get_data();
                break;
            case 'schema':
                $r = seo_autofix_api_fix_schema($fix_request);
                $results['schema'] = $r->get_data();
                break;
            case 'og_tags':
                $r = seo_autofix_api_fix_og_tags($fix_request);
                $results['og_tags'] = $r->get_data();
                break;
            case 'robots':
                $r = seo_autofix_api_fix_robots($fix_request);
                $results['robots'] = $r->get_data();
                break;
            case 'meta':
            case 'meta_descriptions':
                $r = seo_autofix_api_fix_meta($fix_request);
                $results['meta'] = $r->get_data();
                break;
            case 'title':
            case 'title_tag':
            case 'title_optimize':
                $r = seo_autofix_api_fix_title_optimize($fix_request);
                $results['title'] = $r->get_data();
                break;
            case 'database':
            case 'database_cleanup':
                $r = seo_autofix_api_fix_database($fix_request);
                $results['database'] = $r->get_data();
                break;
            
            // Phase 1 - Local SEO (handled by SEO_AutoFix_Local class)
            case 'local_business_schema':
            case 'local_schema':
                $local = SEO_AutoFix_Local::instance();
                $r = $local->api_fix_local_schema($fix_request);
                $results['local_schema'] = $r->get_data();
                break;
            case 'contact_info':
                $local = SEO_AutoFix_Local::instance();
                $r = $local->api_fix_contact_info($fix_request);
                $results['contact_info'] = $r->get_data();
                break;
            case 'business_hours':
                $local = SEO_AutoFix_Local::instance();
                $r = $local->api_fix_business_hours($fix_request);
                $results['business_hours'] = $r->get_data();
                break;
            case 'click_to_call':
                $fix_request->set_param('enable_click_to_call', true);
                $local = SEO_AutoFix_Local::instance();
                $r = $local->api_fix_contact_info($fix_request);
                $results['click_to_call'] = $r->get_data();
                break;
            case 'map_embed':
                $local = SEO_AutoFix_Local::instance();
                $r = $local->api_fix_map_embed($fix_request);
                $results['map_embed'] = $r->get_data();
                break;
            case 'service_areas':
                $local = SEO_AutoFix_Local::instance();
                $r = $local->api_fix_service_areas($fix_request);
                $results['service_areas'] = $r->get_data();
                break;
            
            // Phase 2 - Trust & E-E-A-T (handled by SEO_AutoFix_Trust class)
            case 'author_info':
                $trust = SEO_AutoFix_Trust::instance();
                $r = $trust->api_fix_author_info($fix_request);
                $results['author_info'] = $r->get_data();
                break;
            case 'testimonials':
            case 'testimonials_schema':
                $trust = SEO_AutoFix_Trust::instance();
                $r = $trust->api_fix_testimonials($fix_request);
                $results['testimonials'] = $r->get_data();
                break;
            case 'trust_badges':
                $trust = SEO_AutoFix_Trust::instance();
                $r = $trust->api_fix_trust_badges($fix_request);
                $results['trust_badges'] = $r->get_data();
                break;
            case 'review_schema':
                $trust = SEO_AutoFix_Trust::instance();
                $r = $trust->api_fix_review_schema($fix_request);
                $results['review_schema'] = $r->get_data();
                break;
            
            // Phase 3 - Performance (handled by SEO_AutoFix_Performance class)
            case 'resource_hints':
                $perf = SEO_AutoFix_Performance::instance();
                $r = $perf->api_fix_resource_hints($fix_request);
                $results['resource_hints'] = $r->get_data();
                break;
            case 'js_optimization':
                $fix_request->set_param('defer_scripts', true);
                $fix_request->set_param('async_analytics', true);
                $perf = SEO_AutoFix_Performance::instance();
                $r = $perf->api_fix_js_optimization($fix_request);
                $results['js_optimization'] = $r->get_data();
                break;
            case 'css_optimization':
                $perf = SEO_AutoFix_Performance::instance();
                $r = $perf->api_fix_css_optimization($fix_request);
                $results['css_optimization'] = $r->get_data();
                break;
            case 'preload':
                $perf = SEO_AutoFix_Performance::instance();
                $r = $perf->api_fix_preload($fix_request);
                $results['preload'] = $r->get_data();
                break;
            
            // Phase 4 - Accessibility (handled by SEO_AutoFix_Accessibility class)
            case 'skip_link':
                $fix_request->set_param('enable', true);
                $a11y = SEO_AutoFix_Accessibility::instance();
                $r = $a11y->api_fix_skip_link($fix_request);
                $results['skip_link'] = $r->get_data();
                break;
            case 'focus_styles':
                $fix_request->set_param('enable', true);
                $a11y = SEO_AutoFix_Accessibility::instance();
                $r = $a11y->api_fix_focus_styles($fix_request);
                $results['focus_styles'] = $r->get_data();
                break;
            case 'link_warnings':
                $fix_request->set_param('add_aria_labels', true);
                $fix_request->set_param('add_visual_indicator', true);
                $a11y = SEO_AutoFix_Accessibility::instance();
                $r = $a11y->api_fix_link_warnings($fix_request);
                $results['link_warnings'] = $r->get_data();
                break;
            case 'accessibility':
                $a11y = SEO_AutoFix_Accessibility::instance();
                $r = $a11y->api_fix_all_accessibility($fix_request);
                $results['accessibility'] = $r->get_data();
                break;
            
            // Phase 5 - Advanced (handled by SEO_AutoFix_Advanced class)
            case 'analytics':
                $adv = SEO_AutoFix_Advanced::instance();
                $r = $adv->api_fix_analytics($fix_request);
                $results['analytics'] = $r->get_data();
                break;
            case 'faq_schema':
                $adv = SEO_AutoFix_Advanced::instance();
                $r = $adv->api_fix_faq_schema($fix_request);
                $results['faq_schema'] = $r->get_data();
                break;
            case 'llms_txt':
                $fix_request->set_param('generate', true);
                $adv = SEO_AutoFix_Advanced::instance();
                $r = $adv->api_fix_llms_txt($fix_request);
                $results['llms_txt'] = $r->get_data();
                break;
            case 'breadcrumbs':
                $fix_request->set_param('enable', true);
                $adv = SEO_AutoFix_Advanced::instance();
                $r = $adv->api_fix_breadcrumbs($fix_request);
                $results['breadcrumbs'] = $r->get_data();
                break;
        }
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'fixes_applied' => count($results),
        'results' => $results,
    ), 200);
}

// ==================== ADMIN MENU ====================
add_action('admin_menu', 'seo_autofix_menu');
function seo_autofix_menu() {
    add_menu_page('SEO AutoFix', 'SEO AutoFix', 'manage_options', 'seo-auto-fix', 'seo_autofix_dashboard', 'dashicons-admin-tools', 80);
    add_submenu_page('seo-auto-fix', 'Dashboard', 'Dashboard', 'manage_options', 'seo-auto-fix', 'seo_autofix_dashboard');
    add_submenu_page('seo-auto-fix', 'Images', 'Images', 'manage_options', 'seo-auto-fix-images', 'seo_autofix_images_page');
    add_submenu_page('seo-auto-fix', 'AI Alt Text', 'AI Alt Text', 'manage_options', 'seo-auto-fix-ai', 'seo_autofix_ai_page');
    add_submenu_page('seo-auto-fix', 'Bulk Optimize', 'Bulk Optimize', 'manage_options', 'seo-auto-fix-bulk', 'seo_autofix_bulk_page');
    add_submenu_page('seo-auto-fix', 'Meta Editor', 'Meta Editor', 'manage_options', 'seo-auto-fix-meta', 'seo_autofix_meta_page');
    add_submenu_page('seo-auto-fix', 'Local SEO', 'Local SEO', 'manage_options', 'seo-auto-fix-local', 'seo_autofix_local_page');
    add_submenu_page('seo-auto-fix', 'Testimonials', 'Testimonials', 'manage_options', 'seo-auto-fix-testimonials', 'seo_autofix_testimonials_page');
    add_submenu_page('seo-auto-fix', 'Performance', 'Performance', 'manage_options', 'seo-auto-fix-performance', 'seo_autofix_performance_page');
    add_submenu_page('seo-auto-fix', 'Accessibility', 'Accessibility', 'manage_options', 'seo-auto-fix-a11y', 'seo_autofix_a11y_page');
    add_submenu_page('seo-auto-fix', 'Analytics', 'Analytics', 'manage_options', 'seo-auto-fix-analytics', 'seo_autofix_analytics_page');
    add_submenu_page('seo-auto-fix', 'Broken Links', 'Broken Links', 'manage_options', 'seo-auto-fix-links', 'seo_autofix_links_page');
    add_submenu_page('seo-auto-fix', 'Redirects', 'Redirects', 'manage_options', 'seo-auto-fix-redirects', 'seo_autofix_redirects_page');
    add_submenu_page('seo-auto-fix', 'Sitemap', 'Sitemap', 'manage_options', 'seo-auto-fix-sitemap', 'seo_autofix_sitemap_page');
    add_submenu_page('seo-auto-fix', 'Robots.txt', 'Robots.txt', 'manage_options', 'seo-auto-fix-robots', 'seo_autofix_robots_page');
    add_submenu_page('seo-auto-fix', 'Social Tags', 'Social Tags', 'manage_options', 'seo-auto-fix-social', 'seo_autofix_social_page');
    add_submenu_page('seo-auto-fix', 'Schema', 'Schema', 'manage_options', 'seo-auto-fix-schema', 'seo_autofix_schema_page');
    add_submenu_page('seo-auto-fix', 'Database', 'Database', 'manage_options', 'seo-auto-fix-database', 'seo_autofix_database_page');
    add_submenu_page('seo-auto-fix', 'API / Connect', 'API / Connect', 'manage_options', 'seo-auto-fix-api', 'seo_autofix_api_page');
    add_submenu_page('seo-auto-fix', 'Debug Logs', 'Debug Logs', 'manage_options', 'seo-auto-fix-debug', 'seo_autofix_debug_page');
    add_submenu_page('seo-auto-fix', 'Settings', 'Settings', 'manage_options', 'seo-auto-fix-settings', 'seo_autofix_settings_page');
}

// Admin Styles
add_action('admin_enqueue_scripts', 'seo_autofix_admin_assets');
function seo_autofix_admin_assets($hook) {
    if (strpos($hook, 'seo-auto-fix') === false) return;
    
    wp_enqueue_script('jquery');
    wp_enqueue_media();
    
    wp_add_inline_style('admin-menu', '
        .seo-autofix-wrap { max-width: 1400px; }
        .seo-autofix-card { background: #fff; border: 1px solid #ccd0d4; border-radius: 4px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 1px rgba(0,0,0,.04); }
        .seo-autofix-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .seo-autofix-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .seo-autofix-stat { text-align: center; padding: 20px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px; }
        .seo-autofix-stat-value { font-size: 36px; font-weight: 700; color: #1d2327; }
        .seo-autofix-stat-label { color: #646970; margin-top: 5px; font-size: 14px; }
        .seo-autofix-score { width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; color: #fff; margin: 0 auto 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .score-good { background: linear-gradient(135deg, #00a32a, #00c853); }
        .score-ok { background: linear-gradient(135deg, #dba617, #ffca28); }
        .score-bad { background: linear-gradient(135deg, #d63638, #f44336); }
        .check-pass { color: #00a32a; }
        .check-fail { color: #d63638; }
        .check-warn { color: #dba617; }
        .seo-autofix-progress { height: 24px; background: #e9ecef; border-radius: 12px; overflow: hidden; margin: 10px 0; }
        .seo-autofix-progress-bar { height: 100%; background: linear-gradient(90deg, #00a32a, #00c853); transition: width 0.5s ease; border-radius: 12px; }
        .seo-autofix-checklist { list-style: none; padding: 0; margin: 0; }
        .seo-autofix-checklist li { padding: 12px 0; border-bottom: 1px solid #f0f0f1; display: flex; align-items: center; gap: 12px; }
        .seo-autofix-checklist li:last-child { border-bottom: none; }
        .seo-autofix-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        .seo-autofix-btn-group { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px; }
        .seo-autofix-table { width: 100%; border-collapse: collapse; }
        .seo-autofix-table th, .seo-autofix-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
        .seo-autofix-table th { background: #f8f9fa; font-weight: 600; }
        .seo-autofix-table tr:hover { background: #f8f9fa; }
        .seo-autofix-code { background: #1d2327; color: #50fa7b; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
        .seo-autofix-api-key { font-family: monospace; background: #f0f0f1; padding: 10px 15px; border-radius: 4px; font-size: 14px; word-break: break-all; }
        @media (max-width: 782px) { .seo-autofix-grid-3 { grid-template-columns: 1fr; } }
    ');
}

// ==================== API PAGE ====================
function seo_autofix_api_page() {
    $api_key = get_option('seo_autofix_api_key');
    $settings = get_option('seo_autofix_settings', array());
    
    // Handle Magic Link Connection (Handshake Protocol)
    if (isset($_GET['connect_token']) && isset($_GET['callback_url'])) {
        $token = sanitize_text_field($_GET['connect_token']);
        $callback = esc_url_raw(urldecode($_GET['callback_url']));

        // Handle Approval Logic
        if (isset($_POST['approve_connection']) && check_admin_referer('seo_autofix_connect_approve')) {
            $api_key = get_option('seo_autofix_api_key');
            $callback = esc_url_raw($_POST['saas_callback']);
            $token = sanitize_text_field($_POST['saas_token']);

            // Update transient status to approved (for polling mechanism)
            $connection = get_transient('seo_autofix_pending_connection_' . $token);
            if ($connection) {
                $connection['status'] = 'approved';
                set_transient('seo_autofix_pending_connection_' . $token, $connection, 600);
            }

            // Enable remote API
            $settings = get_option('seo_autofix_settings', array());
            $settings['enable_remote_api'] = true;
            update_option('seo_autofix_settings', $settings);

            echo '<div class="wrap seo-autofix-wrap">';
            echo '<div class="seo-autofix-card" style="text-align:center; max-width:600px; margin:50px auto; padding:40px;">';
            echo '<h1 style="font-size:48px; margin-bottom:20px;">✅</h1>';
            echo '<h2 style="margin-top:0; color:#00a32a;">Connected Successfully!</h2>';
            echo '<p style="font-size:16px; color:#646970;">Your WordPress site is now connected to the SEO Audit Tool.</p>';
            echo '<p style="font-size:14px; color:#646970;">You can close this window and return to the SEO Audit Tool.</p>';
            echo '<p style="margin-top:20px;"><a href="' . admin_url('admin.php?page=seo-auto-fix') . '" class="button button-primary">Go to Dashboard</a></p>';
            echo '</div>';
            echo '</div>';
            return;
        }

        // UI for Approval
        ?>
        <div class="wrap seo-autofix-wrap">
            <div class="seo-autofix-card" style="text-align:center; max-width:600px; margin:50px auto; padding:40px;">
                <h1 style="font-size:48px; margin-bottom:20px;">🚀</h1>
                <h2 style="margin-top:0;">Connect to SEO Audit Tool?</h2>
                <p style="font-size:16px; color:#646970; margin:20px 0;">
                    The SaaS platform is requesting access to manage your SEO automatically.
                </p>
                <p style="font-size:14px; color:#646970; margin:20px 0;">
                    By approving, you'll allow the platform to:<br>
                    ✓ Analyze your site's SEO<br>
                    ✓ Apply automatic fixes<br>
                    ✓ Monitor performance
                </p>
                <form method="post" style="margin-top:30px;">
                    <?php wp_nonce_field('seo_autofix_connect_approve'); ?>
                    <input type="hidden" name="saas_token" value="<?php echo esc_attr($token); ?>">
                    <input type="hidden" name="saas_callback" value="<?php echo esc_attr($callback); ?>">
                    <button type="submit" name="approve_connection" class="button button-primary button-hero" style="padding:15px 40px; font-size:16px;">
                        ✅ Approve & Connect
                    </button>
                </form>
                <p style="margin-top:30px;">
                    <a href="<?php echo admin_url('admin.php?page=seo-auto-fix-api'); ?>" style="color:#646970; text-decoration:none;">
                        Cancel and return to manual setup
                    </a>
                </p>
            </div>
        </div>
        <?php
        return;
    }
    
    if (isset($_POST['regenerate_api_key']) && check_admin_referer('seo_autofix_api')) {
        $api_key = wp_generate_password(32, false);
        update_option('seo_autofix_api_key', $api_key);
        echo '<div class="notice notice-success"><p>API key regenerated!</p></div>';
    }
    
    if (isset($_POST['toggle_api']) && check_admin_referer('seo_autofix_api')) {
        $settings['enable_remote_api'] = isset($_POST['enable_remote_api']);
        update_option('seo_autofix_settings', $settings);
        echo '<div class="notice notice-success"><p>API settings saved!</p></div>';
    }
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1><span class="dashicons dashicons-rest-api"></span> API / Remote Connection</h1>
        
        <div class="seo-autofix-card">
            <h3 style="margin-top:0;">🔗 Connect to SEO Audit Tool</h3>
            <p>Use these credentials to connect your WordPress site to the SEO Audit Tool for automatic fixes.</p>
            
            <form method="post">
                <?php wp_nonce_field('seo_autofix_api'); ?>
                <table class="form-table">
                    <tr>
                        <th>Enable Remote API</th>
                        <td>
                            <label>
                                <input type="checkbox" name="enable_remote_api" value="1" <?php checked(!empty($settings['enable_remote_api'])); ?>>
                                Allow remote connections to fix SEO issues
                            </label>
                        </td>
                    </tr>
                </table>
                <button type="submit" name="toggle_api" class="button button-primary">Save API Settings</button>
            </form>
        </div>
        
        <div class="seo-autofix-card">
            <h3 style="margin-top:0;">🔑 Your API Credentials</h3>
            <p>Copy these values into the SEO Audit Tool to connect your site:</p>
            
            <table class="form-table">
                <tr>
                    <th>Site URL</th>
                    <td><code class="seo-autofix-api-key"><?php echo home_url(); ?></code></td>
                </tr>
                <tr>
                    <th>API Key</th>
                    <td>
                        <code class="seo-autofix-api-key"><?php echo esc_html($api_key); ?></code>
                        <form method="post" style="display:inline; margin-left:10px;">
                            <?php wp_nonce_field('seo_autofix_api'); ?>
                            <button type="submit" name="regenerate_api_key" class="button button-small" onclick="return confirm('Regenerate API key? Existing connections will stop working.');">Regenerate</button>
                        </form>
                    </td>
                </tr>
                <tr>
                    <th>API Endpoint</th>
                    <td><code class="seo-autofix-api-key"><?php echo home_url('/wp-json/seo-autofix/v1/'); ?></code></td>
                </tr>
            </table>
        </div>
        
        <div class="seo-autofix-card">
            <h3 style="margin-top:0;">📡 Available API Endpoints</h3>
            <table class="seo-autofix-table">
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Method</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td><code>/verify</code></td><td>GET</td><td>Verify connection</td></tr>
                    <tr><td><code>/status</code></td><td>GET</td><td>Get site stats and feature status</td></tr>
                    <tr><td><code>/fix/alt-text</code></td><td>POST</td><td>Generate alt text for images</td></tr>
                    <tr><td><code>/fix/compress-images</code></td><td>POST</td><td>Compress images</td></tr>
                    <tr><td><code>/fix/security-headers</code></td><td>POST</td><td>Enable security headers</td></tr>
                    <tr><td><code>/fix/lazy-loading</code></td><td>POST</td><td>Enable lazy loading</td></tr>
                    <tr><td><code>/fix/sitemap</code></td><td>POST</td><td>Generate XML sitemap</td></tr>
                    <tr><td><code>/fix/schema</code></td><td>POST</td><td>Enable schema markup</td></tr>
                    <tr><td><code>/fix/og-tags</code></td><td>POST</td><td>Enable Open Graph tags</td></tr>
                    <tr><td><code>/fix/robots</code></td><td>POST</td><td>Optimize robots.txt</td></tr>
                    <tr><td><code>/fix/meta-descriptions</code></td><td>POST</td><td>Generate meta descriptions</td></tr>
                    <tr><td><code>/fix/database</code></td><td>POST</td><td>Clean up database</td></tr>
                    <tr><td><code>/fix/bulk</code></td><td>POST</td><td>Apply multiple fixes</td></tr>
                </tbody>
            </table>
        </div>
        
        <div class="seo-autofix-card">
            <h3 style="margin-top:0;">🧪 Test Connection</h3>
            <p>Test your API connection using either method:</p>
            <p><strong>Method 1: Custom Header (Standard)</strong></p>
            <div class="seo-autofix-code">curl -H "X-SEO-AutoFix-Key: <?php echo esc_html($api_key); ?>" \
  <?php echo home_url('/wp-json/seo-autofix/v1/verify'); ?></div>
            <p><strong>Method 2: Bearer Token (More reliable on Hostinger)</strong></p>
            <div class="seo-autofix-code">curl -H "Authorization: Bearer <?php echo esc_html($api_key); ?>" \
  <?php echo home_url('/wp-json/seo-autofix/v1/verify'); ?></div>
        </div>
    </div>
    <?php
}

// ==================== DASHBOARD ====================
function seo_autofix_dashboard() {
    $stats = seo_autofix_get_stats();
    $score = seo_autofix_calculate_score($stats);
    $score_class = $score >= 80 ? 'score-good' : ($score >= 50 ? 'score-ok' : 'score-bad');
    $settings = get_option('seo_autofix_settings', array());
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1><span class="dashicons dashicons-admin-tools"></span> SEO AutoFix Pro Dashboard</h1>
        
        <div class="seo-autofix-grid">
            <div class="seo-autofix-card" style="text-align:center;">
                <div class="seo-autofix-score <?php echo $score_class; ?>"><?php echo $score; ?></div>
                <h2 style="margin:0 0 10px;">SEO Health Score</h2>
                <p style="color:#646970; margin:0;">
                    <?php
                    if ($score >= 80) echo 'Excellent! Your site is well optimized.';
                    elseif ($score >= 50) echo 'Good, but there\'s room for improvement.';
                    else echo 'Needs attention! Fix the issues below.';
                    ?>
                </p>
            </div>
            
            <div class="seo-autofix-card">
                <h3 style="margin-top:0;"><span class="dashicons dashicons-yes-alt"></span> Quick Status</h3>
                <ul class="seo-autofix-checklist">
                    <li>
                        <span class="<?php echo is_ssl() ? 'check-pass' : 'check-fail'; ?>"><?php echo is_ssl() ? '✔' : '✘'; ?></span>
                        HTTPS <?php echo is_ssl() ? 'Enabled' : 'Not Enabled'; ?>
                    </li>
                    <li>
                        <span class="<?php echo !empty($settings['enable_security_headers']) ? 'check-pass' : 'check-warn'; ?>"><?php echo !empty($settings['enable_security_headers']) ? '✔' : '⚠'; ?></span>
                        Security Headers
                    </li>
                    <li>
                        <span class="<?php echo !empty($settings['enable_schema']) ? 'check-pass' : 'check-warn'; ?>"><?php echo !empty($settings['enable_schema']) ? '✔' : '⚠'; ?></span>
                        Schema Markup
                    </li>
                    <li>
                        <span class="<?php echo !empty($settings['enable_sitemap']) ? 'check-pass' : 'check-warn'; ?>"><?php echo !empty($settings['enable_sitemap']) ? '✔' : '⚠'; ?></span>
                        XML Sitemap
                    </li>
                    <li>
                        <span class="<?php echo !empty($settings['enable_remote_api']) ? 'check-pass' : 'check-warn'; ?>"><?php echo !empty($settings['enable_remote_api']) ? '✔' : '⚠'; ?></span>
                        Remote API
                        <a href="<?php echo admin_url('admin.php?page=seo-auto-fix-api'); ?>" class="button button-small">Connect</a>
                    </li>
                </ul>
            </div>
        </div>
        
        <div class="seo-autofix-grid-3">
            <div class="seo-autofix-card">
                <h3 style="margin-top:0;"><span class="dashicons dashicons-format-image"></span> Images</h3>
                <div class="seo-autofix-stat">
                    <div class="seo-autofix-stat-value"><?php echo $stats['total_images']; ?></div>
                    <div class="seo-autofix-stat-label">Total Images</div>
                </div>
                <p><strong><?php echo $stats['images_without_alt']; ?></strong> images missing alt text</p>
                <div class="seo-autofix-btn-group">
                    <a href="<?php echo admin_url('admin.php?page=seo-auto-fix-images'); ?>" class="button button-primary">Fix</a>
                </div>
            </div>
            
            <div class="seo-autofix-card">
                <h3 style="margin-top:0;"><span class="dashicons dashicons-admin-links"></span> Links</h3>
                <div class="seo-autofix-stat">
                    <div class="seo-autofix-stat-value"><?php echo $stats['broken_links']; ?></div>
                    <div class="seo-autofix-stat-label">Broken Links</div>
                </div>
                <div class="seo-autofix-btn-group">
                    <a href="<?php echo admin_url('admin.php?page=seo-auto-fix-links'); ?>" class="button button-primary">Scan</a>
                </div>
            </div>
            
            <div class="seo-autofix-card">
                <h3 style="margin-top:0;"><span class="dashicons dashicons-edit"></span> Content</h3>
                <div class="seo-autofix-stat">
                    <div class="seo-autofix-stat-value"><?php echo $stats['posts_without_meta']; ?></div>
                    <div class="seo-autofix-stat-label">Missing Meta</div>
                </div>
                <div class="seo-autofix-btn-group">
                    <a href="<?php echo admin_url('admin.php?page=seo-auto-fix-meta'); ?>" class="button button-primary">Fix</a>
                </div>
            </div>
        </div>
    </div>
    <?php
}

// Include the rest of admin pages (keeping them shorter for brevity)
// These functions are the same as v3.0 but with minor updates

function seo_autofix_images_page() {
    global $wpdb;
    
    if (isset($_POST['save_alt_texts']) && check_admin_referer('seo_autofix_save_alt')) {
        $updated = 0;
        if (!empty($_POST['alt_text'])) {
            foreach ($_POST['alt_text'] as $id => $alt) {
                update_post_meta(intval($id), '_wp_attachment_image_alt', sanitize_text_field($alt));
                $updated++;
            }
        }
        echo '<div class="notice notice-success"><p>Updated ' . $updated . ' alt texts.</p></div>';
    }
    
    if (isset($_POST['generate_all_alt']) && check_admin_referer('seo_autofix_generate_alt')) {
        $images = $wpdb->get_results("SELECT p.ID, p.post_title FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt' WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%' AND (pm.meta_value IS NULL OR pm.meta_value = '')");
        $updated = 0;
        foreach ($images as $img) {
            $alt = ucfirst(preg_replace('/[-_]+/', ' ', pathinfo($img->post_title, PATHINFO_FILENAME)));
            if ($alt) { update_post_meta($img->ID, '_wp_attachment_image_alt', sanitize_text_field($alt)); $updated++; }
        }
        echo '<div class="notice notice-success"><p>Generated alt for ' . $updated . ' images.</p></div>';
    }
    
    $images = $wpdb->get_results("SELECT p.ID, p.post_title, p.guid FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt' WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%' AND (pm.meta_value IS NULL OR pm.meta_value = '') ORDER BY p.ID DESC LIMIT 50");
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Image Alt Text Editor</h1>
        <?php if (empty($images)): ?>
            <div class="seo-autofix-card" style="text-align:center;padding:40px;"><h2 style="color:#00a32a;">✅ All images have alt text!</h2></div>
        <?php else: ?>
            <div class="seo-autofix-card">
                <form method="post" style="margin-bottom:20px;"><?php wp_nonce_field('seo_autofix_generate_alt'); ?><button type="submit" name="generate_all_alt" class="button">Auto-Generate All</button></form>
                <form method="post"><?php wp_nonce_field('seo_autofix_save_alt'); ?>
                <table class="seo-autofix-table"><thead><tr><th>Image</th><th>Filename</th><th>Alt Text</th></tr></thead><tbody>
                <?php foreach ($images as $img): $thumb = wp_get_attachment_image_url($img->ID, 'thumbnail'); $suggested = ucfirst(preg_replace('/[-_]+/', ' ', pathinfo($img->post_title, PATHINFO_FILENAME))); ?>
                <tr><td><?php if ($thumb): ?><img src="<?php echo esc_url($thumb); ?>" style="max-width:60px;"><?php endif; ?></td><td><?php echo esc_html(basename($img->guid)); ?></td><td><input type="text" name="alt_text[<?php echo $img->ID; ?>]" value="<?php echo esc_attr($suggested); ?>" class="large-text"></td></tr>
                <?php endforeach; ?>
                </tbody></table><p><button type="submit" name="save_alt_texts" class="button button-primary">Save All</button></p></form>
            </div>
        <?php endif; ?>
    </div>
    <?php
}

function seo_autofix_ai_page() {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    $api_key = $settings['openai_api_key'] ?? '';
    
    if (isset($_POST['bulk_ai_generate']) && check_admin_referer('seo_autofix_bulk_ai') && $api_key) {
        $limit = min(5, intval($_POST['bulk_limit'] ?? 5));
        $images = $wpdb->get_results($wpdb->prepare("SELECT p.ID FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt' WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%%' AND (pm.meta_value IS NULL OR pm.meta_value = '') LIMIT %d", $limit));
        $success = 0;
        foreach ($images as $img) {
            $url = wp_get_attachment_url($img->ID);
            $alt = seo_autofix_generate_ai_alt($url, $api_key);
            if ($alt && !is_wp_error($alt)) { update_post_meta($img->ID, '_wp_attachment_image_alt', sanitize_text_field($alt)); $success++; }
            sleep(1);
        }
        echo '<div class="notice notice-success"><p>Generated AI alt for ' . $success . ' images.</p></div>';
    }
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>AI Alt Text Generator</h1>
        <?php if (!$api_key): ?>
            <div class="notice notice-warning"><p>Add OpenAI API key in <a href="<?php echo admin_url('admin.php?page=seo-auto-fix-settings'); ?>">Settings</a>.</p></div>
        <?php else: ?>
            <div class="seo-autofix-card">
                <h3>Bulk AI Generation</h3>
                <form method="post"><?php wp_nonce_field('seo_autofix_bulk_ai'); ?>
                <select name="bulk_limit"><option value="1">1</option><option value="3">3</option><option value="5" selected>5</option></select>
                <button type="submit" name="bulk_ai_generate" class="button button-primary">Generate with AI</button>
                <p class="description">~$0.01-0.03 per image</p></form>
            </div>
        <?php endif; ?>
    </div>
    <?php
}

function seo_autofix_bulk_page() {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    $quality = $settings['compression_quality'] ?? 82;
    
    if (isset($_POST['compress_images']) && check_admin_referer('seo_autofix_compress')) {
        $images = $wpdb->get_results("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_mime_type IN ('image/jpeg', 'image/png') LIMIT 20");
        $compressed = 0;
        foreach ($images as $img) {
            $file = get_attached_file($img->ID);
            if ($file && file_exists($file) && seo_autofix_compress_image($file, $quality)) $compressed++;
        }
        echo '<div class="notice notice-success"><p>Compressed ' . $compressed . ' images.</p></div>';
    }
    
    if (isset($_POST['create_webp']) && check_admin_referer('seo_autofix_webp') && function_exists('imagewebp')) {
        $images = $wpdb->get_results("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_mime_type IN ('image/jpeg', 'image/png') LIMIT 20");
        $converted = 0;
        foreach ($images as $img) {
            $file = get_attached_file($img->ID);
            if ($file && file_exists($file) && seo_autofix_create_webp($file, $quality)) $converted++;
        }
        echo '<div class="notice notice-success"><p>Created WebP for ' . $converted . ' images.</p></div>';
    }
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Bulk Image Optimization</h1>
        <div class="seo-autofix-grid">
            <div class="seo-autofix-card">
                <h3>Compress Images</h3>
                <form method="post"><?php wp_nonce_field('seo_autofix_compress'); ?><button type="submit" name="compress_images" class="button button-primary">Compress (20)</button></form>
            </div>
            <div class="seo-autofix-card">
                <h3>WebP Conversion</h3>
                <form method="post"><?php wp_nonce_field('seo_autofix_webp'); ?><button type="submit" name="create_webp" class="button button-primary" <?php echo !function_exists('imagewebp') ? 'disabled' : ''; ?>>Create WebP (20)</button></form>
            </div>
        </div>
    </div>
    <?php
}

function seo_autofix_meta_page() {
    global $wpdb;
    
    if (isset($_POST['save_meta']) && check_admin_referer('seo_autofix_save_meta')) {
        if (!empty($_POST['meta_desc'])) {
            foreach ($_POST['meta_desc'] as $id => $desc) {
                update_post_meta(intval($id), '_seo_autofix_description', sanitize_textarea_field($desc));
                if (!empty($_POST['meta_title'][$id])) update_post_meta(intval($id), '_seo_autofix_title', sanitize_text_field($_POST['meta_title'][$id]));
            }
        }
        echo '<div class="notice notice-success"><p>Meta saved!</p></div>';
    }
    
    if (isset($_POST['auto_generate_meta']) && check_admin_referer('seo_autofix_auto_meta')) {
        $posts = $wpdb->get_results("SELECT p.ID, p.post_title, p.post_excerpt, p.post_content FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_seo_autofix_description' WHERE p.post_type IN ('post', 'page') AND p.post_status = 'publish' AND (pm.meta_value IS NULL OR pm.meta_value = '')");
        $updated = 0;
        foreach ($posts as $post) {
            $desc = $post->post_excerpt ?: wp_trim_words(strip_tags($post->post_content), 25, '...');
            if ($desc) { update_post_meta($post->ID, '_seo_autofix_description', sanitize_textarea_field($desc)); update_post_meta($post->ID, '_seo_autofix_title', sanitize_text_field($post->post_title)); $updated++; }
        }
        echo '<div class="notice notice-success"><p>Generated meta for ' . $updated . ' posts.</p></div>';
    }
    
    $posts = $wpdb->get_results("SELECT p.ID, p.post_title, pm_desc.meta_value as seo_desc FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm_desc ON p.ID = pm_desc.post_id AND pm_desc.meta_key = '_seo_autofix_description' WHERE p.post_type IN ('post', 'page') AND p.post_status = 'publish' ORDER BY p.post_date DESC LIMIT 30");
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Meta Editor</h1>
        <div class="seo-autofix-card">
            <form method="post" style="margin-bottom:20px;"><?php wp_nonce_field('seo_autofix_auto_meta'); ?><button type="submit" name="auto_generate_meta" class="button">Auto-Generate Missing</button></form>
            <form method="post"><?php wp_nonce_field('seo_autofix_save_meta'); ?>
            <table class="seo-autofix-table"><thead><tr><th>Title</th><th>Meta Description</th></tr></thead><tbody>
            <?php foreach ($posts as $post): ?>
            <tr><td><strong><?php echo esc_html(wp_trim_words($post->post_title, 6)); ?></strong><input type="hidden" name="meta_title[<?php echo $post->ID; ?>]" value="<?php echo esc_attr($post->post_title); ?>"></td><td><textarea name="meta_desc[<?php echo $post->ID; ?>]" rows="2" class="large-text"><?php echo esc_textarea($post->seo_desc); ?></textarea></td></tr>
            <?php endforeach; ?>
            </tbody></table><p><button type="submit" name="save_meta" class="button button-primary">Save All</button></p></form>
        </div>
    </div>
    <?php
}

function seo_autofix_links_page() {
    global $wpdb;
    $broken = get_option('seo_autofix_broken_links', array());
    
    if (isset($_POST['scan_links']) && check_admin_referer('seo_autofix_scan_links')) {
        $posts = $wpdb->get_results("SELECT ID, post_content FROM {$wpdb->posts} WHERE post_type IN ('post', 'page') AND post_status = 'publish' LIMIT 50");
        $broken = array();
        foreach ($posts as $post) {
            preg_match_all('/<a[^>]+href=["\']([^"\']+)["\'][^>]*>/i', $post->post_content, $matches);
            if (!empty($matches[1])) {
                foreach ($matches[1] as $url) {
                    if (strpos($url, '#') === 0 || strpos($url, 'mailto:') === 0) continue;
                    $check = (strpos($url, '/') === 0) ? home_url($url) : $url;
                    $resp = wp_remote_head($check, array('timeout' => 5, 'sslverify' => false));
                    $code = wp_remote_retrieve_response_code($resp);
                    if (is_wp_error($resp) || $code >= 400) {
                        $broken[] = array('url' => $url, 'post_id' => $post->ID, 'status' => is_wp_error($resp) ? 'Error' : $code);
                    }
                }
            }
        }
        update_option('seo_autofix_broken_links', $broken);
        update_option('seo_autofix_last_link_scan', current_time('mysql'));
    }
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Broken Link Checker</h1>
        <div class="seo-autofix-card">
            <form method="post"><?php wp_nonce_field('seo_autofix_scan_links'); ?><button type="submit" name="scan_links" class="button button-primary">Scan Links (50 posts)</button></form>
            <p>Last scan: <?php echo get_option('seo_autofix_last_link_scan', 'Never'); ?></p>
        </div>
        <?php if ($broken): ?>
        <div class="seo-autofix-card">
            <h3><?php echo count($broken); ?> Broken Links</h3>
            <table class="seo-autofix-table"><thead><tr><th>URL</th><th>Status</th><th>Action</th></tr></thead><tbody>
            <?php foreach ($broken as $link): ?>
            <tr><td><code><?php echo esc_html($link['url']); ?></code></td><td><?php echo esc_html($link['status']); ?></td><td><a href="<?php echo get_edit_post_link($link['post_id']); ?>" class="button button-small">Edit</a></td></tr>
            <?php endforeach; ?>
            </tbody></table>
        </div>
        <?php endif; ?>
    </div>
    <?php
}

function seo_autofix_redirects_page() {
    global $wpdb;
    $table = $wpdb->prefix . 'seo_autofix_redirects';
    
    if (isset($_POST['add_redirect']) && check_admin_referer('seo_autofix_add_redirect')) {
        $wpdb->insert($table, array('source_url' => sanitize_text_field($_POST['source_url']), 'target_url' => esc_url_raw($_POST['target_url']), 'redirect_type' => intval($_POST['redirect_type'])));
    }
    if (isset($_GET['delete_redirect'])) { $wpdb->delete($table, array('id' => intval($_GET['delete_redirect']))); }
    
    $redirects = $wpdb->get_results("SELECT * FROM $table ORDER BY id DESC LIMIT 100");
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Redirects</h1>
        <div class="seo-autofix-card">
            <form method="post"><?php wp_nonce_field('seo_autofix_add_redirect'); ?>
            <input type="text" name="source_url" placeholder="/old-page/" required>
            <input type="url" name="target_url" placeholder="https://..." required>
            <select name="redirect_type"><option value="301">301</option><option value="302">302</option></select>
            <button type="submit" name="add_redirect" class="button button-primary">Add</button></form>
        </div>
        <?php if ($redirects): ?>
        <div class="seo-autofix-card">
            <table class="seo-autofix-table"><thead><tr><th>Source</th><th>Target</th><th>Type</th><th>Hits</th><th></th></tr></thead><tbody>
            <?php foreach ($redirects as $r): ?>
            <tr><td><code><?php echo esc_html($r->source_url); ?></code></td><td><code><?php echo esc_html($r->target_url); ?></code></td><td><?php echo $r->redirect_type; ?></td><td><?php echo $r->hits; ?></td><td><a href="?page=seo-auto-fix-redirects&delete_redirect=<?php echo $r->id; ?>" class="button button-small">Delete</a></td></tr>
            <?php endforeach; ?>
            </tbody></table>
        </div>
        <?php endif; ?>
    </div>
    <?php
}

function seo_autofix_sitemap_page() {
    if (isset($_POST['generate_sitemap']) && check_admin_referer('seo_autofix_sitemap')) { seo_autofix_generate_sitemap(); echo '<div class="notice notice-success"><p>Sitemap generated!</p></div>'; }
    if (isset($_POST['ping_engines']) && check_admin_referer('seo_autofix_sitemap')) {
        $url = home_url('/sitemap.xml');
        wp_remote_get('https://www.google.com/ping?sitemap=' . urlencode($url), array('timeout' => 10));
        wp_remote_get('https://www.bing.com/ping?sitemap=' . urlencode($url), array('timeout' => 10));
        echo '<div class="notice notice-success"><p>Pinged search engines!</p></div>';
    }
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>XML Sitemap</h1>
        <div class="seo-autofix-card">
            <p>URL: <a href="<?php echo home_url('/sitemap.xml'); ?>" target="_blank"><?php echo home_url('/sitemap.xml'); ?></a></p>
            <form method="post" style="display:inline;"><?php wp_nonce_field('seo_autofix_sitemap'); ?><button type="submit" name="generate_sitemap" class="button button-primary">Generate</button></form>
            <form method="post" style="display:inline;"><?php wp_nonce_field('seo_autofix_sitemap'); ?><button type="submit" name="ping_engines" class="button">Ping Search Engines</button></form>
        </div>
    </div>
    <?php
}

function seo_autofix_robots_page() {
    $settings = get_option('seo_autofix_settings', array());
    if (isset($_POST['save_robots']) && check_admin_referer('seo_autofix_robots')) { $settings['custom_robots_txt'] = sanitize_textarea_field($_POST['robots']); update_option('seo_autofix_settings', $settings); }
    $default = "User-agent: *\nDisallow: /wp-admin/\nDisallow: /wp-includes/\nAllow: /wp-admin/admin-ajax.php\nSitemap: " . home_url('/sitemap.xml');
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Robots.txt</h1>
        <div class="seo-autofix-card">
            <form method="post"><?php wp_nonce_field('seo_autofix_robots'); ?>
            <textarea name="robots" rows="12" class="large-text code"><?php echo esc_textarea($settings['custom_robots_txt'] ?: $default); ?></textarea>
            <p><button type="submit" name="save_robots" class="button button-primary">Save</button></p></form>
        </div>
    </div>
    <?php
}

function seo_autofix_social_page() {
    $settings = get_option('seo_autofix_settings', array());
    if (isset($_POST['save_social']) && check_admin_referer('seo_autofix_social')) {
        $settings['enable_og_tags'] = isset($_POST['enable_og_tags']);
        $settings['enable_twitter_cards'] = isset($_POST['enable_twitter_cards']);
        $settings['default_og_image'] = esc_url_raw($_POST['default_og_image']);
        $settings['twitter_card_type'] = sanitize_text_field($_POST['twitter_card_type']);
        $settings['twitter_site'] = sanitize_text_field($_POST['twitter_site']);
        update_option('seo_autofix_settings', $settings);
    }
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Social Tags</h1>
        <div class="seo-autofix-card">
            <form method="post"><?php wp_nonce_field('seo_autofix_social'); ?>
            <p><label><input type="checkbox" name="enable_og_tags" <?php checked(!empty($settings['enable_og_tags'])); ?>> Enable Open Graph</label></p>
            <p><label><input type="checkbox" name="enable_twitter_cards" <?php checked(!empty($settings['enable_twitter_cards'])); ?>> Enable Twitter Cards</label></p>
            <p>Default Image: <input type="url" name="default_og_image" value="<?php echo esc_attr($settings['default_og_image'] ?? ''); ?>" class="large-text"></p>
            <p>Twitter Card: <select name="twitter_card_type"><option value="summary" <?php selected($settings['twitter_card_type'] ?? '', 'summary'); ?>>Summary</option><option value="summary_large_image" <?php selected($settings['twitter_card_type'] ?? '', 'summary_large_image'); ?>>Large Image</option></select></p>
            <p>Twitter @: <input type="text" name="twitter_site" value="<?php echo esc_attr($settings['twitter_site'] ?? ''); ?>"></p>
            <p><button type="submit" name="save_social" class="button button-primary">Save</button></p></form>
        </div>
    </div>
    <?php
}

function seo_autofix_schema_page() {
    $settings = get_option('seo_autofix_settings', array());
    if (isset($_POST['save_schema']) && check_admin_referer('seo_autofix_schema')) {
        $settings['enable_schema'] = isset($_POST['enable_schema']);
        $settings['business_name'] = sanitize_text_field($_POST['business_name']);
        $settings['business_type'] = sanitize_text_field($_POST['business_type']);
        $settings['business_phone'] = sanitize_text_field($_POST['business_phone']);
        $settings['business_email'] = sanitize_email($_POST['business_email']);
        $settings['business_address'] = sanitize_text_field($_POST['business_address']);
        $settings['business_city'] = sanitize_text_field($_POST['business_city']);
        $settings['business_country'] = sanitize_text_field($_POST['business_country']);
        update_option('seo_autofix_settings', $settings);
    }
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Schema Markup</h1>
        <div class="seo-autofix-card">
            <form method="post"><?php wp_nonce_field('seo_autofix_schema'); ?>
            <p><label><input type="checkbox" name="enable_schema" <?php checked(!empty($settings['enable_schema'])); ?>> Enable Schema</label></p>
            <p>Business Name: <input type="text" name="business_name" value="<?php echo esc_attr($settings['business_name'] ?? ''); ?>" class="regular-text"></p>
            <p>Type: <select name="business_type"><?php foreach (array('LocalBusiness','Restaurant','Store','ProfessionalService') as $t): ?><option <?php selected($settings['business_type'] ?? '', $t); ?>><?php echo $t; ?></option><?php endforeach; ?></select></p>
            <p>Phone: <input type="text" name="business_phone" value="<?php echo esc_attr($settings['business_phone'] ?? ''); ?>"></p>
            <p>Email: <input type="email" name="business_email" value="<?php echo esc_attr($settings['business_email'] ?? ''); ?>"></p>
            <p>Address: <input type="text" name="business_address" value="<?php echo esc_attr($settings['business_address'] ?? ''); ?>" class="regular-text"></p>
            <p>City: <input type="text" name="business_city" value="<?php echo esc_attr($settings['business_city'] ?? ''); ?>"></p>
            <p>Country: <input type="text" name="business_country" value="<?php echo esc_attr($settings['business_country'] ?? ''); ?>"></p>
            <p><button type="submit" name="save_schema" class="button button-primary">Save</button></p></form>
        </div>
    </div>
    <?php
}

function seo_autofix_database_page() {
    global $wpdb;
    if (isset($_POST['cleanup']) && check_admin_referer('seo_autofix_cleanup')) {
        $type = sanitize_text_field($_POST['cleanup']);
        if ($type === 'revisions') $wpdb->query("DELETE FROM {$wpdb->posts} WHERE post_type = 'revision'");
        if ($type === 'spam') $wpdb->query("DELETE FROM {$wpdb->comments} WHERE comment_approved = 'spam'");
        if ($type === 'trash') $wpdb->query("DELETE FROM {$wpdb->posts} WHERE post_status = 'trash'");
        if ($type === 'transients') $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%'");
        if ($type === 'optimize') { $tables = $wpdb->get_results("SHOW TABLES", ARRAY_N); foreach ($tables as $t) $wpdb->query("OPTIMIZE TABLE {$t[0]}"); }
        echo '<div class="notice notice-success"><p>Done!</p></div>';
    }
    $stats = array(
        'revisions' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'revision'"),
        'spam' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->comments} WHERE comment_approved = 'spam'"),
        'trash' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_status = 'trash'"),
    );
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Database Cleanup</h1>
        <div class="seo-autofix-grid-3">
            <div class="seo-autofix-card"><h3>Revisions: <?php echo $stats['revisions']; ?></h3><form method="post"><?php wp_nonce_field('seo_autofix_cleanup'); ?><input type="hidden" name="cleanup" value="revisions"><button class="button">Delete</button></form></div>
            <div class="seo-autofix-card"><h3>Spam: <?php echo $stats['spam']; ?></h3><form method="post"><?php wp_nonce_field('seo_autofix_cleanup'); ?><input type="hidden" name="cleanup" value="spam"><button class="button">Delete</button></form></div>
            <div class="seo-autofix-card"><h3>Trash: <?php echo $stats['trash']; ?></h3><form method="post"><?php wp_nonce_field('seo_autofix_cleanup'); ?><input type="hidden" name="cleanup" value="trash"><button class="button">Delete</button></form></div>
        </div>
        <div class="seo-autofix-card"><form method="post"><?php wp_nonce_field('seo_autofix_cleanup'); ?><input type="hidden" name="cleanup" value="optimize"><button class="button button-primary">Optimize Database</button></form></div>
    </div>
    <?php
}

function seo_autofix_settings_page() {
    $settings = get_option('seo_autofix_settings', array());
    if (isset($_POST['save_settings']) && check_admin_referer('seo_autofix_settings')) {
        $settings['openai_api_key'] = sanitize_text_field($_POST['openai_api_key']);
        $settings['enable_image_compression'] = isset($_POST['enable_image_compression']);
        $settings['enable_webp_conversion'] = isset($_POST['enable_webp_conversion']);
        $settings['compression_quality'] = max(1, min(100, intval($_POST['compression_quality'])));
        $settings['enable_lazy_loading'] = isset($_POST['enable_lazy_loading']);
        $settings['enable_security_headers'] = isset($_POST['enable_security_headers']);
        $settings['enable_sitemap'] = isset($_POST['enable_sitemap']);
        $settings['enable_remote_api'] = isset($_POST['enable_remote_api']);
        // Auto-indexing settings
        $settings['enable_auto_indexing'] = isset($_POST['enable_auto_indexing']);
        $settings['indexnow_api_key'] = sanitize_text_field($_POST['indexnow_api_key'] ?? '');
        $settings['google_service_account_key'] = sanitize_textarea_field($_POST['google_service_account_key'] ?? '');
        // Social settings
        $settings['enable_og_tags'] = isset($_POST['enable_og_tags']);
        $settings['enable_twitter_cards'] = isset($_POST['enable_twitter_cards']);
        $settings['enable_schema'] = isset($_POST['enable_schema']);
        $settings['enable_debug_log'] = isset($_POST['enable_debug_log']);
        update_option('seo_autofix_settings', $settings);
        
        // Generate IndexNow key file if key is set
        if (!empty($settings['indexnow_api_key'])) {
            @file_put_contents(ABSPATH . $settings['indexnow_api_key'] . '.txt', $settings['indexnow_api_key']);
        }
        
        echo '<div class="notice notice-success"><p>Saved!</p></div>';
    }
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>Settings</h1>
        
        <div class="seo-autofix-grid">
            <div class="seo-autofix-card">
                <form method="post"><?php wp_nonce_field('seo_autofix_settings'); ?>
                <h3 style="margin-top:0;">🤖 AI Settings</h3>
                <p>OpenAI API Key: <input type="password" name="openai_api_key" value="<?php echo esc_attr($settings['openai_api_key'] ?? ''); ?>" class="large-text"></p>
                <p class="description">Used for AI-powered alt text generation</p>
                
                <h3>🖼️ Images</h3>
                <p><label><input type="checkbox" name="enable_image_compression" <?php checked(!empty($settings['enable_image_compression'])); ?>> Auto-compress on upload</label></p>
                <p><label><input type="checkbox" name="enable_webp_conversion" <?php checked(!empty($settings['enable_webp_conversion'])); ?>> Create WebP on upload</label></p>
                <p>Quality: <input type="number" name="compression_quality" value="<?php echo esc_attr($settings['compression_quality'] ?? 82); ?>" min="1" max="100" style="width:60px;"></p>
                <p><label><input type="checkbox" name="enable_lazy_loading" <?php checked(!empty($settings['enable_lazy_loading'])); ?>> Lazy loading</label></p>
                
                <h3>🔒 Security & Technical</h3>
                <p><label><input type="checkbox" name="enable_security_headers" <?php checked(!empty($settings['enable_security_headers'])); ?>> Security headers</label></p>
                <p><label><input type="checkbox" name="enable_sitemap" <?php checked(!empty($settings['enable_sitemap'])); ?>> Auto sitemap</label></p>
                
                <h3>📱 Social Media</h3>
                <p><label><input type="checkbox" name="enable_og_tags" <?php checked(!empty($settings['enable_og_tags'])); ?>> Enable Open Graph tags</label></p>
                <p><label><input type="checkbox" name="enable_twitter_cards" <?php checked(!empty($settings['enable_twitter_cards'])); ?>> Enable Twitter Cards</label></p>
                <p><label><input type="checkbox" name="enable_schema" <?php checked(!empty($settings['enable_schema'])); ?>> Enable Schema markup</label></p>
                
                <h3>🔌 Remote API</h3>
                <p><label><input type="checkbox" name="enable_remote_api" <?php checked(!empty($settings['enable_remote_api'])); ?>> Enable remote API access</label></p>
                <p>API Key: <code><?php echo esc_html(get_option('seo_autofix_api_key', 'Not generated yet')); ?></code></p>
                
                <h3>🐛 Debug</h3>
                <p><label><input type="checkbox" name="enable_debug_log" <?php checked(!empty($settings['enable_debug_log'])); ?>> Enable debug logging</label></p>
                <p class="description">Logs all API requests and fixes to <a href="<?php echo admin_url('admin.php?page=seo-auto-fix-debug'); ?>">Debug Logs</a></p>
            </div>
            
            <div class="seo-autofix-card">
                <h3 style="margin-top:0;">🚀 Auto-Indexing (Google & Bing)</h3>
                <p class="description">Automatically submit new posts to search engines when published</p>
                
                <p><label><input type="checkbox" name="enable_auto_indexing" <?php checked(!empty($settings['enable_auto_indexing'])); ?>> <strong>Enable Auto-Indexing on Publish</strong></label></p>
                
                <h4>IndexNow API (Free - Bing, Yandex)</h4>
                <p>
                    <input type="text" name="indexnow_api_key" value="<?php echo esc_attr($settings['indexnow_api_key'] ?? ''); ?>" class="large-text" placeholder="Your IndexNow API key">
                </p>
                <p class="description">
                    <a href="https://www.bing.com/indexnow" target="_blank">Get free IndexNow key from Bing</a>
                </p>
                
                <h4>Google Indexing API</h4>
                <p>
                    <textarea name="google_service_account_key" rows="5" class="large-text" placeholder="Paste Google Service Account JSON"><?php echo esc_textarea($settings['google_service_account_key'] ?? ''); ?></textarea>
                </p>
                <p class="description">
                    <a href="https://developers.google.com/search/apis/indexing-api/v3/quickstart" target="_blank">Setup Google Indexing API</a>
                </p>
                
                <?php if (!empty($settings['enable_auto_indexing'])): ?>
                <div style="background:#d4edda; padding:10px; border-radius:4px; margin-top:15px;">
                    <strong>✅ Auto-indexing is active!</strong>
                    <p style="margin:5px 0 0;">New posts will be submitted to:
                    <?php 
                    $services = array();
                    if (!empty($settings['indexnow_api_key'])) $services[] = 'IndexNow';
                    if (!empty($settings['google_service_account_key'])) $services[] = 'Google';
                    if (!empty($settings['enable_sitemap'])) $services[] = 'Sitemap Ping';
                    echo implode(', ', $services) ?: 'Configure API keys above';
                    ?>
                    </p>
                </div>
                <?php endif; ?>
                
                <p style="margin-top:20px;"><button type="submit" name="save_settings" class="button button-primary button-hero">Save All Settings</button></p>
                </form>
            </div>
        </div>
    </div>
    <?php
}

// ==================== DEBUG LOGS PAGE ====================
function seo_autofix_debug_page() {
    $settings = get_option('seo_autofix_settings', array());
    $logs = get_option('seo_autofix_debug_log', array());
    
    // Handle clear logs action
    if (isset($_POST['clear_logs']) && check_admin_referer('seo_autofix_debug')) {
        delete_option('seo_autofix_debug_log');
        $logs = array();
        echo '<div class="notice notice-success"><p>Debug logs cleared!</p></div>';
    }
    
    // Handle toggle debug action
    if (isset($_POST['toggle_debug']) && check_admin_referer('seo_autofix_debug')) {
        $settings['enable_debug_log'] = !$settings['enable_debug_log'];
        update_option('seo_autofix_settings', $settings);
        echo '<div class="notice notice-success"><p>Debug logging ' . ($settings['enable_debug_log'] ? 'enabled' : 'disabled') . '!</p></div>';
    }
    ?>
    <div class="wrap seo-autofix-wrap">
        <h1>🐛 Debug Logs</h1>
        
        <div class="seo-autofix-card" style="margin-bottom:20px;">
            <form method="post" style="display:flex; gap:10px; align-items:center;">
                <?php wp_nonce_field('seo_autofix_debug'); ?>
                <button type="submit" name="toggle_debug" class="button <?php echo $settings['enable_debug_log'] ? 'button-secondary' : 'button-primary'; ?>">
                    <?php echo $settings['enable_debug_log'] ? '⏸️ Disable Debug Logging' : '▶️ Enable Debug Logging'; ?>
                </button>
                <button type="submit" name="clear_logs" class="button" onclick="return confirm('Clear all debug logs?');">🗑️ Clear Logs</button>
                <span style="margin-left:auto;">
                    Status: <strong style="color:<?php echo $settings['enable_debug_log'] ? '#46b450' : '#dc3232'; ?>">
                        <?php echo $settings['enable_debug_log'] ? '● Active' : '○ Inactive'; ?>
                    </strong>
                </span>
            </form>
        </div>
        
        <div class="seo-autofix-card">
            <h3 style="margin-top:0;">📋 API Request Logs (Last 100)</h3>
            <p class="description">Shows all incoming fix requests from the SaaS platform and their results</p>
            
            <?php if (empty($logs)): ?>
                <div style="padding:40px; text-align:center; color:#666;">
                    <p style="font-size:48px; margin:0;">📭</p>
                    <p>No debug logs yet.</p>
                    <p class="description">Enable debug logging and trigger some fixes from your SEO audit dashboard to see logs here.</p>
                </div>
            <?php else: ?>
                <div style="max-height:600px; overflow-y:auto; font-family:monospace; font-size:12px; background:#1e1e1e; color:#d4d4d4; padding:15px; border-radius:4px;">
                    <?php foreach ($logs as $idx => $log): ?>
                        <div style="padding:8px 0; border-bottom:1px solid #333; <?php echo $idx === 0 ? 'background:#2d2d30;' : ''; ?>">
                            <?php 
                            // Color-code based on content
                            $color = '#d4d4d4';
                            if (strpos($log, 'request received') !== false) $color = '#569cd6';
                            if (strpos($log, 'updated') !== false || strpos($log, 'fixed') !== false || strpos($log, 'set') !== false) $color = '#4ec9b0';
                            if (strpos($log, 'not found') !== false || strpos($log, 'error') !== false) $color = '#f14c4c';
                            ?>
                            <span style="color:<?php echo $color; ?>"><?php echo esc_html($log); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
                <p class="description" style="margin-top:10px;">
                    💡 <strong>Tip:</strong> Open browser DevTools console (F12) on your SEO audit page to see frontend logs
                </p>
            <?php endif; ?>
        </div>
        
        <div class="seo-autofix-card" style="margin-top:20px;">
            <h3 style="margin-top:0;">🔍 Debug Checklist</h3>
            <table class="widefat" style="margin-top:10px;">
                <tbody>
                    <tr>
                        <td><strong>Remote API</strong></td>
                        <td><?php echo !empty($settings['enable_remote_api']) ? '✅ Enabled' : '❌ Disabled'; ?></td>
                        <td class="description">Must be enabled for fixes to work</td>
                    </tr>
                    <tr>
                        <td><strong>API Key</strong></td>
                        <td><?php echo get_option('seo_autofix_api_key') ? '✅ Set' : '❌ Not set'; ?></td>
                        <td class="description"><?php echo get_option('seo_autofix_api_key') ? '<code>' . substr(get_option('seo_autofix_api_key'), 0, 8) . '...</code>' : 'Generate in API / Connect page'; ?></td>
                    </tr>
                    <tr>
                        <td><strong>Debug Logging</strong></td>
                        <td><?php echo !empty($settings['enable_debug_log']) ? '✅ Enabled' : '⚪ Disabled'; ?></td>
                        <td class="description">Enable to see detailed request logs</td>
                    </tr>
                    <tr>
                        <td><strong>Log Entries</strong></td>
                        <td><?php echo count($logs); ?> entries</td>
                        <td class="description">Max 100 entries kept</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <?php
}

// ==================== HELPER FUNCTIONS ====================
function seo_autofix_get_stats() {
    global $wpdb;
    return array(
        'total_images' => intval($wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_mime_type LIKE 'image/%'")),
        'images_without_alt' => intval($wpdb->get_var("SELECT COUNT(p.ID) FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt' WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%' AND (pm.meta_value IS NULL OR pm.meta_value = '')")),
        'broken_links' => count(get_option('seo_autofix_broken_links', array())),
        'posts_without_meta' => intval($wpdb->get_var("SELECT COUNT(p.ID) FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_seo_autofix_description' WHERE p.post_type IN ('post','page') AND p.post_status = 'publish' AND (pm.meta_value IS NULL OR pm.meta_value = '')")),
    );
}

function seo_autofix_calculate_score($stats) {
    $score = 100;
    if ($stats['total_images'] > 0 && $stats['images_without_alt'] > 0) $score -= min(25, round(($stats['images_without_alt'] / $stats['total_images']) * 25));
    if ($stats['broken_links'] > 0) $score -= min(15, $stats['broken_links'] * 3);
    if ($stats['posts_without_meta'] > 0) $score -= min(15, $stats['posts_without_meta']);
    if (!is_ssl()) $score -= 15;
    $settings = get_option('seo_autofix_settings', array());
    if (empty($settings['enable_security_headers'])) $score -= 5;
    if (empty($settings['enable_schema'])) $score -= 5;
    return max(0, min(100, $score));
}

function seo_autofix_compress_image($file, $quality = 82) {
    if (!function_exists('imagecreatefromjpeg')) return false;
    $type = wp_check_filetype($file);
    if ($type['type'] === 'image/jpeg') { $img = @imagecreatefromjpeg($file); if ($img) { imagejpeg($img, $file, $quality); imagedestroy($img); return true; } }
    if ($type['type'] === 'image/png') { $img = @imagecreatefrompng($file); if ($img) { imagepng($img, $file, round(9 - ($quality / 100 * 9))); imagedestroy($img); return true; } }
    return false;
}

function seo_autofix_create_webp($file, $quality = 82) {
    if (!function_exists('imagewebp')) return false;
    $type = wp_check_filetype($file);
    $webp = preg_replace('/\.(jpe?g|png)$/i', '.webp', $file);
    if ($type['type'] === 'image/jpeg') { $img = @imagecreatefromjpeg($file); }
    elseif ($type['type'] === 'image/png') { $img = @imagecreatefrompng($file); if ($img) { imagepalettetotruecolor($img); imagealphablending($img, true); imagesavealpha($img, true); } }
    else return false;
    if ($img) { imagewebp($img, $webp, $quality); imagedestroy($img); return true; }
    return false;
}

function seo_autofix_generate_ai_alt($url, $api_key) {
    $resp = wp_remote_post('https://api.openai.com/v1/chat/completions', array(
        'timeout' => 60,
        'headers' => array('Authorization' => 'Bearer ' . $api_key, 'Content-Type' => 'application/json'),
        'body' => json_encode(array('model' => 'gpt-4o-mini', 'messages' => array(array('role' => 'user', 'content' => array(array('type' => 'text', 'text' => 'Generate concise alt text under 125 chars for this image. Return only the alt text.'), array('type' => 'image_url', 'image_url' => array('url' => $url))))), 'max_tokens' => 100)),
    ));
    if (is_wp_error($resp)) return $resp;
    $body = json_decode(wp_remote_retrieve_body($resp), true);
    return isset($body['choices'][0]['message']['content']) ? trim($body['choices'][0]['message']['content']) : new WP_Error('error', 'Failed');
}

function seo_autofix_generate_sitemap() {
    $posts = get_posts(array('post_type' => array('post', 'page'), 'post_status' => 'publish', 'posts_per_page' => -1));
    $xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    $xml .= '<url><loc>' . home_url('/') . '</loc><changefreq>daily</changefreq><priority>1.0</priority></url>';
    foreach ($posts as $p) $xml .= '<url><loc>' . get_permalink($p->ID) . '</loc><lastmod>' . get_the_modified_date('c', $p->ID) . '</lastmod></url>';
    $xml .= '</urlset>';
    file_put_contents(ABSPATH . 'sitemap.xml', $xml);
}

// ==================== CONTENT PUBLISHING API ====================
function seo_autofix_api_publish_content($request) {
    $params = $request->get_json_params() ?: $request->get_params();
    
    $title = sanitize_text_field($params['title'] ?? '');
    $content = wp_kses_post($params['content'] ?? '');
    $location = sanitize_text_field($params['location'] ?? '');
    $content_type = sanitize_text_field($params['contentType'] ?? 'blog post');
    $primary_keywords = array_map('sanitize_text_field', (array) ($params['primaryKeywords'] ?? []));
    $status = sanitize_text_field($params['status'] ?? 'draft');
    $tags = array_map('sanitize_text_field', (array) ($params['tags'] ?? []));
    
    // Validate required fields
    if (empty($title) || empty($content)) {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'Title and content are required'
        ), 400);
    }
    
    // Create post array
    $post_data = array(
        'post_title' => $title,
        'post_content' => $content,
        'post_status' => $status,
        'post_type' => 'post',
        'post_author' => get_current_user_id() ?: 1, // Default to admin if no user
    );
    
    // Insert the post
    $post_id = wp_insert_post($post_data, true);
    
    if (is_wp_error($post_id)) {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => $post_id->get_error_message()
        ), 500);
    }
    
    // Add meta data
    update_post_meta($post_id, '_seo_autofix_location', $location);
    update_post_meta($post_id, '_seo_autofix_content_type', $content_type);
    update_post_meta($post_id, '_seo_autofix_primary_keywords', $primary_keywords);
    update_post_meta($post_id, '_seo_autofix_generated_by', 'auto-content-engine');
    
    // Set featured image if URL provided - try multiple field names
    // IMPORTANT: Don't use esc_url_raw on AI image URLs as it can break them
    $image_url = '';
    $raw_urls = array(
        $params['imageUrl'] ?? '',
        $params['featured_image'] ?? '',
        $params['featuredImageUrl'] ?? '',
        $params['image_url'] ?? '',
        $params['media_url'] ?? '',
    );
    
    // Log all received image URL fields
    error_log('[SEO AutoFix] Received image URL fields: ' . print_r($raw_urls, true));
    
    foreach ($raw_urls as $url) {
        if (!empty($url) && filter_var($url, FILTER_VALIDATE_URL)) {
            $image_url = $url;
            break;
        }
    }
    
    error_log('[SEO AutoFix] Final image URL to process: ' . $image_url);
    
    $featured_media_id = 0;
    $image_error = '';
    $debug_steps = array(); // Track each step for debugging
    
    if (!empty($image_url)) {
        $debug_steps[] = 'Step 1: Image URL received: ' . substr($image_url, 0, 100) . '...';
        error_log('[SEO AutoFix] Processing featured image URL: ' . $image_url);
        
        $image_id = seo_autofix_upload_image_from_url($image_url, $post_id, $title);
        $debug_steps[] = 'Step 2: Upload function returned: ' . (is_wp_error($image_id) ? 'WP_Error: ' . $image_id->get_error_message() : $image_id);
        
        if ($image_id && !is_wp_error($image_id) && is_numeric($image_id) && $image_id > 0) {
            $debug_steps[] = 'Step 3: Image uploaded successfully with ID: ' . $image_id;
            error_log('[SEO AutoFix] Image uploaded successfully with ID: ' . $image_id);
            
            // CRITICAL: Make sure the attachment exists and is valid
            $attachment = get_post($image_id);
            if (!$attachment || $attachment->post_type !== 'attachment') {
                error_log('[SEO AutoFix] ERROR: Uploaded media ID is not a valid attachment!');
                $image_error = 'Uploaded file is not a valid attachment';
            } else {
                $debug_steps[] = 'Step 4: Attachment verified, type: ' . $attachment->post_mime_type;
                error_log('[SEO AutoFix] Attachment verified: ' . $attachment->post_mime_type);
                
                // Ensure theme supports post-thumbnails
                if (!current_theme_supports('post-thumbnails')) {
                    add_theme_support('post-thumbnails');
                    $debug_steps[] = 'Step 5: Added theme support for post-thumbnails';
                }
                
                // Delete any existing thumbnail first using direct database
                global $wpdb;
                $wpdb->delete(
                    $wpdb->postmeta,
                    array('post_id' => $post_id, 'meta_key' => '_thumbnail_id'),
                    array('%d', '%s')
                );
                $debug_steps[] = 'Step 6: Cleared existing thumbnail meta';
                
                // Method 1: Direct database insert (most reliable)
                $db_result = $wpdb->insert(
                    $wpdb->postmeta,
                    array(
                        'post_id' => $post_id,
                        'meta_key' => '_thumbnail_id',
                        'meta_value' => $image_id
                    ),
                    array('%d', '%s', '%s')
                );
                $debug_steps[] = 'Step 7: Direct DB insert result: ' . ($db_result ? 'SUCCESS (rows: ' . $db_result . ')' : 'FAILED - ' . $wpdb->last_error);
                
                if ($db_result) {
                    $featured_media_id = $image_id;
                    $debug_steps[] = 'Step 8: Featured media ID set to: ' . $featured_media_id;
                    wp_cache_delete($post_id, 'post_meta');
                } else {
                    // Method 2: set_post_thumbnail
                    $result = set_post_thumbnail($post_id, $image_id);
                    $debug_steps[] = 'Step 7b: set_post_thumbnail result: ' . ($result ? 'true' : 'false');
                    
                    if ($result) {
                        $featured_media_id = $image_id;
                    } else {
                        // Method 3: update_post_meta
                        $meta_result = update_post_meta($post_id, '_thumbnail_id', $image_id);
                        $debug_steps[] = 'Step 7c: update_post_meta result: ' . ($meta_result ? 'success' : 'failed');
                        if ($meta_result) {
                            $featured_media_id = $image_id;
                        } else {
                            // Method 4: add_post_meta
                            $add_result = add_post_meta($post_id, '_thumbnail_id', $image_id, true);
                            $debug_steps[] = 'Step 7d: add_post_meta result: ' . ($add_result ? 'success' : 'failed');
                            if ($add_result) {
                                $featured_media_id = $image_id;
                            } else {
                                $image_error = 'All methods to set featured image failed';
                                $debug_steps[] = 'Step 7e: ALL METHODS FAILED';
                            }
                        }
                    }
                }
                
                // Final verification using direct database query
                $verify_query = $wpdb->get_var($wpdb->prepare(
                    "SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = '_thumbnail_id'",
                    $post_id
                ));
                error_log('[SEO AutoFix] DB Verification - _thumbnail_id value: ' . $verify_query);
                
                if ($verify_query == $image_id) {
                    $featured_media_id = $image_id;
                    error_log('[SEO AutoFix] VERIFIED: Featured image is correctly set in database!');
                } else {
                    error_log('[SEO AutoFix] WARNING: DB verification failed. Expected ' . $image_id . ', got ' . $verify_query);
                    // Force insert via raw SQL
                    $wpdb->query($wpdb->prepare(
                        "INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value) VALUES (%d, '_thumbnail_id', %s)",
                        $post_id,
                        $image_id
                    ));
                    wp_cache_delete($post_id, 'post_meta');
                    
                    $verify_again = $wpdb->get_var($wpdb->prepare(
                        "SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = '_thumbnail_id'",
                        $post_id
                    ));
                    if ($verify_again == $image_id) {
                        $featured_media_id = $image_id;
                        error_log('[SEO AutoFix] FORCED via raw SQL: Featured image now set!');
                    } else {
                        $image_error = 'Database insert failed even with raw SQL';
                        error_log('[SEO AutoFix] CRITICAL: ' . $image_error);
                    }
                }
            }
        } else {
            $image_error = is_wp_error($image_id) ? $image_id->get_error_message() : 'Unknown upload error (returned: ' . var_export($image_id, true) . ')';
            $debug_steps[] = 'Step 3: UPLOAD FAILED - ' . $image_error;
            error_log('[SEO AutoFix] Failed to upload featured image: ' . $image_error);
        }
    } else {
        $debug_steps[] = 'No image URL provided or URL invalid';
        error_log('[SEO AutoFix] No valid image URL provided');
    }
    
    // Generate SEO meta description
    $excerpt = wp_trim_words(strip_tags($content), 30);
    update_post_meta($post_id, '_seo_autofix_description', $excerpt);
    
    // Set tags if provided
    if (!empty($tags)) {
        wp_set_post_tags($post_id, $tags, false);
    }
    
    // Get the created post object
    $post = get_post($post_id);
    $permalink = get_permalink($post);
    $edit_url = admin_url('post.php?post=' . $post_id . '&action=edit');
    
    // Clear ALL caches before getting featured media
    clean_post_cache($post_id);
    wp_cache_delete($post_id, 'post_meta');
    wp_cache_flush();
    
    // Get the actual featured media ID directly from database to bypass cache
    global $wpdb;
    $actual_featured_media = $wpdb->get_var($wpdb->prepare(
        "SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = '_thumbnail_id' LIMIT 1",
        $post_id
    ));
    $actual_featured_media = intval($actual_featured_media);
    
    error_log('[SEO AutoFix] Direct DB query for _thumbnail_id: ' . $actual_featured_media);
    
    error_log('[SEO AutoFix] Final post created. ID: ' . $post_id . ', Featured Media: ' . $actual_featured_media . ', Link: ' . $permalink);
    error_log('[SEO AutoFix] ========== PUBLISH COMPLETE ==========');
    
    return new WP_REST_Response(array(
        'success' => true,
        'pluginVersion' => '5.3.0-debug-steps',
        'post' => array(
            'id' => $post->ID,
            'title' => array('rendered' => get_the_title($post)),
            'content' => array('rendered' => wpautop($post->post_content)),
            'status' => $post->post_status,
            'slug' => $post->post_name,
            'link' => $permalink,
            'edit_url' => $edit_url,
            'date' => $post->post_date_gmt,
            'featured_media' => $actual_featured_media ?: 0,
            'meta' => array(
                'primary_keywords' => $primary_keywords,
                'location' => $location,
                'content_type' => $content_type,
                'generated_by' => 'auto-content-engine',
                'tags' => $tags
            )
        ),
        'postId' => $post->ID,
        'url' => $permalink,
        'editUrl' => $edit_url,
        'featured_media' => $actual_featured_media ?: 0,
        'imageStatus' => array(
            'requested' => !empty($image_url),
            'url' => substr($image_url, 0, 200),
            'uploaded' => $featured_media_id > 0,
            'mediaId' => $featured_media_id,
            'setAsFeatured' => $actual_featured_media > 0,
            'thumbnailId' => $actual_featured_media,
            'error' => $image_error,
            'steps' => $debug_steps,
            'debug' => array(
                'uploadedId' => $featured_media_id,
                'dbThumbnailId' => $actual_featured_media,
                'match' => ($featured_media_id == $actual_featured_media && $actual_featured_media > 0)
            )
        ),
        'message' => "Content published as {$status}"
    ), 200);
}

// Set featured image for a post
function seo_autofix_api_set_featured_image($request) {
    $params = $request->get_json_params() ?: $request->get_params();
    
    $post_id = intval($params['post_id'] ?? 0);
    $media_id = intval($params['media_id'] ?? 0);
    
    error_log('[SEO AutoFix] Set Featured Image - Post ID: ' . $post_id . ', Media ID: ' . $media_id);
    
    if (!$post_id || !$media_id) {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'post_id and media_id are required'
        ), 400);
    }
    
    // Verify post exists
    $post = get_post($post_id);
    if (!$post) {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'Post not found'
        ), 404);
    }
    
    // Verify media exists
    $media = get_post($media_id);
    if (!$media || $media->post_type !== 'attachment') {
        return new WP_REST_Response(array(
            'success' => false,
            'error' => 'Media not found or not a valid attachment'
        ), 404);
    }
    
    // Delete existing thumbnail first
    delete_post_meta($post_id, '_thumbnail_id');
    
    // Method 1: set_post_thumbnail
    $result = set_post_thumbnail($post_id, $media_id);
    error_log('[SEO AutoFix] set_post_thumbnail result: ' . ($result ? 'true' : 'false'));
    
    if (!$result) {
        // Method 2: Direct meta update
        $meta_result = update_post_meta($post_id, '_thumbnail_id', $media_id);
        error_log('[SEO AutoFix] update_post_meta result: ' . ($meta_result ? 'success' : 'failed'));
        
        if (!$meta_result) {
            // Method 3: Add meta
            add_post_meta($post_id, '_thumbnail_id', $media_id, true);
        }
    }
    
    // Verify
    $verify = get_post_thumbnail_id($post_id);
    $success = ($verify == $media_id);
    
    error_log('[SEO AutoFix] Verification: ' . ($success ? 'SUCCESS' : 'FAILED') . ' - Expected: ' . $media_id . ', Got: ' . $verify);
    
    return new WP_REST_Response(array(
        'success' => $success,
        'post_id' => $post_id,
        'media_id' => $media_id,
        'verified_thumbnail_id' => $verify,
        'message' => $success ? 'Featured image set successfully' : 'Failed to set featured image'
    ));
}

function seo_autofix_api_get_content($request) {
    $post_id = intval($request->get_param('postId'));
    
    if ($post_id) {
        // Get specific post
        $post = get_post($post_id);
        if (!$post) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Post not found'
            ), 404);
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'post' => array(
                'id' => $post->ID,
                'title' => array('rendered' => get_the_title($post)),
                'content' => array('rendered' => wpautop($post->post_content)),
                'status' => $post->post_status,
                'date' => $post->post_date_gmt,
                'link' => get_permalink($post)
            )
        ));
    } else {
        // Get all posts
        $posts = get_posts(array(
            'post_type' => 'post',
            'post_status' => 'any',
            'posts_per_page' => 10,
            'orderby' => 'date',
            'order' => 'DESC'
        ));
        
        $formatted_posts = array();
        foreach ($posts as $post) {
            $formatted_posts[] = array(
                'id' => $post->ID,
                'title' => array('rendered' => get_the_title($post)),
                'status' => $post->post_status,
                'date' => $post->post_date_gmt,
                'link' => get_permalink($post)
            );
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'posts' => $formatted_posts
        ));
    }
}

function seo_autofix_upload_image_from_url($image_url, $post_id = 0, $title = '') {
    // Include required files
    require_once(ABSPATH . 'wp-admin/includes/media.php');
    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    
    // Log the attempt
    error_log('[SEO AutoFix] ========== IMAGE UPLOAD START ==========');
    error_log('[SEO AutoFix] Original URL: ' . $image_url);
    error_log('[SEO AutoFix] Post ID: ' . $post_id . ', Title: ' . $title);
    
    // Clean the URL
    $image_url = trim($image_url);
    
    // Check if URL has a valid image extension, if not append #.jpg
    // This is a documented workaround for media_sideload_image extension check
    $parsed_url = parse_url($image_url, PHP_URL_PATH);
    $extension = strtolower(pathinfo($parsed_url, PATHINFO_EXTENSION));
    $valid_extensions = array('jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp');
    
    $modified_url = $image_url;
    if (empty($extension) || !in_array($extension, $valid_extensions)) {
        // Append #.jpg to bypass extension check (documented WordPress workaround)
        $modified_url = $image_url . '#.jpg';
        error_log('[SEO AutoFix] URL has no valid extension, using workaround: ' . $modified_url);
    }
    
    // Method 1: Try media_sideload_image with 'id' return type (simplest approach)
    error_log('[SEO AutoFix] Method 1: Trying media_sideload_image...');
    $attachment_id = media_sideload_image($modified_url, $post_id, $title, 'id');
    
    if (!is_wp_error($attachment_id) && is_numeric($attachment_id) && $attachment_id > 0) {
        error_log('[SEO AutoFix] Method 1 SUCCESS! Attachment ID: ' . $attachment_id);
        // Set alt text
        if ($title) {
            update_post_meta($attachment_id, '_wp_attachment_image_alt', sanitize_text_field($title));
        }
        return $attachment_id;
    }
    
    $error_msg = is_wp_error($attachment_id) ? $attachment_id->get_error_message() : 'Unknown error';
    error_log('[SEO AutoFix] Method 1 failed: ' . $error_msg);
    
    // Method 2: Manual download with wp_remote_get and media_handle_sideload
    error_log('[SEO AutoFix] Method 2: Trying manual download with wp_remote_get...');
    
    $response = wp_remote_get($image_url, array(
        'timeout' => 120,
        'redirection' => 10,
        'sslverify' => false,
        'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ));
    
    if (is_wp_error($response)) {
        error_log('[SEO AutoFix] Method 2 wp_remote_get failed: ' . $response->get_error_message());
        return $response;
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    error_log('[SEO AutoFix] Method 2 HTTP response code: ' . $response_code);
    
    if ($response_code !== 200) {
        return new WP_Error('http_error', 'HTTP ' . $response_code);
    }
    
    $image_data = wp_remote_retrieve_body($response);
    $content_type = wp_remote_retrieve_header($response, 'content-type');
    error_log('[SEO AutoFix] Method 2 Content-Type: ' . $content_type . ', Size: ' . strlen($image_data) . ' bytes');
    
    if (empty($image_data) || strlen($image_data) < 100) {
        return new WP_Error('empty_image', 'Downloaded image is empty or too small');
    }
    
    // Determine extension from content-type
    $mime_to_ext = array(
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg', 
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    );
    
    $ext = 'jpg'; // default
    foreach ($mime_to_ext as $mime => $e) {
        if (strpos($content_type, $mime) !== false) {
            $ext = $e;
            break;
        }
    }
    
    // Generate filename
    $clean_title = $title ? sanitize_title(substr($title, 0, 50)) : 'featured-image';
    $filename = $clean_title . '-' . time() . '.' . $ext;
    error_log('[SEO AutoFix] Method 2 Using filename: ' . $filename);
    
    // Save to temp file
    $upload_dir = wp_upload_dir();
    $tmp_file = $upload_dir['basedir'] . '/seo-autofix-tmp-' . time() . '.' . $ext;
    
    $written = file_put_contents($tmp_file, $image_data);
    if ($written === false) {
        error_log('[SEO AutoFix] Method 2 Failed to write temp file');
        return new WP_Error('write_error', 'Failed to write temp file');
    }
    error_log('[SEO AutoFix] Method 2 Wrote ' . $written . ' bytes to: ' . $tmp_file);
    
    // Prepare file array
    $file_array = array(
        'name' => $filename,
        'tmp_name' => $tmp_file,
        'type' => 'image/' . ($ext === 'jpg' ? 'jpeg' : $ext),
        'error' => 0,
        'size' => filesize($tmp_file),
    );
    
    // Sideload the file
    $attachment_id = media_handle_sideload($file_array, $post_id);
    
    // Clean up temp file
    if (file_exists($tmp_file)) {
        @unlink($tmp_file);
    }
    
    if (is_wp_error($attachment_id)) {
        error_log('[SEO AutoFix] Method 2 media_handle_sideload failed: ' . $attachment_id->get_error_message());
        return $attachment_id;
    }
    
    error_log('[SEO AutoFix] Method 2 SUCCESS! Attachment ID: ' . $attachment_id);
    
    // Set alt text
    if ($title && $attachment_id) {
        update_post_meta($attachment_id, '_wp_attachment_image_alt', sanitize_text_field($title));
    }
    
    error_log('[SEO AutoFix] ========== IMAGE UPLOAD END ==========');
    return $attachment_id;
}

// ==================== FRONTEND HOOKS ====================
$settings = get_option('seo_autofix_settings', array());

if (!empty($settings['enable_image_compression'])) {
    add_filter('wp_handle_upload', function($file) {
        $s = get_option('seo_autofix_settings', array());
        if (isset($file['type']) && in_array($file['type'], array('image/jpeg', 'image/png'))) {
            seo_autofix_compress_image($file['file'], $s['compression_quality'] ?? 82);
            if (!empty($s['enable_webp_conversion'])) seo_autofix_create_webp($file['file'], $s['compression_quality'] ?? 82);
        }
        return $file;
    });
}

if (!empty($settings['enable_lazy_loading'])) add_filter('wp_img_tag_add_loading_attr', function() { return 'lazy'; }, 10, 3);

if (!empty($settings['enable_security_headers'])) {
    add_action('send_headers', function() {
        if (!is_admin()) {
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');
            header('X-XSS-Protection: 1; mode=block');
            header('Referrer-Policy: strict-origin-when-cross-origin');
            if (is_ssl()) header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
    });
}

if (!empty($settings['custom_robots_txt'])) add_filter('robots_txt', function() { $s = get_option('seo_autofix_settings', array()); return $s['custom_robots_txt']; }, 999);

add_action('template_redirect', function() {
    global $wpdb;
    $table = $wpdb->prefix . 'seo_autofix_redirects';
    $redirect = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE source_url = %s", $_SERVER['REQUEST_URI']));
    if ($redirect) { $wpdb->query($wpdb->prepare("UPDATE $table SET hits = hits + 1 WHERE id = %d", $redirect->id)); wp_redirect($redirect->target_url, $redirect->redirect_type); exit; }
});

// Output custom meta description in wp_head - check both meta keys for compatibility
add_action('wp_head', function() {
    $settings = get_option('seo_autofix_settings', array());
    if (is_singular()) {
        // Check both meta keys - _seo_autofix_meta_description (new) and _seo_autofix_description (legacy)
        $desc = get_post_meta(get_the_ID(), '_seo_autofix_meta_description', true);
        if (empty($desc)) {
            $desc = get_post_meta(get_the_ID(), '_seo_autofix_description', true);
        }
        if ($desc) echo '<meta name="description" content="' . esc_attr($desc) . '">' . "\n";
    }
    if (!empty($settings['enable_og_tags']) && is_singular()) {
        $custom_title = get_post_meta(get_the_ID(), '_seo_autofix_title', true);
        $title = $custom_title ?: get_the_title();
        $desc = get_post_meta(get_the_ID(), '_seo_autofix_meta_description', true) ?: get_post_meta(get_the_ID(), '_seo_autofix_description', true) ?: wp_trim_words(get_the_excerpt(), 25);
        $image = get_the_post_thumbnail_url(get_the_ID(), 'large') ?: ($settings['default_og_image'] ?? '');
        echo '<meta property="og:type" content="article"><meta property="og:title" content="' . esc_attr($title) . '"><meta property="og:description" content="' . esc_attr($desc) . '"><meta property="og:url" content="' . esc_url(get_permalink()) . '">' . ($image ? '<meta property="og:image" content="' . esc_url($image) . '">' : '') . "\n";
    }
    if (!empty($settings['enable_twitter_cards']) && is_singular()) {
        $custom_title = get_post_meta(get_the_ID(), '_seo_autofix_title', true);
        $title = $custom_title ?: get_the_title();
        $desc = get_post_meta(get_the_ID(), '_seo_autofix_meta_description', true) ?: get_post_meta(get_the_ID(), '_seo_autofix_description', true) ?: wp_trim_words(get_the_excerpt(), 25);
        $image = get_the_post_thumbnail_url(get_the_ID(), 'large') ?: ($settings['default_og_image'] ?? '');
        echo '<meta name="twitter:card" content="' . esc_attr($settings['twitter_card_type'] ?? 'summary_large_image') . '"><meta name="twitter:title" content="' . esc_attr($title) . '"><meta name="twitter:description" content="' . esc_attr($desc) . '">' . ($image ? '<meta name="twitter:image" content="' . esc_url($image) . '">' : '') . "\n";
    }
    if (!empty($settings['enable_schema']) && !empty($settings['business_name'])) {
        $schema = array('@context' => 'https://schema.org', '@type' => $settings['business_type'] ?? 'LocalBusiness', 'name' => $settings['business_name'], 'url' => home_url());
        if (!empty($settings['business_phone'])) $schema['telephone'] = $settings['business_phone'];
        if (!empty($settings['business_email'])) $schema['email'] = $settings['business_email'];
        echo '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
    }
}, 1);

// Filter document title to use custom SEO title if set
add_filter('document_title_parts', function($title_parts) {
    if (is_singular()) {
        $custom_title = get_post_meta(get_the_ID(), '_seo_autofix_title', true);
        if (!empty($custom_title)) {
            $title_parts['title'] = $custom_title;
            // Remove site name if it's already in the custom title
            if (isset($title_parts['site']) && strpos($custom_title, $title_parts['site']) !== false) {
                unset($title_parts['site']);
            }
        }
    }
    return $title_parts;
}, 20);

// Also filter pre_get_document_title for themes that don't use document_title_parts
add_filter('pre_get_document_title', function($title) {
    if (is_singular()) {
        $custom_title = get_post_meta(get_the_ID(), '_seo_autofix_title', true);
        if (!empty($custom_title)) {
            return $custom_title;
        }
    }
    return $title;
}, 20);

if (!empty($settings['enable_sitemap'])) { add_action('publish_post', 'seo_autofix_generate_sitemap'); add_action('publish_page', 'seo_autofix_generate_sitemap'); }

// CORS for API access - Targeted to our namespace only
add_action('rest_api_init', function() {
    add_filter('rest_authentication_errors', 'seo_autofix_handle_cors', 10);
});

function seo_autofix_handle_cors($result) {
    // Only apply to our namespace
    if (strpos($_SERVER['REQUEST_URI'], 'seo-autofix/v1') === false) {
        return $result;
    }

    $origin = get_http_origin();
    header("Access-Control-Allow-Origin: " . ($origin ? $origin : '*'));
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Authorization, X-SEO-AutoFix-Key, Content-Type, X-WP-Nonce");

    if ('OPTIONS' === $_SERVER['REQUEST_METHOD']) {
        status_header(200);
        exit();
    }

    return $result;
}

// ==================== HANDSHAKE CALLBACK FUNCTIONS ====================
function seo_autofix_api_handshake_init($request) {
    $callback_url = esc_url_raw($request->get_param('callback_url'));
    $saas_name = sanitize_text_field($request->get_param('saas_name') ?: 'SEO Audit Tool');
    
    if (empty($callback_url)) {
        return new WP_REST_Response(array('success' => false, 'error' => 'callback_url required'), 400);
    }
    
    $token = wp_generate_password(32, false);
    set_transient('seo_autofix_pending_connection_' . $token, array(
        'callback_url' => $callback_url,
        'saas_name' => $saas_name,
        'status' => 'pending',
        'created_at' => time()
    ), 600);
    
    $approval_url = admin_url('admin.php?page=seo-auto-fix-api&connect_token=' . $token . '&callback_url=' . urlencode($callback_url));
    
    return new WP_REST_Response(array(
        'success' => true,
        'token' => $token,
        'approval_url' => $approval_url,
        'site_name' => get_bloginfo('name'),
        'site_url' => home_url(),
        'expires_in' => 600
    ), 200);
}

function seo_autofix_api_handshake_complete($request) {
    $token = sanitize_text_field($request->get_param('connect_token'));
    
    if (empty($token)) {
        $token = sanitize_text_field($request->get_param('token'));
    }
    
    if (empty($token)) {
        return new WP_REST_Response(array('success' => false, 'error' => 'token required'), 400);
    }
    
    $connection = get_transient('seo_autofix_pending_connection_' . $token);
    
    if (!$connection) {
        return new WP_REST_Response(array('success' => false, 'error' => 'Token expired or invalid'), 404);
    }
    
    if ($connection['status'] !== 'approved') {
        return new WP_REST_Response(array('success' => false, 'error' => 'Connection not yet approved', 'status' => $connection['status']), 403);
    }
    
    $api_key = get_option('seo_autofix_api_key');
    
    // Ensure API key exists - generate if missing
    if (empty($api_key)) {
        $api_key = wp_generate_password(32, false);
        update_option('seo_autofix_api_key', $api_key);
    }
    
    delete_transient('seo_autofix_pending_connection_' . $token);
    
    return new WP_REST_Response(array(
        'success' => true,
        'api_key' => $api_key,
        'site_url' => home_url(),
        'site_name' => get_bloginfo('name'),
        'message' => 'Connection approved'
    ), 200);
}

function seo_autofix_api_handshake_status($request) {
    $token = sanitize_text_field($request->get_param('token'));
    
    // Also check connect_token for compatibility
    if (empty($token)) {
        $token = sanitize_text_field($request->get_param('connect_token'));
    }
    
    if (empty($token)) {
        return new WP_REST_Response(array('success' => false, 'error' => 'token required'), 400);
    }
    
    $connection = get_transient('seo_autofix_pending_connection_' . $token);
    
    if (!$connection) {
        return new WP_REST_Response(array('success' => false, 'error' => 'Token expired or invalid'), 404);
    }
    
    $response = array(
        'success' => true,
        'status' => $connection['status'],
        'site_name' => get_bloginfo('name')
    );
    
    if ($connection['status'] === 'approved') {
        $response['api_key'] = get_option('seo_autofix_api_key');
        $response['site_url'] = home_url();
    }
    
    return new WP_REST_Response($response, 200);
}

// ==================== ISSUE DETECTION CALLBACK ====================
function seo_autofix_api_audit_issues($request) {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    
    $issues = array(
        'local_seo' => array('issues' => array(), 'fixable' => true),
        'onpage_seo' => array('issues' => array(), 'fixable' => true),
        'links' => array('issues' => array(), 'fixable' => true),
        'usability' => array('issues' => array(), 'fixable' => true),
        'performance' => array('issues' => array(), 'fixable' => true),
        'social' => array('issues' => array(), 'fixable' => true),
        'technology' => array('issues' => array(), 'fixable' => true),
        'content' => array('issues' => array(), 'fixable' => true),
        'eeat' => array('issues' => array(), 'fixable' => true),
    );
    
    // Check Local SEO issues
    if (empty($settings['business_name'])) $issues['local_seo']['issues'][] = 'Missing business name';
    if (empty($settings['business_phone'])) $issues['local_seo']['issues'][] = 'Missing phone number';
    if (empty($settings['business_address'])) $issues['local_seo']['issues'][] = 'Missing address';
    if (empty($settings['enable_local_schema'])) $issues['local_seo']['issues'][] = 'Local business schema not enabled';
    
    // Check On-Page SEO issues
    $missing_alt = $wpdb->get_var("SELECT COUNT(p.ID) FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt' WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%' AND (pm.meta_value IS NULL OR pm.meta_value = '')");
    if ($missing_alt > 0) $issues['onpage_seo']['issues'][] = "$missing_alt images missing alt text";
    
    $missing_meta = $wpdb->get_var("SELECT COUNT(p.ID) FROM {$wpdb->posts} p LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_seo_autofix_description' WHERE p.post_type IN ('post','page') AND p.post_status = 'publish' AND (pm.meta_value IS NULL OR pm.meta_value = '')");
    if ($missing_meta > 0) $issues['onpage_seo']['issues'][] = "$missing_meta pages missing meta descriptions";
    
    if (empty($settings['enable_schema'])) $issues['onpage_seo']['issues'][] = 'Schema markup not enabled';
    
    // Check Links issues
    if (empty($settings['enable_sitemap'])) $issues['links']['issues'][] = 'XML sitemap not enabled';
    if (empty($settings['custom_robots_txt'])) $issues['links']['issues'][] = 'Robots.txt not optimized';
    
    // Check Usability issues
    if (empty($settings['enable_lazy_loading'])) $issues['usability']['issues'][] = 'Lazy loading not enabled';
    if (empty($settings['enable_skip_link'])) $issues['usability']['issues'][] = 'Skip link not enabled';
    if (empty($settings['enable_focus_styles'])) $issues['usability']['issues'][] = 'Focus styles not enabled';
    
    // Check Performance issues
    if (empty($settings['enable_image_compression'])) $issues['performance']['issues'][] = 'Image compression not enabled';
    if (empty($settings['enable_resource_hints'])) $issues['performance']['issues'][] = 'Resource hints not enabled';
    
    // Check Social issues
    if (empty($settings['enable_og_tags'])) $issues['social']['issues'][] = 'Open Graph tags not enabled';
    if (empty($settings['enable_twitter_cards'])) $issues['social']['issues'][] = 'Twitter cards not enabled';
    
    // Check Technology issues
    if (empty($settings['enable_security_headers'])) $issues['technology']['issues'][] = 'Security headers not enabled';
    if (!is_ssl()) $issues['technology']['issues'][] = 'HTTPS not enabled';
    
    // Check Content issues
    if ($missing_meta > 0) $issues['content']['issues'][] = 'Missing meta descriptions';
    
    // Check E-E-A-T issues
    if (empty($settings['default_author_name'])) $issues['eeat']['issues'][] = 'Author information not configured';
    if (empty($settings['enable_author_schema'])) $issues['eeat']['issues'][] = 'Author schema not enabled';
    
    $total_issues = 0;
    foreach ($issues as &$cat) {
        $cat['count'] = count($cat['issues']);
        $total_issues += $cat['count'];
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'total_issues' => $total_issues,
        'categories' => $issues,
    ), 200);
}

function seo_autofix_api_audit_autofix($request) {
    $results = array();
    $fix_request = new WP_REST_Request('POST');
    
    // Apply all fixes
    $results['security'] = seo_autofix_api_fix_security($fix_request)->get_data();
    $results['lazy_loading'] = seo_autofix_api_fix_lazy_loading($fix_request)->get_data();
    $results['sitemap'] = seo_autofix_api_fix_sitemap($fix_request)->get_data();
    $results['robots'] = seo_autofix_api_fix_robots($fix_request)->get_data();
    $results['og_tags'] = seo_autofix_api_fix_og_tags($fix_request)->get_data();
    $results['schema'] = seo_autofix_api_fix_schema($fix_request)->get_data();
    $results['meta'] = seo_autofix_api_fix_meta($fix_request)->get_data();
    $results['alt_text'] = seo_autofix_api_fix_alt_text($fix_request)->get_data();
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'All auto-fixes applied',
        'results' => $results
    ), 200);
}

// ==================== CATEGORY-SPECIFIC FIX CALLBACKS ====================
function seo_autofix_api_fix_local_seo($request) {
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_local_schema'] = true;
    $settings['enable_click_to_call'] = true;
    if (empty($settings['business_name'])) $settings['business_name'] = get_bloginfo('name');
    
    $fixes_applied = array('local_schema_enabled', 'click_to_call_enabled');
    $needs_manual = array();
    
    // Check if address data exists
    $has_address = !empty($settings['business_address']) || 
                   (!empty($settings['business_street']) && !empty($settings['business_city']));
    
    if (!$has_address) {
        // Try to extract address from site content
        $address_found = seo_autofix_extract_address_from_content();
        if ($address_found) {
            $settings['business_street'] = $address_found['street'] ?? '';
            $settings['business_city'] = $address_found['city'] ?? '';
            $settings['business_state'] = $address_found['state'] ?? '';
            $settings['business_zip'] = $address_found['zip'] ?? '';
            $settings['business_country'] = $address_found['country'] ?? '';
            $fixes_applied[] = 'address_extracted_from_content';
        } else {
            $needs_manual[] = array(
                'issue' => 'business_address',
                'message' => 'Business address not found. Go to WordPress Admin → SEO AutoFix → Local SEO to add your address.',
                'admin_url' => admin_url('admin.php?page=seo-auto-fix-local')
            );
        }
    }
    
    // Check if phone exists
    if (empty($settings['business_phone'])) {
        $phone_found = seo_autofix_extract_phone_from_content();
        if ($phone_found) {
            $settings['business_phone'] = $phone_found;
            $fixes_applied[] = 'phone_extracted_from_content';
        }
    }
    
    // Enable Google Maps embed if coordinates exist
    if (!empty($settings['business_lat']) && !empty($settings['business_lng'])) {
        $settings['enable_google_map'] = true;
        $fixes_applied[] = 'google_map_enabled';
    } else {
        $needs_manual[] = array(
            'issue' => 'google_map',
            'message' => 'Add your business coordinates in Local SEO settings to enable Google Maps embed.',
            'admin_url' => admin_url('admin.php?page=seo-auto-fix-local')
        );
    }
    
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Local SEO fixes applied',
        'fixes_applied' => $fixes_applied,
        'needs_manual_action' => $needs_manual,
        'settings_url' => admin_url('admin.php?page=seo-auto-fix-local')
    ), 200);
}

// Helper function to extract address from site content
function seo_autofix_extract_address_from_content() {
    global $wpdb;
    
    // Search in contact page or footer widget content
    $contact_page = $wpdb->get_var("SELECT post_content FROM {$wpdb->posts} WHERE post_type = 'page' AND post_status = 'publish' AND (post_title LIKE '%contact%' OR post_name LIKE '%contact%') LIMIT 1");
    
    if ($contact_page) {
        // Try to find address pattern (simplified)
        preg_match('/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)[^,]*),?\s*([A-Za-z\s]+),?\s*([A-Z]{2})?\s*(\d{5}(?:-\d{4})?)?/i', $contact_page, $matches);
        
        if (!empty($matches)) {
            return array(
                'street' => trim($matches[1] ?? ''),
                'city' => trim($matches[2] ?? ''),
                'state' => trim($matches[3] ?? ''),
                'zip' => trim($matches[4] ?? ''),
            );
        }
    }
    
    return null;
}

// Helper function to extract phone from site content
function seo_autofix_extract_phone_from_content() {
    global $wpdb;
    
    $content = $wpdb->get_var("SELECT post_content FROM {$wpdb->posts} WHERE post_type = 'page' AND post_status = 'publish' AND (post_title LIKE '%contact%' OR post_name LIKE '%contact%') LIMIT 1");
    
    if ($content) {
        // Match phone patterns
        preg_match('/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/', $content, $matches);
        if (!empty($matches[0])) {
            return preg_replace('/[^0-9+]/', '', $matches[0]);
        }
    }
    
    return null;
}

function seo_autofix_api_fix_eeat($request) {
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_author_schema'] = true;
    $settings['display_author_on_posts'] = true;
    if (empty($settings['default_author_name'])) {
        $admin = get_user_by('email', get_option('admin_email'));
        if ($admin) $settings['default_author_name'] = $admin->display_name;
    }
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'E-E-A-T fixes applied',
        'fixes' => array('author_schema', 'author_display')
    ), 200);
}

function seo_autofix_api_fix_content($request) {
    $result = seo_autofix_api_fix_meta(new WP_REST_Request('POST'));
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Content fixes applied',
        'meta_result' => $result->get_data()
    ), 200);
}

function seo_autofix_api_fix_usability($request) {
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_lazy_loading'] = true;
    $settings['enable_skip_link'] = true;
    $settings['enable_focus_styles'] = true;
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Usability fixes applied',
        'fixes' => array('lazy_loading', 'skip_link', 'focus_styles')
    ), 200);
}

function seo_autofix_api_fix_performance($request) {
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_image_compression'] = true;
    $settings['enable_resource_hints'] = true;
    $settings['enable_lazy_loading'] = true;
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Performance fixes applied',
        'fixes' => array('image_compression', 'resource_hints', 'lazy_loading')
    ), 200);
}

function seo_autofix_api_fix_social($request) {
    $result = seo_autofix_api_fix_og_tags(new WP_REST_Request('POST'));
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Social fixes applied',
        'og_result' => $result->get_data()
    ), 200);
}

function seo_autofix_api_fix_technology($request) {
    $result = seo_autofix_api_fix_security(new WP_REST_Request('POST'));
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Technology fixes applied',
        'security_result' => $result->get_data()
    ), 200);
}

function seo_autofix_api_fix_links($request) {
    $sitemap_result = seo_autofix_api_fix_sitemap(new WP_REST_Request('POST'));
    $robots_result = seo_autofix_api_fix_robots(new WP_REST_Request('POST'));
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Links fixes applied',
        'sitemap_result' => $sitemap_result->get_data(),
        'robots_result' => $robots_result->get_data()
    ), 200);
}

function seo_autofix_api_fix_onpage($request) {
    $schema_result = seo_autofix_api_fix_schema(new WP_REST_Request('POST'));
    $alt_result = seo_autofix_api_fix_alt_text(new WP_REST_Request('POST'));
    $meta_result = seo_autofix_api_fix_meta(new WP_REST_Request('POST'));
    
    // Also fix content images (images embedded in post content)
    $content_images_result = seo_autofix_fix_content_images();
    
    // Fix title tag length issues
    $title_result = seo_autofix_optimize_titles();
    
    $needs_manual = array();
    
    // Check if there are still images without alt text
    $alt_data = $alt_result->get_data();
    if (isset($alt_data['remaining']) && $alt_data['remaining'] > 0) {
        $needs_manual[] = array(
            'issue' => 'images_without_alt',
            'message' => $alt_data['remaining'] . ' images still need alt text. Run fix again or add manually in Media Library.',
            'admin_url' => admin_url('upload.php')
        );
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'On-page SEO fixes applied',
        'schema_result' => $schema_result->get_data(),
        'alt_result' => $alt_result->get_data(),
        'meta_result' => $meta_result->get_data(),
        'content_images_fixed' => $content_images_result,
        'title_optimization' => $title_result,
        'needs_manual_action' => $needs_manual
    ), 200);
}

// Fix images embedded in post content that lack alt attributes
function seo_autofix_fix_content_images() {
    global $wpdb;
    
    $fixed = 0;
    $posts_updated = 0;
    
    // Get all published posts/pages with images in content
    $posts = $wpdb->get_results("
        SELECT ID, post_content, post_title FROM {$wpdb->posts} 
        WHERE post_type IN ('post', 'page') 
        AND post_status = 'publish'
        AND post_content LIKE '%<img%'
        LIMIT 100
    ");
    
    foreach ($posts as $post) {
        $content = $post->post_content;
        $updated = false;
        
        // Find all images in content
        preg_match_all('/<img[^>]*>/i', $content, $matches);
        
        foreach ($matches[0] as $img_tag) {
            // Check if alt is missing or empty
            $has_good_alt = preg_match('/alt\s*=\s*["\']([^"\']+)["\']/i', $img_tag, $alt_match) && !empty(trim($alt_match[1]));
            
            if (!$has_good_alt) {
                // Extract src to generate alt from filename
                preg_match('/src\s*=\s*["\']([^"\']+)["\']/i', $img_tag, $src_match);
                if (!empty($src_match[1])) {
                    $url = $src_match[1];
                    $filename = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_FILENAME);
                    
                    // Clean up filename to create alt text
                    $alt_text = preg_replace('/[-_]+/', ' ', $filename);
                    $alt_text = preg_replace('/\d{3,}x\d{3,}/', '', $alt_text); // Remove dimensions
                    $alt_text = preg_replace('/\s+/', ' ', $alt_text);
                    $alt_text = ucfirst(trim($alt_text));
                    
                    // If alt is too short, use post title as context
                    if (strlen($alt_text) < 5) {
                        $alt_text = sanitize_text_field($post->post_title) . ' image';
                    }
                    
                    $alt_text = sanitize_text_field($alt_text);
                    
                    if (strlen($alt_text) >= 3) {
                        // Check if image has empty alt="" or no alt at all
                        if (preg_match('/alt\s*=\s*["\']\s*["\']/i', $img_tag)) {
                            // Has empty alt, replace it
                            $new_img = preg_replace('/alt\s*=\s*["\']\s*["\']/i', 'alt="' . esc_attr($alt_text) . '"', $img_tag);
                        } else if (!preg_match('/alt\s*=/i', $img_tag)) {
                            // No alt attribute at all, add it after <img
                            $new_img = preg_replace('/<img/i', '<img alt="' . esc_attr($alt_text) . '"', $img_tag);
                        } else {
                            continue; // Skip if it has some alt attribute we can't handle
                        }
                        
                        $content = str_replace($img_tag, $new_img, $content);
                        $updated = true;
                        $fixed++;
                    }
                }
            }
        }
        
        if ($updated) {
            $wpdb->update($wpdb->posts, array('post_content' => $content), array('ID' => $post->ID));
            // Clear post cache
            clean_post_cache($post->ID);
            $posts_updated++;
        }
    }
    
    return array(
        'fixed' => $fixed,
        'posts_updated' => $posts_updated,
        'message' => "Added alt text to $fixed content images in $posts_updated posts"
    );
}

// Optimize title tags that are too short or too long
function seo_autofix_optimize_titles() {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    
    // Get posts with short titles (less than 30 chars)
    $short_titles = $wpdb->get_results("
        SELECT ID, post_title FROM {$wpdb->posts}
        WHERE post_type IN ('post', 'page')
        AND post_status = 'publish'
        AND CHAR_LENGTH(post_title) < 30
        LIMIT 50
    ");
    
    $optimized = 0;
    $results = array();
    $site_name = get_bloginfo('name');
    
    foreach ($short_titles as $post) {
        $current_custom = get_post_meta($post->ID, '_seo_autofix_title', true);
        $current_len = strlen($post->post_title);
        
        // Create optimized title by appending site name if needed
        $new_title = $post->post_title . ' | ' . $site_name;
        $new_len = strlen($new_title);
        
        // Only optimize if current title is short and new title is within range
        if ($current_len < 30 && $new_len >= 30 && $new_len <= 70) {
            update_post_meta($post->ID, '_seo_autofix_title', $new_title);
            $optimized++;
            $results[] = array(
                'id' => $post->ID,
                'original' => $post->post_title,
                'optimized' => $new_title,
                'original_length' => $current_len,
                'new_length' => $new_len
            );
        }
    }
    
    return array(
        'optimized' => $optimized,
        'results' => $results,
        'message' => $optimized > 0 ? "Optimized $optimized title tags to ideal length (30-60 chars)" : "All titles are already optimized"
    );
}

// Dedicated API endpoint for title optimization
function seo_autofix_api_fix_title_optimize($request) {
    $result = seo_autofix_optimize_titles();
    
    return new WP_REST_Response(array(
        'success' => true,
        'fixed' => $result['optimized'],
        'results' => $result['results'] ?? array(),
        'message' => $result['message']
    ), 200);
}

// ==================== VERIFY/RESCAN ENDPOINT ====================
function seo_autofix_api_verify_status($request) {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    $category = $request->get_param('category'); // local_seo, onpage, social, etc.
    
    $status = array();
    
    // Local SEO Status
    if (!$category || $category === 'local_seo') {
        $has_address = !empty($settings['business_address']) || 
                       (!empty($settings['business_street']) && !empty($settings['business_city']));
        $has_phone = !empty($settings['business_phone']);
        $has_map = !empty($settings['business_lat']) && !empty($settings['business_lng']);
        
        $status['local_seo'] = array(
            'local_schema_enabled' => !empty($settings['enable_local_schema']),
            'has_address' => $has_address,
            'has_phone' => $has_phone,
            'has_google_map' => $has_map,
            'business_name' => $settings['business_name'] ?? get_bloginfo('name'),
            'issues' => array()
        );
        
        if (!$has_address) {
            $status['local_seo']['issues'][] = array(
                'type' => 'address_missing',
                'fixable' => false,
                'message' => 'Business address not configured',
                'action' => 'Go to WordPress Admin → SEO AutoFix → Local SEO to add your address'
            );
        }
        if (!$has_map) {
            $status['local_seo']['issues'][] = array(
                'type' => 'map_missing',
                'fixable' => false,
                'message' => 'Google Map coordinates not set',
                'action' => 'Add latitude/longitude in Local SEO settings'
            );
        }
    }
    
    // On-Page SEO Status
    if (!$category || $category === 'onpage') {
        // Count images without alt text
        $images_without_alt = intval($wpdb->get_var("
            SELECT COUNT(p.ID) FROM {$wpdb->posts} p 
            LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attachment_image_alt'
            WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%'
            AND (pm.meta_value IS NULL OR pm.meta_value = '')
        "));
        
        $total_images = intval($wpdb->get_var("
            SELECT COUNT(*) FROM {$wpdb->posts} 
            WHERE post_type = 'attachment' AND post_mime_type LIKE 'image/%'
        "));
        
        // Count short titles
        $short_titles = intval($wpdb->get_var("
            SELECT COUNT(*) FROM {$wpdb->posts}
            WHERE post_type IN ('post', 'page') AND post_status = 'publish'
            AND CHAR_LENGTH(post_title) < 20
        "));
        
        // Count posts without meta descriptions
        $posts_without_meta = intval($wpdb->get_var("
            SELECT COUNT(p.ID) FROM {$wpdb->posts} p
            LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_seo_autofix_description'
            WHERE p.post_type IN ('post', 'page') AND p.post_status = 'publish'
            AND (pm.meta_value IS NULL OR pm.meta_value = '')
        "));
        
        $status['onpage'] = array(
            'schema_enabled' => !empty($settings['enable_schema']),
            'images_with_alt' => $total_images - $images_without_alt,
            'images_without_alt' => $images_without_alt,
            'total_images' => $total_images,
            'alt_percentage' => $total_images > 0 ? round((($total_images - $images_without_alt) / $total_images) * 100) : 100,
            'short_titles' => $short_titles,
            'posts_without_meta' => $posts_without_meta,
            'issues' => array()
        );
        
        if ($images_without_alt > 0) {
            $status['onpage']['issues'][] = array(
                'type' => 'images_without_alt',
                'fixable' => true,
                'count' => $images_without_alt,
                'message' => "$images_without_alt images missing alt text",
                'action' => 'Click "Fix" to auto-generate alt text from filenames'
            );
        }
        if ($short_titles > 0) {
            $status['onpage']['issues'][] = array(
                'type' => 'short_titles',
                'fixable' => true,
                'count' => $short_titles,
                'message' => "$short_titles pages have short title tags",
                'action' => 'Click "Fix" to optimize titles'
            );
        }
    }
    
    // Social Status
    if (!$category || $category === 'social') {
        $status['social'] = array(
            'og_tags_enabled' => !empty($settings['enable_og_tags']),
            'twitter_cards_enabled' => !empty($settings['enable_twitter_cards']),
            'default_og_image' => $settings['default_og_image'] ?? null,
            'has_og_image' => !empty($settings['default_og_image']),
            'social_links' => $settings['social_links'] ?? array(),
            'issues' => array()
        );
        
        if (empty($settings['default_og_image'])) {
            $status['social']['issues'][] = array(
                'type' => 'og_image_missing',
                'fixable' => true,
                'message' => 'Default Open Graph image not set',
                'action' => 'Click "Fix" to auto-set from site logo'
            );
        }
        if (empty($settings['social_links']) || count($settings['social_links']) < 2) {
            $status['social']['issues'][] = array(
                'type' => 'social_links_missing',
                'fixable' => false,
                'message' => 'Social media profile links not configured',
                'action' => 'Go to WordPress Admin → SEO AutoFix → Social Tags to add your social profiles'
            );
        }
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'status' => $status,
        'timestamp' => current_time('mysql')
    ), 200);
}

// ==================== CAPABILITIES ENDPOINT ====================
function seo_autofix_api_get_capabilities() {
    return new WP_REST_Response(array(
        'success' => true,
        'capabilities' => array(
            'auto_fixable' => array(
                array(
                    'id' => 'alt_text',
                    'name' => 'Image Alt Text',
                    'description' => 'Auto-generate alt text from image filenames',
                    'category' => 'onpage'
                ),
                array(
                    'id' => 'meta_descriptions',
                    'name' => 'Meta Descriptions',
                    'description' => 'Generate meta descriptions from post excerpts/content',
                    'category' => 'onpage'
                ),
                array(
                    'id' => 'title_optimization',
                    'name' => 'Title Tag Optimization',
                    'description' => 'Optimize short titles by appending site name',
                    'category' => 'onpage'
                ),
                array(
                    'id' => 'schema_markup',
                    'name' => 'Schema Markup',
                    'description' => 'Enable structured data for better search appearance',
                    'category' => 'onpage'
                ),
                array(
                    'id' => 'og_tags',
                    'name' => 'Open Graph Tags',
                    'description' => 'Enable social sharing meta tags',
                    'category' => 'social'
                ),
                array(
                    'id' => 'twitter_cards',
                    'name' => 'Twitter Cards',
                    'description' => 'Enable Twitter card meta tags',
                    'category' => 'social'
                ),
                array(
                    'id' => 'default_og_image',
                    'name' => 'Default OG Image',
                    'description' => 'Set default social sharing image from site logo',
                    'category' => 'social'
                ),
                array(
                    'id' => 'local_schema',
                    'name' => 'Local Business Schema',
                    'description' => 'Enable LocalBusiness structured data',
                    'category' => 'local_seo'
                ),
                array(
                    'id' => 'sitemap',
                    'name' => 'XML Sitemap',
                    'description' => 'Generate and submit XML sitemap',
                    'category' => 'technical'
                ),
                array(
                    'id' => 'robots_txt',
                    'name' => 'Robots.txt',
                    'description' => 'Optimize robots.txt for search engines',
                    'category' => 'technical'
                )
            ),
            'requires_manual' => array(
                array(
                    'id' => 'business_address',
                    'name' => 'Business Address',
                    'description' => 'Physical address for LocalBusiness schema',
                    'category' => 'local_seo',
                    'admin_page' => 'seo-auto-fix-local',
                    'reason' => 'Requires your actual business address information'
                ),
                array(
                    'id' => 'google_map',
                    'name' => 'Google Maps Embed',
                    'description' => 'Embed Google Maps on contact page',
                    'category' => 'local_seo',
                    'admin_page' => 'seo-auto-fix-local',
                    'reason' => 'Requires latitude/longitude coordinates'
                ),
                array(
                    'id' => 'social_links',
                    'name' => 'Social Media Links',
                    'description' => 'Links to social media profiles',
                    'category' => 'social',
                    'admin_page' => 'seo-auto-fix-social',
                    'reason' => 'Requires your actual social media profile URLs'
                ),
                array(
                    'id' => 'ai_alt_text',
                    'name' => 'AI-Generated Alt Text',
                    'description' => 'Use AI to generate descriptive alt text',
                    'category' => 'onpage',
                    'admin_page' => 'seo-auto-fix-ai',
                    'reason' => 'Requires OpenAI API key configuration'
                ),
                array(
                    'id' => 'custom_content',
                    'name' => 'Content Quality',
                    'description' => 'Improve content readability and keyword usage',
                    'category' => 'content',
                    'reason' => 'Content improvements require human expertise'
                )
            )
        )
    ), 200);
}

// Get items that need AI-generated content (images without alt, posts without meta)
function seo_autofix_api_get_ai_pending($request) {
    $type = sanitize_text_field($request->get_param('type') ?: 'all');
    $limit = intval($request->get_param('limit') ?: 20);
    
    $result = array(
        'images' => array(),
        'posts' => array(),
        'site_info' => array(
            'name' => get_bloginfo('name'),
            'description' => get_bloginfo('description'),
            'url' => home_url()
        )
    );
    
    // Get images without alt text
    if ($type === 'all' || $type === 'images') {
        $images = get_posts(array(
            'post_type' => 'attachment',
            'post_mime_type' => 'image',
            'posts_per_page' => $limit,
            'meta_query' => array(
                'relation' => 'OR',
                array(
                    'key' => '_wp_attachment_image_alt',
                    'compare' => 'NOT EXISTS'
                ),
                array(
                    'key' => '_wp_attachment_image_alt',
                    'value' => '',
                    'compare' => '='
                )
            )
        ));
        
        foreach ($images as $image) {
            $file = get_attached_file($image->ID);
            $filename = $file ? basename($file) : '';
            $parent_post = $image->post_parent ? get_post($image->post_parent) : null;
            
            $result['images'][] = array(
                'id' => $image->ID,
                'url' => wp_get_attachment_url($image->ID),
                'filename' => $filename,
                'title' => $image->post_title,
                'page_context' => $parent_post ? $parent_post->post_title : '',
                'page_content' => $parent_post ? wp_trim_words(strip_tags($parent_post->post_content), 50) : ''
            );
        }
    }
    
    // Get posts without meta descriptions
    if ($type === 'all' || $type === 'posts') {
        $posts = get_posts(array(
            'post_type' => array('post', 'page'),
            'posts_per_page' => $limit,
            'post_status' => 'publish',
            'meta_query' => array(
                'relation' => 'OR',
                array(
                    'key' => '_seo_autofix_meta_description',
                    'compare' => 'NOT EXISTS'
                ),
                array(
                    'key' => '_seo_autofix_meta_description',
                    'value' => '',
                    'compare' => '='
                ),
                array(
                    'key' => '_yoast_wpseo_metadesc',
                    'compare' => 'NOT EXISTS'
                )
            )
        ));
        
        foreach ($posts as $post) {
            // Skip if already has Yoast meta
            $yoast_meta = get_post_meta($post->ID, '_yoast_wpseo_metadesc', true);
            $our_meta = get_post_meta($post->ID, '_seo_autofix_meta_description', true);
            
            if (!empty($yoast_meta) || !empty($our_meta)) {
                continue;
            }
            
            $result['posts'][] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'url' => get_permalink($post->ID),
                'excerpt' => wp_trim_words(strip_tags($post->post_content), 100),
                'type' => $post->post_type
            );
        }
    }
    
    $result['counts'] = array(
        'images_pending' => count($result['images']),
        'posts_pending' => count($result['posts'])
    );
    
    return new WP_REST_Response($result, 200);
}

// Apply AI-generated content from the website
function seo_autofix_api_apply_ai_content($request) {
    $body = $request->get_json_params();
    $type = sanitize_text_field($body['type'] ?? '');
    $items = $body['items'] ?? array();
    
    $results = array(
        'success' => true,
        'applied' => 0,
        'failed' => 0,
        'details' => array()
    );
    
    if ($type === 'alt_text' && !empty($items)) {
        foreach ($items as $item) {
            $image_id = intval($item['id'] ?? 0);
            $alt_text = sanitize_text_field($item['alt_text'] ?? '');
            
            if ($image_id && $alt_text) {
                $updated = update_post_meta($image_id, '_wp_attachment_image_alt', $alt_text);
                if ($updated !== false) {
                    $results['applied']++;
                    $results['details'][] = array(
                        'id' => $image_id,
                        'status' => 'success',
                        'alt_text' => $alt_text
                    );
                } else {
                    $results['failed']++;
                    $results['details'][] = array(
                        'id' => $image_id,
                        'status' => 'failed',
                        'error' => 'Could not update alt text'
                    );
                }
            }
        }
    }
    
    if ($type === 'meta_description' && !empty($items)) {
        foreach ($items as $item) {
            $post_id = intval($item['id'] ?? 0);
            $meta_desc = sanitize_text_field($item['meta_description'] ?? '');
            
            if ($post_id && $meta_desc) {
                update_post_meta($post_id, '_seo_autofix_meta_description', $meta_desc);
                $results['applied']++;
                $results['details'][] = array(
                    'id' => $post_id,
                    'status' => 'success',
                    'meta_description' => $meta_desc
                );
            }
        }
    }
    
    $results['message'] = sprintf('Applied %d AI-generated items', $results['applied']);
    
    return new WP_REST_Response($results, 200);
}

// Get current social/OG settings
function seo_autofix_api_get_social_settings($request) {
    $settings = get_option('seo_autofix_settings', array());
    
    // Get potential default images
    $logo_id = get_theme_mod('custom_logo');
    $logo_url = $logo_id ? wp_get_attachment_url($logo_id) : '';
    
    // Get first featured image from recent posts as fallback
    $featured_image = '';
    $recent_posts = get_posts(array('numberposts' => 5, 'post_status' => 'publish'));
    foreach ($recent_posts as $post) {
        $thumb = get_the_post_thumbnail_url($post->ID, 'large');
        if ($thumb) {
            $featured_image = $thumb;
            break;
        }
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'settings' => array(
            'enable_og_tags' => !empty($settings['enable_og_tags']),
            'enable_twitter_cards' => !empty($settings['enable_twitter_cards']),
            'default_og_image' => $settings['default_og_image'] ?? '',
            'twitter_username' => $settings['twitter_username'] ?? '',
            'facebook_url' => $settings['facebook_url'] ?? '',
            'instagram_url' => $settings['instagram_url'] ?? ''
        ),
        'available_images' => array(
            'logo' => $logo_url,
            'featured' => $featured_image
        ),
        'site_info' => array(
            'name' => get_bloginfo('name'),
            'description' => get_bloginfo('description'),
            'url' => home_url()
        )
    ), 200);
}

// Apply social/OG fixes
function seo_autofix_api_apply_social_fixes($request) {
    $body = $request->get_json_params();
    $settings = get_option('seo_autofix_settings', array());
    $fixes_applied = array();
    
    // Enable OG tags
    if (isset($body['enable_og_tags'])) {
        $settings['enable_og_tags'] = (bool) $body['enable_og_tags'];
        $fixes_applied[] = 'og_tags_' . ($body['enable_og_tags'] ? 'enabled' : 'disabled');
    }
    
    // Enable Twitter cards
    if (isset($body['enable_twitter_cards'])) {
        $settings['enable_twitter_cards'] = (bool) $body['enable_twitter_cards'];
        $fixes_applied[] = 'twitter_cards_' . ($body['enable_twitter_cards'] ? 'enabled' : 'disabled');
    }
    
    // Set default OG image
    if (!empty($body['default_og_image'])) {
        $settings['default_og_image'] = esc_url_raw($body['default_og_image']);
        $fixes_applied[] = 'default_og_image_set';
    }
    
    // Set social URLs
    if (isset($body['twitter_username'])) {
        $settings['twitter_username'] = sanitize_text_field($body['twitter_username']);
        if ($body['twitter_username']) $fixes_applied[] = 'twitter_username_set';
    }
    
    if (isset($body['facebook_url'])) {
        $settings['facebook_url'] = esc_url_raw($body['facebook_url']);
        if ($body['facebook_url']) $fixes_applied[] = 'facebook_url_set';
    }
    
    if (isset($body['instagram_url'])) {
        $settings['instagram_url'] = esc_url_raw($body['instagram_url']);
        if ($body['instagram_url']) $fixes_applied[] = 'instagram_url_set';
    }
    
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Social settings updated',
        'fixes_applied' => $fixes_applied,
        'current_settings' => array(
            'enable_og_tags' => !empty($settings['enable_og_tags']),
            'enable_twitter_cards' => !empty($settings['enable_twitter_cards']),
            'default_og_image' => $settings['default_og_image'] ?? '',
        )
    ), 200);
}

// ==================== FIX INDEXING ====================
function seo_autofix_api_fix_indexing($request) {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    $fixes_applied = array();
    
    // 1. Remove noindex from posts/pages that shouldn't have it
    $noindex_posts = $wpdb->get_results("
        SELECT p.ID, p.post_title, pm.meta_value 
        FROM {$wpdb->posts} p 
        INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id 
        WHERE p.post_status = 'publish' 
        AND p.post_type IN ('post', 'page')
        AND pm.meta_key IN ('_yoast_wpseo_meta-robots-noindex', 'rank_math_robots', '_seo_autofix_noindex')
        AND pm.meta_value LIKE '%noindex%'
    ");
    
    $removed_noindex = 0;
    foreach ($noindex_posts as $post) {
        // Remove Yoast noindex
        delete_post_meta($post->ID, '_yoast_wpseo_meta-robots-noindex');
        // Remove Rank Math noindex (more complex - stored as array)
        $rm_robots = get_post_meta($post->ID, 'rank_math_robots', true);
        if (is_array($rm_robots) && in_array('noindex', $rm_robots)) {
            $rm_robots = array_diff($rm_robots, array('noindex'));
            update_post_meta($post->ID, 'rank_math_robots', $rm_robots);
        }
        // Remove our own noindex
        delete_post_meta($post->ID, '_seo_autofix_noindex');
        $removed_noindex++;
    }
    
    if ($removed_noindex > 0) {
        $fixes_applied[] = "Removed noindex from $removed_noindex posts/pages";
    }
    
    // 2. Ensure blog is not set to discourage search engines
    $blog_public = get_option('blog_public');
    if ($blog_public == '0') {
        update_option('blog_public', '1');
        $fixes_applied[] = 'Enabled search engine visibility in WordPress settings';
    }
    
    // 3. Submit sitemap to search engines
    if (!empty($settings['enable_sitemap'])) {
        $sitemap_url = home_url('/sitemap.xml');
        wp_remote_get('https://www.google.com/ping?sitemap=' . urlencode($sitemap_url), array('timeout' => 10, 'blocking' => false));
        wp_remote_get('https://www.bing.com/ping?sitemap=' . urlencode($sitemap_url), array('timeout' => 10, 'blocking' => false));
        $fixes_applied[] = 'Pinged search engines with sitemap';
    }
    
    // 4. Submit to IndexNow if configured
    if (!empty($settings['indexnow_api_key'])) {
        $recent_posts = get_posts(array('numberposts' => 10, 'post_status' => 'publish'));
        $urls = array_map('get_permalink', $recent_posts);
        $host = wp_parse_url(home_url(), PHP_URL_HOST);
        
        wp_remote_post('https://api.indexnow.org/indexnow', array(
            'timeout' => 10,
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array(
                'host' => $host,
                'key' => $settings['indexnow_api_key'],
                'urlList' => $urls
            ))
        ));
        $fixes_applied[] = 'Submitted ' . count($urls) . ' URLs to IndexNow';
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Indexing issues fixed',
        'fixes_applied' => $fixes_applied,
        'noindex_removed' => $removed_noindex,
        'blog_public' => get_option('blog_public')
    ), 200);
}

// ==================== FIX CANONICAL ====================
function seo_autofix_api_fix_canonical($request) {
    global $wpdb;
    $settings = get_option('seo_autofix_settings', array());
    
    // Enable canonical tag output
    $settings['enable_canonical'] = true;
    update_option('seo_autofix_settings', $settings);
    
    // Get posts without canonical URLs set
    $posts = $wpdb->get_results("
        SELECT p.ID, p.post_name, p.guid
        FROM {$wpdb->posts} p
        LEFT JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_seo_autofix_canonical'
        WHERE p.post_status = 'publish' 
        AND p.post_type IN ('post', 'page')
        AND (pm.meta_value IS NULL OR pm.meta_value = '')
        LIMIT 100
    ");
    
    $fixed = 0;
    foreach ($posts as $post) {
        $canonical = get_permalink($post->ID);
        update_post_meta($post->ID, '_seo_autofix_canonical', $canonical);
        $fixed++;
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => "Canonical URLs configured for $fixed posts",
        'canonical_enabled' => true,
        'posts_fixed' => $fixed
    ), 200);
}

// ==================== FIX INTERNAL LINKS ====================
function seo_autofix_api_fix_internal_links($request) {
    global $wpdb;
    $limit = min(20, intval($request->get_param('limit') ?: 10));
    
    // Get all published posts
    $all_posts = $wpdb->get_results("
        SELECT ID, post_title, post_name, post_content 
        FROM {$wpdb->posts} 
        WHERE post_status = 'publish' 
        AND post_type IN ('post', 'page')
    ");
    
    // Build keyword map
    $keyword_map = array();
    foreach ($all_posts as $post) {
        $keywords = array_filter(explode(' ', strtolower($post->post_title)));
        $keywords = array_filter($keywords, function($k) { return strlen($k) > 3; });
        foreach ($keywords as $keyword) {
            if (!isset($keyword_map[$keyword])) {
                $keyword_map[$keyword] = array();
            }
            $keyword_map[$keyword][] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'url' => get_permalink($post->ID)
            );
        }
    }
    
    $suggestions = array();
    $posts_analyzed = 0;
    
    // Find internal linking opportunities
    foreach ($all_posts as $post) {
        if ($posts_analyzed >= $limit) break;
        
        $content_lower = strtolower(strip_tags($post->post_content));
        $current_links = array();
        preg_match_all('/href=["\']([^"\']+)["\']/', $post->post_content, $matches);
        if (!empty($matches[1])) {
            $current_links = $matches[1];
        }
        
        $post_suggestions = array();
        
        foreach ($keyword_map as $keyword => $targets) {
            // Skip if keyword is too common or is in current post title
            if (count($targets) > 5) continue;
            if (stripos($post->post_title, $keyword) !== false) continue;
            
            // Check if keyword exists in content but isn't linked
            if (stripos($content_lower, $keyword) !== false) {
                foreach ($targets as $target) {
                    // Don't suggest linking to self
                    if ($target['id'] == $post->ID) continue;
                    
                    // Check if already linked
                    $already_linked = false;
                    foreach ($current_links as $link) {
                        if (strpos($link, $target['url']) !== false) {
                            $already_linked = true;
                            break;
                        }
                    }
                    
                    if (!$already_linked) {
                        $post_suggestions[] = array(
                            'keyword' => $keyword,
                            'target_post_id' => $target['id'],
                            'target_title' => $target['title'],
                            'target_url' => $target['url']
                        );
                    }
                }
            }
        }
        
        if (!empty($post_suggestions)) {
            $suggestions[] = array(
                'post_id' => $post->ID,
                'post_title' => $post->post_title,
                'edit_url' => admin_url('post.php?post=' . $post->ID . '&action=edit'),
                'suggestions' => array_slice($post_suggestions, 0, 5)
            );
        }
        
        $posts_analyzed++;
    }
    
    // Store suggestions for later retrieval
    update_option('seo_autofix_link_suggestions', $suggestions);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Internal linking analysis complete',
        'posts_analyzed' => $posts_analyzed,
        'suggestions_count' => count($suggestions),
        'suggestions' => array_slice($suggestions, 0, 10),
        'note' => 'Internal links require manual review. Suggestions stored in WordPress admin.'
    ), 200);
}

// ==================== FIX HEADINGS ====================
function seo_autofix_api_fix_headings($request) {
    global $wpdb;
    $limit = min(50, intval($request->get_param('limit') ?: 20));
    
    // Get posts with heading issues
    $posts = $wpdb->get_results($wpdb->prepare("
        SELECT ID, post_title, post_content
        FROM {$wpdb->posts}
        WHERE post_status = 'publish'
        AND post_type IN ('post', 'page')
        AND post_content != ''
        LIMIT %d
    ", $limit));
    
    $issues_found = array();
    $fixed = 0;
    
    foreach ($posts as $post) {
        $content = $post->post_content;
        $has_issues = false;
        $post_issues = array();
        
        // Check for H1 in content (should only be in title)
        if (preg_match('/<h1[^>]*>/i', $content)) {
            $post_issues[] = 'Multiple H1 tags (H1 should only be page title)';
            $has_issues = true;
            
            // Auto-fix: Convert H1 to H2 in content
            $new_content = preg_replace('/<h1([^>]*)>/i', '<h2$1>', $content);
            $new_content = preg_replace('/<\/h1>/i', '</h2>', $new_content);
            
            if ($new_content !== $content) {
                wp_update_post(array(
                    'ID' => $post->ID,
                    'post_content' => $new_content
                ));
                $fixed++;
            }
        }
        
        // Check for skipped heading levels (e.g., H2 then H4)
        preg_match_all('/<h([2-6])[^>]*>/i', $content, $matches);
        if (!empty($matches[1])) {
            $levels = array_map('intval', $matches[1]);
            for ($i = 1; $i < count($levels); $i++) {
                if ($levels[$i] - $levels[$i-1] > 1) {
                    $post_issues[] = "Skipped heading level: H{$levels[$i-1]} to H{$levels[$i]}";
                    $has_issues = true;
                }
            }
        }
        
        if ($has_issues) {
            $issues_found[] = array(
                'post_id' => $post->ID,
                'post_title' => $post->post_title,
                'edit_url' => admin_url('post.php?post=' . $post->ID . '&action=edit'),
                'issues' => $post_issues
            );
        }
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => "Analyzed $limit posts for heading issues",
        'h1_converted_to_h2' => $fixed,
        'posts_with_issues' => count($issues_found),
        'issues' => array_slice($issues_found, 0, 20),
        'note' => 'Some heading issues require manual content restructuring'
    ), 200);
}

// ==================== FIX REDIRECTS ====================
function seo_autofix_api_fix_redirects($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'seo_autofix_redirects';
    
    // Get broken links that have been scanned
    $broken_links = get_option('seo_autofix_broken_links', array());
    $redirects_created = 0;
    $suggestions = array();
    
    // For each broken link, try to find a similar page to redirect to
    foreach ($broken_links as $link) {
        $url = $link['url'] ?? '';
        if (empty($url)) continue;
        
        // Extract the slug from the URL
        $parsed = wp_parse_url($url);
        $path = $parsed['path'] ?? '';
        $slug = trim($path, '/');
        $slug_parts = explode('/', $slug);
        $last_part = end($slug_parts);
        
        if (empty($last_part)) continue;
        
        // Try to find a published post with similar slug
        $similar_post = $wpdb->get_row($wpdb->prepare("
            SELECT ID, post_name, post_title 
            FROM {$wpdb->posts} 
            WHERE post_status = 'publish' 
            AND post_type IN ('post', 'page')
            AND (post_name LIKE %s OR post_title LIKE %s)
            LIMIT 1
        ", '%' . $wpdb->esc_like($last_part) . '%', '%' . $wpdb->esc_like(str_replace('-', ' ', $last_part)) . '%'));
        
        if ($similar_post) {
            $target_url = get_permalink($similar_post->ID);
            
            // Check if redirect already exists
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$table_name} WHERE source_url = %s",
                $path
            ));
            
            if (!$exists) {
                $suggestions[] = array(
                    'source' => $path,
                    'target' => $target_url,
                    'target_title' => $similar_post->post_title,
                    'auto_created' => false
                );
            }
        }
    }
    
    // If auto_create parameter is passed, create the redirects
    $auto_create = $request->get_param('auto_create');
    if ($auto_create && !empty($suggestions)) {
        foreach ($suggestions as &$suggestion) {
            $result = $wpdb->insert($table_name, array(
                'source_url' => $suggestion['source'],
                'target_url' => $suggestion['target'],
                'redirect_type' => 301,
                'hits' => 0,
                'created_at' => current_time('mysql'),
            ));
            
            if ($result !== false) {
                $redirects_created++;
                $suggestion['auto_created'] = true;
            }
        }
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => $redirects_created > 0 
            ? "Created $redirects_created redirects for broken links" 
            : 'Redirect suggestions generated. Review and approve in WordPress admin.',
        'redirects_created' => $redirects_created,
        'suggestions' => array_slice($suggestions, 0, 20),
        'broken_links_found' => count($broken_links),
        'admin_url' => admin_url('admin.php?page=seo-auto-fix-redirects'),
        'note' => 'Redirects require manual review. Use auto_create=true to auto-create suggested redirects.'
    ), 200);
}

// ==================== FIX CORE WEB VITALS ====================
function seo_autofix_api_fix_cwv($request) {
    $settings = get_option('seo_autofix_settings', array());
    $fixes_applied = array();
    
    // 1. Enable lazy loading
    $settings['enable_lazy_loading'] = true;
    $fixes_applied[] = 'Lazy loading enabled for images';
    
    // 2. Enable resource hints
    $settings['enable_resource_hints'] = true;
    
    // Auto-detect common external domains to preconnect
    $preconnect_domains = array(
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
    );
    
    // Add Google Analytics if detected
    if (!empty($settings['ga4_id']) || !empty($settings['gtm_id'])) {
        $preconnect_domains[] = 'https://www.googletagmanager.com';
        $preconnect_domains[] = 'https://www.google-analytics.com';
    }
    
    $settings['preconnect_domains'] = $preconnect_domains;
    $fixes_applied[] = 'Resource hints configured (' . count($preconnect_domains) . ' domains)';
    
    // 3. Defer JavaScript
    $settings['defer_js'] = true;
    $settings['defer_exclude'] = array('jquery', 'jquery-core');
    $fixes_applied[] = 'JavaScript defer enabled';
    
    // 4. Remove jQuery Migrate
    $settings['remove_jquery_migrate'] = true;
    $fixes_applied[] = 'jQuery Migrate removal enabled';
    
    // 5. Enable image compression for future uploads
    $settings['enable_image_compression'] = true;
    $settings['compression_quality'] = $settings['compression_quality'] ?? 82;
    $fixes_applied[] = 'Image compression enabled (quality: ' . $settings['compression_quality'] . ')';
    
    // 6. Enable WebP conversion if supported
    if (function_exists('imagewebp')) {
        $settings['enable_webp_conversion'] = true;
        $fixes_applied[] = 'WebP conversion enabled';
    }
    
    update_option('seo_autofix_settings', $settings);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Core Web Vitals optimizations applied',
        'fixes_applied' => $fixes_applied,
        'settings_updated' => array(
            'lazy_loading' => true,
            'resource_hints' => true,
            'defer_js' => true,
            'image_compression' => true,
            'webp_support' => function_exists('imagewebp')
        ),
        'note' => 'Some CWV improvements require theme/server-level changes'
    ), 200);
}

// ==================== DEBUG LOGGING ====================
function seo_autofix_debug_log($message, $data = null) {
    $settings = get_option('seo_autofix_settings', array());
    if (empty($settings['enable_debug_log'])) return;
    
    $log_entry = date('Y-m-d H:i:s') . ' - ' . $message;
    if ($data !== null) {
        $log_entry .= ' | Data: ' . json_encode($data);
    }
    
    $log = get_option('seo_autofix_debug_log', array());
    array_unshift($log, $log_entry);
    $log = array_slice($log, 0, 100); // Keep last 100 entries
    update_option('seo_autofix_debug_log', $log);
    
    // Also log to error_log for server-side debugging
    error_log('[SEO AutoFix] ' . $log_entry);
}

// ==================== PER-PAGE FIX: META DESCRIPTION ====================
function seo_autofix_api_fix_meta_page($request) {
    // Try multiple ways to get the options
    $options = $request->get_param('options');
    if (empty($options)) {
        $options = $request->get_json_params();
        if (isset($options['options'])) {
            $options = $options['options'];
        }
    }
    if (empty($options)) {
        $options = array();
    }
    
    $page_url = $options['page_url'] ?? '';
    $page_pathname = $options['page_pathname'] ?? '';
    $ai_suggestion = $options['ai_suggestion'] ?? '';
    $current_value = $options['current_value'] ?? array();
    
    seo_autofix_debug_log('fix_meta_page request received', array(
        'page_url' => $page_url,
        'page_pathname' => $page_pathname,
        'ai_suggestion' => $ai_suggestion,
        'current_value' => $current_value,
        'raw_body' => $request->get_body()
    ));
    
    // Find the post by URL
    $post_id = url_to_postid($page_url);
    if (!$post_id && $page_pathname === '/') {
        $post_id = get_option('page_on_front');
    }
    
    if (!$post_id) {
        seo_autofix_debug_log('fix_meta_page: Post not found', array('url' => $page_url));
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Page not found in WordPress',
            'page_url' => $page_url,
            'debug' => 'url_to_postid returned 0'
        ), 200);
    }
    
    $post = get_post($post_id);
    $current_meta = get_post_meta($post_id, '_seo_autofix_meta_description', true);
    $current_length = $current_value['length'] ?? strlen($current_meta);
    
    // Generate optimal meta description using AI suggestion as guide
    $new_meta = '';
    if ($current_length === 0) {
        // No meta - generate from content
        $content = strip_tags($post->post_content);
        $content = preg_replace('/\s+/', ' ', $content);
        $new_meta = substr($content, 0, 155);
        if (strlen($content) > 155) {
            $new_meta = substr($new_meta, 0, strrpos($new_meta, ' ')) . '...';
        }
    } elseif ($current_length < 120) {
        // Too short - expand it
        $existing = $current_value['description'] ?? $current_meta;
        $content = strip_tags($post->post_content);
        $new_meta = $existing . ' ' . substr($content, 0, 160 - strlen($existing));
        $new_meta = substr($new_meta, 0, 155);
    } elseif ($current_length > 160) {
        // Too long - shorten it
        $existing = $current_value['description'] ?? $current_meta;
        $new_meta = substr($existing, 0, 155);
        $new_meta = substr($new_meta, 0, strrpos($new_meta, ' ')) . '...';
    } else {
        // Length is fine, no change needed
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Meta description length is already optimal',
            'page_url' => $page_url,
            'current_length' => $current_length,
            'fixed' => 0
        ), 200);
    }
    
    // Save the new meta description
    update_post_meta($post_id, '_seo_autofix_meta_description', $new_meta);
    
    seo_autofix_debug_log('fix_meta_page: Meta description updated', array(
        'post_id' => $post_id,
        'old_length' => $current_length,
        'new_length' => strlen($new_meta),
        'new_meta' => substr($new_meta, 0, 50) . '...'
    ));
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Meta description optimized for ' . $page_pathname,
        'page_url' => $page_url,
        'post_id' => $post_id,
        'old_length' => $current_length,
        'new_length' => strlen($new_meta),
        'new_meta' => $new_meta,
        'fixed' => 1
    ), 200);
}

// ==================== PER-PAGE FIX: TITLE TAG ====================
function seo_autofix_api_fix_title_page($request) {
    // Try multiple ways to get the options
    $options = $request->get_param('options');
    if (empty($options)) {
        $options = $request->get_json_params();
        if (isset($options['options'])) {
            $options = $options['options'];
        }
    }
    if (empty($options)) {
        $options = array();
    }
    
    $page_url = $options['page_url'] ?? '';
    $page_pathname = $options['page_pathname'] ?? '';
    $ai_suggestion = $options['ai_suggestion'] ?? '';
    $current_value = $options['current_value'] ?? array();
    
    seo_autofix_debug_log('fix_title_page request received', array(
        'page_url' => $page_url,
        'page_pathname' => $page_pathname,
        'ai_suggestion' => $ai_suggestion,
        'raw_body' => $request->get_body()
    ));
    
    $post_id = url_to_postid($page_url);
    if (!$post_id && $page_pathname === '/') {
        $post_id = get_option('page_on_front');
    }
    
    if (!$post_id) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Page not found in WordPress',
            'page_url' => $page_url
        ), 200);
    }
    
    $post = get_post($post_id);
    $current_title = $current_value['title'] ?? $post->post_title;
    $current_length = strlen($current_title);
    
    $new_title = $current_title;
    $site_name = get_bloginfo('name');
    
    if ($current_length < 30) {
        // Too short - add site name and context
        $new_title = $current_title . ' | ' . $site_name;
        if (strlen($new_title) < 30) {
            // Still short, add more context
            $new_title = $current_title . ' - Expert Guide | ' . $site_name;
        }
    } elseif ($current_length > 60) {
        // Too long - shorten intelligently
        $new_title = substr($current_title, 0, 55);
        if (strrpos($new_title, ' ') !== false) {
            $new_title = substr($new_title, 0, strrpos($new_title, ' '));
        }
        $new_title .= '...';
    } else {
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Title length is already optimal',
            'page_url' => $page_url,
            'current_length' => $current_length,
            'fixed' => 0
        ), 200);
    }
    
    // Save custom title
    update_post_meta($post_id, '_seo_autofix_title', $new_title);
    
    seo_autofix_debug_log('fix_title_page: Title updated', array(
        'post_id' => $post_id,
        'old_title' => $current_title,
        'new_title' => $new_title
    ));
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Title optimized for ' . $page_pathname,
        'page_url' => $page_url,
        'post_id' => $post_id,
        'old_title' => $current_title,
        'new_title' => $new_title,
        'old_length' => $current_length,
        'new_length' => strlen($new_title),
        'fixed' => 1
    ), 200);
}

// ==================== PER-PAGE FIX: ALT TEXT ====================
function seo_autofix_api_fix_alt_text_page($request) {
    // Try multiple ways to get the options
    $options = $request->get_param('options');
    if (empty($options)) {
        $options = $request->get_json_params();
        if (isset($options['options'])) {
            $options = $options['options'];
        }
    }
    if (empty($options)) {
        $options = array();
    }
    
    $page_url = $options['page_url'] ?? '';
    $page_pathname = $options['page_pathname'] ?? '';
    
    seo_autofix_debug_log('fix_alt_text_page request received', array(
        'page_url' => $page_url,
        'page_pathname' => $page_pathname
    ));
    
    $post_id = url_to_postid($page_url);
    if (!$post_id && $page_pathname === '/') {
        $post_id = get_option('page_on_front');
    }
    
    if (!$post_id) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Page not found in WordPress',
            'page_url' => $page_url
        ), 200);
    }
    
    $post = get_post($post_id);
    $content = $post->post_content;
    $fixed_images = 0;
    
    // Find images without alt text in post content
    preg_match_all('/<img[^>]+>/i', $content, $matches);
    
    foreach ($matches[0] as $img_tag) {
        // Check if alt is missing or empty
        if (!preg_match('/alt=["\'][^"\']+["\']/i', $img_tag)) {
            // Extract src to generate alt text from filename
            if (preg_match('/src=["\']([^"\']+)["\']/i', $img_tag, $src_match)) {
                $src = $src_match[1];
                $filename = pathinfo($src, PATHINFO_FILENAME);
                $alt_text = ucwords(str_replace(array('-', '_'), ' ', $filename));
                
                // Add alt attribute
                $new_img = preg_replace('/<img/', '<img alt="' . esc_attr($alt_text) . '"', $img_tag);
                $content = str_replace($img_tag, $new_img, $content);
                $fixed_images++;
            }
        }
    }
    
    if ($fixed_images > 0) {
        wp_update_post(array(
            'ID' => $post_id,
            'post_content' => $content
        ));
        
        seo_autofix_debug_log('fix_alt_text_page: Images fixed', array(
            'post_id' => $post_id,
            'fixed_count' => $fixed_images
        ));
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => $fixed_images > 0 
            ? "Fixed alt text for $fixed_images images on $page_pathname" 
            : 'No images needing alt text found',
        'page_url' => $page_url,
        'post_id' => $post_id,
        'fixed' => $fixed_images
    ), 200);
}

// ==================== PER-PAGE FIX: HEADINGS ====================
function seo_autofix_api_fix_headings_page($request) {
    // Try multiple ways to get the options
    $options = $request->get_param('options');
    if (empty($options)) {
        $options = $request->get_json_params();
        if (isset($options['options'])) {
            $options = $options['options'];
        }
    }
    if (empty($options)) {
        $options = array();
    }
    
    $page_url = $options['page_url'] ?? '';
    $page_pathname = $options['page_pathname'] ?? '';
    $current_value = $options['current_value'] ?? array();
    
    seo_autofix_debug_log('fix_headings_page request received', array(
        'page_url' => $page_url,
        'page_pathname' => $page_pathname,
        'current_value' => $current_value
    ));
    
    $post_id = url_to_postid($page_url);
    if (!$post_id && $page_pathname === '/') {
        $post_id = get_option('page_on_front');
    }
    
    if (!$post_id) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Page not found in WordPress',
            'page_url' => $page_url
        ), 200);
    }
    
    $post = get_post($post_id);
    $content = $post->post_content;
    $fixes = array();
    
    // Check for H1 in content (should only be page title)
    $h1_count = preg_match_all('/<h1[^>]*>/i', $content, $matches);
    if ($h1_count > 0) {
        // Convert H1 to H2 in content
        $content = preg_replace('/<h1([^>]*)>/i', '<h2$1>', $content);
        $content = preg_replace('/<\/h1>/i', '</h2>', $content);
        $fixes[] = "Converted $h1_count H1 tags to H2";
    }
    
    // Fix skipped heading levels (e.g., H2 then H4)
    // This is more complex and might need manual review
    
    if (count($fixes) > 0) {
        wp_update_post(array(
            'ID' => $post_id,
            'post_content' => $content
        ));
        
        seo_autofix_debug_log('fix_headings_page: Headings fixed', array(
            'post_id' => $post_id,
            'fixes' => $fixes
        ));
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => count($fixes) > 0 
            ? 'Heading structure fixed on ' . $page_pathname 
            : 'No heading issues to fix',
        'page_url' => $page_url,
        'post_id' => $post_id,
        'fixes_applied' => $fixes,
        'fixed' => count($fixes) > 0 ? 1 : 0
    ), 200);
}

// ==================== PER-PAGE FIX: CANONICAL URL ====================
function seo_autofix_api_fix_canonical_page($request) {
    // Try multiple ways to get the options
    $options = $request->get_param('options');
    if (empty($options)) {
        $options = $request->get_json_params();
        if (isset($options['options'])) {
            $options = $options['options'];
        }
    }
    if (empty($options)) {
        $options = array();
    }
    
    $page_url = $options['page_url'] ?? '';
    $page_pathname = $options['page_pathname'] ?? '';
    
    seo_autofix_debug_log('fix_canonical_page request received', array(
        'page_url' => $page_url,
        'page_pathname' => $page_pathname
    ));
    
    $post_id = url_to_postid($page_url);
    if (!$post_id && $page_pathname === '/') {
        $post_id = get_option('page_on_front');
    }
    
    if (!$post_id) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Page not found in WordPress',
            'page_url' => $page_url
        ), 200);
    }
    
    // Set canonical URL
    $canonical = get_permalink($post_id);
    update_post_meta($post_id, '_seo_autofix_canonical', $canonical);
    
    // Enable canonical output
    $settings = get_option('seo_autofix_settings', array());
    $settings['enable_canonical'] = true;
    update_option('seo_autofix_settings', $settings);
    
    seo_autofix_debug_log('fix_canonical_page: Canonical set', array(
        'post_id' => $post_id,
        'canonical' => $canonical
    ));
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Canonical URL set for ' . $page_pathname,
        'page_url' => $page_url,
        'post_id' => $post_id,
        'canonical' => $canonical,
        'fixed' => 1
    ), 200);
}

// ==================== TECHNICAL SEO COMBINED FIX ====================
function seo_autofix_api_fix_technical_seo($request) {
    seo_autofix_debug_log('fix_technical_seo request received', array());
    
    $fixes_applied = array();
    $settings = get_option('seo_autofix_settings', array());
    
    // Enable canonical URLs
    if (empty($settings['enable_canonical'])) {
        $settings['enable_canonical'] = true;
        $fixes_applied[] = 'Enabled canonical URLs';
    }
    
    // Enable sitemap
    if (empty($settings['enable_sitemap'])) {
        $settings['enable_sitemap'] = true;
        $fixes_applied[] = 'Enabled XML sitemap';
    }
    
    // Enable robots.txt optimization
    if (empty($settings['enable_robots'])) {
        $settings['enable_robots'] = true;
        $fixes_applied[] = 'Enabled robots.txt optimization';
    }
    
    // Enable schema markup
    if (empty($settings['enable_schema'])) {
        $settings['enable_schema'] = true;
        $fixes_applied[] = 'Enabled schema markup';
    }
    
    // Enable Open Graph tags
    if (empty($settings['enable_og_tags'])) {
        $settings['enable_og_tags'] = true;
        $fixes_applied[] = 'Enabled Open Graph tags';
    }
    
    update_option('seo_autofix_settings', $settings);
    
    seo_autofix_debug_log('fix_technical_seo: Fixes applied', array(
        'fixes' => $fixes_applied
    ));
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Technical SEO optimizations applied',
        'fixes_applied' => $fixes_applied,
        'fixed' => count($fixes_applied)
    ), 200);
}

// ==================== KEYWORDS PAGE FIX (RECOMMENDATIONS) ====================
function seo_autofix_api_fix_keywords_page($request) {
    $options = $request->get_param('options');
    if (empty($options)) {
        $options = $request->get_json_params();
        if (isset($options['options'])) {
            $options = $options['options'];
        }
    }
    if (empty($options)) {
        $options = array();
    }
    
    $page_url = $options['page_url'] ?? '';
    $page_pathname = $options['page_pathname'] ?? '';
    $current_value = $options['current_value'] ?? array();
    
    seo_autofix_debug_log('fix_keywords_page request received', array(
        'page_url' => $page_url,
        'current_value' => $current_value
    ));
    
    // Keywords require manual content optimization - provide recommendations
    $recommendations = array(
        'Ensure your primary keyword appears in the title tag',
        'Include your main keyword in the H1 heading',
        'Add your keyword naturally in the meta description',
        'Use keyword variations throughout the content',
        'Include related keywords (LSI) in subheadings'
    );
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Keyword optimization requires content updates. See recommendations.',
        'page_url' => $page_url,
        'recommendations' => $recommendations,
        'current_consistency' => $current_value['consistency'] ?? 0,
        'fixed' => 0,
        'needs_manual_action' => $recommendations
    ), 200);
}

// ==================== BROKEN LINKS PAGE FIX (RECOMMENDATIONS) ====================
function seo_autofix_api_fix_broken_links_page($request) {
    $options = $request->get_param('options');
    if (empty($options)) {
        $options = $request->get_json_params();
        if (isset($options['options'])) {
            $options = $options['options'];
        }
    }
    if (empty($options)) {
        $options = array();
    }
    
    $page_url = $options['page_url'] ?? '';
    $page_pathname = $options['page_pathname'] ?? '';
    $current_value = $options['current_value'] ?? array();
    
    seo_autofix_debug_log('fix_broken_links_page request received', array(
        'page_url' => $page_url,
        'empty_links' => $current_value['emptyLinks'] ?? 0
    ));
    
    $post_id = url_to_postid($page_url);
    if (!$post_id && $page_pathname === '/') {
        $post_id = get_option('page_on_front');
    }
    
    if (!$post_id) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Page not found in WordPress',
            'page_url' => $page_url
        ), 200);
    }
    
    $post = get_post($post_id);
    $content = $post->post_content;
    $fixed_links = 0;
    
    // Find and fix empty href links (href="" or href="#")
    $content = preg_replace_callback(
        '/<a([^>]*?)href=["\'](?:#|)["\']([^>]*?)>/i',
        function($matches) use (&$fixed_links) {
            $fixed_links++;
            // Remove empty links or convert to span
            return '<span' . $matches[1] . $matches[2] . '>';
        },
        $content
    );
    
    if ($fixed_links > 0) {
        wp_update_post(array(
            'ID' => $post_id,
            'post_content' => $content
        ));
        
        seo_autofix_debug_log('fix_broken_links_page: Links fixed', array(
            'post_id' => $post_id,
            'fixed_count' => $fixed_links
        ));
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => $fixed_links > 0 
            ? "Removed $fixed_links empty/placeholder links on $page_pathname" 
            : 'No empty links found to fix automatically. Review links manually.',
        'page_url' => $page_url,
        'post_id' => $post_id,
        'fixed' => $fixed_links,
        'recommendations' => array(
            'Review all links in the page editor',
            'Replace empty href="#" with actual URLs',
            'Remove placeholder links that go nowhere',
            'Use proper anchor text for all links'
        )
    ), 200);
}
