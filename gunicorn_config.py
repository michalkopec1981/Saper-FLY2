# Gunicorn configuration for SAPER QR
import multiprocessing

# Worker configuration
worker_class = 'geventwebsocket.gunicorn.workers.GeventWebSocketWorker'
workers = 1  # Musi być 1 dla Socket.IO z background tasks
bind = '0.0.0.0:8080'
timeout = 120
keepalive = 5

# Logging
loglevel = 'info'
accesslog = '-'
errorlog = '-'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Worker lifecycle hooks
def post_worker_init(worker):
    """
    Called after a worker has been forked.
    This is where we start the background task for Socket.IO timers.
    """
    from app import init_background_tasks
    import logging

    logger = logging.getLogger('gunicorn.error')
    logger.info('=' * 60)
    logger.info('🚀 POST WORKER INIT - Starting background tasks')
    logger.info('=' * 60)

    try:
        init_background_tasks()
        logger.info('✅ Background tasks initialized successfully')
    except Exception as e:
        logger.error(f'❌ Failed to initialize background tasks: {e}')
        import traceback
        traceback.print_exc()

def worker_exit(server, worker):
    """Called when a worker is exiting."""
    import logging
    logger = logging.getLogger('gunicorn.error')
    logger.info(f'Worker {worker.pid} exiting...')
