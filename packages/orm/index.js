const { sequelize } = require('./models');

mp.events.add('packagesLoaded', () =>
{
    sequelize.authenticate();
}); 