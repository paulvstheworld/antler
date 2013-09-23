LoginValidator = function(email, firstname, lastinitial) {
  this.email = email;
  this.firstname = firstname;
  this.lastinitial = lastinitial;
  this.errors = [];
}

LoginValidator.prototype.addError = function(field, msg) {
  var error = { field: field, msg: msg };
  this.errors.push(error);
}

LoginValidator.prototype.isEmailFormatValid = function() {
  var re = /[\S-]+@([\S-]+\.)+[\S-]+/;
  return re.test(this.email);
}

LoginValidator.prototype.isEmailValid = function() {
  if(!this.email) {
    this.addError('email', 'Email is required.');
    return false;
  }
  
  if(!this.isEmailFormatValid()) {
    this.addError('email', 'Email format is invalid. Please try again.');
    return false;
  }
  
  return true;
}

LoginValidator.prototype.isFirstNameValid = function() {
  if(!this.firstname) {
    this.addError('firstname', 'First name is required.');
    return false;
  }
  
  return true;
}

LoginValidator.prototype.isLastInitialValid = function() {
  if(!this.lastinitial) {
    this.addError('lastinitial', 'Last initial is required.');
    return false;
  }
  
  if(this.lastinitial.length > 1) {
    this.addError('lastinitial', 'One letter please.');
    return false;
  }
  
  return true;
}

LoginValidator.prototype.isValid = function() {
  return (this.isEmailValid() && this.isFirstNameValid() 
      && this.isLastInitialValid())
}

LoginValidator.prototype.getErrors = function() {
  return this.errors;
}

module.exports = LoginValidator;