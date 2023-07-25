module.exports = {
  'env': {
    'browser': true,
    'amd': true,
    'es6': true,
  },
  'extends': 'google',
  'overrides': [
    {
      'env': {
        'node': true,
      },
      'files': [
        '.eslintrc.{js,cjs}',
      ],
      'parserOptions': {
        'sourceType': 'script',
      },
    },
  ],
  'parserOptions': {
    'ecmaVersion': 9,
  },
  'rules': {
    'max-len': [
      'error',
      {
        'code': 100,
        'tabWidth': 4,
        'ignoreComments': true, // "comments": 80
        'ignoreUrls': true,
        'ignoreStrings': true,
        'ignoreTemplateLiterals': true,
      },
    ],
  },
};
