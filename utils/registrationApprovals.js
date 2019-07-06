const approveReject = async (request) => {
  if (request.actions && Array.isArray(request.actions)) {
    if (request.actions[0] && request.actions[0].value === 'accept') {
      console.log("ACCEPTING THE REGISTRATION");
      return true;
    } else {
      const reasonForRejection = request.actions[0].selected_options;
      console.log("REJECTING THE REGISTRATION: ", reasonForRejection[0].value);
      return false;
    }
  } else {
    return null;
  }
};

module.exports = approveReject;