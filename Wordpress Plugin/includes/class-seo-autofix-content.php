<?php
/**
 * Content Publishing Features
 * 
 * Handles remote content publishing from the AI Content Scheduler
 */

defined('ABSPATH') || exit;

class SEO_AutoFix_Content {
    
    private static $instance = null;
    
    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_endpoints'));
    }
    
    public function register_endpoints() {
        $namespace = 'seo-autofix/v1';

        // Get categories endpoint
        register_rest_route($namespace, '/content/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'api_get_categories'),
            'permission_callback' => 'seo_autofix_api_permission',
        ));
        
        // Get tags endpoint
        register_rest_route($namespace, '/content/tags', array(
            'methods' => 'GET',
            'callback' => array($this, 'api_get_tags'),
            'permission_callback' => 'seo_autofix_api_permission',
        ));
    }
    
    /**
     * Publish new content
     */
    public function api_publish_content($request) {
        $title = sanitize_text_field($request->get_param('title'));
        $content = wp_kses_post($request->get_param('content'));
        $slug = sanitize_title($request->get_param('slug') ?: $title);
        $excerpt = sanitize_textarea_field($request->get_param('excerpt') ?: '');
        $meta_description = sanitize_text_field($request->get_param('metaDescription') ?: '');
        $focus_keyword = sanitize_text_field($request->get_param('focusKeyword') ?: '');
        $categories = $request->get_param('categories') ?: array();
        $tags = $request->get_param('tags') ?: array();
        $featured_image_url = esc_url_raw($request->get_param('featuredImageUrl') ?: '');
        $featured_image_alt = sanitize_text_field($request->get_param('featuredImageAlt') ?: '');
        $post_type = sanitize_text_field($request->get_param('postType') ?: 'post');
        $post_status = sanitize_text_field($request->get_param('postStatus') ?: 'publish');
        
        if (empty($title) || empty($content)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Title and content are required',
            ), 400);
        }
        
        // Prepare post data
        $post_data = array(
            'post_title'   => $title,
            'post_content' => $content,
            'post_name'    => $slug,
            'post_excerpt' => $excerpt,
            'post_status'  => $post_status,
            'post_type'    => $post_type,
            'post_author'  => get_current_user_id() ?: 1,
        );
        
        // Insert post
        $post_id = wp_insert_post($post_data, true);
        
        if (is_wp_error($post_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $post_id->get_error_message(),
            ), 500);
        }
        
        // Set categories
        if (!empty($categories) && $post_type === 'post') {
            $category_ids = $this->get_or_create_terms($categories, 'category');
            wp_set_post_categories($post_id, $category_ids);
        }
        
        // Set tags
        if (!empty($tags) && $post_type === 'post') {
            $tag_ids = $this->get_or_create_terms($tags, 'post_tag');
            wp_set_post_tags($post_id, $tag_ids);
        }
        
        // Handle featured image
        if (!empty($featured_image_url)) {
            $attachment_id = $this->upload_image_from_url($featured_image_url, $post_id, $featured_image_alt);
            if ($attachment_id) {
                set_post_thumbnail($post_id, $attachment_id);
            }
        }
        
        // Set SEO meta (Yoast compatible)
        if (!empty($meta_description)) {
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $meta_description);
        }
        if (!empty($focus_keyword)) {
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $focus_keyword);
        }
        
        // Also set for Rank Math
        if (!empty($meta_description)) {
            update_post_meta($post_id, 'rank_math_description', $meta_description);
        }
        if (!empty($focus_keyword)) {
            update_post_meta($post_id, 'rank_math_focus_keyword', $focus_keyword);
        }
        
        // Set for SEO AutoFix
        update_post_meta($post_id, '_seo_autofix_meta_description', $meta_description);
        update_post_meta($post_id, '_seo_autofix_focus_keyword', $focus_keyword);
        
        $post = get_post($post_id);
        
        return new WP_REST_Response(array(
            'success' => true,
            'postId' => $post_id,
            'url' => get_permalink($post_id),
            'editUrl' => admin_url('post.php?post=' . $post_id . '&action=edit'),
            'status' => $post->post_status,
            'message' => 'Content published successfully',
        ), 200);
    }
    
    /**
     * Update existing content
     */
    public function api_update_content($request) {
        $post_id = intval($request->get_param('postId'));
        
        if (!$post_id || !get_post($post_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => 'Invalid post ID',
            ), 400);
        }
        
        $update_data = array('ID' => $post_id);
        
        if ($request->get_param('title')) {
            $update_data['post_title'] = sanitize_text_field($request->get_param('title'));
        }
        if ($request->get_param('content')) {
            $update_data['post_content'] = wp_kses_post($request->get_param('content'));
        }
        if ($request->get_param('excerpt')) {
            $update_data['post_excerpt'] = sanitize_textarea_field($request->get_param('excerpt'));
        }
        if ($request->get_param('slug')) {
            $update_data['post_name'] = sanitize_title($request->get_param('slug'));
        }
        if ($request->get_param('postStatus')) {
            $update_data['post_status'] = sanitize_text_field($request->get_param('postStatus'));
        }
        
        $result = wp_update_post($update_data, true);
        
        if (is_wp_error($result)) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $result->get_error_message(),
            ), 500);
        }
        
        // Update meta
        if ($request->get_param('metaDescription')) {
            $meta = sanitize_text_field($request->get_param('metaDescription'));
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $meta);
            update_post_meta($post_id, 'rank_math_description', $meta);
            update_post_meta($post_id, '_seo_autofix_meta_description', $meta);
        }
        if ($request->get_param('focusKeyword')) {
            $keyword = sanitize_text_field($request->get_param('focusKeyword'));
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $keyword);
            update_post_meta($post_id, 'rank_math_focus_keyword', $keyword);
            update_post_meta($post_id, '_seo_autofix_focus_keyword', $keyword);
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'postId' => $post_id,
            'url' => get_permalink($post_id),
            'message' => 'Content updated successfully',
        ), 200);
    }
    
    /**
     * Get all categories
     */
    public function api_get_categories($request) {
        $categories = get_categories(array(
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'ASC',
        ));
        
        $result = array();
        foreach ($categories as $cat) {
            $result[] = array(
                'id' => $cat->term_id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'count' => $cat->count,
            );
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'data' => $result,
        ), 200);
    }
    
    /**
     * Get all tags
     */
    public function api_get_tags($request) {
        $tags = get_tags(array(
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'ASC',
        ));
        
        $result = array();
        foreach ($tags as $tag) {
            $result[] = array(
                'id' => $tag->term_id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'count' => $tag->count,
            );
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'data' => $result,
        ), 200);
    }
    
    /**
     * Get or create terms (categories/tags)
     */
    private function get_or_create_terms($term_names, $taxonomy) {
        $term_ids = array();
        
        foreach ($term_names as $name) {
            $name = trim($name);
            if (empty($name)) continue;
            
            $term = get_term_by('name', $name, $taxonomy);
            
            if ($term) {
                $term_ids[] = $term->term_id;
            } else {
                $result = wp_insert_term($name, $taxonomy);
                if (!is_wp_error($result)) {
                    $term_ids[] = $result['term_id'];
                }
            }
        }
        
        return $term_ids;
    }
    
    /**
     * Upload image from URL
     */
    private function upload_image_from_url($url, $post_id, $alt_text = '') {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        // Download file to temp location
        $tmp = download_url($url);
        
        if (is_wp_error($tmp)) {
            return false;
        }
        
        // Get filename from URL
        $url_path = parse_url($url, PHP_URL_PATH);
        $filename = basename($url_path);
        
        // Ensure it has a valid extension
        if (!preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $filename)) {
            $filename .= '.jpg';
        }
        
        $file_array = array(
            'name' => $filename,
            'tmp_name' => $tmp,
        );
        
        // Upload and attach to post
        $attachment_id = media_handle_sideload($file_array, $post_id);
        
        // Clean up temp file
        if (file_exists($tmp)) {
            @unlink($tmp);
        }
        
        if (is_wp_error($attachment_id)) {
            return false;
        }
        
        // Set alt text
        if (!empty($alt_text)) {
            update_post_meta($attachment_id, '_wp_attachment_image_alt', $alt_text);
        }
        
        return $attachment_id;
    }
}

// Initialize
SEO_AutoFix_Content::instance();
