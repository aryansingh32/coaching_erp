import { AckPolicy, DeliverPolicy } from 'nats';
import { connect, StringCodec, NatsConnection } from 'nats';
import * as dotenv from 'dotenv';
import { createClient } from '@clickhouse/client';

dotenv.config();

const sc = StringCodec();

const clickhouse = createClient({
  host: process.env.CLICKHOUSE_URL || 'http://clickhouse:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  database: 'coaching_analytics',
});

async function bootstrap() {
  console.log('Starting Analytics Worker...');
  
  let nc: NatsConnection;
  try {
    nc = await connect({ servers: process.env.NATS_URL || 'nats://nats:4222' });
    console.log('Connected to NATS');
  } catch (err) {
    console.error('Failed to connect to NATS', err);
    process.exit(1);
  }

  const jsm = await nc.jetstreamManager();
  const js = nc.jetstream();

  // We want to subscribe to ALL events across streams
  const streams = ['STUDENT_EVENTS', 'BATCH_EVENTS', 'ATTENDANCE', 'FEE_EVENTS', 'LMS_EVENTS', 'CLASS_EVENTS'];
  
  for (const stream of streams) {
    try {
      await jsm.consumers.add(stream, {
        durable_name: `analytics-worker-${stream}`,
        ack_policy: AckPolicy.Explicit,
        deliver_policy: DeliverPolicy.All
      });
      
      const sub = await js.pullSubscribe('>', {
        config: { durable_name: `analytics-worker-${stream}` }
      });

      (async () => {
        for await (const msg of sub) {
          try {
            const payload = JSON.parse(sc.decode(msg.data));
            console.log(`Analytics ingesting ${msg.subject}:`, payload);
            
            // Route to correct ClickHouse table based on subject
            let tableName = 'analytics_events';
            if (msg.subject.startsWith('attendance.')) tableName = 'attendance_events';
            else if (msg.subject.startsWith('fee.')) tableName = 'fee_events';
            else if (msg.subject.startsWith('test.')) tableName = 'test_events';
            else if (msg.subject.startsWith('lms.')) tableName = 'lms_events';
            else if (msg.subject.startsWith('class.')) tableName = 'class_events';
            
            // ClickHouse insert
            await clickhouse.insert({
              table: tableName,
              values: [
                {
                  event_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  institute_id: payload.instituteId || 'unknown',
                  batch_id: payload.batchId || '',
                  student_id: payload.studentId || payload.erpId || '',
                  event_type: msg.subject.split('.').pop() || 'unknown',
                  properties: JSON.stringify(payload)
                }
              ],
              format: 'JSONEachRow',
            });
            
            msg.ack();
          } catch (err) {
            console.error('Error processing event for analytics', err);
            msg.nak(); 
          }
        }
      })();
      
      setInterval(() => {
        sub.pull({ batch: 100, expires: 5000 });
      }, 1000);
      
    } catch (err) {
      console.error(`Error creating consumer for ${stream}`, err);
    }
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await nc.drain();
    process.exit(0);
  });
}

bootstrap();
