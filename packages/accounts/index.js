const mysql = require('mysql');

const { Account } = require('../orm/models');

const bcrypt = require('bcrypt');
const saltRounds = 10;



// Previous database connection 
// let DB = false;
// mp.events.add('packagesLoaded', () => {
//   DB = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'baserage',
//   });
//   DB.connect(function (err) {
//     if (err)
//       return console.log('Connection client accounts error: ' + err.stack);
//     console.log('Connected to client accounts');
//   });
// });

mp.events.add('playerReady', (player) => {
  player.call('showLoginDialog');
});

mp.events.add('onLoginAttempt', async (player, data) => {
  try {
    const { login, password } = JSON.parse(data);

    const account  = await Account.findOne({ where: { login } });
    if (!account) return player.call('showAuthError', ['Неправильний пароль']);

    const isPasswordMatch = await bcrypt.compare(password, account.password);

    if(!isPasswordMatch) {
      return player.call('showAuthError', ['Неправильний пароль']);
    }

    player.account = account;

    player.call('hideLoginDialog'); 
    player.call('updateAuthClient'); 
  } catch (error) {
    console.error('Error during login attempt:', error);
    player.call('showAuthError', ['Виникла помилка під час входу']);
  }
});

mp.events.add('onRegisterAttempt', async (player, data) => {
  try {
    const { login, password } = JSON.parse(data);

    const account = await Account.findOne({ where: { login } });
    if (account){
      return player.call('showAuthError', ['Аккаунт було створено раніше']);
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    await Account.create({
      login,
      password: passwordHash,
    });

    player.call('hideLoginDialog'); 
  } catch (error) {
    console.error('Error during register attempt:', error);
    player.call('showAuthError', ['Виникла помилка під час реєстрації']);
  }
});
