/**
 * Job Scheduler
 * Handles cron jobs and background tasks
 */

import cron from 'node-cron';

/**
 * Job Manager Class
 */
export class JobManager {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Register a new cron job
   */
  registerJob(name, schedule, task, options = {}) {
    if (this.jobs.has(name)) {
      console.warn(`⚠️ Job ${name} already exists, overwriting`);
    }

    const job = cron.schedule(schedule, task, {
      scheduled: false,
      timezone: options.timezone || 'UTC',
      ...options
    });

    this.jobs.set(name, {
      job,
      schedule,
      task,
      options,
      lastRun: null,
      nextRun: null
    });

    console.log(`✅ Job registered: ${name} (${schedule})`);
    return job;
  }

  /**
   * Start all jobs
   */
  startAll() {
    console.log('🔄 Starting all scheduled jobs...');
    
    for (const [name, jobData] of this.jobs) {
      try {
        jobData.job.start();
        console.log(`✅ Started job: ${name}`);
      } catch (error) {
        console.error(`❌ Failed to start job ${name}:`, error);
      }
    }

    this.isRunning = true;
    console.log('🎉 All jobs started successfully');
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    console.log('🔄 Stopping all scheduled jobs...');
    
    for (const [name, jobData] of this.jobs) {
      try {
        jobData.job.stop();
        console.log(`🛑 Stopped job: ${name}`);
      } catch (error) {
        console.error(`❌ Failed to stop job ${name}:`, error);
      }
    }

    this.isRunning = false;
    console.log('✅ All jobs stopped');
  }

  /**
   * Start specific job
   */
  startJob(name) {
    const jobData = this.jobs.get(name);
    if (!jobData) {
      throw new Error(`Job not found: ${name}`);
    }

    jobData.job.start();
    console.log(`✅ Started job: ${name}`);
  }

  /**
   * Stop specific job
   */
  stopJob(name) {
    const jobData = this.jobs.get(name);
    if (!jobData) {
      throw new Error(`Job not found: ${name}`);
    }

    jobData.job.stop();
    console.log(`🛑 Stopped job: ${name}`);
  }

  /**
   * Get job status
   */
  getJobStatus(name) {
    const jobData = this.jobs.get(name);
    if (!jobData) {
      return null;
    }

    return {
      name,
      schedule: jobData.schedule,
      running: jobData.job.running,
      lastRun: jobData.lastRun,
      nextRun: jobData.nextRun
    };
  }

  /**
   * List all jobs
   */
  listJobs() {
    const jobList = [];
    for (const [name] of this.jobs) {
      jobList.push(this.getJobStatus(name));
    }
    return jobList;
  }

  /**
   * Remove job
   */
  removeJob(name) {
    const jobData = this.jobs.get(name);
    if (!jobData) {
      throw new Error(`Job not found: ${name}`);
    }

    jobData.job.stop();
    this.jobs.delete(name);
    console.log(`🗑️ Removed job: ${name}`);
  }
}

/**
 * Default jobs that come with the boilerplate
 */
export const defaultJobs = {
  /**
   * Clean up expired sessions
   */
  sessionCleanup: {
    name: 'session-cleanup',
    schedule: '0 2 * * *', // Daily at 2 AM
    task: async () => {
      try {
        console.log('🧹 Running session cleanup job...');
        
        // Here you would implement session cleanup logic
        // For example: delete sessions older than 30 days
        
        console.log('✅ Session cleanup completed');
      } catch (error) {
        console.error('❌ Session cleanup failed:', error);
      }
    }
  },

  /**
   * Sync billing subscriptions
   */
  billingSync: {
    name: 'billing-sync',
    schedule: '0 */6 * * *', // Every 6 hours
    task: async () => {
      try {
        console.log('💳 Running billing sync job...');
        
        // Here you would implement billing sync logic
        // For example: check Shopify for subscription status updates
        
        console.log('✅ Billing sync completed');
      } catch (error) {
        console.error('❌ Billing sync failed:', error);
      }
    }
  },

  /**
   * Health check and monitoring
   */
  healthCheck: {
    name: 'health-check',
    schedule: '*/15 * * * *', // Every 15 minutes
    task: async () => {
      try {
        console.log('🏥 Running health check...');
        
        // Here you would implement health check logic
        // For example: check database connection, external APIs, etc.
        
        console.log('✅ Health check passed');
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }
  },

  /**
   * Data backup
   */
  dataBackup: {
    name: 'data-backup',
    schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
    task: async () => {
      try {
        console.log('💾 Running data backup job...');
        
        // Here you would implement backup logic
        // For example: backup critical data to cloud storage
        
        console.log('✅ Data backup completed');
      } catch (error) {
        console.error('❌ Data backup failed:', error);
      }
    }
  }
};

/**
 * Initialize job manager with default jobs
 */
export function initializeJobs(config = {}) {
  const jobManager = new JobManager();

  // Register default jobs if enabled
  if (config.enableDefaultJobs !== false) {
    Object.values(defaultJobs).forEach(jobConfig => {
      jobManager.registerJob(
        jobConfig.name,
        jobConfig.schedule,
        jobConfig.task,
        jobConfig.options
      );
    });
  }

  // Start jobs if auto-start is enabled
  if (config.autoStart !== false) {
    jobManager.startAll();
  }

  return jobManager;
}

export default {
  JobManager,
  defaultJobs,
  initializeJobs
};
