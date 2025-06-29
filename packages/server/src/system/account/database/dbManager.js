// File: packages/server/src/database/dbManager.js

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const fs = require('fs').promises;

// Load Sequelize and models
const { sequelize, Sequelize } = require('../models');
const config = require('../config/config.json');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class DatabaseManager {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.config = config[this.env];
    this.sequelize = sequelize;
  }

  // Helper method to log with colors
  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  // Check database connection
  async checkConnection() {
    try {
      await this.sequelize.authenticate();
      this.log('✓ Database connection established successfully', 'green');
      return true;
    } catch (error) {
      this.log('✗ Unable to connect to the database:', 'red');
      console.error(error);
      return false;
    }
  }

  // Create database if it doesn't exist
  async createDatabase() {
    const { database, username, password, host, dialect } = this.config;
    
    try {
      // Create a temporary connection without specifying database
      const tempSequelize = new Sequelize('', username, password, {
        host,
        dialect,
        logging: false
      });

      // Create database
      await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
      this.log(`✓ Database '${database}' created or already exists`, 'green');
      
      await tempSequelize.close();
      return true;
    } catch (error) {
      this.log(`✗ Error creating database: ${error.message}`, 'red');
      return false;
    }
  }

  // Run all pending migrations
  async runMigrations() {
    try {
      this.log('\n📋 Running migrations...', 'cyan');
      
      const { stdout, stderr } = await execPromise('npx sequelize-cli db:migrate');
      
      if (stderr && !stderr.includes('No migrations were executed')) {
        this.log(`⚠️  Migration warnings: ${stderr}`, 'yellow');
      }
      
      if (stdout) {
        console.log(stdout);
      }
      
      this.log('✓ Migrations completed successfully', 'green');
      return true;
    } catch (error) {
      this.log('✗ Migration failed:', 'red');
      console.error(error.message);
      return false;
    }
  }

  // Undo last migration
  async undoLastMigration() {
    try {
      this.log('\n↩️  Undoing last migration...', 'cyan');
      
      const { stdout, stderr } = await execPromise('npx sequelize-cli db:migrate:undo');
      
      if (stderr) {
        this.log(`⚠️  Warning: ${stderr}`, 'yellow');
      }
      
      if (stdout) {
        console.log(stdout);
      }
      
      this.log('✓ Last migration undone successfully', 'green');
      return true;
    } catch (error) {
      this.log('✗ Undo migration failed:', 'red');
      console.error(error.message);
      return false;
    }
  }

  // Undo all migrations
  async undoAllMigrations() {
    try {
      this.log('\n↩️  Undoing all migrations...', 'cyan');
      
      const { stdout, stderr } = await execPromise('npx sequelize-cli db:migrate:undo:all');
      
      if (stderr) {
        this.log(`⚠️  Warning: ${stderr}`, 'yellow');
      }
      
      if (stdout) {
        console.log(stdout);
      }
      
      this.log('✓ All migrations undone successfully', 'green');
      return true;
    } catch (error) {
      this.log('✗ Undo all migrations failed:', 'red');
      console.error(error.message);
      return false;
    }
  }

  // Run seeders
  async runSeeders() {
    try {
      this.log('\n🌱 Running seeders...', 'cyan');
      
      const { stdout, stderr } = await execPromise('npx sequelize-cli db:seed:all');
      
      if (stderr && !stderr.includes('No seeders found')) {
        this.log(`⚠️  Seeder warnings: ${stderr}`, 'yellow');
      }
      
      if (stdout) {
        console.log(stdout);
      }
      
      this.log('✓ Seeders completed successfully', 'green');
      return true;
    } catch (error) {
      this.log('✗ Seeders failed:', 'red');
      console.error(error.message);
      return false;
    }
  }

  // Get migration status
  async getMigrationStatus() {
    try {
      this.log('\n📊 Migration Status:', 'cyan');
      
      const { stdout } = await execPromise('npx sequelize-cli db:migrate:status');
      console.log(stdout);
      
      return true;
    } catch (error) {
      this.log('✗ Failed to get migration status:', 'red');
      console.error(error.message);
      return false;
    }
  }

  // Sync models (alternative to migrations - use with caution!)
  async syncModels(options = {}) {
    try {
      this.log('\n🔄 Syncing models with database...', 'cyan');
      
      if (options.force) {
        this.log('⚠️  WARNING: Force sync will DROP all tables!', 'yellow');
        
        // Add confirmation in production
        if (this.env === 'production') {
          this.log('❌ Force sync is disabled in production!', 'red');
          return false;
        }
      }
      
      await this.sequelize.sync(options);
      
      this.log('✓ Models synced successfully', 'green');
      return true;
    } catch (error) {
      this.log('✗ Model sync failed:', 'red');
      console.error(error.message);
      return false;
    }
  }

  // Backup database
  async backupDatabase(backupPath = null) {
    try {
      const { database, username, password, host } = this.config;
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const fileName = backupPath || `backup_${database}_${timestamp}.sql`;
      
      this.log(`\n💾 Creating backup: ${fileName}...`, 'cyan');
      
      const command = `mysqldump -h ${host} -u ${username} -p${password} ${database} > ${fileName}`;
      
      await execPromise(command);
      
      this.log(`✓ Backup created successfully: ${fileName}`, 'green');
      return fileName;
    } catch (error) {
      this.log('✗ Backup failed:', 'red');
      console.error(error.message);
      return null;
    }
  }

  // Restore database from backup
  async restoreDatabase(backupFile) {
    try {
      const { database, username, password, host } = this.config;
      
      // Check if backup file exists
      await fs.access(backupFile);
      
      this.log(`\n📥 Restoring from backup: ${backupFile}...`, 'cyan');
      
      const command = `mysql -h ${host} -u ${username} -p${password} ${database} < ${backupFile}`;
      
      await execPromise(command);
      
      this.log('✓ Database restored successfully', 'green');
      return true;
    } catch (error) {
      this.log('✗ Restore failed:', 'red');
      console.error(error.message);
      return false;
    }
  }

  // Create a new migration file
  async createMigration(name) {
    try {
      this.log(`\n📝 Creating migration: ${name}...`, 'cyan');
      
      const { stdout } = await execPromise(`npx sequelize-cli migration:generate --name ${name}`);
      console.log(stdout);
      
      this.log('✓ Migration file created successfully', 'green');
      return true;
    } catch (error) {
      this.log('✗ Failed to create migration:', 'red');
      console.error(error.message);
      return false;
    }
  }

  // Full setup - creates database, runs migrations and seeders
  async fullSetup() {
    this.log('\n🚀 Starting full database setup...', 'bright');
    
    // Create database
    const dbCreated = await this.createDatabase();
    if (!dbCreated) return false;
    
    // Check connection
    const connected = await this.checkConnection();
    if (!connected) return false;
    
    // Run migrations
    const migrated = await this.runMigrations();
    if (!migrated) return false;
    
    // Run seeders
    await this.runSeeders();
    
    this.log('\n✅ Database setup completed successfully!', 'green');
    return true;
  }

  // Reset database - drops all tables and recreates
  async resetDatabase() {
    if (this.env === 'production') {
      this.log('❌ Database reset is disabled in production!', 'red');
      return false;
    }
    
    this.log('\n⚠️  WARNING: This will DELETE all data!', 'yellow');
    this.log('Resetting database in 5 seconds... Press Ctrl+C to cancel', 'yellow');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Undo all migrations
    await this.undoAllMigrations();
    
    // Run migrations again
    await this.runMigrations();
    
    // Run seeders
    await this.runSeeders();
    
    this.log('\n✅ Database reset completed!', 'green');
    return true;
  }

  // Check and fix table collations
  async fixCollations() {
    try {
      this.log('\n🔧 Checking and fixing table collations...', 'cyan');
      
      const tables = await this.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = :database",
        {
          replacements: { database: this.config.database },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      for (const table of tables) {
        const tableName = table.table_name || table.TABLE_NAME;
        
        // Convert table to utf8mb4
        await this.sequelize.query(
          `ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
        );
        
        this.log(`✓ Fixed collation for table: ${tableName}`, 'green');
      }
      
      return true;
    } catch (error) {
      this.log('✗ Failed to fix collations:', 'red');
      console.error(error.message);
      return false;
    }
  }

  // Get database info
  async getDatabaseInfo() {
    try {
      this.log('\n📈 Database Information:', 'cyan');
      
      // Get all tables
      const tables = await this.sequelize.query(
        "SELECT table_name, table_rows, data_length, index_length FROM information_schema.tables WHERE table_schema = :database",
        {
          replacements: { database: this.config.database },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      
      console.log('\nTables:');
      tables.forEach(table => {
        const name = table.table_name || table.TABLE_NAME;
        const rows = table.table_rows || table.TABLE_ROWS || 0;
        const dataSize = table.data_length || table.DATA_LENGTH || 0;
        const indexSize = table.index_length || table.INDEX_LENGTH || 0;
        const totalSize = (dataSize + indexSize) / 1024 / 1024; // Convert to MB
        
        console.log(`  - ${name}: ${rows} rows, ${totalSize.toFixed(2)} MB`);
      });
      
      return true;
    } catch (error) {
      this.log('✗ Failed to get database info:', 'red');
      console.error(error.message);
      return false;
    }
  }
}

// CLI Interface
async function runCLI() {
  const dbManager = new DatabaseManager();
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log(colors.bright + '\n🗄️  Sequelize Database Manager' + colors.reset);
  console.log('Environment:', colors.cyan + dbManager.env + colors.reset);
  console.log('Database:', colors.cyan + dbManager.config.database + colors.reset);
  
  switch (command) {
    case 'setup':
      await dbManager.fullSetup();
      break;
      
    case 'migrate':
      await dbManager.runMigrations();
      break;
      
    case 'migrate:undo':
      await dbManager.undoLastMigration();
      break;
      
    case 'migrate:undo:all':
      await dbManager.undoAllMigrations();
      break;
      
    case 'migrate:status':
      await dbManager.getMigrationStatus();
      break;
      
    case 'migrate:create':
      const migrationName = args[1];
      if (!migrationName) {
        dbManager.log('Please provide a migration name', 'red');
        break;
      }
      await dbManager.createMigration(migrationName);
      break;
      
    case 'seed':
      await dbManager.runSeeders();
      break;
      
    case 'sync':
      await dbManager.syncModels();
      break;
      
    case 'sync:force':
      await dbManager.syncModels({ force: true });
      break;
      
    case 'reset':
      await dbManager.resetDatabase();
      break;
      
    case 'backup':
      const backupPath = args[1];
      await dbManager.backupDatabase(backupPath);
      break;
      
    case 'restore':
      const restoreFile = args[1];
      if (!restoreFile) {
        dbManager.log('Please provide a backup file path', 'red');
        break;
      }
      await dbManager.restoreDatabase(restoreFile);
      break;
      
    case 'fix:collations':
      await dbManager.fixCollations();
      break;
      
    case 'info':
      await dbManager.getDatabaseInfo();
      break;
      
    case 'test':
      await dbManager.checkConnection();
      break;
      
    default:
      console.log('\nAvailable commands:');
      console.log('  setup              - Full database setup (create, migrate, seed)');
      console.log('  migrate            - Run pending migrations');
      console.log('  migrate:undo       - Undo last migration');
      console.log('  migrate:undo:all   - Undo all migrations');
      console.log('  migrate:status     - Show migration status');
      console.log('  migrate:create <name> - Create new migration file');
      console.log('  seed               - Run all seeders');
      console.log('  sync               - Sync models with database (safe)');
      console.log('  sync:force         - Force sync (DROPS all tables!)');
      console.log('  reset              - Reset database (undo all, migrate, seed)');
      console.log('  backup [path]      - Backup database');
      console.log('  restore <path>     - Restore database from backup');
      console.log('  fix:collations     - Fix table collations to utf8mb4');
      console.log('  info               - Show database information');
      console.log('  test               - Test database connection');
  }
  
  process.exit(0);
}

// Export for programmatic use
module.exports = DatabaseManager;

// Run CLI if called directly
if (require.main === module) {
  runCLI().catch(error => {
    console.error(colors.red + 'Fatal error:' + colors.reset, error);
    process.exit(1);
  });
}