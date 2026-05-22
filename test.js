const bcrypt = require('bcryptjs');

bcrypt.hash('noutong1', 12).then((hash) => {
    console.log(hash);
});