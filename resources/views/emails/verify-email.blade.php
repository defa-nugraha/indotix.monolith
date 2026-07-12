<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifikasi Email Indotix</title>
    </head>
    <body style="margin:0; padding:0; background:#f6fbff; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6fbff; padding:32px 16px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; background:#ffffff; border:1px solid #dbeafe; border-radius:24px; overflow:hidden; box-shadow:0 16px 40px rgba(15,23,42,0.08);">
                        <tr>
                            <td style="padding:28px 28px 18px; background:#ffffff;">
                                <img src="{{ $logoUrl }}" alt="Indotix" width="132" style="display:block; width:132px; max-width:100%; height:auto;">
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:0 28px 28px;">
                                <p style="margin:0 0 10px; color:#0284c7; font-size:12px; line-height:1.4; font-weight:700; text-transform:uppercase;">
                                    Verifikasi Email
                                </p>
                                <h1 style="margin:0; color:#0f172a; font-size:28px; line-height:1.25; font-weight:800;">
                                    Halo, {{ $name ?: 'Pengguna Indotix' }}
                                </h1>
                                <p style="margin:14px 0 0; color:#475569; font-size:15px; line-height:1.7;">
                                    Terima kasih sudah mendaftar di Indotix. Klik tombol di bawah ini untuk mengaktifkan akun Anda dan melanjutkan penggunaan layanan.
                                </p>

                                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0;">
                                    <tr>
                                        <td>
                                            <a href="{{ $verificationUrl }}" style="display:inline-block; background:#0284c7; color:#ffffff; text-decoration:none; border-radius:14px; padding:14px 22px; font-size:15px; line-height:1; font-weight:700;">
                                                Verifikasi Email
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:16px; padding:16px;">
                                    <p style="margin:0; color:#1e3a8a; font-size:14px; line-height:1.6;">
                                        Link verifikasi ini berlaku selama {{ $expiresMinutes }} menit. Setelah berhasil, Anda akan diarahkan otomatis ke {{ $forMobileApp ? 'aplikasi Indotix' : 'halaman dashboard sesuai role akun Anda' }}.
                                    </p>
                                </div>

                                <p style="margin:18px 0 0; color:#64748b; font-size:13px; line-height:1.7;">
                                    Jika tombol tidak bisa diklik, salin dan buka link berikut di browser:
                                </p>
                                <p style="margin:8px 0 0; word-break:break-all; color:#0284c7; font-size:12px; line-height:1.6;">
                                    {{ $verificationUrl }}
                                </p>

                                <p style="margin:22px 0 0; color:#94a3b8; font-size:12px; line-height:1.6;">
                                    Jika Anda tidak merasa membuat akun di Indotix, abaikan email ini.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:18px 28px; background:#f8fafc; border-top:1px solid #e2e8f0;">
                                <p style="margin:0; color:#64748b; font-size:12px; line-height:1.6;">
                                    INDOTIX - Tiket Digital Indonesia
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
