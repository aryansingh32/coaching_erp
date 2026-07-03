import * as mqtt from 'mqtt';
import { connect, StringCodec, NatsConnection } from 'nats';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const sc = StringCodec();

// Connect to Gateway PostgreSQL to lookup RFID cards
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://coaching:coachingpass@pgbouncer:5432/coaching_db',
});

async function bootstrap() {
  console.log('Starting RFID Service...');
  
  let nc: NatsConnection;
  try {
    nc = await connect({ servers: process.env.NATS_URL || 'nats://nats:4222' });
    console.log('Connected to NATS');
  } catch (err) {
    console.error('Failed to connect to NATS', err);
    process.exit(1);
  }

  // Ensure attendance_events table exists
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS attendance_events (
      id SERIAL PRIMARY KEY,
      erp_student_id VARCHAR(255) NOT NULL,
      institute_id VARCHAR(255) NOT NULL,
      punch_type VARCHAR(50) NOT NULL,
      punched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const js = nc.jetstream();

  // Connect to MQTT broker
  const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://mosquitto:1883');
  
  mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe('coaching/rfid/punch', (err) => {
      if (err) console.error('Failed to subscribe to MQTT topic', err);
    });
  });

  mqttClient.on('message', async (topic, message) => {
    if (topic === 'coaching/rfid/punch') {
      try {
        const payload = JSON.parse(message.toString());
        const { cardUid, readerId } = payload;
        
        console.log(`RFID punch received: ${cardUid} at ${readerId}`);
        
        // Lookup student in DB
        const result = await pgPool.query(
          'SELECT erp_student_id, institute_id FROM rfid_cards WHERE card_uid = $1 AND is_active = true',
          [cardUid]
        );
        
        if (result.rows.length === 0) {
          console.warn(`Unknown or inactive RFID card: ${cardUid}`);
          return;
        }
        
        const { erp_student_id, institute_id } = result.rows[0];
        
        // Determine entry vs exit by checking last punch in DB
        const lastPunch = await pgPool.query(
          `SELECT punch_type FROM attendance_events 
           WHERE erp_student_id = $1 AND institute_id = $2 
           AND punched_at > NOW() - INTERVAL '8 hours'
           ORDER BY punched_at DESC LIMIT 1`,
          [erp_student_id, institute_id]
        );

        const lastPunchType = lastPunch.rows[0]?.punch_type;
        const punchType = lastPunchType === 'entry' ? 'exit' : 'entry';

        await pgPool.query(
          `INSERT INTO attendance_events (erp_student_id, institute_id, punch_type, punched_at) 
           VALUES ($1, $2, $3, NOW())`,
          [erp_student_id, institute_id, punchType]
        );
        
        // Publish to NATS
        const event = {
          erpId: erp_student_id,
          instituteId: institute_id,
          readerId,
          timestamp: new Date().toISOString(),
          punchType
        };
        
        await js.publish('attendance.rfid_punch', sc.encode(JSON.stringify(event)));
        console.log(`Published attendance event for ${erp_student_id} (${punchType})`);
        
      } catch (err) {
        console.error('Error processing MQTT message', err);
      }
    }
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    mqttClient.end();
    await nc.drain();
    await pgPool.end();
    process.exit(0);
  });
}

bootstrap();
