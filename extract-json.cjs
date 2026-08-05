const fs = require('fs');

const data = JSON.parse(fs.readFileSync('artifacts/build-info/solc-0_8_22-eba86c3fe051e69ecd30089a24b8b3921ea12461.json', 'utf8'));

fs.writeFileSync('Standard-Json-Input.json', JSON.stringify(data.input, null, 2));

console.log('Successfully created Standard-Json-Input.json');
