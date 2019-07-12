const JWT = require('../utils/security/JWT');
const axios = require('axios');

const approveReject = async (request) => {
  if (request.actions && Array.isArray(request.actions)) {
    const backendApiJWT = JWT.ASCWDS_JWT(15, request.user.name);

    if (request.actions[0] && request.actions[0].value === 'accept') {

      try {
        const apiResponse = await axios.get(
          `${apiUrl}/${establishmentUID}/approve`,
          {
            params: null,
            headers: {
              Authorization: `Bearer ${backendApiJWT}`
          }
        });

        if (apiResponse.status === 200) {
          console.log("Accepting the registration");
          return true;
        } else {
          console.log("The ASC WDS failed to accept registration");

        }
      } catch (err) {
        console.error("WA TODO - Need better error handling");
        return false;
      }

    } else {
      const reasonForRejection = request.actions[0].selected_options;
      console.log("REJECTING THE REGISTRATION: ", reasonForRejection[0].value);


      try {
        const apiResponse = await axios.get(
          `${apiUrl}/${establishmentUID}/reject`,
          {
            params: {
              reject: {
                reason: reasonForRejection[0].value,
                notes: '',    // this will come later
              }
            },
            headers: {
              Authorization: `Bearer ${backendApiJWT}`
          }
        });

        if (apiResponse.status === 200) {
          console.log("Rejecting the registration");
          return true;
        } else {
          console.log("The ASC WDS failed to reject registration");
          return false;
        }
      } catch (err) {
        console.error("WA TODO - Need better error handling");
        return false;
      }
    }
  } else {
    return null;
  }
};

module.exports = approveReject;