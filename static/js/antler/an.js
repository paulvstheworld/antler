var an = {};
an.namespace = function() {
  var validNamespace = /^([\$a-z]+[a-z0-9]?)+(\.[a-z]+[a-z0-9]?)*$/i;

  return function(namespaceInput) {
    var namespaceLevels, namespaceHierarchy = null;
    var hasError = false;
    var errorMessage = [
      'an.namespace(): The namespace input must be a string of the form',
      'level1.level2.level3...where each level is of the form', 
      '/[a-z]+[a-z0-9]?/i.\n',
      namespaceInput,
      'was provided.'
    ].join(' ');
    
    // Check argument.
    if (("string" != typeof (namespaceInput)) || !validNamespace.test(namespaceInput)) {
      hasError = true;
    }

    // If the argument is valid create the namespace.
    if (!hasError) {
      namespaceLevels = namespaceInput.split(".");
      namespaceHierarchy = window;
      
      for (var i = 0, len=namespaceLevels.length; i < len; i++) {
        var namespaceLevel = namespaceLevels[i];
        if ("undefined" == typeof (namespaceHierarchy[namespaceLevel])) {
          namespaceHierarchy[namespaceLevel] = {};
        }
        namespaceHierarchy = namespaceHierarchy[namespaceLevel];
      }
      return namespaceHierarchy; 
    }

    // Throw an exception if there were any errors.
    if (hasError) {
      throw new Error(errorMessage);
    }
  };
}();