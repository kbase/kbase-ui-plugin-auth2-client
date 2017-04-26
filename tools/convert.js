let fs = require('fs');
let contents = fs.readFileSync('institutions.csv', 'utf-8');
let rows = contents.split('\n').slice(1);
let obj = rows.map(function (line) {
    var row = line.split(','); // CHEAP!
    return {
        value: row[0],
        label: row[1]
            // data: {
            //     name: row[1],
            //     city: row[2],
            //     state: row[3]
            // }
    };
});
fs.writeFileSync('institutions.json', JSON.stringify(obj), 'utf-8');