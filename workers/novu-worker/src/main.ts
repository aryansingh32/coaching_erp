import { AckPolicy, DeliverPolicy } from 'nats';
import { connect, StringCodec, NatsConnection } from 'nats';
import * as dotenv from 'dotenv';
import { Novu } from '@novu/node';

dotenv.config();

const sc = StringCodec();
const novu = new Novu(process.env.NOVU_API_KEY || '');

async function bootstrap() {
  console.log('Starting Novu Worker...');
  
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

  // Ensure consumer exists
  try {
    await jsm.consumers.add('ATTENDANCE', {
      durable_name: 'novu-worker-attendance',
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      filter_subject: 'attendance.>'
    });
    
    await jsm.consumers.add('FEE_EVENTS', {
      durable_name: 'novu-worker-fees',
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      filter_subject: 'fee.>'
    });
  } catch (err) {
    console.error('Error creating consumers', err);
  }

  console.log('Listening for events...');

  // Subscribe to attendance
  const attendanceSub = await js.pullSubscribe('attendance.>', {
    config: { durable_name: 'novu-worker-attendance' }
  });

  (async () => {
    for await (const msg of attendanceSub) {
      try {
        const payload = JSON.parse(sc.decode(msg.data));
        console.log(`Received ${msg.subject}:`, payload);
        
        if (msg.subject === 'attendance.rfid_punch') {
           console.log(`Sending SMS to parents of ${payload.erpId}`);
           // await novu.trigger('attendance-punch', { to: { subscriberId: payload.erpId }, payload });
        }
        
        msg.ack();
      } catch (err) {
        console.error('Error processing attendance event', err);
        msg.nak(); 
      }
    }
  })();
  
  setInterval(() => {
    attendanceSub.pull({ batch: 10, expires: 5000 });
  }, 1000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await nc.drain();
    process.exit(0);
  });
}

bootstrap();
