function encodeEmail(email) {
    // Replace '@' with a special character (e.g., '@@' or '%40')
    return email.replace('.', '@@'); 
  }
  
  function decodeEmail(encodedEmail) {
    // Replace the special character back to '@'
    return encodedEmail.replace('@@', '.'); 
  }