import { DataSource } from 'typeorm';
import { BillingCycle, PlanType } from '../module/plan/const/plan.const';
import { config } from 'dotenv';

// Load environment variables
config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'cinehub',
  synchronize: false,
});

interface PlanSeed {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  stripeProductId: string;
  stripePriceId: string;
  billingCycle: BillingCycle;
  planType: PlanType;
  isActive: boolean;
}

const planSeeds: PlanSeed[] = [
  // Free Plan
  {
    id: '17a1485b-d70d-11f0-b3a9-6afd218a7d00',
    name: 'Free',
    description: 'Gói miễn phí. Xem phim có quảng cáo, chất lượng 480p SD.',
    price: 0,
    durationDays: 30,
    stripeProductId: 'prod_TaXsu4u0WLzuTP',
    stripePriceId: 'price_1SdMml2caDcXa36zcaYREhfW',
    billingCycle: BillingCycle.MONTHLY,
    planType: PlanType.FREE,
    isActive: true,
  },
  // Pro Plan
  {
    id: '27b2586c-e81e-22f1-c4b0-7bfe329b8e00',
    name: 'Pro',
    description: 'Gói Pro. Xem phim không quảng cáo, chất lượng Full HD 1080p.',
    price: 100000,
    durationDays: 30,
    stripeProductId: 'prod_TW62eqmFdhwPU9',
    stripePriceId: 'price_1SZ3qe2caDcXa36zKKTJoVMI',
    billingCycle: BillingCycle.MONTHLY,
    planType: PlanType.BASIC,
    isActive: true,
  },
  // Premium Plan
  {
    id: '37c3697d-f92f-33f2-d5c1-8caf43ac9f00',
    name: 'Premium',
    description: 'Gói Premium. Xem phim không quảng cáo, chất lượng 2K QHD.',
    price: 200000,
    durationDays: 30,
    stripeProductId: 'prod_TW64pUelchi8K8',
    stripePriceId: 'price_1SZ3rx2caDcXa36zrNZnj9ct',
    billingCycle: BillingCycle.MONTHLY,
    planType: PlanType.PREMIUM,
    isActive: true,
  },
];

async function seed() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Check if plans already exist
    const [existingPlans] = await dataSource.query(
      'SELECT COUNT(*) as count FROM plans',
    );
    if (existingPlans.count > 0) {
      console.log(
        `⚠️  Plans already exist (${existingPlans.count} plans). Skipping seed.`,
      );
      console.log(
        '💡 If you want to re-seed, please delete existing plans first.',
      );
      await dataSource.destroy();
      return;
    }

    // Insert plans using raw query
    for (const planData of planSeeds) {
      await dataSource.query(
        `INSERT INTO plans (id, name, description, price, durationDays, stripeProductId, stripePriceId, billingCycle, planType, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          planData.id,
          planData.name,
          planData.description,
          planData.price,
          planData.durationDays,
          planData.stripeProductId,
          planData.stripePriceId,
          planData.billingCycle,
          planData.planType,
          planData.isActive,
        ],
      );
      console.log(`✅ Created plan: ${planData.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${planSeeds.length} plans!`);
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  }
}

seed();
