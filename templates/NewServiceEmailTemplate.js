const NewServiceEmailTemplate = (newService, providerName) => {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Helvetica', Arial, sans-serif;
            background-color: #fafafa;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #4CAF50;
            color: #fff;
            padding: 15px;
            text-align: center;
            font-size: 22px;
            border-radius: 10px 10px 0 0;
          }
          .body {
            padding: 20px;
          }
          .service-name {
            font-size: 22px;
            font-weight: 600;
            color: #333;
          }
          .service-details {
            margin-top: 15px;
            font-size: 16px;
            line-height: 1.5;
          }
          .cta {
            display: inline-block;
            background-color: #4CAF50;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            font-weight: 600;
            border-radius: 5px;
            margin-top: 20px;
          }
          .cta:hover {
            background-color: #45a049;
          }
          .footer {
            text-align: center;
            color: #888;
            font-size: 14px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            New Service Created: ${newService.name}
          </div>
          <div class="body">
            <p>Hi ${providerName},</p>
            <p>We are excited to let you know that your new service has been successfully created. Here are the details:</p>
            <div class="service-details">
              <p><strong>Service Name:</strong> ${newService.name}</p>
              <p><strong>Description:</strong> ${newService.description}</p>
              <p><strong>Price:</strong> $${newService.price}</p>
              <p><strong>Duration:</strong> ${newService.duration} minutes</p>
            </div>
            <a href="${newService.url}" class="cta">View Your Service</a>
          </div>
          <div class="footer">
            <p>If you did not create this service, please contact us immediately.</p>
            <p>Thank you for using our platform!</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

module.exports = NewServiceEmailTemplate;
