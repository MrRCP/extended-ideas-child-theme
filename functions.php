<?php 
/**
 * Register/enqueue custom scripts and styles
 */
add_action('wp_enqueue_scripts', function() {
	if (!bricks_is_builder_main()) {
		wp_enqueue_style('bricks-child', get_stylesheet_uri(), ['bricks-frontend'], filemtime(get_stylesheet_directory() . '/style.css'));
	}
});

// Enqueue Extended custom JavaScript
add_action('wp_enqueue_scripts', 'extended_scripts');
function extended_scripts() {
	// Cookie consent placeholder for Calendly when Termageddon/Usercentrics blocks embeds
	wp_enqueue_script('extended-consent-placeholder',
		get_stylesheet_directory_uri() . '/assets/js/extended-consent-placeholder.js',
		array(),
		'1.0.1',
		true // Load in footer
	);
}

/**
 * Register custom elements
 */
add_action( 'init', function() {
	$element_files = [
		__DIR__ . '/elements/title.php',
	];

	foreach ( $element_files as $file ) {
		\Bricks\Elements::register_element( $file );
	}
}, 11 );

/**
 * Add text strings to builder
 */
add_filter( 'bricks/builder/i18n', function( $i18n ) {
	// For element category 'custom'
	$i18n['custom'] = esc_html__( 'Custom', 'bricks' );

	return $i18n;
} );

add_action('bricks_dynamic_tags', function($tags) {
	$tags['get_post_type'] = [
		'type' => 'post',
		'label' => 'Post Type',
		'callback' => function() {
			return get_post_type();
		}
	];
});



function get_post_link( string $field_name, string $key ) {
	$field_value = get_post_meta( get_the_ID(), $field_name, true );

	if ( $field_value && isset( $field_value[$key] ) ) {
		return $field_value[$key];
	}
}


/**
 * Custom Image Sizes
 */
add_theme_support( 'post-thumbnails' );

// Most commonly used sizes
add_image_size( '21x9-crop-1360px', 1360, 579, true);  
add_image_size('16x9-crop-1360px', 1360, 765, true);
add_image_size( '4x3-crop-960px', 960, 720, true );
add_image_size( '4x3-crop-480px', 480, 360, true );
add_image_size( '1x1-crop-960px', 960, 960, true );
add_image_size( '1x1-crop-480px', 480, 480, true );

// Make sizes available in Bricks
function wpb_custom_image_sizes($size_names) {
	$new_sizes = array(
		'21x9-crop-1360px' => 'Cropped 21:9 (1360px)', 
		'16x9-crop-1360px' => 'Cropped 16:9 (1360px)', 
		'4x3-crop-960px' => 'Cropped 4:3 (960px)', 
		'4x3-crop-480px' => 'Cropped 4:3 (480px)', 
		'1x1-crop-960px' => 'Cropped 1:1 (960px)', 
		'1x1-crop-480px' => 'Cropped 1:1 (480px)'
	);
	return array_merge($size_names, $new_sizes);
}
add_filter('image_size_names_choose', 'wpb_custom_image_sizes');

function dynamic_picture_preload() {
    if (is_singular()) { // Only for single posts/pages
        $image_id = get_post_thumbnail_id(get_the_ID()); // Get featured image ID

        if ($image_id) {
            // Get different image sizes
            $image_desktop = wp_get_attachment_image_src($image_id, '21x9-crop-1360px');
            $image_tablet = wp_get_attachment_image_src($image_id, '4x3-crop-960px');
            $image_mobile = wp_get_attachment_image_src($image_id, '1x1-crop-480px');

            // Ensure images exist before outputting the preload links
            if (!empty($image_desktop[0])) {
                echo '<link rel="preload" as="image" href="' . esc_url($image_desktop[0]) . '" media="(min-width: 992px)" fetchpriority="high" type="image/webp">' . "\n";
            }
            if (!empty($image_tablet[0])) {
                echo '<link rel="preload" as="image" href="' . esc_url($image_tablet[0]) . '" media="(max-width: 991px) and (min-width: 479px)" fetchpriority="high" type="image/webp">' . "\n";
            }
            if (!empty($image_mobile[0])) {
                echo '<link rel="preload" as="image" href="' . esc_url($image_mobile[0]) . '" media="(max-width: 478px)" fetchpriority="high" type="image/webp">' . "\n";
            }
        }
    }
}
add_action('wp_head', 'dynamic_picture_preload');

add_filter( 'bricks/allowed_html_tags', function( $allowed_html_tags ) {
	// Define the additional tags to be added (e.g. 'form' & 'select')
	$additional_tags = ['time', 'select'];

	// Merge additional tags with the existing allowed tags
	return array_merge( $allowed_html_tags, $additional_tags );
} );


add_filter( 'bricks/code/echo_function_names', function() {
	return [
		'get_post_type',
		'get_post_link',
		'wpb_custom_image_sizes',
	];
} );

function remove_h1_from_tinymce( $init ) {
    $init['block_formats'] = 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6';
    return $init;
}
add_filter( 'tiny_mce_before_init', 'remove_h1_from_tinymce' );