<?php
/**
 * Universal SeoRise chatbot embed (same snippet as non-WordPress sites).
 */
defined('ABSPATH') || exit;

add_action('wp_footer', 'seo_autofix_output_chatbot_embed', 99);
function seo_autofix_output_chatbot_embed() {
    if (is_admin()) {
        return;
    }
    $settings = get_option('seo_autofix_settings', array());
    if (empty($settings['chatbot_embed_enabled']) || empty($settings['chatbot_saas_site_id'])) {
        return;
    }
    $base = defined('SEO_AUDIT_API_URL') ? rtrim(SEO_AUDIT_API_URL, '/') : '';
    if ($base === '') {
        return;
    }
    $site_id = sanitize_text_field($settings['chatbot_saas_site_id']);
    $src = esc_url($base . '/widget.js');
    echo '<script src="' . $src . '" data-site-id="' . esc_attr($site_id) . '" defer></script>' . "\n";
}
