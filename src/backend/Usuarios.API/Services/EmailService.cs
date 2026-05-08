using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace Usuario.API.Services;

public class EmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var smtpServer = _config["EmailSettings:SmtpServer"];
        var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"]!);
        var senderEmail = _config["EmailSettings:SenderEmail"];
        var senderPassword = _config["EmailSettings:SenderPassword"];
        var enableSsl = bool.Parse(_config["EmailSettings:EnableSsl"]!);

        using var client = new SmtpClient(smtpServer, smtpPort)
        {
            Credentials = new NetworkCredential(senderEmail, senderPassword),
            EnableSsl = enableSsl
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(senderEmail!),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };

        mailMessage.To.Add(toEmail);

        await client.SendMailAsync(mailMessage);
    }
}