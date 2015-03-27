# face-plus-plus

[face-plus-plus]() is a node client for the [faceplusplus.com](http://faceplusplus.com)([CN](http://faceplusplus.com.cn)) API

## Version: 0.0.1

### Installation via npm
    $ npm install face-plus-plus

### Require
```js
    var fpp = require('face-plus-plus');
```

## Configure face-plus-plus

### (Required) Set your API Key
```js
    fpp.setApiKey('YOUR_API_KEY');
```

### (Required) Set your API Secret
```js
    fpp.setApiSecret('YOUR_API_SECRET');
```

### (Optional) Set the server (default: 'us')
```js
    fpp.setServer('cn');
```

### (Optional) Set the API version (default: '2')
```js
    fpp.setVersion('2');
```

### (Optional) Set request options
```js
    var options = {
        timeout:  3000,
        headers:  { connection:  "keep-alive" }
    };

    fpp.setOptions(options);
```

## Examples

### GET request (pass an image at a URL)
```js
    var fpp = require('face-plus-plus');

    fpp.setApiKey('YOUR_API_KEY');
    fpp.setApiSecret('YOUR_API_SECRET');

    var parameters = {
        url: 'http://example.com/a.jpg',
        attribute: 'gender,age'
    };
    fpp.get('detection/detect', parameters, function(err, res) {
        console.log(res);
    });
```

### POST request (pass an image from the local file system)
```js
    var fpp = require('face-plus-plus'),
        fs = require('fs');

    fpp.setApiKey('YOUR_API_KEY');
    fpp.setApiSecret('YOUR_API_SECRET');

    var parameters = {
        attribute: 'gender,age',
        img : {
            value: fs.readFileSync('./a.jpg')
            , meta: {filename:'a.jpg'}
        }
    };
    fpp.post('detection/detect', parameters, function(err, res) {
        console.log(res);
    });
```