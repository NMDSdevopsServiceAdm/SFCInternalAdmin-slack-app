const axios = require('axios');
const JWT = require('../utils/security/JWT');
const config = require('../config/config');

const apiUrl = config.get('app.url') + '/api/establishment';

const approveReject = async (establishmentUID, request) => {
  if (request.actions && Array.isArray(request.actions)) {
    const backendApiJWT = JWT.ASCWDS_JWT(15, request.user.name);

    if (request.actions[0] && request.actions[0].value === 'accept') {

      try {
        const apiResponse = await axios(
          {
            method: 'post',
            url: `${apiUrl}/${establishmentUID}/approve`,
            headers: {
              Authorization: `Bearer ${backendApiJWT}`
            },
          }
        );

        if (apiResponse.status === 200) {
          console.log("Accepting the registration");
          return true;
        } else {
          console.log("The ASC WDS failed to accept registration");
          return null;
        }
      } catch (err) {
        console.error("WA TODO - Need better error handling: ", err);
        return null;
      }

    } else {
      const reasonForRejection = request.actions[0].selected_options;
      console.log("REJECTING THE REGISTRATION: ", reasonForRejection[0].value);


      try {
        const apiResponse = await axios(
          {
            method: 'post',
            url: `${apiUrl}/${establishmentUID}/reject`,
            headers: {
              Authorization: `Bearer ${backendApiJWT}`
            },
            data: {
              reject: {
                reason: reasonForRejection[0].value,
                notes: '',    // this will come later
              }
            }
          }
        );

        if (apiResponse.status === 200) {
          console.log("Rejecting the registration");
          return false;
        } else {
          console.log("The ASC WDS failed to reject registration");
          return null;
        }
      } catch (err) {
        console.error("WA TODO - Need better error handling: ", err);
        return null;
      }
    }
  } else {
    return null;
  }
};

module.exports = approveReject;