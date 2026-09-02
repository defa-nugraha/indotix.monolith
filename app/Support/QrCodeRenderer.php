<?php

namespace App\Support;

use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class QrCodeRenderer
{
    public static function svg(string $data, int $size = 260): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size),
            new SvgImageBackEnd()
        );

        return (new Writer($renderer))->writeString($data, ecLevel: ErrorCorrectionLevel::H());
    }

    public static function dataUri(string $data, int $size = 260): string
    {
        return 'data:image/svg+xml;base64,'.base64_encode(self::svg($data, $size));
    }
}
