const resetPasswordEmailTemplate = (resetUrl) => `
<!doctype html>
<html lang="en-US">

<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <title>Reset Your Password</title>
    <meta name="description" content="Reset your password with the provided link.">
    <style type="text/css">
        a:hover {
            text-decoration: underline !important;
        }

        body {
            margin: 0px;
            background-color: #f4f4f7;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .email-header {
            padding: 20px;
            background-color: #1e1e2d;
            color: #ffffff;
            text-align: center;
        }

        .email-header img {
            width: 50px;
        }

        .email-body {
            padding: 30px;
        }

        .email-body h1 {
            color: #333333;
            font-size: 24px;
            margin-bottom: 16px;
        }

        .email-body p {
            color: #666666;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .email-body a {
            background-color: #20e277;
            color: #ffffff;
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
            padding: 12px 24px;
            border-radius: 50px;
            display: inline-block;
        }

        .email-footer {
            padding: 20px;
            text-align: center;
            color: #999999;
            font-size: 14px;
        }

        .email-footer p {
            margin: 0;
        }
    </style>
</head>

<body>
    <table>
        <tr>
            <td>
                <table class="email-container" align="center">
                    <tr>
                        <td class="email-header">
                            <img src="https://images-platform.99static.com//EZ_jIb2rLrbXTVygzz6tjL47smo=/54x24:1586x1556/fit-in/500x500/99designs-contests-attachments/73/73651/attachment_73651808" alt="Company Logo">
                        </td>
                    </tr>
                    <tr>
                        <td class="email-body">
                            <h1>Reset Your Password</h1>
                            <p>You have requested to reset your password. Click the button below to proceed with the password reset.</p>
                            <p>If you didn't request this, please ignore this email.</p>
                            <a href="${resetUrl}" target="_blank">Reset Password</a>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-footer">
                            <p>Thank you,<br>MAX ZHOO</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
`;

module.exports = resetPasswordEmailTemplate;