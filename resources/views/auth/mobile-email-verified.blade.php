<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="robots" content="noindex, nofollow">
        <title>Email Terverifikasi - Indotix</title>
        <style>
            * { box-sizing: border-box; }
            body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                padding: 24px;
                background: #f6fbff;
                color: #0f172a;
                font-family: Arial, Helvetica, sans-serif;
            }
            main {
                width: min(100%, 440px);
                padding: 32px;
                border: 1px solid #dbeafe;
                border-radius: 20px;
                background: #ffffff;
                box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
                text-align: center;
            }
            img { width: 132px; height: auto; }
            h1 { margin: 24px 0 10px; font-size: 26px; line-height: 1.25; }
            p { margin: 0; color: #475569; font-size: 15px; line-height: 1.7; }
            a {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 48px;
                margin-top: 24px;
                padding: 12px 22px;
                border-radius: 12px;
                background: #0284c7;
                color: #ffffff;
                font-weight: 700;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <main>
            <img src="{{ $logoUrl }}" alt="Indotix">
            <h1>Email berhasil diverifikasi</h1>
            <p>Aplikasi Indotix akan terbuka otomatis. Jika tidak terbuka, gunakan tombol di bawah ini.</p>
            <a href="{{ $deepLink }}">Buka aplikasi Indotix</a>
        </main>
        <script>
            window.setTimeout(function () {
                window.location.href = @json($deepLink);
            }, 250);
        </script>
    </body>
</html>
