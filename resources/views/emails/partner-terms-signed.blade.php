<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dokumen Mitra Indotix</title>
</head>
<body style="margin:0;background:#f6fbff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6fbff;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dff2ff;border-radius:24px;overflow:hidden;">
                    <tr>
                        <td style="padding:28px 32px 12px;">
                            <img src="{{ asset('logo.png') }}" alt="Indotix" style="height:48px;display:block;margin-bottom:20px;">
                            <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0284c7;">Dokumen Mitra</div>
                            <h1 style="margin:10px 0 8px;font-size:24px;line-height:1.35;color:#0f172a;">Syarat dan ketentuan berhasil disetujui</h1>
                            <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">
                                Halo {{ $user->name }}, terima kasih. Persetujuan Anda untuk dokumen <strong>{{ $document->title }}</strong> sudah kami catat.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:12px 32px 24px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:18px;padding:18px;">
                                <tr>
                                    <td style="font-size:13px;color:#64748b;padding:6px 0;">Nama penandatangan</td>
                                    <td style="font-size:13px;font-weight:700;color:#0f172a;padding:6px 0;text-align:right;">{{ $signature->signer_name }}</td>
                                </tr>
                                <tr>
                                    <td style="font-size:13px;color:#64748b;padding:6px 0;">Kategori mitra</td>
                                    <td style="font-size:13px;font-weight:700;color:#0f172a;padding:6px 0;text-align:right;">{{ ucfirst($signature->business_type) }}</td>
                                </tr>
                                <tr>
                                    <td style="font-size:13px;color:#64748b;padding:6px 0;">Waktu persetujuan</td>
                                    <td style="font-size:13px;font-weight:700;color:#0f172a;padding:6px 0;text-align:right;">{{ $signature->signed_at?->timezone(config('app.timezone'))->format('d M Y H:i') }}</td>
                                </tr>
                            </table>
                            <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#475569;">
                                PDF dokumen terlampir pada email ini. Simpan email ini sebagai arsip kerja sama Anda dengan Indotix.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 32px;background:#e0f2fe;color:#0369a1;font-size:12px;line-height:1.6;">
                            Email ini dikirim otomatis oleh sistem Indotix. Jika Anda merasa tidak melakukan persetujuan, segera hubungi tim Indotix.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
