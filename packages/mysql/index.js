var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'baserage',
});

connection.connect(function (err) {
  if (err) {
    console.error('error sql connecting: ' + err.stack);
    return;
  }

  console.log('connected sql id ' + connection.threadId);
});

// //POST
// var userLogin = 'test4';
// connection.query('SELECT * FROM accounts WHERE login = ?', [userLogin], function (error, results, fields) {
//   if (error) throw error;
//   // connected!

//   console.log(results);
//   // console.log(userLogin);
// });

//INSERT
// const user = { login: 'Lol', password: '123' };
// connection.query('INSERT INTO accounts SET ?', user);

mp.events.add('serverShutdown', async () => {
  connection.end();
});
