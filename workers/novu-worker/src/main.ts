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

  const startAttendanceSub = async () => {
    while (true) {
      try {
        const attendanceSub = await js.pullSubscribe('attendance.>', {
          config: { durable_name: 'novu-worker-attendance' }
        });
        
        const pullInterval = setInterval(() => {
          attendanceSub.pull({ batch: 10, expires: 5000 });
        }, 1000);

        for await (const msg of attendanceSub) {
          try {
            const payload = JSON.parse(sc.decode(msg.data));
            console.log(`Received ${msg.subject}:`, payload);
            
            if (msg.subject === 'attendance.rfid_punch') {
               console.log(`Sending SMS to parents of ${payload.erpId}`);
               await novu.trigger('attendance-punch', {
                 to: { subscriberId: payload.erpId },
                 payload: {
                   studentName: payload.studentName || 'Student',
                   time: new Date(payload.timestamp).toLocaleTimeString('en-IN'),
                   instituteName: payload.instituteName || 'Institute',
                   punchType: payload.punchType
                 }
               });
            }
            
            msg.ack();
          } catch (err) {
            console.error('Error processing attendance event', err);
            msg.nak(); 
          }
        }
        clearInterval(pullInterval);
      } catch (err) {
        console.error('Attendance subscription error, retrying in 5s...', err);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  };
  startAttendanceSub();

  const startFeeSub = async () => {
    while (true) {
      try {
        const feeSub = await js.pullSubscribe('fee.>', {
          config: { durable_name: 'novu-worker-fees' }
        });
        
        const pullInterval = setInterval(() => {
          feeSub.pull({ batch: 10, expires: 5000 });
        }, 1000);

        for await (const msg of feeSub) {
          try {
            const payload = JSON.parse(sc.decode(msg.data));
            console.log(`Received ${msg.subject}:`, payload);
            
            if (msg.subject === 'fee.payment.confirmed') {
               console.log(`Sending fee confirmation SMS to parents of ${payload.erpId}`);
               await novu.trigger('fee-payment-confirmed', {
                 to: { subscriberId: payload.erpId },
                 payload: {
                   studentName: payload.studentName || 'Student',
                   amount: payload.amount,
                   instituteName: payload.instituteName || 'Institute'
                 }
               });
            }
            
            msg.ack();
          } catch (err) {
            console.error('Error processing fee event', err);
            msg.nak(); 
          }
        }
        clearInterval(pullInterval);
      } catch (err) {
        console.error('Fee subscription error, retrying in 5s...', err);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  };
  startFeeSub();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await nc.drain();
    process.exit(0);
  });
}

bootstrap();
