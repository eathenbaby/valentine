import { db } from './db';
import fs from 'fs';
import path from 'path';

/**
 * Database Migration Runner
 * Runs SQL migration files to update database schema
 */

export class MigrationRunner {
  
  /**
   * Run all pending migrations
   */
  static async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running database migrations...');
      
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();
      
      // Get migration files
      const migrationFiles = this.getMigrationFiles();
      
      // Get already run migrations
      const runMigrations = await this.getRunMigrations();
      
      // Run pending migrations
      for (const file of migrationFiles) {
        const migrationName = path.basename(file, '.sql');
        
        if (!runMigrations.includes(migrationName)) {
          console.log(`📄 Running migration: ${migrationName}`);
          await this.runMigration(file, migrationName);
          console.log(`✅ Migration completed: ${migrationName}`);
        } else {
          console.log(`⏭️  Migration already run: ${migrationName}`);
        }
      }
      
      console.log('🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Create migrations tracking table
   */
  private static async createMigrationsTable(): Promise<void> {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error) {
      console.error('Error creating migrations table:', error);
      throw error;
    }
  }
  
  /**
   * Get list of migration files
   */
  private static getMigrationFiles(): string[] {
    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 No migrations directory found');
      return [];
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in order
    
    return files.map(file => path.join(migrationsDir, file));
  }
  
  /**
   * Get list of already run migrations
   */
  private static async getRunMigrations(): Promise<string[]> {
    try {
      const result = await db.execute('SELECT name FROM migrations ORDER BY executed_at');
      return result.map((row: any) => row.name);
    } catch (error) {
      console.error('Error getting run migrations:', error);
      return [];
    }
  }
  
  /**
   * Run a single migration
   */
  private static async runMigration(filePath: string, migrationName: string): Promise<void> {
    try {
      // Read migration file
      const migrationSQL = fs.readFileSync(filePath, 'utf8');
      
      // Execute migration
      await db.execute(migrationSQL);
      
      // Record migration as run
      await db.execute(
        'INSERT INTO migrations (name) VALUES ($1)',
        [migrationName]
      );
    } catch (error) {
      console.error(`Error running migration ${migrationName}:`, error);
      throw error;
    }
  }
  
  /**
   * Check if migrations are needed
   */
  static async checkMigrations(): Promise<boolean> {
    try {
      const migrationFiles = this.getMigrationFiles();
      const runMigrations = await this.getRunMigrations();
      
      const pendingMigrations = migrationFiles.filter(file => {
        const migrationName = path.basename(file, '.sql');
        return !runMigrations.includes(migrationName);
      });
      
      return pendingMigrations.length > 0;
    } catch (error) {
      console.error('Error checking migrations:', error);
      return false;
    }
  }
}

// Auto-run migrations if this file is executed directly
if (require.main === module) {
  MigrationRunner.runMigrations()
    .then(() => {
      console.log('✅ Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default MigrationRunner;
