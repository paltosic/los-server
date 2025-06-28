$('.message a').click(function () {
  $('form').animate({ height: 'toggle', opacity: 'toggle' }, 'slow');
});

function showRegister() {
  resetError();
  document.getElementById('login').style.display = 'none';
  document.getElementById('register').style.display = 'block';
}
function showLogin() {
  resetError();
  document.getElementById('login').style.display = 'block';
  document.getElementById('register').style.display = 'none';
}

function registerAttempt(){
    // считываем содержимое полей
    const login = document.getElementById('reg-login').value;
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;
    resetError();

    // Проверяем чтобы поля были заполнены, они были нужной длинны и пароли совпадали
    if(!login || login.length < 3){
        return showError('Введите логин');
    }

    if(!password || password.length < 3){
        return showError('Введите пароль');
    }

    if(password != passwordConfirm){
        return showError('Пароли не совпадают');
    }

    // Отправляем логин и пароль на клиент
    mp.trigger('registerAttempt', JSON.stringify({ login, password }) );
}

function loginAttempt(){
    const login = document.getElementById('log-login').value;
    const password = document.getElementById('log-password').value;
    resetError();

    if(!login || login.length < 3){
        return showError('Введите логин');
    }

    if(!password || password.length < 3){
        return showError('Введите пароль');
    }

    mp.trigger('loginAttempt', JSON.stringify({ login, password }) );
}

function showError(message) {
  const errorBlock = document.getElementById('error');
  errorBlock.innerText = message;
  errorBlock.style.display = 'block';
}

function resetError() {
  const errorBlock = document.getElementById('error');
  errorBlock.innerText = 'message';
  errorBlock.style.display = 'none';
}
