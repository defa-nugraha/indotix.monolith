<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

class HtmlSanitizer
{
    private const ALLOWED_TAGS = [
        'a',
        'blockquote',
        'br',
        'code',
        'div',
        'em',
        'h2',
        'h3',
        'h4',
        'hr',
        'li',
        'ol',
        'p',
        'pre',
        'span',
        'strong',
        'table',
        'tbody',
        'td',
        'th',
        'thead',
        'tr',
        'ul',
    ];

    private const ALLOWED_ATTRIBUTES = [
        'a' => ['href', 'title', 'target', 'rel'],
        'td' => ['colspan', 'rowspan'],
        'th' => ['colspan', 'rowspan'],
        '*' => ['class'],
    ];

    private const DANGEROUS_TAGS = [
        'iframe',
        'object',
        'script',
        'style',
    ];

    public static function clean(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $html = trim($html);
        if ($html === '') {
            return '';
        }

        if (! class_exists(DOMDocument::class)) {
            return htmlspecialchars(strip_tags($html), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }

        $previous = libxml_use_internal_errors(true);
        $document = new DOMDocument('1.0', 'UTF-8');
        $document->loadHTML(
            '<!DOCTYPE html><html><body><div id="__sanitize_root">'.$html.'</div></body></html>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $root = $document->getElementById('__sanitize_root');
        if (! $root) {
            return '';
        }

        self::sanitizeChildren($root);

        $output = '';
        foreach ($root->childNodes as $child) {
            $output .= $document->saveHTML($child);
        }

        return trim($output);
    }

    private static function sanitizeChildren(DOMNode $node): void
    {
        for ($child = $node->firstChild; $child !== null;) {
            $next = $child->nextSibling;

            if ($child instanceof DOMElement) {
                self::sanitizeElement($child);
            }

            if ($child->parentNode !== null) {
                self::sanitizeChildren($child);
            }

            $child = $next;
        }
    }

    private static function sanitizeElement(DOMElement $element): void
    {
        $tag = strtolower($element->tagName);

        if (in_array($tag, self::DANGEROUS_TAGS, true)) {
            $element->parentNode?->removeChild($element);

            return;
        }

        if (! in_array($tag, self::ALLOWED_TAGS, true)) {
            $textNode = $element->ownerDocument->createTextNode($element->textContent);
            $element->parentNode?->replaceChild($textNode, $element);

            return;
        }

        foreach (iterator_to_array($element->attributes) as $attribute) {
            $name = strtolower($attribute->name);
            $value = trim((string) $attribute->value);
            $allowed = in_array($name, self::ALLOWED_ATTRIBUTES[$tag] ?? [], true)
                || in_array($name, self::ALLOWED_ATTRIBUTES['*'], true);

            if (! $allowed || str_starts_with($name, 'on') || self::isUnsafeUrlAttribute($name, $value)) {
                $element->removeAttribute($attribute->name);
            }
        }

        if ($tag === 'a') {
            $element->setAttribute('rel', 'noopener noreferrer');
            if ($element->getAttribute('target') === '') {
                $element->setAttribute('target', '_blank');
            }
        }
    }

    private static function isUnsafeUrlAttribute(string $name, string $value): bool
    {
        if (! in_array($name, ['href'], true)) {
            return false;
        }

        $normalized = strtolower(preg_replace('/\s+/', '', html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8')));

        return str_starts_with($normalized, 'javascript:')
            || str_starts_with($normalized, 'data:')
            || str_starts_with($normalized, 'vbscript:');
    }
}
