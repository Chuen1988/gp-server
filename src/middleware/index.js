// eslint-disable-next-line no-unused-vars
module.exports = function (req, res, next) {
  // Add your custom middleware here. Remember that
  // in Express, the order matters.

  //Get ip address from Client with x-forwarded-for due to HAProxy
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    req.feathers.ip = req.headers['x-forwarded-for'];
  }
  //Get ip address from client
  else {
    req.feathers.ip = req.ip;
  }

  const contentType = req.headers['content-type'];

  if (contentType) {
    //Check if contain application/json for the content type
    if (contentType.toUpperCase().includes('application/json'.toUpperCase())) {
      //Check req.body is string
      if (typeof req.body === 'string' && Object.prototype.toString.call(req.body) === '[object String]') {
        if (req.body) {
          req.body = JSON.parse(req.body);
        }
        else {
          //Do nothing
        }
      }
    }
    //check if contain multipart/form-data for the content type
    else if (contentType.toUpperCase().includes('multipart/form-data'.toUpperCase())) {
      if (req.body && typeof req.body !== 'object') {
        //From ChatGPT
        // Define a regular expression to match form-data parts
        /* eslint-disable */
        const regex = /Content-Disposition: form-data; name=\"(.*?)\"\r\n\r\n(.*?)\r\n/g;
        // Match all key-value pairs
        let match;
        const formDataObject = {};

        while ((match = regex.exec(req.body)) != null) {
          const key = match[1];
          const value = match[2];
          formDataObject[key] = value;
        }

        // Convert to JSON
        const jsonData = JSON.stringify(formDataObject, null, 2);
        req.body = JSON.parse(jsonData);
      }
    }
  }

  next();
};
