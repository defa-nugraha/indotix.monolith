<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Reset Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; background: #f6fbff; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; color: #0f172a;">Halo, {{ $name }}</h2>
            <p style="margin: 0 0 16px; color: #475569;">
                Berikut kode OTP untuk reset password akun Anda:
            </p>
            <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0284c7; text-align: center; padding: 12px 0; border: 1px dashed #bae6fd; border-radius: 12px;">
                {{ $code }}
            </div>
            <p style="margin: 16px 0 0; color: #475569;">
                Kode ini berlaku selama {{ $expiresMinutes }} menit. Jangan bagikan kode ini kepada siapa pun.
            </p>
            <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px;">
                Jika Anda tidak meminta reset password, abaikan email ini.
            </p>
        </div>
    </body>
</html>
