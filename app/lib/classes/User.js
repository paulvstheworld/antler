User = function(user, active) {
  this.id = user.id;
  this.email = user.email;
  this.firstname = user.firstname;
  this.lastname = user.lastname;
  this.active = active;
}

User.prototype.getValues = function() {
  return {
    id: this.id,
    email: this.email,
    firstname: this.firstname,
    lastname: this.lastname,
    active: this.active
  };
}

module.exports = User;