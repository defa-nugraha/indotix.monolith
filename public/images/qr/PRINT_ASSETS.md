# QR poster print assets

These JPEGs are print derivatives of the existing Indotix assets:

- `print-logo.jpg`: `public/logo.png`, white background, JPEG quality 95.
- `print-playstore.jpg`: `public/images/playstore.png`, white background, JPEG quality 95.
- `entry-mountain-print.jpg`: `entry-mountain-bg.svg`, rendered at 1600 x 900, JPEG quality 95.

Dompdf cannot paint the SVG gradients; the JPEG background preserves the preview colors.
The two branding JPEGs are used when PHP GD is unavailable, so default PNG transparency
does not cause missing logos. Regenerate these derivatives when the source assets change.
QR codes themselves remain SVG vectors generated for each destination.
