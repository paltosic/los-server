// File: packages/server/src/database/fixForeignKeyError.js

const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function diagnoseAndFix() {
  const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false
  });

  try {
    log('\n🔍 Diagnosing Foreign Key Constraint Error...', 'cyan');
    
    // 1. Check if database exists
    await sequelize.authenticate();
    log('✓ Database connection successful', 'green');
    
    // 2. Get all tables
    const [tables] = await sequelize.query("SHOW TABLES");
    log(`\nFound ${tables.length} tables:`, 'cyan');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });
    
    // 3. Check for specific tables
    const tableNames = tables.map(t => Object.values(t)[0]);
    const hasAccountsTable = tableNames.some(name => 
      name.includes('account') || name === 'enhanced_accounts'
    );
    const hasBansTable = tableNames.includes('bans');
    
    if (!hasAccountsTable) {
      log('\n❌ No accounts table found!', 'red');
      log('This is why the foreign key constraint fails.', 'yellow');
    } else {
      log('\n✓ Accounts table exists', 'green');
      
      // Get the exact accounts table name
      const accountsTableName = tableNames.find(name => 
        name.includes('account') || name === 'enhanced_accounts'
      );
      
      // Check structure
      const [columns] = await sequelize.query(`SHOW COLUMNS FROM \`${accountsTableName}\``);
      const idColumn = columns.find(col => col.Field === 'id');
      
      if (idColumn) {
        log(`  ID column type: ${idColumn.Type}`, 'cyan');
        
        if (!idColumn.Type.includes('UNSIGNED')) {
          log('  ⚠️  ID column is not UNSIGNED - this might cause issues', 'yellow');
        }
      }
    }
    
    if (hasBansTable) {
      log('\n⚠️  Bans table already exists', 'yellow');
      
      // Check if it has the foreign key
      const [constraints] = await sequelize.query(`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
          TABLE_SCHEMA = '${dbConfig.database}'
          AND TABLE_NAME = 'bans'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      
      if (constraints.length > 0) {
        log('  Foreign key constraints:', 'cyan');
        constraints.forEach(c => {
          console.log(`    - ${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`);
        });
      } else {
        log('  No foreign key constraints found', 'yellow');
      }
    }
    
    // 4. Check migration status
    const [migrationTable] = await sequelize.query("SHOW TABLES LIKE 'SequelizeMeta'");
    if (migrationTable.length > 0) {
      const [migrations] = await sequelize.query("SELECT * FROM SequelizeMeta ORDER BY name");
      log('\nMigration history:', 'cyan');
      migrations.forEach(m => {
        console.log(`  - ${m.name}`);
      });
    }
    
    // 5. Provide solution
    log('\n💡 SOLUTION:', 'green');
    
    if (!hasAccountsTable) {
      log('\n1. Create the accounts table first:', 'yellow');
      console.log(`
   Run this SQL or ensure your first migration creates the accounts table:

   CREATE TABLE IF NOT EXISTS \`enhanced_accounts\` (
     \`id\` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
     \`username\` VARCHAR(255) NOT NULL UNIQUE,
     \`password\` VARCHAR(255) NOT NULL,
     -- ... other columns ...
     PRIMARY KEY (\`id\`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    }
    
    if (hasBansTable && !hasAccountsTable) {
      log('\n2. Drop the bans table and recreate after accounts:', 'yellow');
      console.log(`
   DROP TABLE IF EXISTS \`bans\`;
   -- Then run migrations in correct order
      `);
    }
    
    log('\n3. Ensure your migrations run in the correct order:', 'yellow');
    console.log(`
   Your migration files should be named like:
   - 20240101000001-create-enhanced-accounts.js
   - 20240101000002-create-bans.js
   - 20240101000003-create-security-logs.js
   
   The timestamp ensures they run in order.
    `);
    
    log('\n4. Quick fix commands:', 'cyan');
    console.log(`
   # Undo all migrations
   npx sequelize-cli db:migrate:undo:all
   
   # Or manually clear
   TRUNCATE TABLE SequelizeMeta;
   DROP TABLE IF EXISTS bans;
   DROP TABLE IF EXISTS security_logs;
   DROP TABLE IF EXISTS enhanced_accounts;
   
   # Then run migrations again
   npx sequelize-cli db:migrate
    `);
    
    // 6. Offer to fix automatically
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (query) => new Promise((resolve) => rl.question(query, resolve));
    
    const fix = await question('\nWould you like to attempt an automatic fix? (y/n): ');
    
    if (fix.toLowerCase() === 'y') {
      log('\n🔧 Attempting automatic fix...', 'cyan');
      
      try {
        // Drop tables in reverse order
        if (hasBansTable) {
          await sequelize.query('DROP TABLE IF EXISTS `bans`');
          log('✓ Dropped bans table', 'green');
        }
        
        await sequelize.query('DROP TABLE IF EXISTS `security_logs`');
        log('✓ Dropped security_logs table', 'green');
        
        if (tableNames.includes('SequelizeMeta')) {
          await sequelize.query('TRUNCATE TABLE `SequelizeMeta`');
          log('✓ Cleared migration history', 'green');
        }
        
        log('\n✅ Cleanup complete! Now run:', 'green');
        console.log('   npm run db:migrate');
        
      } catch (error) {
        log(`\n❌ Automatic fix failed: ${error.message}`, 'red');
      }
    }
    
    rl.close();
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    
    if (error.message.includes('Unknown database')) {
      log('\nThe database does not exist. Create it first:', 'yellow');
      console.log(`   CREATE DATABASE \`${dbConfig.database}\`;`);
    }
  } finally {
    await sequelize.close();
  }
}

// Run the diagnostic
diagnoseAndFix().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});