// File: packages/server/src/systems/account/auth/mysql_enhanced_auth.js

const { EnhancedAccount, Ban, SecurityLog } = require('../../../models');
const bcrypt = require('bcrypt');

// Покращене відстеження спроб входу
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 хвилин

// Обмеження частоти запитів для спроб входу
function checkRateLimit(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return { allowed: true };
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeLeft = LOCKOUT_TIME - (Date.now() - attempts.lastAttempt);
    if (timeLeft > 0) {
      return { 
        allowed: false, 
        blocked: true, 
        timeLeft: Math.ceil(timeLeft / 1000 / 60) 
      };
    } else {
      // Скинути спроби після закінчення блокування
      loginAttempts.delete(ip);
      return { allowed: true };
    }
  }
  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(ip, attempts);
}

function clearFailedAttempts(ip) {
  loginAttempts.delete(ip);
}

// Покращений обробник входу
mp.events.add('receiveLoginData', async (player, password) => {
  try {
    // Перевірка обмеження частоти запитів
    const rateLimitCheck = checkRateLimit(player.ip);
    if (!rateLimitCheck.allowed) {
      player.call('sendAuthResponse', [
        `Занадто багато невдалих спроб. Зачекайте ${rateLimitCheck.timeLeft} хвилин.`, 
        'login'
      ]);
      return false;
    }

    // Знайти акаунт в базі даних
    const account = await EnhancedAccount.findByUsername(player.name);

    if (!account) {
      recordFailedAttempt(player.ip);
      
      // Логувати спробу входу в неіснуючий акаунт
      await SecurityLog.create({
        accountId: 0, // Спеціальний ID для неіснуючих акаунтів
        type: 'login',
        details: `Спроба входу в неіснуючий акаунт: ${player.name}`,
        ip: player.ip
      });
      
      player.call('sendAuthResponse', [`Ім'я користувача ${player.name} не зареєстровано.`, 'login']);
      return false;
    }

    // Перевірити пароль
    const isValidPassword = await account.validatePassword(password);
    if (!isValidPassword) {
      recordFailedAttempt(player.ip);
      
      // Логувати невдалу спробу входу
      await account.addSecurityLog('login', 'Невдала спроба входу - неправильний пароль', null, player.ip);
      
      player.call('sendAuthResponse', ['Пароль неправильний.', 'login']);
      return false;
    }

    // Перевірка статусу бану
    if (account.isBanned) {
      const activeBan = account.activeBan;
      let banMessage = `Акаунт забанений. Причина: ${activeBan.reason}`;
      
      if (!activeBan.permanent && activeBan.expiresAt) {
        const timeLeft = Math.ceil((new Date(activeBan.expiresAt) - new Date()) / (1000 * 60 * 60));
        banMessage += ` | Залишилось часу: ${timeLeft} годин`;
      } else if (activeBan.permanent) {
        banMessage += ' | Цей бан постійний';
      }
      
      // Логувати спробу входу забаненого користувача
      await account.addSecurityLog('login', 'Спроба входу забаненого користувача', null, player.ip, {
        banReason: activeBan.reason,
        bannedBy: activeBan.bannedBy
      });
      
      player.call('sendAuthResponse', [banMessage, 'login']);
      return false;
    }

    // Успіх - очистити невдалі спроби та продовжити
    clearFailedAttempts(player.ip);
    
    // Оновити статистику підключення
    await account.updateConnectionStats();
    
    // Логувати успішний вхід
    await account.addSecurityLog('login', 'Успішний вхід в систему', null, player.ip, {
      lastConnected: account.lastConnected,
      totalConnections: account.totalConnections
    });

    // Завантажити акаунт з затримкою для плавного переходу
    player.loadAccountTimer = setTimeout(() => { 
      mp.events.call("loadAccount", player, account.id); 
    }, 1000);
    
    console.log(`[MYSQL AUTH] ${player.name} увійшов успішно з ${player.ip}`);
    return true;

  } catch (error) {
    console.error('[MYSQL AUTH ERROR] Вхід не вдався:', error);
    player.call('sendAuthResponse', ['Помилка сервера. Спробуйте ще раз.', 'login']);
    return false;
  }
});

// Покращений обробник реєстрації
mp.events.add('receiveRegisterData', async (player, password, email = null) => {
  try {
    // Валідація введення
    if (!password || password.length < 6) {
      player.call('sendAuthResponse', ['Пароль повинен містити принаймні 6 символів.', 'register']);
      return false;
    }

    if (player.name.length < 3 || player.name.length > 20) {
      player.call('sendAuthResponse', ['Ім\'я користувача повинно бути від 3 до 20 символів.', 'register']);
      return false;
    }

    // Перевірка на неприйнятний контент в імені користувача
    const inappropriateWords = ['admin', 'moderator', 'staff', 'owner', 'developer'];
    if (inappropriateWords.some(word => player.name.toLowerCase().includes(word))) {
      player.call('sendAuthResponse', ['Це ім\'я користувача заборонено.', 'register']);
      return false;
    }

    // Перевірити, чи існує акаунт
    const existingAccount = await EnhancedAccount.findByUsername(player.name);
    if (existingAccount) {
      player.call('sendAuthResponse', [`${player.name} вже зареєстровано.`, 'register']);
      return false;
    }

    // Створити новий акаунт (пароль автоматично хешується)
    const newAccount = await EnhancedAccount.create({
      username: player.name,
      password: password, // Буде автоматично захешовано в хуку beforeCreate
      email: email,
      ip: player.ip,
      socialClub: player.socialClub,
      serial: player.serial || 'unknown',
      
      // Початкові дані
      level: 1,
      wallet: 1000,
      bank: 75000,
      respect: 0,
      hoursPlayed: 0,
      admin: 0,
      warns: 0,
      
      // Початковий інвентар
      inventory: JSON.stringify([
        {
          title: "Мобільний телефон",
          type: 1,
          stackable: false,
          quantity: 1,
          canBeUsed: true,
          canBeTradable: false,
          markedForTrade: false
        },
        {
          title: "Гаманець",
          type: 2,
          stackable: false,
          quantity: 1,
          canBeUsed: false,
          canBeTradable: false,
          markedForTrade: false
        }
      ]),
      
      // Статистика
      totalConnections: 1,
      totalPlaytime: 0,
      firstConnection: new Date(),
      averageSessionLength: 0,
      longestSession: 0,
      online: true
    });

    // Логувати реєстрацію
    await newAccount.addSecurityLog('registration', 'Акаунт зареєстровано', null, player.ip, {
      email: email,
      socialClub: player.socialClub,
      serial: player.serial
    });

    console.log(`[MYSQL AUTH] Новий акаунт зареєстровано: ${player.name} з ${player.ip}`);
    
    // Почати створення персонажа
    player.call('prepareCharacter');
    return true;

  } catch (error) {
    console.error('[MYSQL AUTH ERROR] Реєстрація не вдалася:', error);
    player.call('sendAuthResponse', ['Реєстрація не вдалася. Спробуйте ще раз.', 'register']);
    return false;
  }
});

// Покращене завантаження акаунта
mp.events.add('loadAccount', async (player, accountId = null) => {
  try {
    let account;
    
    if (accountId) {
      // Завантажити за ID
      account = await EnhancedAccount.findByPk(accountId, {
        include: [
          { model: Ban, as: 'bans' },
          { 
            model: SecurityLog, 
            as: 'securityLogs',
            limit: 10,
            order: [['createdAt', 'DESC']]
          }
        ]
      });
    } else {
      // Завантажити за ім'ям користувача
      account = await EnhancedAccount.findByUsername(player.name);
    }

    if (!account) {
      console.error(`[MYSQL AUTH ERROR] Акаунт не знайдено для ${player.name}`);
      player.kick('Помилка завантаження акаунта');
      return;
    }

    // Конвертувати дані для сумісності з існуючою системою
    player.info = {
      justRegistered: account.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000), // Зареєстрований менше ніж день назад
      level: account.level,
      wallet: account.wallet,
      bank: account.bank,
      respect: account.respect,
      hoursPlayed: account.hoursPlayed,
      admin: account.admin,
      warns: account.warns,
      muted: account.muted,
      member: account.member,
      leader: account.leader,
      rank: account.rank,
      fwarns: account.fwarns,
      fJoined: account.fJoined,
      spawn: account.spawn,
      houseSpawn: account.houseSpawn,
      prisonTime: account.prisonTime,
      wantedLevel: account.wantedLevel,
      paycheck: account.paycheck,
      premium: account.premium,
      personalSlots: account.personalSlots,
      licenses: {
        driving: account.drivingLicense,
        weapon: account.weaponLicense
      },
      inventory: account.inventoryData,
      character: account.characterData,
      markPosition: {
        x: account.markPositionX,
        y: account.markPositionY,
        z: account.markPositionZ
      },
      online: true
    };

    // Зберегти посилання на модель для збереження
    player.accountModel = account;
    player.lastConnected = account.lastConnected;

    // Оновити онлайн статус
    await account.update({ online: true });

    // Форматувати дату останнього підключення
    const lastConnection = account.lastConnected || new Date();
    const month = (lastConnection.getMonth() + 1).toString().padStart(2, '0');
    const day = lastConnection.getDate().toString().padStart(2, '0');
    const hour = lastConnection.getHours().toString().padStart(2, '0');
    const minutes = lastConnection.getMinutes().toString().padStart(2, '0');
    const year = lastConnection.getFullYear();

    if (account.characterData != null) {
      // Існуючий персонаж - заспавнити гравця
      player.loggedIn = true;
      player.call('updateAuthClient');
      player.call('authCamera', [2]);
      
      // Завантажити ігрові змінні та заспавнити
      mp.events.call("loadVariables", player);
      mp.events.call("spawnPlayer", player);
      
      // Оновити клієнтські змінні
      player.updateSecurityInfo();
      player.setVariable('money', player.info.wallet);
      player.setVariable('bank', player.info.bank);
      player.call('updateHud');

      if (player.info.justRegistered == true) {
        // Перший раз входить
        player.pushChat(`[Ласкаво просимо] Ви успішно зареєструвалися на нашому сервері!`, null, 'server-message');
        player.pushChat(`[Інфо] Відвідайте фіолетову позначку на вашій карті, щоб отримати водійські права.`, null, 'server-message');
        player.pushChat(`[Інфо] Введіть /help у чат, щоб побачити доступні команди.`, null, 'server-message');
        player.sendMessageToAdmins(`[Новий гравець] ${player.name} щойно зареєструвався з ${player.ip}`, null, 'admin-message');
        
        // Скинути прапор першого разу
        player.info.justRegistered = false;
        await account.update({ 
          characterData: account.characterData // Це оновить justRegistered через логіку
        });
        
        // Вітальна послідовність
        player.giveSubtitle(`Ласкаво просимо до ~r~Лос-Сантоса~w~! Приємної гри.`, 30);
        player.giveSubtitle(`Відвідайте ~p~Автошколу~w~, щоб отримати водійські права.`, 30);
        player.call('createGPSBlip', [-828.446, -1086.113, 11.132, `Автошкола - Водійські права`]);

        // Викликати події реєстрації
        mp.events.call("registeredJoin", player);
      } else {
        // Гравець, що повертається
        player.pushChat(`[Ласкаво просимо назад] ${player.name} (ID: ${player.id})`, null, 'server-message');
        player.pushChat(`[Інфо] Останній раз онлайн: ${day}.${month}.${year} о ${hour}:${minutes}`, null, 'server-message');
        
        if (player.info.admin != 0) {
          player.pushChat(`[Персонал] Увійшли як Адміністратор ${player.info.admin} рівня`, null, 'admin-message');
        }

        // Показати MOTD фракції, якщо застосовно
        if (player.info.member != null && databox && databox[4] && databox[4].data.factions[player.info.member]) {
          const faction = databox[4].data.factions[player.info.member];
          if (faction.motd != null) {
            player.pushChat('[MOTD Фракції] ' + faction.motd, null, 'faction-message');
          }
        }

        mp.events.call("loggedJoin", player);
      }
    } else {
      // Немає персонажа - перейти до створення персонажа
      player.call('prepareCharacter');
    }

    console.log(`[MYSQL AUTH] ${player.name} акаунт завантажено успішно`);

  } catch (error) {
    console.error('[MYSQL AUTH ERROR] Помилка завантаження акаунта:', error);
    player.kick('Помилка завантаження акаунта');
  }
});

// Покращене відстеження безпеки
mp.events.add("loadVariables", player => {
  // Покращене оновлення інформації безпеки
  player.updateSecurityInfo = async function() {
    try {
      if (player.accountModel) {
        await player.accountModel.update({
          ip: player.ip,
          socialClub: player.socialClub,
          serial: player.serial || 'unknown',
          lastConnected: new Date()
        });
      }
    } catch (error) {
      console.error('[MYSQL AUTH ERROR] Помилка оновлення інформації безпеки:', error);
    }
  };

  // Покращена функція збереження
  player.savePlayerInfo = async function() {
    try {
      if (player.accountModel && player.info) {
        // Оновити основні дані
        await player.accountModel.update({
          level: player.info.level,
          wallet: player.info.wallet,
          bank: player.info.bank,
          respect: player.info.respect,
          hoursPlayed: player.info.hoursPlayed,
          admin: player.info.admin,
          warns: player.info.warns,
          muted: player.info.muted,
          member: player.info.member,
          leader: player.info.leader,
          rank: player.info.rank,
          fwarns: player.info.fwarns,
          fJoined: player.info.fJoined,
          spawn: player.info.spawn,
          houseSpawn: player.info.houseSpawn,
          prisonTime: player.info.prisonTime,
          wantedLevel: player.info.wantedLevel,
          paycheck: player.info.paycheck,
          premium: player.info.premium,
          personalSlots: player.info.personalSlots,
          drivingLicense: player.info.licenses ? player.info.licenses.driving : false,
          weaponLicense: player.info.licenses ? player.info.licenses.weapon : false,
          characterData: player.info.character ? JSON.stringify(player.info.character) : null,
          inventoryData: player.info.inventory ? JSON.stringify(player.info.inventory) : '[]',
          markPositionX: player.info.markPosition ? player.info.markPosition.x : null,
          markPositionY: player.info.markPosition ? player.info.markPosition.y : null,
          markPositionZ: player.info.markPosition ? player.info.markPosition.z : null,
          lastDisconnected: new Date(),
          online: false
        });
        
        console.log(`[MYSQL AUTH] Дані збережено для ${player.name}`);
      }
    } catch (error) {
      console.error('[MYSQL AUTH ERROR] Помилка збереження:', error);
    }
  };
});

// Очищення при відключенні
mp.events.add("playerQuit", async (player, exitType, reason) => {
  if (player.loggedIn == true && player.accountModel) {
    try {
      // Оновити статус офлайн
      await player.accountModel.update({ online: false });
      
      // Зберегти дані гравця
      await player.savePlayerInfo();
      
      // Логувати відключення
      await player.accountModel.addSecurityLog('logout', `Відключився: ${reason}`, null, player.ip, {
        exitType,
        sessionLength: player.accountModel.lastConnected ? 
          Math.floor((new Date() - new Date(player.accountModel.lastConnected)) / (1000 * 60)) : 0
      });
      
      mp.events.call("loggedQuit", player);
      console.log(`[MYSQL AUTH] ${player.name} відключився та дані збережено`);
    } catch (error) {
      console.error('[MYSQL AUTH ERROR] Помилка збереження при відключенні:', error);
    }
  }
});

// Автоматичне очищення застарілих банів (запускається кожну годину)
setInterval(async () => {
  try {
    const expiredCount = await Ban.cleanupExpiredBans();
    if (expiredCount > 0) {
      console.log(`[MYSQL AUTH] Очищено ${expiredCount} застарілих банів`);
    }
  } catch (error) {
    console.error('[MYSQL AUTH ERROR] Помилка очищення банів:', error);
  }
}, 60 * 60 * 1000); // Кожну годину

// Автоматичне очищення старих журналів безпеки (запускається щодня)
setInterval(async () => {
  try {
    const deletedCount = await SecurityLog.cleanupOldLogs(5000); // Зберігати останні 5000 записів
    if (deletedCount > 0) {
      console.log(`[MYSQL AUTH] Очищено ${deletedCount} старих журналів безпеки`);
    }
  } catch (error) {
    console.error('[MYSQL AUTH ERROR] Помилка очищення журналів:', error);
  }
}, 24 * 60 * 60 * 1000); // Щодня

// Виявлення підозрілої активності (запускається кожні 6 годин)
setInterval(async () => {
  try {
    const suspicious = await SecurityLog.detectSuspiciousActivity();
    if (suspicious.length > 0) {
      console.log(`[MYSQL AUTH SECURITY] Виявлено ${suspicious.length} підозрілих активностей:`, suspicious);
      
      // Надіслати сповіщення адміністраторам онлайн
      mp.players.forEach(player => {
        if (player.loggedIn && player.info.admin >= 5) {
          player.pushChat(`[БЕЗПЕКА] Виявлено ${suspicious.length} підозрілих активностей. Перевірте журнали.`, null, 'admin-message');
        }
      });
    }
  } catch (error) {
    console.error('[MYSQL AUTH ERROR] Помилка виявлення підозрілої активності:', error);
  }
}, 6 * 60 * 60 * 1000); // Кожні 6 годин

console.log('[MYSQL AUTH] Покращена система автентифікації MySQL завантажена');